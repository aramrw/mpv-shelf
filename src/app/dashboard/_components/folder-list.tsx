import type { Folder as PrismaFolder, User, Video } from "@prisma/client";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { useEffect, useState } from "react";
import { closeDatabase, getFolders, getVideo, updateFolderExpanded, updateVideoWatched, userGetAllVideos } from '../../../../lib/prisma-commands';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Eye, EyeOff, Film, FolderInput, } from 'lucide-react';
import { invoke } from "@tauri-apps/api/tauri";
import { string } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from "next/navigation";
import { SettingSchema } from "@/app/settings/page";
import { AnimeData } from "@/app/dashboard/page";
import ParentTitleAndTags from "./parent-title-and-tags";
import ParentTrashcan from "./trashcan";

let supportedVideoFormats = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'vob', 'ogv', 'ogg', 'drc', 'gif', 'gifv', 'mng', 'avi', 'mov', 'qt', 'wmv', 'yuv', 'rm', 'rmvb', 'asf', 'amv', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'mpg', 'mpeg', 'm2v', 'm4v', 'svi', '3gp', '3g2', 'mxf', 'roq', 'nsv', 'flv', 'f4v', 'f4p', 'f4a', 'f4b'];

let supportedSubtitleFormats = ['srt', 'ass', 'vtt', 'stl', 'scc', 'ttml'];


