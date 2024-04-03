import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '@/components/ui/context-menu'
import { ContextMenu } from '@/components/ui/context-menu'
import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Eye, EyeOff, Film, FolderInput } from 'lucide-react'
import { SettingSchema } from '@/app/settings/page'
import { FileEntry } from '@tauri-apps/api/fs'
import type { Folder as PrismaFolder, User, Video } from "@prisma/client";
import { closeDatabase, updateVideoWatched } from '../../../../lib/prisma-commands'
import { invoke } from '@tauri-apps/api/tauri'
import { string } from 'zod';
import { useRouter } from 'next/navigation'

export default function VideoFile({ userSettings, file, files, currentFolderColor, prismaVideos, currentUser, index, handleUnwatchVideo, handleCheckWatched, handleWatchVideo, handleSliceToWatchVideo, handleSliceToUnwatchVideo }:
    { userSettings: SettingSchema | undefined, file: FileEntry, files: FileEntry[], currentFolderColor: string | undefined, prismaVideos: Video[], currentUser: User | undefined, index: number, handleUnwatchVideo: (file: FileEntry) => void, handleCheckWatched: (file: FileEntry) => boolean, handleWatchVideo: (file: FileEntry) => void, handleSliceToWatchVideo: (index: number) => void, handleSliceToUnwatchVideo: (index: number) => void }) {

    let router = useRouter();

    return (
        <div>
            <ContextMenu key={"context-menu" + index}>
                <ContextMenuTrigger>
                    <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 py-1.5 px-4 cursor-pointer overflow-hidden',
                        (index === files.length - 1) && 'rounded-b-md border-none',
                        userSettings?.animations === "Off" && 'hover:opacity-50',
                        index % 2 && 'brightness-150',
                        (!(index % 2)) && 'brightness-[1.35]',
                        {/* watched video notification  */ },
                        prismaVideos.some(video => video.path === file.path && video.watched) && 'shadow-md brightness-105',
                    )}
                        style={{
                            ...((currentFolderColor) && index % 2 ? { backgroundColor: `${currentFolderColor}` } : {}),
                            ...((currentFolderColor) && (!(index % 2)) ? { backgroundColor: `${currentFolderColor}` } : {}),
                        }}
                        onClick={(_e) => {
                            if (currentUser)
                                updateVideoWatched({ videoPath: file.path, user: currentUser, watched: true }).then(() => {
                                    return closeDatabase()
                                }).finally(() => {
                                    invoke('open_video', { path: file.path, userId: string });
                                })

                        }}
                        key={file.name + "current-video" + index}
                        initial={userSettings?.animations === "On" ? { opacity: 0, x: -20 } : undefined}
                        animate={userSettings?.animations === "On" ? { opacity: 1, x: 0 } : undefined}
                        exit={userSettings?.animations === "On" ? { opacity: 0, x: -20 } : undefined}
                        whileHover={userSettings?.animations === "On" ? { x: 1.5 } : undefined}
                        transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                    >

                        <motion.div className={cn('text-base flex flex-row items-start justify-center gap-1 font-medium select-none text-center',
                            (file.name && file.name?.length > 20) && 'overflow-hidden whitespace-nowrap',
                        )}
                            key={"current-video-file-name-motion-div" + file.name + index}
                            whileHover={userSettings?.animations === "On" && (file.name && file.name?.length > 65) ? { width: "-100%" } : undefined}
                            transition={{ duration: 1, damping: 0.2 }}
                        >
                            <Film className={cn('h-auto w-3',
                                (file.name && file.name?.length > 100) && 'items-start justify-center gap-1 p-0',
                                userSettings?.fontSize === "Medium" && 'h-auto w-4',
                                userSettings?.fontSize === "Large" && 'h-auto w-5',
                                userSettings?.fontSize === "XLarge" && 'h-auto w-6'
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
                                <motion.div className={cn(`flex flex-row items-center justify-center gap-1 rounded-sm px-0.5 font-bold`,
                                    {/* watched video notification */ },
                                )}
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
                                            e.stopPropagation();
                                            //set unwatched when user clicks on eye
                                            handleUnwatchVideo(file);
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
                        </motion.div>



                    </motion.li>

                    <ContextMenuContent className={cn(``,
                        userSettings?.animations === "Off" && ``
                    )}
                    >
                        <ContextMenuItem className='cursor-pointer gap-1 font-medium'
                            onClick={(e) => {
                                if (e.button === 0) {
                                    invoke('show_in_folder', { path: `${file.path}` }).then((res) => {
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
                                            handleWatchVideo(file)
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
                                                handleUnwatchVideo(file);
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
                                <ContextMenuSeparator className='my-1 h-[1px] bg-accent' />
                                <ContextMenuItem className='cursor-pointer'
                                    onClick={(e) => {
                                        //e.stopPropagation();
                                        if (currentUser?.id) {
                                            handleSliceToUnwatchVideo(index);
                                        }
                                    }}
                                >
                                    <div className='flex gap-1'>
                                        <span className={cn("",
                                            userSettings?.fontSize === "Medium" && 'text-base',
                                            userSettings?.fontSize === "Large" && 'text-lg',
                                            userSettings?.fontSize === "XLarge" && 'text-xl',
                                        )}>Unwatch To</span>
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
                                <ContextMenuItem className='cursor-pointer'
                                    onClick={(e) => {
                                        //e.stopPropagation();
                                        if (currentUser) {
                                            handleSliceToWatchVideo(index);
                                        }

                                    }
                                    }
                                >
                                    <div className='flex gap-1'>
                                        <span className={cn("",
                                            userSettings?.fontSize === "Medium" && 'text-base',
                                            userSettings?.fontSize === "Large" && 'text-lg',
                                            userSettings?.fontSize === "XLarge" && 'text-xl',
                                        )}>Watch To</span>
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
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                    </ContextMenuContent>
                </ContextMenuTrigger>
            </ContextMenu>
        </div>
    );
}

