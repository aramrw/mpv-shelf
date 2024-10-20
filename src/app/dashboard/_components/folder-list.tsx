import type { Folder as PrismaFolder, User, Video } from "@prisma/client";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { useEffect, useState, useRef } from "react";
import {
  getFolderColor,
  randomizeFolderColor,
} from "../../../../lib/prisma-commands/misc-cmds";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { FolderInput, Palette } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { SettingSchema } from "@/app/settings/page";
// import { AnimeData } from "@/app/dashboard/page";
import ParentTitleAndTags from "./parent-title-and-tags";
import ParentTrashcan from "./parentTrashcan";
import VideoFile from "./_video-files/video-file";
import {
  getFolders,
  updateFolderExpanded,
  updateFolderScrollY,
  getFolderScrollY
} from "../../../../lib/prisma-commands/folders/folder-cmds";
import { getVideo, updateVideoWatched } from "../../../../lib/prisma-commands/videos/video-cmds";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { updateUserScrollY } from "../../../../lib/prisma-commands/misc-cmds";
import FolderContexMenuContent from "./folder_contex_menu_content";

let supportedFormats = [
  "mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "vob", "ogv", "ogg",
  "drc", "gif", "gifv", "mng", "avi", "mov", "qt", "wmv", "yuv", "rm",
  "rmvb", "asf", "amv", "mp4", "m4p", "m4v", "mpg", "mp2", "mpeg", "mpe",
  "mpv", "mpg", "mpeg", "m2v", "m4v", "svi", "3gp", "3g2", "mxf", "roq",
  "nsv", "flv", "f4v", "f4p", "f4a", "f4b", "m4a", "m4b", "aac", "ac3",
  "aiff", "alac", "ape", "au", "dsd", "dts", "flac", "m4a", "m4b", "mka",
  "mp2", "mp3", "oga", "ogg", "opus", "pcm", "tak", "tta", "wav", "wma", "wv"
];

let supportedSubtitleFormats = ["srt", "ass", "vtt", "stl", "scc", "ttml"];

