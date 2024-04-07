import type { Folder as PrismaFolder, User, Video } from "@prisma/client";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { useEffect, useState } from "react";
import { getFolderColor, getFolders, getVideo, randomizeFolderColor, updateFolderExpanded, updateVideoWatched } from '../../../../lib/prisma-commands';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils";
import { FolderInput, Palette, } from 'lucide-react';
import { invoke } from "@tauri-apps/api/tauri";
import { AnimatePresence, motion } from 'framer-motion';
import { SettingSchema } from "@/app/settings/page";
// import { AnimeData } from "@/app/dashboard/page";
import ParentTitleAndTags from "./parent-title-and-tags";
import ParentTrashcan from "./parentTrashcan";
import VideoFile from "./_video-files/video-file";

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

    // reading directory contents
    useEffect(() => {
        //console.log("CurrentFolderPath = ", folderPath);
        setFinishedSettingFiles(false);
        readDir(folderPath).then((res) => {
            if (res) {
                // console.log("res:", res);
                const videoFiles = res.filter(file => supportedVideoFormats.includes(file.path.replace(/^.*\./, '')) && !file.children);
                // console.log(videoFiles.map(vid => vid.name));
                let filteredVideos = videoFiles
                    .filter(video => video !== null && video !== undefined)
                    .sort((a, b) => {
                        const numA = parseInt(a.name!.replace(/[^0-9]/g, ""));
                        const numB = parseInt(b.name!.replace(/[^0-9]/g, ""));
                        return numA - numB;
                    }) as FileEntry[];
                // console.log(filteredVideos.map(vid => vid.name));
                const subtitleFiles = res.filter(file => supportedSubtitleFormats.some(format => format === file.path.split('.').pop()));
                const folders = res.filter(file => file.children);

                // let uniqueFolders: FileEntry[] = [];

                setFiles(filteredVideos as FileEntry[]);
                setFolders(folders as FileEntry[]);
                setSubtitleFiles(subtitleFiles as FileEntry[]);

                setFinishedSettingFiles(true);

            }
        })
    }, [folderPath]);

    // get the current folder color from the db 
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

    // update the folder expanded state in the db when the user expands or collapses a folder
    useEffect(() => {
        if (currentUser && finishedSettingFiles && expanded !== undefined) {
            updateFolderExpanded({ folderPath: folderPath, expanded: expanded, userId: currentUser?.id, asChild: asChild || false }).then(() => {
            });
        }
    }, [asChild, folderPath, expanded, finishedSettingFiles, currentUser, currentFolderColor]);

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
            invoke("rename_subs", { subPaths: JSON.stringify(subPaths), vidPaths: JSON.stringify(vidPaths), folderPath: folderPath });
        }
    }, [subtitleFiles, files, userSettings?.autoRename, expanded, folderPath]);


    // Check if video is watched
    const handleCheckWatched = (file: FileEntry) => {
        const video = prismaVideos.find(v => v.path === file.path && v.watched);
        return video ? !video.watched : true; // Return true if video is not found or not watched
    };

    const handleWatchVideo = (file: FileEntry) => {
        updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: true })
            .then(() => {
                // Check if the video exists in prismaVideos
                const videoExists = prismaVideos.some(video => video.path === file.path);

                if (videoExists) {
                    // If the video exists, update its watched property
                    setPrismaVideos(prismaVideos.map(video =>
                        video.path === file.path
                            ? { ...video, watched: true }
                            : video
                    ));
                } else {
                    // If the video doesn't exist, add it to prismaVideos so it updates the ui
                    setPrismaVideos([...prismaVideos, {
                        path: file.path, watched: true,
                        id: -1,
                        userId: currentUser!.id,
                        lastWatchedAt: null
                    }]);
                }
            })
    }

    const handleUnwatchVideo = (file: FileEntry) => {
        updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: false }).then(() => {
            setPrismaVideos(prismaVideos.map(video => video.path === file.path
                ? { ...video, watched: false }
                : video
            ))
        })
    }

    const handleSliceToWatchVideo = async (index: number) => {
        const promises = files.slice(0, index + 1).map(file =>
            updateVideoWatched({ videoPath: file.path, user: currentUser!, watched: true })
        );

        await Promise.all(promises);

        setPrismaVideos(prevPrismaVideos => {
            const newVideos = files.slice(0, index + 1).map(file => ({
                path: file.path, watched: true,
                id: -1,
                userId: currentUser!.id,
                lastWatchedAt: null
            }));

            // Merge prevPrismaVideos and newVideos, removing duplicates
            const mergedVideos = [...prevPrismaVideos, ...newVideos]
                .filter((video, index, self) =>
                    index === self.findIndex(v => v.path === video.path)
                );

            // Mark videos as watched
            return mergedVideos.map(video => {
                if (newVideos.some(newVideo => newVideo.path === video.path)) {
                    return { ...video, watched: true };
                } else {
                    return video;
                }
            });
        });
    }

    const handleSliceToUnWatchVideo = (index: number) => {
        setPrismaVideos(prevPrismaVideos => {
            return prevPrismaVideos.map(video => {
                if (files.slice(index, files.length)
                    .some(file => file.path === video.path)) {
                    updateVideoWatched({ videoPath: video.path, user: currentUser!, watched: false });

                    // return a new video object with watched set to true back into the map of the prevPrismaVideos
                    return { ...video, watched: false };
                } else {
                    // Return the video as is
                    return video;
                }
            });
        });
    }

    // const handleUnwatchMalAnime = (file: File) => {
    //     // remove the file type
    //     let split = file.name?.split(".");
    //     if (split) {
    //         let episodeN = split[split.length - 2].match(/\d+/);
    //         if (episodeN && episodeN[0]) {
    //             invoke("find_anime_from_title", { episodeTitle: split[split.length - 2], folderPath: folderPath })
    //                 .then((res: any) => {
    //                     if (res.includes("Error")) {
    //                         console.log("🚀 ~ .then ~ res:", res)
    //                         return;
    //                     } else {
    //                         let parsedData: AnimeData = JSON.parse(res as string);

    //                         if (episodeN[0]) {
    //                             // @ts-ignore
    //                             invoke("check_mal_config", { animeData: res as string, episodeNumber: Number(episodeN[0]!) })
    //                             //console.log(`Anime from title: ${parsed._sources}`);
    //                         }
    //                     }
    //                 });
    //         }
    //     }
    // }

    // const handleUpdateWatchMalAnime = () => {
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
    // }

    return (
        <main className='mb-2 h-full w-full rounded-b-md'
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
                                    if (!expanded) {
                                        getFolderColor({ folderPath: folderPath })
                                            .then((color: any) => {
                                                // console.log(color[0].color);
                                                if (color && color[0] && color[0].color) {
                                                    setCurrentFolderColor(color[0].color);
                                                }
                                            })

                                    } else {
                                        setCurrentFolderColor(undefined);
                                    }
                                setExpanded(!expanded);
                            }}

                            whileHover={(userSettings?.animations === "On" && !asChild) ? { padding: "6.5px" } : undefined}
                        >

                            {/* Displays all the tags and name for main parent folder. */}
                            <div className="w-full truncate">
                                <ParentTitleAndTags currentFolderColor={currentFolderColor} expanded={expanded} asChild={asChild} files={files} folderPath={folderPath} folders={folders} subtitleFiles={subtitleFiles} userSettings={userSettings} />
                            </div>
                            {/* Only display trashcan when its a main parent folder */}
                            {!asChild && (
                                <ParentTrashcan folderPath={folderPath} folderPaths={folderPaths} parentFolderPaths={parentFolderPaths} setFolderPathsHook={setFolderPathsHook} setParentFolderPathsHook={setParentFolderPathsHook} userSettings={userSettings} />
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
                    <ContextMenuSeparator />
                    <ContextMenuItem className='flex cursor-pointer items-center gap-1 font-medium'
                        onClick={(e) => {
                            if (e.button === 0 && !isInvoking) {
                                randomizeFolderColor({ folderPath: folderPath })
                                    .then((color: any) => {
                                        console.log(color);
                                        setCurrentFolderColor(color);
                                    })
                            }
                        }}
                    >
                        <span className={cn("",
                            userSettings?.fontSize === "Medium" && 'text-base',
                            userSettings?.fontSize === "Large" && 'text-lg',
                            userSettings?.fontSize === "XLarge" && 'text-xl',
                        )}>Randomize Color</span>
                        <Palette className={cn('h-auto w-4',
                            userSettings?.fontSize === "Medium" && 'h-auto w-5',
                            userSettings?.fontSize === "Large" && 'h-auto w-6',
                            userSettings?.fontSize === "XLarge" && 'h-auto w-7'
                        )} />
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>


            {/* Renders Video Files */}
            {
                expanded && files.filter((file, index) => !file.children).map((file, index) => {
                    return (
                        <VideoFile file={file} index={index} userSettings={userSettings} files={files} currentFolderColor={currentFolderColor} prismaVideos={prismaVideos} currentUser={currentUser} handleUnwatchVideo={handleUnwatchVideo} handleCheckWatched={handleCheckWatched} handleWatchVideo={handleWatchVideo} handleSliceToWatchVideo={handleSliceToWatchVideo} handleSliceToUnwatchVideo={handleSliceToUnWatchVideo} key={index + 500} />
                    )
                })
            }

            {/* Renders Child Folders */}
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
                            }}
                            key={folder.name + "current-child" + index}
                            initial={userSettings?.animations === "On" ? { y: -40 } : undefined}
                            animate={userSettings?.animations === "On" ? { opacity: 1, y: 0 } : undefined}
                            exit={(userSettings?.animations === "On") ? { y: -40, opacity: 0 } : undefined}
                            whileHover={(userSettings?.animations === "On") ? { x: 0.2 } : undefined}
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