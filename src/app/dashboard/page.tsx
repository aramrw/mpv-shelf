"use client"

import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { open } from '@tauri-apps/api/dialog';
import { addFolder, deleteFolder, getCurrentUserGlobal, getFolders, getUserSettings, getUsers, getVideo, unwatchVideo, updateVideoWatched } from '../../../lib/prisma-commands';
import type { User, Video } from "@prisma/client";
import { Captions, ChevronDown, ChevronUp, CornerUpRight, Eye, EyeOff, Film, Folder, FolderInput, Folders, Loader2, Trash2, VideoIcon, } from 'lucide-react';
import { FileEntry, readDir } from '@tauri-apps/api/fs'
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/tauri';
import { AnimatePresence, motion, reverseEasing } from 'framer-motion';
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
import { set, string } from 'zod';
// import { WebviewWindow, appWindow } from "@tauri-apps/api/window"

export default function Dashboard() {
    const [folderPaths, setFolderPaths] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<User>();
    const [userSettings, setUserSettings] = useState<SettingSchema>();

    const router = useRouter();

    // fetch the user object from db on start and set the current user
    useEffect(() => {
        getUsers().then((users) => {
            if (users) {
                getCurrentUserGlobal().then((GLOBAL_USER) => {
                    for (const user of users) {
                        if (user.id === Number(GLOBAL_USER?.userId)) {
                            setCurrentUser(user);
                            break;
                        }
                    }
                });
            }
        })

    }, [])

    // get all the folder paths from the folder table with user id on startup
    useEffect(() => {
        console.log(currentUser);

        getFolders({ userId: currentUser?.id as number }).then((folders) => {
            if (folders) {
                setFolderPaths(folders.map(folder => folder.path));
            }
        });

    }, [currentUser])

    // fetch the settings object from db on start
    useEffect(() => {

        console.log(folderPaths);

        if (currentUser?.id) {
            getUserSettings({ userId: currentUser?.id }).then((settings) => {
                if (settings) {
                    console.log("settings", settings);
                    setUserSettings(settings);
                }
            })
        }
    }, [folderPaths])


    function AddFolder(
    ) {
        return (
            <main
            >
                <Button variant="outline"
                    className={cn('select-none',
                        userSettings?.fontSize === "Medium" && 'text-lg mx-0',
                        userSettings?.fontSize === "Large" && 'text-xl mx-0',
                        userSettings?.fontSize === "XLarge" && 'text-2xl mx-0',
                    )}
                    onClick={() => {
                        open({
                            directory: true
                        }).then((res): void => {
                            if (res && currentUser) {
                                for (const path of folderPaths) {
                                    if (path === res?.toString()) {
                                        toast({
                                            title: "Folder already exists",
                                            description: "The folder you are trying to add already exists in your library.",
                                            duration: 1500,
                                        })
                                        return;
                                    }
                                }

                                addFolder({ userId: currentUser?.id, folderPath: res.toString() }).then(() => {
                                    setFolderPaths(prevPaths => [...prevPaths, res] as string[]);
                                });

                            }
                        })
                    }}
                >
                    Add Folder
                </Button>
            </main>
        )
    }

    function FolderList({ folderPath, asChild, }: { folderPath: string, asChild?: boolean | undefined }) {

        const [files, setFiles] = useState<FileEntry[]>([]);
        const [folders, setFolders] = useState<FileEntry[]>([]);
        const [expanded, setExpanded] = useState(false);
        const [subtitleFiles, setSubtitleFiles] = useState<FileEntry[]>([]);
        const [deleting, setDeleting] = useState(false);
        const [prismaVideos, setPrismaVideos] = useState<Video[]>([]);
        const [finishedSettingFiles, setFinishedSettingFiles] = useState(false);
        const [isInvoking, setIsInvoking] = useState(false);
        const [watchedVideos, setWatchedVideos] = useState<Video[]>([]);

        // Reading directory contents
        useEffect(() => {
            setFinishedSettingFiles(false);
            readDir(folderPath).then((res) => {
                if (res) {
                    const videoFiles = res.filter(file => supportedVideoFormats.includes(file.path.replace(/^.*\./, '')) && !file.children);
                    const subtitleFiles = res.filter(file => file.path.split('.').pop() === 'srt');
                    const folders = res.filter(file => file.children).map(file => ({ name: file.name }));

                    setFiles(videoFiles);
                    setFolders(folders as FileEntry[]);
                    setSubtitleFiles(subtitleFiles);
                    setFinishedSettingFiles(true);
                }
            });
        }, [folderPath]); // Added folderPath as a dependency

        // Fetching videos information
        useEffect(() => {
            if (currentUser && files.length > 0 && finishedSettingFiles) {
                setIsInvoking(true);
                Promise.all(files.map(file => getVideo({ videoPath: file.path })))
                    .then(videos => {
                        setPrismaVideos(videos.filter(video => video)); // Filter out undefined or null results
                    })
                    .finally(() => setIsInvoking(false));
            }
        }, [currentUser, files, finishedSettingFiles]);

        // Filtering watched videos
        useEffect(() => {
            setWatchedVideos(prismaVideos.filter(video => video.watched));
        }, [prismaVideos]);

        // Toggle watched status
        const handleWatchedToggle = (file: FileEntry) => {
            const updatedVideos = prismaVideos.map(video => {
                if (video.path === file.path) {
                    const newWatchedStatus = !video.watched; // Toggle the status
                    // Call the backend API to update the database
                    const updateFunction = newWatchedStatus ? updateVideoWatched : unwatchVideo;
                    if (currentUser) {
                        updateFunction({ videoPath: file.path, user: currentUser, watched: newWatchedStatus }).then(() => {
                            console.log(`Video ${newWatchedStatus ? 'watched' : 'unwatched'}`);
                        });
                    }
                    return { ...video, watched: newWatchedStatus };
                }
                return video;
            });

            setPrismaVideos(updatedVideos);
        };

        // Check if video is watched
        const handleCheckWatched = (file: FileEntry) => {
            const video = prismaVideos.find(v => v.path === file.path);
            return video ? !video.watched : true; // Return true if video is not found or not watched
        };

        return (
            <AnimatePresence>
                <motion.main className='h-full w-full overflow-hidden'
                    initial={userSettings?.animations === "On" ? { x: -50 } : undefined}
                    animate={userSettings?.animations === "On" ? { x: 0 } : undefined}
                    exit={userSettings?.animations === "On" ? { y: -30 } : undefined}
                    key={"folder"}

                >
                    <ContextMenu>
                        <ContextMenuTrigger>
                            {/* Main Parent Folder */}
                            <motion.div
                                style={expanded && !asChild ? { padding: "10px" } : {}}
                                className={cn(
                                    'flex cursor-pointer flex-row items-center justify-between rounded-md bg-accent p-1',
                                    (expanded && files.length > 0 && !asChild) && 'rounded-b-none border-b-4 border-tertiary]',
                                    (expanded && folders.length > 0 && !asChild) && 'rounded-b-none border-b-4 border-tertiary',
                                    (expanded && asChild) && 'border-none',
                                    asChild && 'bg-muted',
                                    (asChild && expanded) && 'p-1 border-none drop-shadow-sm rounded-b-sm',
                                    (!asChild && expanded) && 'border-none',
                                    (asChild) && 'flex flex-col rounded-t-none',
                                    (asChild && folderPath.replaceAll("\\", " ").length > 100) && 'flex-col items-start justify-center gap-1',
                                    userSettings?.animations === "Off" && 'hover:opacity-70',

                                )}
                                onClick={(e) => {
                                    if (e.button === 0)
                                        setExpanded(!expanded);
                                }}
                                whileHover={(userSettings?.animations === "On" && !asChild) ? { padding: "10px" } : undefined}
                                transition={{ duration: 0.2, damping: 10, stiffness: 100 }}
                                initial={userSettings?.animations === "On" ? { x: 20 } : undefined}
                                animate={userSettings?.animations === "On" ? { x: 0 } : undefined}
                                exit={userSettings?.animations === "On" ? { y: -1, opacity: 0 } : undefined}

                            >

                                {/* Displays all the tags for main parent folder. */}
                                < div className={cn('flex flex-row items-center justify-start gap-1 font-medium text-primary text-sm text-center w-full',
                                )}>

                                    <AnimatePresence mode='wait'>
                                        <motion.div className='flex items-start justify-center text-center'
                                            key={folderPath + "not expanded" + (Math.random() * 10) + ""}
                                            initial={userSettings?.animations === "On" ? { opacity: 0.7 } : undefined}
                                            animate={userSettings?.animations === "On" ? { rotate: 0, opacity: 1 } : undefined}
                                            exit={userSettings?.animations === "On" ? { opacity: 0.7 } : undefined}
                                            transition={{ duration: 0.1, damping: 300, stiffness: 5, }}
                                        >
                                            {(asChild && !expanded) && (
                                                <Folder className={cn('h-auto w-4',
                                                    userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                    userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                    userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                )} />
                                            )}

                                        </motion.div>
                                        <motion.div className='flex items-start justify-center'
                                            key={folderPath + "expanded"}
                                            initial={userSettings?.animations === "On" ? { rotate: 0.7, rotateX: -200 } : undefined}
                                            animate={userSettings?.animations === "On" ? { opacity: 1 } : undefined}
                                            exit={userSettings?.animations === "On" ? { rotate: 0, opacity: 0 } : undefined}
                                            transition={{ duration: 0.1, damping: 10, stiffness: 100 }}
                                        >
                                            {(asChild && expanded) && (
                                                <CornerUpRight className={cn('h-auto w-4 px-0.5',
                                                    userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                    userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                    userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                )}
                                                />
                                            )}
                                        </motion.div>

                                    </AnimatePresence>

                                    {folders.length === 0 && files.length === 0 && subtitleFiles.length === 0 ?
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
                                        <Trash2 className={cn('rounded-lg p-0.5 text-destructive hover:bg-white h-auto w-6',
                                            userSettings?.fontSize === "Medium" && 'h-auto w-7',
                                            userSettings?.fontSize === "Large" && 'h-auto w-8',
                                            userSettings?.fontSize === "XLarge" && 'h-auto w-9'
                                        )} onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleting(true);
                                            // trigger the delete folder db command
                                            deleteFolder({ folderPath }).then(() => {
                                                setDeleting(false);
                                                router.prefetch('/dashboard');
                                                window.location.reload();
                                            });
                                        }} />

                                    </motion.span>

                                )}
                            </motion.div>
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

                    <ul className='overflow-hidden overflow-y-auto bg-muted'>

                        {/* Files */}
                        <AnimatePresence >
                            {
                                expanded && files.map((file, index) => {
                                    return (
                                        <ContextMenu key={index}>
                                            <ContextMenuTrigger>
                                                <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 py-1 px-4 cursor-pointer overflow-hidden',
                                                    (index === files.length - 1) && 'rounded-b-md border-b-0 border-tertiary',
                                                    userSettings?.animations === "Off" && 'hover:opacity-50',
                                                    prismaVideos.some((video) => video.path === file.path && video.watched) && 'bg-accent drop-shadow-sm',
                                                )}
                                                    onClick={(e) => {
                                                        if (e.button === 0 && !isInvoking && finishedSettingFiles) {
                                                            setIsInvoking(true);
                                                            setFinishedSettingFiles(false);
                                                            updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: true }).then(() => {
                                                                setFinishedSettingFiles(true);
                                                            });

                                                            setFinishedSettingFiles(false);
                                                            invoke('open_video', { path: file.path, userId: string }).then((res) => {
                                                                if ((res as string) === "closed") {
                                                                    setFinishedSettingFiles(true);
                                                                    setIsInvoking(false);
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    key={file.name}

                                                    initial={userSettings?.animations === "On" ? { opacity: 0 } : undefined}
                                                    animate={userSettings?.animations === "On" ? { opacity: 1 } : undefined}
                                                    exit={userSettings?.animations === "On" ? { opacity: 0, x: -100 } : undefined}
                                                    whileHover={userSettings?.animations === "On" ? { x: 1.5 } : undefined}
                                                    transition={{ duration: 0.15, damping: 10, stiffness: 100 }}
                                                >
                                                    {/* If its not a folder render it as a video file */}
                                                    {!file.children &&
                                                        <div className={cn('flex flex-row items-center justify-center gap-1 font-medium select-none',
                                                            (file.name && file.name?.length > 100) && 'flex-col items-start justify-center gap-1',
                                                        )}

                                                        >
                                                            <Film className={cn('h-auto w-4',
                                                                userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                                userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                                userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                            )}

                                                            />
                                                            {/* Check if the file's path matches any video's path in prismaVideos */}
                                                            <AnimatePresence mode='wait'>
                                                                {prismaVideos.some((video) => {
                                                                    if (video?.path === file?.path && video?.watched) {
                                                                        return true;
                                                                    } else {
                                                                        return false;
                                                                    }
                                                                }) ? (
                                                                    <div style={
                                                                        currentUser?.color ? {
                                                                            textShadow: "0 0 5px rgba(0,0,0,0.2)"
                                                                        } : {}} className={(`flex flex-row items-center justify-center gap-1 rounded-sm px-0.5 font-bold`)}>
                                                                        <motion.div
                                                                            key={file.name}
                                                                            className={cn('',
                                                                                userSettings?.animations === "Off" && 'hover:opacity-20'
                                                                            )}
                                                                            initial={userSettings?.animations === "On" ? { x: 20 } : undefined}
                                                                            animate={userSettings?.animations === "On" ? { x: 0 } : undefined}
                                                                            exit={userSettings?.animations === "On" ? { x: -20, opacity: 0 } : undefined}
                                                                            transition={{ duration: 0.2, damping: 10, stiffness: 100 }}
                                                                            whileHover={userSettings?.animations === "On" ? { scale: 1.2 } : undefined}
                                                                            whileTap={userSettings?.animations === "On" ? { scale: 0.9 } : undefined}
                                                                            onClick={(e) => {
                                                                                // set the video as unwatched when the user clicks on the eye icon
                                                                                e.stopPropagation();
                                                                                setFinishedSettingFiles(false);
                                                                                unwatchVideo({ videoPath: file.path }).then(() => {
                                                                                    setFinishedSettingFiles(true);

                                                                                });
                                                                            }}
                                                                        >

                                                                            <Eye className={cn('h-auto w-4 mr-0.5 ',
                                                                                userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                                                userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                                                userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                                            )} />
                                                                        </motion.div
                                                                        >
                                                                        <span className={cn('text-sm',
                                                                            userSettings?.fontSize === "Medium" && 'text-base',
                                                                            userSettings?.fontSize === "Large" && 'text-lg',
                                                                            userSettings?.fontSize === "XLarge" && 'text-2xl',
                                                                        )}>
                                                                            {file.name}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <motion.div
                                                                        key={file.name + "1"}
                                                                        className={cn('flex flex-row items-center justify-center gap-1 rounded-sm px-0.5 font-bold',
                                                                        )}
                                                                        initial={userSettings?.animations === "On" ? { x: 20 } : undefined}
                                                                        animate={userSettings?.animations === "On" ? { x: 0 } : undefined}
                                                                        exit={userSettings?.animations === "On" ? { x: 20 } : undefined}
                                                                        transition={{ duration: 0.2, bounce: 0.5, type: 'spring' }}
                                                                    >
                                                                        <span className={cn('text-sm',
                                                                            userSettings?.fontSize === "Medium" && 'text-base',
                                                                            userSettings?.fontSize === "Large" && 'text-lg',
                                                                            userSettings?.fontSize === "XLarge" && 'text-2xl',
                                                                        )}>{file.name}</span>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    }
                                                </motion.li>
                                                <ContextMenuContent className={cn(``,
                                                    userSettings?.animations === "Off" && ``
                                                )}


                                                >
                                                    <ContextMenuItem className='cursor-pointer gap-1 py-0.5 font-medium'
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
                                                        <ContextMenuSubTrigger className={cn('cursor-pointer gap-1 py-0.5 font-medium',
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
                                                                    onClick={() => handleWatchedToggle(file)}
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
                                                                        setFinishedSettingFiles(false);
                                                                        unwatchVideo({ videoPath: file.path }).then(() => {
                                                                            setFinishedSettingFiles(true);
                                                                        });
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
                                                                    setFinishedSettingFiles(false);
                                                                    files.slice(0, index + 1).map((file) => {
                                                                        updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: true }).then(() => {
                                                                            setFinishedSettingFiles(true);
                                                                        });
                                                                    })

                                                                }}
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
                                                                    files.slice(index, files.length).map((file) => {
                                                                        unwatchVideo({ videoPath: file.path }).then((res) => {
                                                                            if (res)
                                                                                setFinishedSettingFiles(true);
                                                                        });
                                                                    })
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
                                })
                            }
                        </AnimatePresence>
                        {/*Child Folders */}
                        <AnimatePresence>
                            {
                                expanded && folders.map((folder, index) => {
                                    return (
                                        <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 p-0.5 px-2 cursor-pointer overflow-hidden select-none',
                                            (index === folders.length - 1) && 'rounded-b-md border-b-4 border-tertiary',
                                            asChild && 'px-3.5 border-none rounded-none',
                                        )}
                                            key={folder.name}

                                            initial={userSettings?.animations === "On" ? { opacity: 0 } : undefined}
                                            animate={userSettings?.animations === "On" ? { opacity: 1 } : undefined}
                                            exit={(userSettings?.animations === "On") ? { y: -20, opacity: 0 } : undefined}
                                            whileHover={(userSettings?.animations === "On") ? { x: 1 } : undefined}
                                            transition={{ duration: 0.15, damping: 10, stiffness: 100 }}
                                        >

                                            <FolderList folderPath={folder.path} asChild />

                                        </motion.li>

                                    )
                                })
                            }
                        </AnimatePresence>
                    </ul>
                </motion.main >
            </AnimatePresence >
        )
    }

    return (
        <AnimatePresence>
            <div>
                <motion.div className='flex h-fit w-full flex-col gap-2 overflow-auto p-3'
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2, bounce: 0.5, type: 'spring' }}
                    key={"folder"}
                >
                    {folderPaths.map((folder, index) => {
                        return <FolderList folderPath={folder} key={index} />
                    })}
                    <AddFolder />
                </motion.div>

                <motion.div className='h-fit w-full overflow-hidden'
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ duration: 0.2, bounce: 0.5, type: 'spring' }}
                    key={"Loader"}
                >
                    <Loader2 className='animate-spin text-accent' size={40} />
                </motion.div>

            </div>


        </AnimatePresence>
    )

}


let supportedVideoFormats = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'vob', 'ogv', 'ogg', 'drc', 'gif', 'gifv', 'mng', 'avi', 'mov', 'qt', 'wmv', 'yuv', 'rm', 'rmvb', 'asf', 'amv', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'mpg', 'mpeg', 'm2v', 'm4v', 'svi', '3gp', '3g2', 'mxf', 'roq', 'nsv', 'flv', 'f4v', 'f4p', 'f4a', 'f4b'];