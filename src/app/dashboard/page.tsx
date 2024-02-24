"use client"

import { Button } from '@/components/ui/button'
import React, { useEffect, useRef, useState } from 'react'
import { open } from '@tauri-apps/api/dialog';
import { addFolder, deleteFolder, getCurrentUserGlobal, getFolders, getUserScrollY, getUserSettings, getUsers, getVideo, unwatchVideo, updateFolderExpanded, updateUserScrollY, updateVideoWatched } from '../../../lib/prisma-commands';
import type { Folder as PrismaFolder, User, Video } from "@prisma/client";
import { Captions, ChevronDown, ChevronUp, CornerLeftDown, Eye, EyeOff, Film, Folder, FolderInput, Folders, Key, Loader2, Trash2, VideoIcon, } from 'lucide-react';
import { FileEntry, readDir } from '@tauri-apps/api/fs'
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/tauri';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { SettingSchema } from '../settings/page';
import { ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent } from '@radix-ui/react-context-menu';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { string } from 'zod';
// import { WebviewWindow, appWindow } from "@tauri-apps/api/window"


export default function Dashboard() {
    const [folderPaths, setFolderPaths] = useState<string[]>([]);
    const [parentFolderPaths, setParentFolderPaths] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<User>();
    const [userSettings, setUserSettings] = useState<SettingSchema>();
    const scrolledDiv = useRef<HTMLDivElement>(null);
    //const { scrollYProgress } = useScroll();
    const router = useRouter();
    const { scrollY } = useScroll({
        container: scrolledDiv
    })

    const setScrollPosition = (userYPos: any) => {
        (scrolledDiv.current as HTMLElement | null)?.scrollTo({
            top: userYPos > 200 ? userYPos + 50 : userYPos, // test offset
            behavior: "smooth"
        });
    };

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (currentUser && latest > 0)
            updateUserScrollY({ userId: currentUser?.id, scrollY: latest }).then(() => {
                //console.log("Page scroll: ", latest);
            });
    })

    // fetch the user object from db on start and set the current user
    useEffect(() => {
        getUsers().then((users) => {
            if (users?.length !== 0 && users) {
                getCurrentUserGlobal().then((GLOBAL_USER) => {
                    if (GLOBAL_USER && GLOBAL_USER?.userId !== -1) {
                        for (const user of users) {
                            if (user.id === Number(GLOBAL_USER?.userId)) {
                                setCurrentUser(user);
                                break;
                            }
                        }
                    } else {
                        //router.prefetch('/');
                        router.push('/', { scroll: false });
                    }
                });
            } else {
                router.push('/profiles/createUser');
            }
        })
    }, [])

    // get the user's scroll position from the db once currentUser is set
    useEffect(() => {
        if (currentUser)
            getUserScrollY({ userId: currentUser?.id }).then((userY: any) => {
                if (userY !== 0 && userY !== null && userY !== undefined)
                    console.log("User scroll: ", userY)

                // TODO : This needs to be changed. The timeout needs to be referenced to an element.
                setTimeout(() => {
                    console.log("scrolling to: ", userY);
                    setScrollPosition(userY);
                }, 200);
            })
    }, [currentUser]);


    // get all the folder paths from the folder table with user id on startup
    useEffect(() => {
        console.log(currentUser);
        if (currentUser?.id)
            getFolders({ userId: currentUser?.id as number }).then((folders) => {
                if (folders) {
                    console.log(`folders for user ${currentUser?.id} `, folders);
                    for (const folder of folders) {
                        if (!folder.asChild) {
                            setFolderPaths((prev) => [...prev, folder.path]);
                        }
                    }
                }
            });

    }, [currentUser])

    // fetch the settings object from db on start
    useEffect(() => {
        //console.log(`parent folder paths: ${folderPaths}`);
        if (currentUser?.id) {
            getUserSettings({ userId: currentUser?.id }).then((settings) => {
                if (settings) {
                    console.log("user settings:", settings);
                    setUserSettings(settings);
                }
            })
        }
    }, [currentUser])


    const FolderList = ({ folderPath, asChild }: { folderPath: string, asChild?: boolean | undefined }) => {

        const [files, setFiles] = useState<FileEntry[]>([]);
        const [folders, setFolders] = useState<FileEntry[]>([]);
        const [expanded, setExpanded] = useState<boolean>();
        const [subtitleFiles, setSubtitleFiles] = useState<FileEntry[]>([]);
        const [prismaVideos, setPrismaVideos] = useState<Video[]>([]);
        const [finishedSettingFiles, setFinishedSettingFiles] = useState(false);
        const [isInvoking, setIsInvoking] = useState(false);


        // Reading directory contents
        useEffect(() => {
            //console.log("CurrentFolderPath = ", folderPath);
            setFinishedSettingFiles(false);
            readDir(folderPath).then((res) => {
                if (res) {
                    //console.log("res:", res);
                    const videoFiles = res.filter(file => supportedVideoFormats.includes(file.path.replace(/^.*\./, '')) && !file.children);
                    let filtered = videoFiles.filter(video => video !== null && video !== undefined) as Video[];
                    const subtitleFiles = res.filter(file => file.path.split('.').pop() === 'srt');
                    const folders = res.filter(file => file.children);

                    let uniqueFolders: FileEntry[] = [];

                    for (const folder of folders) {
                        for (const uniqueFolder of uniqueFolders) {
                            if (uniqueFolder.path !== folder.path) {
                                uniqueFolders.push(folder);
                            }
                        }
                    }




                    setFiles(filtered as FileEntry[]);
                    setFolders(folders as FileEntry[]);
                    setSubtitleFiles(subtitleFiles as FileEntry[]);

                    setFinishedSettingFiles(true);

                }
            });
        }, [folderPath]); // Added folderPath as a dependency

        // check if folders are expanded on startup
        useEffect(() => {
            if (currentUser) {
                setIsInvoking(true);
                getFolders({ userId: currentUser.id }).then((folders: PrismaFolder[]) => {
                    if (folders && folders.length > 0) {
                        for (const folder of folders) {
                            if (folder.path === folderPath && folder.expanded) {
                                console.log("setting expanded to true from useEffect on startup => ", folderPath);
                                setExpanded(true);
                                //break;
                                // } else if (folder.path === folderPath && !folder.expanded) {
                                //     console.log("setting expanded to false from useEffect on startup => ", folderPath);
                                //     setExpanded(false);
                                //break;
                            }
                        }
                    }
                }).finally(() => setIsInvoking(false));
            }

        }, [currentUser]);

        // Fetching videos information
        useEffect(() => {
            if (currentUser && files.length > 0 && finishedSettingFiles) {
                setIsInvoking(true);
                Promise.all(files.map(file => getVideo({ videoPath: file.path, userId: currentUser.id })))
                    .then(videos => {
                        setPrismaVideos(videos.filter(video => video !== null && video !== undefined) as Video[]);
                        //console.log("set prismaVideos => ", videos);
                    }).finally(() => {
                        setIsInvoking(false);
                    });

            }
        }, [currentUser, files, finishedSettingFiles]);

        // Update the folder expanded state in the db
        useEffect(() => {
            if (currentUser && finishedSettingFiles && !isInvoking && expanded !== undefined) {

                updateFolderExpanded({ folderPath: folderPath, expanded: expanded, userId: currentUser?.id, asChild: asChild || false })
            }

        }, [expanded, isInvoking]);

        // Check if video is watched
        const handleCheckWatched = (file: FileEntry) => {
            const video = prismaVideos.find(v => v.path === file.path && v.watched);
            return video ? !video.watched : true; // Return true if video is not found or not watched
        };

        return (
            <main className='my-1 h-full w-full rounded-b-md'
                key={folderPath + "main-parent-folder"}
            >
                <ContextMenu
                    key={folderPath + "main-parent-context-menu"}
                >

                    <ContextMenuTrigger>
                        <AnimatePresence >
                            {/* Main Parent Folder */}
                            <motion.div
                                initial={userSettings?.animations === "On" ? { opacity: 0 } : undefined}
                                animate={userSettings?.animations === "On" ? { opacity: 1 } : undefined}
                                exit={userSettings?.animations === "On" ? { opacity: 0 } : undefined}
                                transition={{ duration: 0.5, damping: 0.5 }}
                                key={"main-parent-folder+folder"}
                                style={expanded && !asChild ? { padding: "10px" } : {}}
                                className={cn(
                                    'flex cursor-pointer flex-row items-center justify-between rounded-md bg-accent p-1',
                                    (expanded && files.length > 0 && !asChild) && 'rounded-b-none border-b-4 border-tertiary',
                                    (expanded && folders.length > 0 && !asChild) && 'rounded-b-none border-b-4',
                                    (expanded && asChild) && 'border-none',
                                    asChild && 'bg-muted',
                                    (asChild && expanded) && 'p-1 border-none drop-shadow-sm rounded-b-sm',
                                    (!asChild && expanded) && 'border-none',
                                    (asChild) && 'flex flex-col rounded-t-none',
                                    userSettings?.animations === "Off" && 'hover:opacity-80',

                                )}
                                onClick={(e) => {
                                    if (files.length > 0 || folders.length > 0)
                                        setExpanded(!expanded);
                                }}

                                whileHover={(userSettings?.animations === "On" && !asChild) ? { padding: "10px" } : undefined}
                            >
                                {/* Displays all the tags for main parent folder. */}
                                < div className={cn('flex flex-row items-center justify-start gap-1 font-medium text-primary text-sm text-center w-full pb-1.5',
                                )}>


                                    {(asChild && !expanded) ? (
                                        <motion.div className='flex items-start justify-center'
                                            key={folderPath + "not expanded5"}
                                            initial={userSettings?.animations === "On" ? { y: -20, opacity: 0 } : undefined}
                                            animate={userSettings?.animations === "On" ? { y: 0, opacity: 1 } : undefined}
                                            exit={userSettings?.animations === "On" ? { y: -20, opacity: 0 } : undefined}
                                            transition={{ duration: 0.3, damping: 0.3 }}
                                        >
                                            <Folder className={cn('h-auto w-4',
                                                userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                            )} />
                                        </motion.div>
                                    ) : (
                                        <motion.div className='flex items-start justify-center'
                                            key={folderPath + "expanded1"}
                                            initial={userSettings?.animations === "On" ? { y: -50, opacity: 0 } : undefined}
                                            animate={userSettings?.animations === "On" ? { y: 0, opacity: 1 } : undefined}
                                            exit={userSettings?.animations === "On" ? { y: -50, opacity: 0 } : undefined}
                                            transition={{ duration: 0.7, bounce: 0.2, type: 'spring' }}
                                        >
                                            {(asChild && expanded) && (
                                                <CornerLeftDown className={cn('h-auto w-5 px-0.5',
                                                    userSettings?.fontSize === "Medium" && 'h-auto w-6',
                                                    userSettings?.fontSize === "Large" && 'h-auto w-7',
                                                    userSettings?.fontSize === "XLarge" && 'h-auto w-8',
                                                    files.length < 0 || folders.length < 0 && "hidden"
                                                )}
                                                />
                                            )}
                                        </motion.div>
                                    )}


                                    {folders.length === 0 && files.length === 0 ?
                                        <span className={cn('line-through',
                                            userSettings?.fontSize === "Medium" && 'text-lg',
                                            userSettings?.fontSize === "Large" && 'text-2xl',
                                            userSettings?.fontSize === "XLarge" && 'text-3xl',
                                            (userSettings?.fontSize === "Medium" && asChild) && 'text-lg',
                                            (userSettings?.fontSize === "Large" && asChild) && 'text-xl',
                                            (userSettings?.fontSize === "XLarge" && asChild) && 'text-2xl',
                                        )}>{folderPath.replace(/\\/g, '/').split('/').pop()}
                                        </span>
                                        : (
                                            <span className={cn('text-base font-bold',
                                                userSettings?.fontSize === "Medium" && 'text-lg',
                                                userSettings?.fontSize === "Large" && 'text-2xl',
                                                userSettings?.fontSize === "XLarge" && 'text-3xl',
                                                (userSettings?.fontSize === "Medium" && asChild) && 'text-lg',
                                                (userSettings?.fontSize === "Large" && asChild) && 'text-xl',
                                                (userSettings?.fontSize === "XLarge" && asChild) && 'text-2xl',
                                            )}>
                                                {folderPath.replace(/\\/g, '/').split('/').pop()}
                                            </span>
                                        )}
                                    {folders.length > 0 && (
                                        <div className='flex flex-row items-center justify-center gap-0.5 rounded-md bg-tertiary px-0.5'>
                                            <Folders className={cn('h-auto w-4',
                                                userSettings?.fontSize === "Medium" && 'h-auto w-4',
                                                userSettings?.fontSize === "Large" && 'h-auto w-5',
                                                userSettings?.fontSize === "XLarge" && 'h-auto w-6'
                                            )}

                                            />
                                            <span className={cn('text-xs',
                                                userSettings?.fontSize === "Medium" && 'text-sm',
                                                userSettings?.fontSize === "Large" && 'text-base',
                                                userSettings?.fontSize === "XLarge" && 'text-lg',
                                            )}>
                                                {folders.length > 0 && folders.length}
                                            </span>
                                        </div>
                                    )}
                                    {files.length > 0 && (
                                        <div className={cn('flex flex-row items-center justify-center text-sm rounded-md bg-tertiary px-0.5 gap-0.5',
                                        )}>
                                            <VideoIcon className={cn('h-auto w-4',
                                                userSettings?.fontSize === "Medium" && 'h-auto w-4',
                                                userSettings?.fontSize === "Large" && 'h-auto w-5',
                                                userSettings?.fontSize === "XLarge" && 'h-auto w-6'
                                            )}
                                                strokeWidth={1.85}
                                            />
                                            <span className={cn('text-xs',
                                                userSettings?.fontSize === "Medium" && 'text-sm',
                                                userSettings?.fontSize === "Large" && 'text-base',
                                                userSettings?.fontSize === "XLarge" && 'text-lg',
                                            )}>
                                                {files.length > 0 && files.length}
                                            </span>

                                        </div>
                                    )}
                                    {subtitleFiles.length > 0 && (
                                        <div className={cn('flex flex-row items-center justify-center text-xs rounded-md bg-tertiary px-0.5 gap-0.5',
                                        )}>
                                            <Captions className={cn('h-auto w-4',
                                                userSettings?.fontSize === "Medium" && 'h-auto w-4',
                                                userSettings?.fontSize === "Large" && 'h-auto w-5',
                                                userSettings?.fontSize === "XLarge" && 'h-auto w-6'
                                            )}
                                                strokeWidth={1.8}


                                            />
                                            <span className={cn('text-xs',
                                                userSettings?.fontSize === "Medium" && 'text-sm',
                                                userSettings?.fontSize === "Large" && 'text-base',
                                                userSettings?.fontSize === "XLarge" && 'text-lg',
                                            )}>
                                                {subtitleFiles.length > 0 && subtitleFiles.length}
                                            </span>
                                        </div>
                                    )}


                                </div>
                                {/* Only display trashcan when its a main parent folder */}
                                {asChild !== true && (
                                    <motion.span
                                        whileHover={userSettings?.animations === "On" ? { scale: 1.1 } : undefined}
                                        whileTap={userSettings?.animations === "On" ? { scale: 0.9 } : undefined}
                                        className=''
                                    >
                                        <Trash2 className={cn('rounded-lg p-0.5 text-primary hover:bg-background h-auto w-6',
                                            userSettings?.fontSize === "Medium" && 'h-auto w-7',
                                            userSettings?.fontSize === "Large" && 'h-auto w-8',
                                            userSettings?.fontSize === "XLarge" && 'h-auto w-9'
                                        )} onClick={(e) => {
                                            e.stopPropagation();
                                            // trigger the delete folder db command
                                            deleteFolder({ folderPath }).then(() => {
                                                setFolderPaths(folderPaths.filter(path => path !== folderPath));
                                                setParentFolderPaths(parentFolderPaths.filter(path => path !== folderPath));
                                                router.refresh();
                                            });
                                        }} />
                                    </motion.span>
                                )}

                            </motion.div>
                            {/* END Main Parent Folder END */}
                        </AnimatePresence>
                    </ContextMenuTrigger>

                    <ContextMenuContent>
                        <ContextMenuItem className='flex cursor-pointer items-center gap-1 font-medium'
                            onClick={(e) => {
                                if (e.button === 0 && !isInvoking) {
                                    setIsInvoking(true);
                                    invoke('show_in_folder', { path: `${folderPath}` }).then((res) => {
                                        setIsInvoking(false);
                                    });
                                }
                            }}
                        >
                            <span className={cn("",
                                userSettings?.fontSize === "Medium" && 'text-base',
                                userSettings?.fontSize === "Large" && 'text-lg',
                                userSettings?.fontSize === "XLarge" && 'text-xl',
                            )}>Open In Explorer</span>
                            <FolderInput className={cn('h-auto w-4',
                                userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                userSettings?.fontSize === "Large" && 'h-auto w-6',
                                userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                            )} />
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>


                {/* Displays all the child files and folders */}
                {/* Video Files //.. map it only if it has no children*/}
                {expanded && files.filter((file) => !file.children).map((file, index) => {
                    return (
                        <ContextMenu key={"context-menu" + index}>
                            <ContextMenuTrigger>
                                <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 py-1.5 px-4 cursor-pointer overflow-hidden',
                                    (index === files.length - 1) && 'rounded-b-md border-b-4 border-tertiary',
                                    userSettings?.animations === "Off" && 'hover:opacity-50',
                                    prismaVideos.some((video) => video.path === file.path && video.watched) && 'bg-tertiary drop-shadow-sm',
                                )}

                                    onClick={(e) => {
                                        if (!isInvoking && finishedSettingFiles) {
                                            setIsInvoking(true);
                                            setFinishedSettingFiles(false);
                                            if (currentUser)
                                                updateVideoWatched({ videoPath: file.path, user: currentUser, watched: true }).then(() => {
                                                    invoke('open_video', { path: file.path, userId: string });
                                                    setFinishedSettingFiles(true);
                                                    setIsInvoking(false);
                                                });
                                        }
                                    }}
                                    key={file.name + "current-video" + index}
                                    initial={userSettings?.animations === "On" ? { opacity: 0, x: -20 } : undefined}
                                    animate={userSettings?.animations === "On" ? { opacity: 1, x: 0 } : undefined}
                                    exit={userSettings?.animations === "On" ? { opacity: 0, x: -20 } : undefined}
                                    whileHover={userSettings?.animations === "On" ? { x: 1.5 } : undefined}
                                    transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                                >

                                    <div className={cn('flex flex-row items-start justify-center gap-1 font-medium select-none',
                                        (file.name && file.name?.length > 100) && 'items-start justify-center gap-1',

                                    )}

                                    >
                                        <Film className={cn('h-auto w-4 pl-1.5',
                                            (file.name && file.name?.length > 100) && 'items-start justify-center gap-1 p-0',
                                            userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                            userSettings?.fontSize === "Large" && 'h-auto w-6',
                                            userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                        )}

                                        />
                                        {/* Check if the file's path matches any video's path in prismaVideos to render an eye next to the film */}

                                        {prismaVideos.some((video) => {
                                            if (video?.path === file?.path && video?.watched) {
                                                return true;
                                            } else {
                                                return false;
                                            }
                                        }) ? (

                                            <motion.div style={
                                                currentUser?.color ? {
                                                    textShadow: "0 0 5px rgba(0,0,0,0.2)"
                                                } : {}} className={(`flex flex-row items-center justify-center gap-1 rounded-sm px-0.5 font-bold`)}
                                                key={"watched-video-file-name" + file.name + index}
                                                initial={userSettings?.animations === "On" ? { opacity: 0, x: -20 } : undefined}
                                                animate={userSettings?.animations === "On" ? { opacity: 1, x: 0 } : undefined}
                                                exit={userSettings?.animations === "On" ? { opacity: 0, x: -20 } : undefined}
                                                whileHover={userSettings?.animations === "On" ? { x: 1.5 } : undefined}
                                                transition={{ duration: 0.5, bounce: 0.4, type: 'spring' }}
                                            >
                                                <motion.div
                                                    key={index + "watched-video-file-name" + "eye-icon"}
                                                    className={cn('',
                                                        userSettings?.animations === "Off" && 'hover:opacity-20'
                                                    )}
                                                    initial={userSettings?.animations === "On" ? { x: -20, opacity: 0 } : undefined}
                                                    animate={userSettings?.animations === "On" ? { x: 0, opacity: 1 } : undefined}
                                                    exit={userSettings?.animations === "On" ? { x: -20, opacity: 0 } : undefined}
                                                    transition={{ duration: 0.35, bounce: 0.3, type: 'spring' }}
                                                    whileHover={userSettings?.animations === "On" ? { scale: 1.15 } : undefined}
                                                    whileTap={userSettings?.animations === "On" ? { scale: 0.9 } : undefined}
                                                    onClick={(e) => {
                                                        // set the video as unwatched when the user clicks on the eye icon
                                                        e.stopPropagation();
                                                        if (currentUser) {
                                                            setFinishedSettingFiles(false);
                                                            unwatchVideo({ videoPath: file.path, userId: currentUser?.id }).finally(() => setFinishedSettingFiles(true));
                                                        }
                                                    }}
                                                >

                                                    <Eye className={cn('h-auto w-4 mr-0.5 ',
                                                        userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                        userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                    )} />
                                                </motion.div
                                                >
                                                <span className={cn('text-sm ',
                                                    userSettings?.fontSize === "Medium" && 'text-base',
                                                    userSettings?.fontSize === "Large" && 'text-lg',
                                                    userSettings?.fontSize === "XLarge" && 'text-2xl',
                                                )}>
                                                    {file.name}
                                                </span>
                                            </motion.div>

                                        ) : (
                                            <motion.div
                                                key={"render-file-name" + file.name + "1"}
                                                className={cn('flex flex-row items-center justify-center gap-1 rounded-sm px-0.5 font-bold',
                                                )}
                                                initial={userSettings?.animations === "On" ? { x: 20 } : undefined}
                                                animate={userSettings?.animations === "On" ? { x: 0 } : undefined}
                                                exit={userSettings?.animations === "On" ? { x: 20 } : undefined}
                                                transition={{ duration: 0.2, bounce: 0.3, type: 'spring' }}
                                            >
                                                <span className={cn('text-sm',
                                                    userSettings?.fontSize === "Medium" && 'text-base',
                                                    userSettings?.fontSize === "Large" && 'text-lg',
                                                    userSettings?.fontSize === "XLarge" && 'text-2xl',
                                                )}>{file.name}</span>
                                            </motion.div>

                                        )}
                                    </div>



                                </motion.li>

                                <ContextMenuContent className={cn(``,
                                    userSettings?.animations === "Off" && ``
                                )}
                                >
                                    <ContextMenuItem className='cursor-pointer gap-1 font-medium'
                                        onClick={(e) => {
                                            if (e.button === 0 && !isInvoking) {
                                                setIsInvoking(true);
                                                invoke('show_in_folder', { path: `${file.path}` }).then((res) => {
                                                    setIsInvoking(false);
                                                });
                                            }
                                        }}
                                    >
                                        <span className={cn("",
                                            userSettings?.fontSize === "Medium" && 'text-base',
                                            userSettings?.fontSize === "Large" && 'text-lg',
                                            userSettings?.fontSize === "XLarge" && 'text-xl',
                                        )}>Open In Explorer</span>
                                        <FolderInput className={cn('h-auto w-4',
                                            userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                            userSettings?.fontSize === "Large" && 'h-auto w-6',
                                            userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                        )} />
                                    </ContextMenuItem>
                                    <ContextMenuSeparator className='my-1 h-[1px] bg-accent' />
                                    <ContextMenuSub>
                                        <ContextMenuSubTrigger className={cn('cursor-pointer gap-1 font-medium',
                                            userSettings?.fontSize === "Medium" && 'text-base',
                                            userSettings?.fontSize === "Large" && 'text-lg',
                                            userSettings?.fontSize === "XLarge" && 'text-xl',
                                        )}
                                            inset>Watch</ContextMenuSubTrigger>
                                        <ContextMenuSubContent className="mx-2 overflow-hidden rounded-md border bg-popover p-1 font-medium text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                                            {/* Renders the watched context menu sub */}
                                            {handleCheckWatched(file) ? (
                                                <ContextMenuItem
                                                    className='flex cursor-pointer gap-1'
                                                    onClick={() => {
                                                        setIsInvoking(true);
                                                        setFinishedSettingFiles(false);
                                                        updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: true }).finally(() => {
                                                            setFinishedSettingFiles(true);
                                                            setIsInvoking(false);
                                                        });
                                                    }}
                                                >
                                                    <span className={cn("",
                                                        userSettings?.fontSize === "Medium" && 'text-base',
                                                        userSettings?.fontSize === "Large" && 'text-lg',
                                                        userSettings?.fontSize === "XLarge" && 'text-xl',
                                                    )}>Set Watched</span>

                                                    <Eye className={cn('h-auto w-4 ',
                                                        userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                        userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                    )} />

                                                </ContextMenuItem>
                                            ) : (
                                                <ContextMenuItem className='flex cursor-pointer gap-1'
                                                    onClick={(e) => {

                                                        if (currentUser) {
                                                            setFinishedSettingFiles(false);
                                                            unwatchVideo({ videoPath: file.path, userId: currentUser?.id }).finally(() => setFinishedSettingFiles(true));
                                                        }


                                                    }}
                                                >
                                                    <span className={cn("",
                                                        userSettings?.fontSize === "Medium" && 'text-base',
                                                        userSettings?.fontSize === "Large" && 'text-lg',
                                                        userSettings?.fontSize === "XLarge" && 'text-xl',
                                                    )}>Unwatch</span>

                                                    <EyeOff className={cn('h-auto w-4 ',
                                                        userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                        userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                    )} />
                                                </ContextMenuItem>
                                            )}

                                            <ContextMenuItem className='cursor-pointer'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFinishedSettingFiles(false);
                                                    setIsInvoking(true);
                                                    if (currentUser) {
                                                        files.slice(0, index + 1).reverse().map((file) => {
                                                            updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: true }).then(() => {

                                                            }).finally(() => setFinishedSettingFiles(true));
                                                        });


                                                    }

                                                }
                                                }
                                            >
                                                <div className='flex gap-1'>
                                                    <span className={cn("",
                                                        userSettings?.fontSize === "Medium" && 'text-base',
                                                        userSettings?.fontSize === "Large" && 'text-lg',
                                                        userSettings?.fontSize === "XLarge" && 'text-xl',
                                                    )}>Cascade As</span>
                                                    <div className='flex'>
                                                        <Eye className={cn('h-auto w-4 ',
                                                            userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                            userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                            userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                        )} />
                                                        <ChevronDown className={cn('h-auto w-4 ',
                                                            userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                            userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                            userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                        )} />
                                                    </div>
                                                </div>
                                            </ContextMenuItem>
                                            <ContextMenuItem className='cursor-pointer'
                                                onClick={(e) => {
                                                    setFinishedSettingFiles(false);
                                                    if (currentUser) {
                                                        files.slice(index, files.length).map((file) => {
                                                            setFinishedSettingFiles(false);
                                                            unwatchVideo({ videoPath: file.path, userId: currentUser?.id }).finally(() => setFinishedSettingFiles(true));

                                                        })
                                                    }
                                                }}
                                            >
                                                <div className='flex gap-1'>
                                                    <span className={cn("",
                                                        userSettings?.fontSize === "Medium" && 'text-base',
                                                        userSettings?.fontSize === "Large" && 'text-lg',
                                                        userSettings?.fontSize === "XLarge" && 'text-xl',
                                                    )}>Cascade As</span>
                                                    <div className='flex'>
                                                        <EyeOff className={cn('h-auto w-4 ',
                                                            userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                            userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                            userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                        )} />
                                                        <ChevronUp className={cn('h-auto w-4 ',
                                                            userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                            userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                            userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                        )} />
                                                    </div>
                                                </div>
                                            </ContextMenuItem>
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                </ContextMenuContent>
                            </ContextMenuTrigger>
                        </ContextMenu>
                    )
                })}


                {/*Child Folders */}

                {
                    expanded && folders.map((folder, index) => {
                        return (
                            <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 p-0.5 px-2 cursor-pointer overflow-hidden select-none ',
                                (index === folders.length - 1 && !asChild) && 'rounded-b-md border-b-4 border-tertiary',
                                asChild && 'rounded-b-md border-none border-tertiary',

                            )}
                                key={folder.name + "current-child" + index}
                                initial={userSettings?.animations === "On" ? { y: -40 } : undefined}
                                animate={userSettings?.animations === "On" ? { opacity: 1, y: 0 } : undefined}
                                exit={(userSettings?.animations === "On") ? { y: -40, opacity: 0 } : undefined}
                                whileHover={(userSettings?.animations === "On") ? { x: 1 } : undefined}
                                transition={{ duration: 0.3, stiffness: 30 }}
                            >

                                <FolderList folderPath={folder.path} asChild />

                            </motion.li>

                        )
                    })
                }

            </main >
        )
    }

    return (
        <main className={cn('pl-3 lg:px-16 xl:px-36 2xl:px-48 mt-3 max-h-screen overflow-auto',
        )}
            ref={scrolledDiv}
            style={{ scrollbarGutter: "stable", }}
        >

            {/* Render Parent Folders */}
            <motion.div className='mb-20 flex h-full w-full flex-col items-center justify-center gap-2 rounded-b-sm drop-shadow-sm'
                key={"main-parent-folder" + folderPaths.length + 1}
            >
                {folderPaths.map((folder, index) => {
                    return (
                        <FolderList folderPath={folder} key={index.toString() + folder} />
                    )
                })}
                <AnimatePresence>
                    {/* Add Folder Button */}
                    {userSettings && (
                        <motion.div className='flex h-full w-full flex-col items-start justify-center'
                            initial={userSettings?.animations === "On" ? { opacity: 0 } : undefined}
                            animate={userSettings?.animations === "On" ? { opacity: 1 } : undefined}
                            exit={userSettings?.animations === "On" ? { opacity: 0 } : undefined}
                            transition={userSettings?.animations === "On" ? { duration: 0.2, damping: 5 } : undefined}
                            key={"Add-Folder-Button"}
                        >
                            <Button variant="outline"
                                className={cn('select-none',
                                    userSettings?.fontSize === "Medium" && 'text-lg mx-0',
                                    userSettings?.fontSize === "Large" && 'text-xl mx-0',
                                    userSettings?.fontSize === "XLarge" && 'text-2xl mx-0',
                                )}
                                onClick={() => {
                                    open({
                                        directory: true,
                                        multiple: false,
                                        recursive: true,
                                        filters: [
                                            { name: 'Folders', extensions: [""] }
                                        ],
                                        title: "Add Folder"
                                    }).then((res): void => {
                                        if (res && currentUser) {
                                            for (const path of folderPaths) {
                                                if (path === res?.toString()) {
                                                    let pathName = res.toString().replaceAll("\\", " ").split(" ").pop();
                                                    toast({
                                                        title: `${pathName} already exists!`,
                                                        description: `You already have a folder with the name ${pathName} in your library.`,
                                                        duration: 2000,
                                                    })
                                                    return;
                                                }
                                            }

                                            addFolder({ userId: currentUser?.id, folderPath: res.toString(), expanded: false, asChild: false }).then(() => {
                                                setFolderPaths(prevPaths => [...prevPaths, res] as string[]);
                                            });

                                        }
                                    })
                                }}
                            >
                                Add Folder
                            </Button>

                        </motion.div>
                    )}
                    {/* Add Folder Button */}
                </AnimatePresence>
            </motion.div>

        </main>

    )

}


let supportedVideoFormats = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'vob', 'ogv', 'ogg', 'drc', 'gif', 'gifv', 'mng', 'avi', 'mov', 'qt', 'wmv', 'yuv', 'rm', 'rmvb', 'asf', 'amv', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'mpg', 'mpeg', 'm2v', 'm4v', 'svi', '3gp', '3g2', 'mxf', 'roq', 'nsv', 'flv', 'f4v', 'f4p', 'f4a', 'f4b'];