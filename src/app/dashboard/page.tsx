"use client"

import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { open } from '@tauri-apps/api/dialog';
import { addFolder, deleteFolder, getCurrentUserGlobal, getFolders, getUserSettings, getUsers, getVideo, unwatchVideo, updateVideoWatched } from '../../../lib/prisma-commands';
import type { User, Video } from "@prisma/client";
import { Captions, ChevronDown, ChevronUp, Eye, Film, Folder, FolderInput, Folders, Loader, Loader2, MoveDown, MoveUp, Trash2, VideoIcon } from 'lucide-react';
import { FileEntry, readDir } from '@tauri-apps/api/fs'
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { SettingSchema } from '../settings/page';

export default function Dashboard() {
    let [folderPaths, setFolderPaths] = useState<string[]>([]);
    let [currentUser, setCurrentUser] = useState<User>();
    let [userSettings, setUserSettings] = useState<SettingSchema>();

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
                                addFolder({ userId: currentUser?.id, folderPath: res.toString() });
                                setFolderPaths(prevPaths => [...prevPaths, res] as string[]);
                            }
                        })
                    }}
                >
                    Add Folder
                </Button>
            </main>
        )
    }

    function FolderList({ folderPath, asChild }: { folderPath: string, asChild?: boolean | undefined }) {

        let [files, setFiles] = useState<FileEntry[]>([]);
        let [folders, setFolders] = useState<FileEntry[]>([]);
        let [expanded, setExpanded] = useState(false);
        let [subtitleFiles, setSubtitleFiles] = useState<FileEntry[]>([]);
        let [deleting, setDeleting] = useState(false);
        let [prismaVideos, setPrismaVideos] = useState<Video[]>([]);
        let [finishedSettingFiles, setFinishedSettingFiles] = useState(false);

        // get all the files and folders in the folder path on startup
        useEffect(() => {
            readDir(folderPath).then((res) => {
                if (res) {
                    let videoFiles = res.filter(file => {
                        let ext = file.path.split('.').pop();
                        if (ext) {
                            return supportedVideoFormats.includes(ext);
                        }
                        return false;
                    })

                    let subtitleFiles = res.filter(file => {
                        let ext = file.path.split('.').pop();
                        if (ext) {
                            return ext === 'srt';
                        }
                        return false;
                    })

                    let folders = res.filter(file => {
                        if (file.children) {
                            return file.name;
                        }
                    });
                    //console.log("folders:", folders);

                    setFiles(videoFiles);
                    setFolders(folders);
                    setSubtitleFiles(subtitleFiles);
                    setFinishedSettingFiles(true);
                }

            })
        }, [])

        // get all the videos from the db on startup
        useEffect(() => {
            setPrismaVideos([]);
            if (currentUser && files.length > 0) {
                setPrismaVideos([]);
                for (const file of files) {
                    getVideo({ videoPath: file.path }).then((video) => {
                        if (video) {
                            setPrismaVideos(prevVideos => [...prevVideos, video]);
                            //console.log(prismaVideos);
                        }
                    })
                }
            }
        }, [finishedSettingFiles])

        // grabs the users settings from the db on startup
        if (!deleting) {
            return (

                <main className='h-full w-full overflow-hidden'>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            {/* Main Parent Folder */}
                            <motion.div className={cn('flex cursor-pointer flex-row items-center justify-between rounded-md bg-accent p-1 shadow-sm ',
                                (expanded && files.length > 0 && !asChild) && 'rounded-b-none border-b-4 border-tertiary',
                                (expanded && folders.length > 0 && !asChild) && 'rounded-b-none border-b-4 border-tertiary',
                                (asChild && expanded) && ' px-1 border-none ',
                                userSettings?.animations === "Off" && 'hover:opacity-70',
                            )}
                                onClick={(e) => {
                                    if (e.button === 0)
                                        setExpanded(!expanded);
                                }}
                                whileHover={(userSettings?.animations === "On" && !asChild) ? { scale: 0.99 } : undefined}
                                transition={{ duration: 0.15 }}

                            >
                                {/* Displays all the tags for main parent folder. */}
                                <div className={cn('flex flex-row items-center justify-center gap-1 font-medium text-primary text-sm',
                                )}>
                                    {asChild && <Folder className={cn('h-auto w-4',
                                        userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                        userSettings?.fontSize === "Large" && 'h-auto w-6',
                                        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                    )}
                                    />}
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
                                                window.location.reload();
                                            });
                                        }} />

                                    </motion.span>

                                )}

                            </motion.div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem className='flex cursor-pointer items-center gap-1'
                                onClick={(e) => {
                                    if (e.button === 0) {
                                        invoke('show_in_folder', { path: `${folderPath}` });
                                    }
                                }}
                            >
                                Open In File Explorer
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
                        {
                            expanded && files.map((file, index) => {
                                return (
                                    <ContextMenu>
                                        <ContextMenuTrigger>
                                            <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 p-0.5 px-4 cursor-pointer overflow-hidden',
                                                (index === files.length - 1 && !asChild) && 'rounded-b-md border-b-4 border-tertiary',
                                                userSettings?.animations === "Off" && 'hover:opacity-50',
                                            )}
                                                onClick={() => {
                                                    // open the file in the default video player
                                                    invoke('open_video', { path: file.path });

                                                    // update the video as watched in the db
                                                    updateVideoWatched({ videoPath: file.path }).then(() => {
                                                        setFinishedSettingFiles(!finishedSettingFiles);
                                                    });
                                                }}
                                                key={index}

                                                initial={userSettings?.animations === "On" ? { scale: 0.8 } : undefined}
                                                animate={userSettings?.animations === "On" ? { scale: 1 } : undefined}
                                                exit={userSettings?.animations === "On" ? { scale: 0 } : undefined}
                                                whileHover={userSettings?.animations === "On" ? { x: 1.5 } : undefined}
                                            >
                                                {!file.children &&
                                                    <div className='flex flex-row items-center justify-center gap-1 font-medium'>
                                                        <Film className={cn('h-auto w-4',
                                                            userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                            userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                            userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                        )}

                                                        />
                                                        {/* Check if the file's path matches any video's path in prismaVideos */}
                                                        {prismaVideos.some(video => video.path === file.path && video.watched) ? (
                                                            <div className='flex flex-row items-center justify-center gap-1 rounded-sm px-0.5 font-bold'>
                                                                <motion.div
                                                                    className={cn('',
                                                                        userSettings?.animations === "Off" && 'hover:opacity-20'
                                                                    )}
                                                                    whileHover={userSettings?.animations === "On" ? { scale: 1.2 } : undefined}
                                                                    whileTap={userSettings?.animations === "On" ? { scale: 0.9 } : undefined}
                                                                    onClick={(e) => {
                                                                        // set the video as unwatched when the user clicks on the eye icon
                                                                        e.stopPropagation();
                                                                        unwatchVideo({ videoPath: file.path }).then(() => {
                                                                            setFinishedSettingFiles(!finishedSettingFiles);
                                                                        });
                                                                    }}
                                                                >

                                                                    <Eye className={cn('h-auto w-4 ',
                                                                        userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                                        userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                                        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                                    )} />


                                                                </motion.div>
                                                                <span className={cn('text-sm',
                                                                    userSettings?.fontSize === "Medium" && 'text-base',
                                                                    userSettings?.fontSize === "Large" && 'text-lg',
                                                                    userSettings?.fontSize === "XLarge" && 'text-2xl',
                                                                )}>
                                                                    {file.name}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className={cn('text-sm',
                                                                userSettings?.fontSize === "Medium" && 'text-base',
                                                                userSettings?.fontSize === "Large" && 'text-lg',
                                                                userSettings?.fontSize === "XLarge" && 'text-2xl',
                                                            )}>{file.name}</span>
                                                        )}
                                                    </div>
                                                }
                                            </motion.li>
                                            <ContextMenuContent>
                                                <ContextMenuItem className='cursor-pointer'
                                                    onClick={(e) => {

                                                        files.slice(0, index + 1).map((file) => {
                                                            updateVideoWatched({ videoPath: file.path }).then(() => {
                                                                setFinishedSettingFiles(!finishedSettingFiles);
                                                            });
                                                        })

                                                    }}
                                                >
                                                    Cascade As Watched
                                                    <ChevronDown className={cn('h-auto w-4 ',
                                                        userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                        userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                    )} />
                                                </ContextMenuItem>
                                                <ContextMenuItem className='cursor-pointer'
                                                    onClick={(e) => {
                                                        files.slice(index, files.length).map((file) => {
                                                            unwatchVideo({ videoPath: file.path }).then(() => {
                                                                setFinishedSettingFiles(!finishedSettingFiles);
                                                            });
                                                        })
                                                    }}
                                                >
                                                    Cascade As Unwatched
                                                    <ChevronUp className={cn('h-auto w-4 ',
                                                        userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                        userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                    )} />
                                                </ContextMenuItem>
                                                <ContextMenuItem className='flex cursor-pointer items-center gap-1'
                                                    onClick={(e) => {

                                                        invoke('show_in_folder', { path: file.path });

                                                    }}
                                                >
                                                    Open In File Explorer
                                                    <FolderInput className={cn('h-auto w-4',
                                                        userSettings?.fontSize === "Medium" && 'h-auto w-5',
                                                        userSettings?.fontSize === "Large" && 'h-auto w-6',
                                                        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                                                    )} />
                                                </ContextMenuItem>
                                            </ContextMenuContent>
                                        </ContextMenuTrigger>
                                    </ContextMenu>
                                )
                            })
                        }
                        {
                            expanded && folders.map((folder, index) => {
                                return (

                                    <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 p-0.5 px-2 cursor-pointer overflow-hidden',
                                        (index === files.length - 1 && !asChild) && 'rounded-b-md border-b-4 border-tertiary',
                                        (index === folders.length - 1 && !asChild) && 'rounded-b-md border-b-4 border-tertiary',
                                        asChild && 'px-3.5 border-none my-1',
                                    )}
                                        key={index}

                                        initial={userSettings?.animations === "On" ? { scale: 0.8 } : undefined}
                                        animate={userSettings?.animations === "On" ? { scale: 1 } : undefined}
                                        exit={userSettings?.animations === "On" ? { scale: 0 } : undefined}
                                        whileHover={userSettings?.animations === "On" ? { x: 1 } : undefined}
                                    >

                                        <FolderList folderPath={folder.path} asChild />

                                    </motion.li>

                                )
                            })
                        }
                    </ul>
                </main>

            )
        } else {
            return (
                <Loader2 className='animate-spin text-accent' size={40} />
            )
        }
    }

    if (currentUser) {
        return (
            <main className='flex h-fit w-full flex-col gap-2 p-3'>
                {folderPaths.map((folder, index) => {
                    return <FolderList folderPath={folder} key={index} />
                })}

                <AddFolder />
            </main>
        )
    } else {
        return (
            <main className='flex h-1/2 w-full flex-row items-center justify-center'>
                <Loader2 className='animate-spin text-accent' size={100} />
            </main>
        )
    }
}

let supportedVideoFormats = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'vob', 'ogv', 'ogg', 'drc', 'gif', 'gifv', 'mng', 'avi', 'mov', 'qt', 'wmv', 'yuv', 'rm', 'rmvb', 'asf', 'amv', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'mpg', 'mpeg', 'm2v', 'm4v', 'svi', '3gp', '3g2', 'mxf', 'roq', 'nsv', 'flv', 'f4v', 'f4p', 'f4a', 'f4b'];