const FolderList = (
    { folderPath, asChild, userSettings, currentUser, folderPaths, parentFolderPaths, setFolderPathsHook, setParentFolderPathsHook }:
        {
            folderPath: string,
            asChild?: boolean | undefined,
            userSettings: SettingSchema | undefined,
            currentUser: User | undefined,
            folderPaths: string[] | undefined,
            parentFolderPaths: string[] | undefined
            setFolderPathsHook: (folderPaths: string[]) => void
            setParentFolderPathsHook: (folderPaths: string[]) => void
        }
) => {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [folders, setFolders] = useState<FileEntry[]>([]);
    const [expanded, setExpanded] = useState<boolean>();
    const [subtitleFiles, setSubtitleFiles] = useState<FileEntry[]>([]);
    const [prismaVideos, setPrismaVideos] = useState<Video[]>([]);
    const [finishedSettingFiles, setFinishedSettingFiles] = useState(false);
    const [isInvoking, setIsInvoking] = useState(false);
    const [currentFolderColor, setCurrentFolderColor] = useState<string>();
    const [isRecentlyWatched, setIsRecentlyWatched] = useState(false);

    const router = useRouter();

    // Reading directory contents
    useEffect(() => {
        //console.log("CurrentFolderPath = ", folderPath);
        setFinishedSettingFiles(false);
        readDir(folderPath).then((res) => {
            if (res) {
                //console.log("res:", res);
                const videoFiles = res.filter(file => supportedVideoFormats.includes(file.path.replace(/^.*\./, '')) && !file.children);
                let filteredVideos = videoFiles.filter(video => video !== null && video !== undefined) as FileEntry[];
                const subtitleFiles = res.filter(file => supportedSubtitleFormats.some(format => format === file.path.split('.').pop()));
                const folders = res.filter(file => file.children);

                //let uniqueFolders: FileEntry[] = [];

                setFiles(filteredVideos as FileEntry[]);
                setFolders(folders as FileEntry[]);
                setSubtitleFiles(subtitleFiles as FileEntry[]);

                setFinishedSettingFiles(true);

            }
        })
    }, [folderPath]);

    // Get the current folder color from the db 
    useEffect(() => {
        if (currentUser && folderPath) {
            setIsInvoking(true);
            getFolders({ userId: currentUser.id }).then((folders: PrismaFolder[]) => {
                if (folders && folders.length > 0) {
                    for (const folder of folders) {
                        if (folder.path === folderPath && folder.expanded) {
                            //console.log("SET expanded to TRUE from UE on START => ", folderPath);
                            if (folder.color) {
                                setCurrentFolderColor(folder.color);
                            }
                            setExpanded(true);
                        }
                    }
                }
            }).finally(() => {
                setIsInvoking(false)
            });
        }
    }, [currentUser, folderPath]);

    // Check if any videos in this folder were watched recently
    useEffect(() => {
        if (currentUser && folderPath) {
            userGetAllVideos({ userId: currentUser?.id }).then((videos) => {
                if (videos && videos.length > 0) {
                    let sortedVideos = videos.sort((a, b) => {
                        const dateA = a.lastWatchedAt ? new Date(a.lastWatchedAt).getTime() : 0;
                        const dateB = b.lastWatchedAt ? new Date(b.lastWatchedAt).getTime() : 0;
                        return dateB - dateA; // Most recent videos first
                    }).slice(0, 5); // Get the top 5 most recent videos

                    let recentlyWatchedCount = 0;
                    for (const video of sortedVideos) {
                        if (video.userId === currentUser.id && video.path.includes(folderPath) && video.watched && video.lastWatchedAt) {
                            let dateNow = new Date().getTime();
                            let lastWatched = new Date(video.lastWatchedAt).getTime();
                            const difference = dateNow - lastWatched;
                            const daysDifference = difference / (1000 * 60 * 60 * 24);

                            if (daysDifference < 1 && recentlyWatchedCount < 3) {
                                //console.log("Video was watched less than a day ago");
                                recentlyWatchedCount += 1; // Increment if this video was watched less than a day ago
                            }
                        }
                    }


                    if (recentlyWatchedCount > 0 && recentlyWatchedCount < 5) {
                        setIsRecentlyWatched(true);
                    } else {
                        setIsRecentlyWatched(false);
                    }
                } else {
                    // Set to false if there are no videos
                    setIsRecentlyWatched(false);
                }
            }).catch((err) => {
                console.error(err);
                setIsRecentlyWatched(false); // Set to false in case of error
            });
        }
    }, [currentUser, folderPath]);

    // Update the folder expanded state in the db when the user expands or collapses a folder
    useEffect(() => {
        if (currentUser && finishedSettingFiles && expanded !== undefined) {
            updateFolderExpanded({ folderPath: folderPath, expanded: expanded, userId: currentUser?.id, asChild: asChild || false }).then(() => {
            });
        }
    }, [asChild, folderPath, expanded, finishedSettingFiles, currentUser]);

    // Fetching videos information
    useEffect(() => {
        //console.log("Fetching videos information");
        let newVideosArray: Video[] = [];
        if (currentUser && files.length > 0 && finishedSettingFiles) {
            setIsInvoking(true);
            Promise.all(files.map(file => getVideo({ videoPath: file.path, userId: currentUser.id })))
                .then(videos => {
                    for (const video of videos) {
                        if (video) {
                            newVideosArray.push(video);
                        }
                    }
                })
                .finally(() => {
                    setPrismaVideos(newVideosArray);
                    setIsInvoking(false);
                });
        }
    }, [currentUser, files, finishedSettingFiles]);

    // rename subtitles if the auto rename setting is on + expanded
    useEffect(() => {
        if (subtitleFiles.length > 0 && files.length > 0 && userSettings?.autoRename === "On" && expanded) {
            //console.log(files);
            const subPaths: string[] = [];
            const vidPaths: string[] = [];
            for (const sub of subtitleFiles) {
                subPaths.push(sub.path);
            }

            for (const vid of files) {
                vidPaths.push(vid.path);
            }
            invoke("rename_subs", { subPaths: JSON.stringify(subPaths), vidPaths: JSON.stringify(vidPaths) });
        }
    }, [subtitleFiles, files, userSettings?.autoRename, expanded]);

    // update my anime list
    // useEffect(() => {
    //     if (expanded && folderPath && prismaVideos.length > 0) {
    //         // get the title of each episode that is watched to update it on mal
    //         let episodeNames: string[] = [];
    //         let episodeNumbers: number[] = [];
    //         let highestNumberEpisode: String | undefined = "";
    //         for (const v of prismaVideos) {
    //             if (v.watched) {
    //                 let episodeN = v.path.match(/\d+/);
    //                 if (episodeN) {
    //                     episodeNumbers.push(Number(episodeN[0]))
    //                 }
    //                 let split = v.path.split("\\");
    //                 let name = split[split.length - 1].split(".");
    //                 episodeNames.push(name[name.length - 2]);

    //             }
    //         }

    //         if (episodeNumbers.length > 0) {
    //             episodeNumbers.sort((a, b) => b - a);
    //             highestNumberEpisode = episodeNames.find(name => name.includes(episodeNumbers[0].toString()))?.toString();
    //             //console.log(highestNumberEpisode);
    //         }

    //         //console.log(episodeNames)
    //         if (episodeNames.length > 0) {
    //             // extract the episode number
    //             if (highestNumberEpisode) {
    //                 let episodeN = highestNumberEpisode.match(/\d+/);
    //                 if (episodeN) {
    //                     console.log(Number(episodeN[0]));
    //                     invoke("find_anime_from_title", { episodeTitle: highestNumberEpisode, folderPath: folderPath })
    //                         .then((res: any) => {
    //                             if (res.includes("Error")) {
    //                                 console.log("🚀 ~ .then ~ res:", res)
    //                                 return;
    //                             } else {
    //                                 try {
    //                                     let parsedAnimeData: AnimeData = JSON.parse(res);
    //                                     console.log(parsedAnimeData);
    //                                     // If MOVIE = no episode number so set it to 1.
    //                                     if (parsedAnimeData._anime_type == "MOVIE") {
    //                                         invoke("check_mal_config", { animeData: res as string, episodeNumber: 1 })
    //                                     } else {
    //                                         invoke("check_mal_config", { animeData: res as string, episodeNumber: Number(episodeN[0]) })
    //                                     }
    //                                 } catch (e) {
    //                                     console.log("🚀 ~ .then ~ e:", e)
    //                                 }
    //                             }
    //                         });
    //                 } else {
    //                     console.log("Episode N is glitchin! " + episodeN + highestNumberEpisode);
    //                 }

    //             }
    //         }
    //     }
    // }, [expanded, folderPath, prismaVideos])

    // Check if video is watched
    const handleCheckWatched = (file: FileEntry) => {
        const video = prismaVideos.find(v => v.path === file.path && v.watched);
        return video ? !video.watched : true; // Return true if video is not found or not watched
    };

    // unwatch video hook 
    const handleUnwatchVideo = (file: FileEntry) => {
        if (currentUser) {
            setFinishedSettingFiles(false);
            updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: false })
                .finally(() => {
                    setFinishedSettingFiles(true);
                    setIsInvoking(false);
                });
        }
    }

    const handleUnwatchMalAnime = (file: File) => {
        // remove the file type
        let split = file.name?.split(".");
        if (split) {
            let episodeN = split[split.length - 2].match(/\d+/);
            if (episodeN) {
                invoke("find_anime_from_title", { episodeTitle: split[split.length - 2], folderPath: folderPath })
                    .then((res: any) => {
                        if (res.includes("Error")) {
                            console.log("🚀 ~ .then ~ res:", res)
                            return;
                        } else {
                            let parsedData: AnimeData = JSON.parse(res as string);
                            invoke("check_mal_config", { animeData: res as string, episodeNumber: Number(episodeN[0]) })
                            //console.log(`Anime from title: ${parsed._sources}`);
                        }
                    });
            }
        }
    }


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
                            style={{
                                ...((currentFolderColor) ? { backgroundColor: `${currentFolderColor}`, borderBottom: `1px solid ${currentFolderColor}` } : {}),
                                ...(expanded && !asChild ? { padding: "6.5px" } : {}),
                                // Add more conditions as needed
                            }}
                            className={cn(
                                'flex cursor-pointer flex-row items-center justify-between border-tertiary rounded-sm p-1 bg-muted break-keep',
                                (expanded && files.length > 0 && !asChild) && 'rounded-b-none border-b-4',
                                (expanded && folders.length > 0 && !asChild) && 'rounded-b-none border-b-4',
                                (expanded && asChild) && 'border-none rounded-sm',
                                (asChild && expanded) && 'p-1 border-none rounded-b-none',
                                (!asChild && expanded) && 'border-none',
                                asChild && 'shadow-sm rounded-t-none bg-muted flex flex-col',
                                userSettings?.animations === "Off" && 'hover:opacity-80',
                            )}
                            onClick={(e) => {
                                if (files.length > 0 || folders.length > 0)
                                    setExpanded(!expanded);
                            }}

                            whileHover={(userSettings?.animations === "On" && !asChild) ? { padding: "6.5px" } : undefined}
                        >
                            {/* Displays all the tags and name for main parent folder. */}
                            <ParentTitleAndTags currentFolderColor={currentFolderColor} expanded={expanded} asChild={asChild} files={files} folderPath={folderPath} folders={folders} subtitleFiles={subtitleFiles} userSettings={userSettings} />
                            {/* Only display trashcan when its a main parent folder */}
                            <ParentTrashcan asChild={asChild} folderPath={folderPath} folderPaths={folderPaths} parentFolderPaths={parentFolderPaths} setFolderPathsHook={setFolderPathsHook} setParentFolderPathsHook={setParentFolderPathsHook} userSettings={userSettings} />
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
            {
                expanded && files.filter((file) => !file.children).map((file, index) => {
                    return (
                        <ContextMenu key={"context-menu" + index}>
                            <ContextMenuTrigger>
                                <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 py-1.5 px-4 cursor-pointer overflow-hidden',
                                    (index === files.length - 1) && 'rounded-b-md border-none',
                                    userSettings?.animations === "Off" && 'hover:opacity-50',
                                    index % 2 && 'brightness-150',
                                    (!(index % 2)) && 'brightness-[1.35]',
                                    {/* watched video notification  */ },
                                    prismaVideos.some((video) => video.path === file.path && video.watched) && 'shadow-md brightness-105',
                                )}
                                    style={{
                                        ...((currentFolderColor) && index % 2 ? { backgroundColor: `${currentFolderColor}` } : {}),
                                        ...((currentFolderColor) && (!(index % 2)) ? { backgroundColor: `${currentFolderColor}` } : {}),
                                    }}
                                    onClick={(_e) => {
                                        if (!isInvoking && finishedSettingFiles) {
                                            if (currentUser)
                                                updateVideoWatched({ videoPath: file.path, user: currentUser, watched: true }).then(() => {
                                                    return closeDatabase()
                                                }).finally(() => {
                                                    invoke('open_video', { path: file.path, userId: string });
                                                })
                                        }
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
                                                isRecentlyWatched && ''
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
                                                        updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: true })
                                                            .finally(() => {
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
                                                    if (currentUser?.id) {
                                                        files.slice(index, files.length).map((file) => {
                                                            if (currentUser) {
                                                                setFinishedSettingFiles(false);
                                                                updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: false }).finally(() => {
                                                                    setFinishedSettingFiles(true);
                                                                    setIsInvoking(false);
                                                                });
                                                            }
                                                        })
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
                                                    e.stopPropagation();
                                                    setFinishedSettingFiles(false);
                                                    if (currentUser) {
                                                        files.slice(0, index + 1).reverse().map((file) => {
                                                            updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: true }).then(() => {
                                                                return setIsRecentlyWatched(true);
                                                            }).finally(() => {
                                                                setFinishedSettingFiles(true);
                                                            });
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
                    )
                })
            }

            {/*Child Folders */}
            {
                expanded && folders.map((folder, index) => {
                    return (
                        <motion.li className={cn('flex flex-col items-start justify-center gap-1 border-b-2 p-0.5 px-2 cursor-pointer overflow-hidden select-none',
                            (index === folders.length - 1 && !asChild) && 'rounded-b-xl border-b-8 border-tertiary',
                            asChild && 'rounded-b-md border-none border-tertiary',

                        )}
                            style={{
                                ...((currentFolderColor) ?
                                    {
                                        borderBottom: `8px solid ${currentFolderColor}`
                                    } : {}),
                                ...(expanded && !asChild ? { padding: "6.5px" } : {}),
                                // Add more conditions as needed
                            }}
                            key={folder.name + "current-child" + index}
                            initial={userSettings?.animations === "On" ? { y: -40 } : undefined}
                            animate={userSettings?.animations === "On" ? { opacity: 1, y: 0 } : undefined}
                            exit={(userSettings?.animations === "On") ? { y: -40, opacity: 0 } : undefined}
                            whileHover={(userSettings?.animations === "On") ? { x: 1 } : undefined}
                            transition={{ duration: 0.3, stiffness: 30 }}

                        >

                            <FolderList folderPath={folder.path} currentUser={currentUser} folderPaths={folderPaths} parentFolderPaths={parentFolderPaths} userSettings={userSettings} setFolderPathsHook={setFolderPathsHook} setParentFolderPathsHook={setParentFolderPathsHook} asChild />

                        </motion.li>

                    )
                })
            }

        </main >
    )
}

export default FolderList