const FolderList = ({
  folderPath,
  asChild,
  userSettings,
  currentUser,
  folderPaths,
  parentFolderPaths,
  setFolderPathsHook,
  setParentFolderPathsHook,
}: {
  folderPath: string;
  asChild?: boolean | undefined;
  userSettings: SettingSchema | undefined;
  currentUser: User | undefined;
  folderPaths: string[] | undefined;
  parentFolderPaths: string[] | undefined;
  setFolderPathsHook: (folderPaths: string[]) => void;
  setParentFolderPathsHook: (folderPaths: string[]) => void;
}) => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [folders, setFolders] = useState<FileEntry[]>([]);
  const [expanded, setExpanded] = useState<boolean>();
  const [subtitleFiles, setSubtitleFiles] = useState<FileEntry[]>([]);
  const [prismaVideos, setPrismaVideos] = useState<Video[]>([]);
  const [finishedSettingFiles, setFinishedSettingFiles] = useState(false);
  const [isInvoking, setIsInvoking] = useState(false);
  const [currentFolderColor, setCurrentFolderColor] = useState<string>();
  const scrolledDiv = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({
    container: scrolledDiv,
  });

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (currentUser && latest)
      updateFolderScrollY({ userId: currentUser?.id, folderPath, scrollY: latest }).then((_rows) => {
        //console.log(`${folderPath}: ${latest}`);
      })
  });

  const setScrollPosition = (userYPos: any) => {
    (scrolledDiv.current as HTMLElement | null)?.scrollTo({
      top: userYPos,
      behavior: "smooth",
    });
  };

  // get and set the user's scroll position from the db once currentUser is set
  useEffect(() => {
    if (currentUser) {
      getFolderScrollY({ userId: currentUser.id, folderPath }).then((userY: any) => {
        let unlisten: NodeJS.Timeout;

        if (userY > 55) {
          unlisten = setTimeout(() => {
            setScrollPosition(userY);
          }, 500); // specify the timeout duration here
        }

        return () => {
          clearTimeout(unlisten);
        };
      });
    }
  }, [currentUser, folderPath]);

  // reading directory contents
  useEffect(() => {
    //console.log("CurrentFolderPath = ", folderPath);
    setFinishedSettingFiles(false);
    readDir(folderPath).then((res) => {
      if (res) {
        // console.log("res:", res);
        const videoFiles = res.filter(
          (file) =>
            supportedFormats.includes(file.path.replace(/^.*\./, "")) &&
            !file.children,
        );
        // console.log(videoFiles.map(vid => vid.name));
        let filteredVideos = videoFiles
          .filter((video) => video !== null && video !== undefined)
          .sort((a, b) => {
            const numA = parseInt(a.name!.replace(/[^0-9]/g, ""));
            const numB = parseInt(b.name!.replace(/[^0-9]/g, ""));
            return numA - numB;
          }) as FileEntry[];

        //console.log(filteredVideos.map(vid => vid.name));

        const subtitleFiles = res.filter((file) =>
          supportedSubtitleFormats.some(
            (format) => format === file.path.split(".").pop(),
          ),
        );
        const folders = res.filter((file) => file.children);

        const filtered_folders = folders
          .filter((folder) => folder !== null && folder !== undefined)
          .sort((a, b) => {
            const normalizeNumber = (str: string) => {
              // Convert full-width numbers to half-width
              const normalizedStr = str.replace(/[\uFF10-\uFF19]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0));
              // Extract and parse the number
              const match = normalizedStr.match(/\d+/);
              return match ? parseInt(match[0], 10) : 0;
            };

            const numA = normalizeNumber(a.name!.trim());
            const numB = normalizeNumber(b.name!.trim());

            return numA - numB;
          }) as FileEntry[];

        console.log(filtered_folders.map(vid => vid.name));

        setFiles(filteredVideos);
        setFolders(filtered_folders);
        setSubtitleFiles(subtitleFiles as FileEntry[]);

        setFinishedSettingFiles(true);
      }
    });
  }, [folderPath]);

  // get the current folder color from the db
  useEffect(() => {
    if (currentUser && folderPath) {
      setIsInvoking(true);
      getFolders({ userId: currentUser.id })
        .then((folders: PrismaFolder[]) => {
          //console.log(folders.length);
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
        })
        .finally(() => {
          setIsInvoking(false);
        });
    }
  }, [currentUser, folderPath]);

  // update the folder expanded state in the db when the user expands or collapses a folder
  useEffect(() => {
    if (currentUser && finishedSettingFiles && expanded !== undefined) {
      updateFolderExpanded({
        folderPath: folderPath,
        expanded: expanded,
        userId: currentUser?.id,
        asChild: asChild || false,
      });
    }
  }, [
    asChild,
    folderPath,
    expanded,
    finishedSettingFiles,
    currentUser,
    currentFolderColor,
  ]);

  // Fetching videos information
  useEffect(() => {
    //console.log("Fetching videos information");
    let newVideosArray: Video[] = [];
    if (currentUser && files.length > 0 && finishedSettingFiles) {
      setIsInvoking(true);
      Promise.all(
        files.map((file) =>
          getVideo({ videoPath: file.path, userId: currentUser.id }),
        ),
      )
        .then((videos) => {
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
    if (
      subtitleFiles.length > 0 &&
      files.length > 0 &&
      userSettings?.autoRename === "On" &&
      expanded
    ) {
      //console.log(files);
      const subPaths: string[] = [];
      const vidPaths: string[] = [];
      for (const sub of subtitleFiles) {
        subPaths.push(sub.path);
      }

      for (const vid of files) {
        vidPaths.push(vid.path);
      }
      invoke("rename_subs", {
        userId: currentUser?.id,
        subPaths: JSON.stringify(subPaths),
        vidPaths: JSON.stringify(vidPaths),
        folderPath: folderPath,
      });
    }
  }, [subtitleFiles, files, userSettings?.autoRename, expanded, folderPath]);

  // Check if video is watched
  const handleCheckWatched = (file: FileEntry) => {
    const video = prismaVideos.find((v) => v.path === file.path && v.watched);
    return video ? !video.watched : true; // Return true if video is not found or not watched
  };

  const handleWatchVideo = (file: FileEntry) => {
    // update in db
    updateVideoWatched({
      videoPath: file.path,
      user: currentUser,
      watched: true,
    }).then(() => {
      // Check if the video exists in prismaVideos
      const videoExists = prismaVideos.some(
        (video) => video.path === file.path,
      );

      if (videoExists) {
        // If the video exists, update its watched property
        setPrismaVideos(
          prismaVideos.map((video) =>
            video.path === file.path ? { ...video, watched: true } : video,
          ),
        );
      } else {
        // If the video doesn't exist, add it to prismaVideos so it updates the ui
        setPrismaVideos([
          ...prismaVideos,
          {
            path: file.path,
            watched: true,
            id: -1,
            userId: currentUser!.id,
            lastWatchedAt: null,
          },
        ]);
      }
    });
  };

  const handleUnwatchVideo = (file: FileEntry) => {
    updateVideoWatched({
      videoPath: file.path,
      user: currentUser!,
      watched: false,
    }).then(() => {
      setPrismaVideos(
        prismaVideos.map((video) =>
          video.path === file.path ? { ...video, watched: false } : video,
        ),
      );
    });
  };

  const handleSliceToWatchVideo = async (index: number) => {
    const promises = files.slice(0, index + 1).map((file) =>
      updateVideoWatched({
        videoPath: file.path,
        user: currentUser!,
        watched: true,
      }),
    );

    await Promise.all(promises);

    setPrismaVideos((prevPrismaVideos) => {
      const newVideos = files.slice(0, index + 1).map((file) => ({
        path: file.path,
        watched: true,
        id: -1,
        userId: currentUser!.id,
        lastWatchedAt: null,
      }));

      // Merge prevPrismaVideos and newVideos, removing duplicates
      const mergedVideos = [...prevPrismaVideos, ...newVideos].filter(
        (video, index, self) =>
          index === self.findIndex((v) => v.path === video.path),
      );

      // Mark videos as watched
      return mergedVideos.map((video) => {
        if (newVideos.some((newVideo) => newVideo.path === video.path)) {
          return { ...video, watched: true };
        } else {
          return video;
        }
      });
    });
  };

  const handleSliceToUnWatchVideo = (index: number) => {
    setPrismaVideos((prevPrismaVideos) => {
      return prevPrismaVideos.map((video) => {
        if (
          files
            .slice(index, files.length)
            .some((file) => file.path === video.path)
        ) {
          updateVideoWatched({
            videoPath: video.path,
            user: currentUser!,
            watched: false,
          });

          // return a new video object with watched set to true back into the map of the prevPrismaVideos
          return { ...video, watched: false };
        } else {
          // Return the video as is
          return video;
        }
      });
    });
  };


  return (
    <main
      className={cn(
        "h-full w-full rounded-md",
        //expanded && folders.length === 1 && "max-h-60",
      )}
      key={folderPath + "main-parent-folder"}
    >
      <ContextMenu key={folderPath + "main-parent-context-menu"}>
        <ContextMenuTrigger>
          <AnimatePresence>
            {/* Main Parent Folder */}
            <motion.div
              initial={
                userSettings?.animations === "On" ? { opacity: 0 } : undefined
              }
              animate={
                userSettings?.animations === "On" ? { opacity: 1 } : undefined
              }
              exit={
                userSettings?.animations === "On" ? { opacity: 0 } : undefined
              }
              transition={{ duration: 0.2, damping: 0.5 }}
              key={"main-parent-folder-motion-div"}
              id="MAIN_PARENT_FOLDER_TITLE"
              style={{
                ...(currentFolderColor
                  ? {
                    backgroundColor: `${currentFolderColor}`,
                    borderBottom: `1px solid ${currentFolderColor}`,
                    filter: "brightness(0.98)",
                  }
                  : {}),
                ...(expanded && !asChild ? { padding: "6.5px" } : {}),
              }}
              className={cn(
                "flex cursor-default flex-row items-center justify-between border-tertiary rounded-sm p-1 bg-muted break-keep",
                expanded &&
                files.length > 0 &&
                !asChild &&
                "rounded-b-none border-b-4",
                expanded &&
                folders.length > 0 &&
                !asChild &&
                "rounded-b-none border-b-4",
                expanded && asChild && "border-none rounded-sm",
                expanded && asChild && "p-1 border-none rounded-b-none",
                expanded && !asChild && "border-none",
                asChild && "shadow-sm rounded-t-none bg-muted flex flex-col cursor-default",
                userSettings?.animations === "Off" && "hover:opacity-80",
              )}
              onClick={() => {
                if (files.length > 0 || folders.length > 0) {
                  if (!expanded) {
                    getFolderColor({ folderPath: folderPath }).then(
                      (color: any) => {
                        // console.log(color[0].color);
                        if (color && color[0] && color[0].color) {
                          setCurrentFolderColor(color[0].color);
                        }
                      },
                    );
                  } else {
                    setCurrentFolderColor(undefined);
                  }
                  setExpanded(!expanded);
                }
              }}
              whileHover={
                userSettings?.animations === "On" && !asChild && files.length > 0 || folders.length > 0
                  ? { padding: "6.5px", opacity: 0.7 }
                  : { opacity: 0.7 }
              }
            >
              {/* Displays all the tags and name for main parent folder. */}
              <div className="w-full truncate">
                <ParentTitleAndTags
                  currentFolderColor={currentFolderColor}
                  expanded={expanded}
                  asChild={asChild}
                  files={files}
                  folderPath={folderPath}
                  folders={folders}
                  subtitleFiles={subtitleFiles}
                  userSettings={userSettings}
                />
              </div>
              {/* Only display trashcan when its a main parent folder */}
              {!asChild && (
                <ParentTrashcan
                  currentUser={currentUser}
                  folderPath={folderPath}
                  folderPaths={folderPaths}
                  parentFolderPaths={parentFolderPaths}
                  setFolderPathsHook={setFolderPathsHook}
                  setParentFolderPathsHook={setParentFolderPathsHook}
                  userSettings={userSettings}
                />
              )}
            </motion.div>
            {/* END Main Parent Folder END */}
          </AnimatePresence>
        </ContextMenuTrigger>
        <FolderContexMenuContent
          folderPath={folderPath}
          userSettings={userSettings}
          setCurrentFolderColor={setCurrentFolderColor}
        />
      </ContextMenu>

      {/* Main folder div that holds all videos and child folders */}
      <div
        className={cn(
          "overflow-y-auto rounded-b-lg overflow-x-hidden max-h-60",
        )}
        ref={scrolledDiv}
        id="MAIN_FOLDER_DIV"
        style={{
          ...(currentFolderColor
            ? {
              //backgroundColor: `${currentFolderColor}`,
              borderBottom: `8px solid ${currentFolderColor}`,
              //filter: "brightness(1.1)",
            }
            : {}),
        }}
      >
        {/* Renders Video Files */}
        {expanded &&
          files
            .filter((file) => !file.children)
            .map((file, index) => {
              return (
                <VideoFile
                  file={file}
                  index={index}
                  userSettings={userSettings}
                  files={files}
                  currentFolderColor={currentFolderColor}
                  prismaVideos={prismaVideos}
                  currentUser={currentUser}
                  handleUnwatchVideo={handleUnwatchVideo}
                  handleCheckWatched={handleCheckWatched}
                  handleWatchVideo={handleWatchVideo}
                  handleSliceToWatchVideo={handleSliceToWatchVideo}
                  handleSliceToUnwatchVideo={handleSliceToUnWatchVideo}
                  key={index + 500}
                />
              );
            })}
        {/* Renders Child Folders */}
        {expanded &&
          folders.map((folder, index) => {
            return (
              <motion.li
                id="CHILD-FOLDER-WRAPPER"
                className={cn(
                  `h-fit 
									flex 
									flex-col 
									items-start 
									justify-self-center gap-1 px-2 overflow-x-hidden overflow-y-auto select-none`,
                  index === folders.length - 1 && !asChild && "border-tertiary mb-1.5",
                  asChild && "rounded-b-md border-none border-tertiary",
                )}
                style={{
                  ...(currentFolderColor
                    ? {
                      //borderBottom: `8px solid ${currentFolderColor}`,
                      //filter: "brightness(1.3)", // Adjust the brightness value as needed
                    }
                    : {}),
                  ...(expanded && !asChild
                    ? {
                      padding: "5.5px 3.5px 0 3.5px",

                    }
                    : {}),
                }}
                key={folder.name + "current-child" + index}
                initial={
                  userSettings?.animations === "On" ? { y: -40 } : undefined
                }
                animate={
                  userSettings?.animations === "On"
                    ? { opacity: 1, y: 0 }
                    : undefined
                }
                exit={
                  userSettings?.animations === "On"
                    ? { y: -40, opacity: 0 }
                    : undefined
                }
                transition={{ duration: 0.3, stiffness: 30 }}
              >
                <FolderList
                  folderPath={folder.path}
                  currentUser={currentUser}
                  folderPaths={folderPaths}
                  parentFolderPaths={parentFolderPaths}
                  userSettings={userSettings}
                  setFolderPathsHook={setFolderPathsHook}
                  setParentFolderPathsHook={setParentFolderPathsHook}
                  asChild
                />
              </motion.li>
            );
          })}
      </div>
    </main>
  );
};

export default FolderList;
