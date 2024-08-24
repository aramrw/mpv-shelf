import { ContextMenuTrigger } from "@/components/ui/context-menu";
import { ContextMenu } from "@/components/ui/context-menu";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eye, Film, MusicIcon } from "lucide-react";
import { SettingSchema } from "@/app/settings/page";
import { FileEntry } from "@tauri-apps/api/fs";
import type { User, Video } from "@prisma/client";
import { closeDatabase } from "../../../../../lib/prisma-commands/misc-cmds";
import { invoke } from "@tauri-apps/api/tauri";
import VideoContextMenu from "./video-context-menu";
import { updateVideoWatched } from "../../../../../lib/prisma-commands/videos/video-cmds";
import OpenVideoError from "../error-dialogs/open-video-error";

export default function VideoFile({
  userSettings,
  file,
  //files,
  currentFolderColor,
  prismaVideos,
  currentUser,
  index,
  handleUnwatchVideo,
  handleCheckWatched,
  handleWatchVideo,
  handleSliceToWatchVideo,
  handleSliceToUnwatchVideo,
}: {
  userSettings: SettingSchema | undefined;
  file: FileEntry;
  files: FileEntry[];
  currentFolderColor: string | undefined;
  prismaVideos: Video[];
  currentUser: User | undefined;
  index: number;
  handleUnwatchVideo: (file: FileEntry) => void;
  handleCheckWatched: (file: FileEntry) => boolean;
  handleWatchVideo: (file: FileEntry) => void;
  handleSliceToWatchVideo: (index: number) => void;
  handleSliceToUnwatchVideo: (index: number) => void;
}) {

  function getFileType(name: string): string {
    const split = name.split(".");
    return split[split.length - 1];
  }

  function calculateScrollX(fileNameLength: number): number {
    if (fileNameLength < 20) {
      return 3;
    } else if (fileNameLength < 40) {
      return 4.6;
    } else if (fileNameLength < 60) {
      return 6.9;
    } else if (fileNameLength < 80) {
      return 8.2;
    } else if (fileNameLength <= 100) {
      return 10.5;
    } else {
      return 12; // For any length above 100
    }
  }

  const audioFormats = [
    "aac", "ac3", "aiff", "alac", "ape", "au", "dsd", "dts", "flac",
    "m4a", "m4b", "mka", "mp2", "mp3", "oga", "ogg", "opus", "pcm",
    "tak", "tta", "wav", "wma", "wv"
  ];

  const videoFormats = [
    "3gp", "avi", "f4v", "flv", "mkv", "mov", "mp4", "mpg", "mpeg",
    "mts", "m2ts", "ogv", "rmvb", "vob", "webm", "wmv", "m4v"
  ];

  return (
    <div>
      <ContextMenu key={"context-menu" + index}>
        <ContextMenuTrigger>
          <motion.li
            className={cn(
              "flex flex-col items-start justify-center gap-1 border-b-2 py-1.5 px-1.5 pr-4 overflow-hidden",
              userSettings?.animations === "Off" && "hover:opacity-50",
              index % 2 && "brightness-[1.2]",
              !(index % 2) && "brightness-[1.35] rounded-none",
              {
                /* watched video notification  */
              },
              prismaVideos.some(
                (video) => video.path === file.path && video.watched,
              ) && "shadow-md brightness-105",
            )}
            style={{
              ...(currentFolderColor && index % 2
                ? { backgroundColor: `${currentFolderColor}` }
                : {}),
              ...(currentFolderColor && !(index % 2)
                ? { backgroundColor: `${currentFolderColor}` }
                : {}),
            }}
            onClick={(_e) => {
              if (currentUser)
                updateVideoWatched({
                  videoPath: file.path,
                  user: currentUser,
                  watched: true,
                })
                  .then(() => {
                    return closeDatabase();
                  })
                  .finally(() => {
                    invoke("open_video", {
                      path: file.path,
                      autoPlay: userSettings?.autoPlay,
                      userId: currentUser.id,
                    }).catch((err) => {
                      OpenVideoError(err);
                    });
                  });
            }}
            key={file.name + "current-video" + index}
            initial={
              userSettings?.animations === "On"
                ? { opacity: 0, x: -20 }
                : undefined
            }
            animate={
              userSettings?.animations === "On"
                ? { opacity: 1, x: 0 }
                : undefined
            }
            exit={
              userSettings?.animations === "On"
                ? { opacity: 0, x: -20 }
                : undefined
            }
            whileHover={
              userSettings?.animations === "On" ? { x: 1 } : undefined
            }
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          >
            <motion.div
              className={cn(
                "text-base flex flex-row items-start justify-center gap-1 font-medium select-none text-center",
                file.name &&
                file.name?.length > 20 &&
                "overflow-hidden whitespace-nowrap",
              )}
              key={"current-video-file-name-motion-div" + file.name + index}
              whileHover={
                userSettings?.animations === "On" &&
                  file.name &&
                  file.name?.length > 1
                  ? { x: -calculateScrollX(file.name.length) * file.name.length }
                  : undefined
              }
              transition={{ duration: calculateScrollX(file.name!.length / 2), damping: 0.2, delay: 1.2 }}
            >
              {audioFormats.includes(getFileType(file.name!)) ? (
                <MusicIcon
                  className={cn(
                    "h-auto w-3 stroke-[2.3px]",
                    file.name &&
                    file.name?.length > 100 &&
                    "items-start justify-center gap-1 p-0",
                    userSettings?.fontSize === "Medium" && "h-auto w-3.5",
                    userSettings?.fontSize === "Large" && "h-auto w-4",
                    userSettings?.fontSize === "XLarge" && "h-auto w-5",
                  )}
                />
              ) :
                <Film
                  className={cn(
                    "h-auto w-3",
                    file.name &&
                    file.name?.length > 100 &&
                    "items-start justify-center gap-1 p-0",
                    userSettings?.fontSize === "Medium" && "h-auto w-3.5",
                    userSettings?.fontSize === "Large" && "h-auto w-4",
                    userSettings?.fontSize === "XLarge" && "h-auto w-5",
                  )}
                />
              }

              {/* Check if the file's path matches any video's path in prismaVideos to render an eye next to the film */}
              {prismaVideos.some((video) => {
                if (video?.path === file?.path && video?.watched) {
                  return true;
                } else {
                  return false;
                }
              }) ? (
                <>
                  <motion.div
                    className={cn(
                      `flex flex-row items-center justify-center gap-1 px-0.5 font-bold`,
                      {
                        /* watched video eye icon next to file name */
                      },
                    )}
                    key={"watched-video-file-name" + file.name + index}
                    initial={
                      userSettings?.animations === "On"
                        ? { opacity: 0, x: -20 }
                        : undefined
                    }
                    animate={
                      userSettings?.animations === "On"
                        ? { opacity: 1, x: 0 }
                        : undefined
                    }
                    exit={
                      userSettings?.animations === "On"
                        ? { opacity: 0, x: -20 }
                        : undefined
                    }
                    transition={{ duration: 0.5, bounce: 0.4, type: "spring" }}
                  >
                    <motion.div
                      key={index + "watched-video-file-name" + "eye-icon"}
                      className={cn(
                        "cursor-pointer",
                        userSettings?.animations === "Off" && "hover:opacity-20",
                      )}
                      initial={
                        userSettings?.animations === "On"
                          ? { x: -20, opacity: 0 }
                          : undefined
                      }
                      animate={
                        userSettings?.animations === "On"
                          ? { x: 0, opacity: 1 }
                          : undefined
                      }
                      exit={
                        userSettings?.animations === "On"
                          ? { x: -20, opacity: 0 }
                          : undefined
                      }
                      transition={{ duration: 0.35, bounce: 0.3, type: "spring" }}
                      whileHover={
                        userSettings?.animations === "On"
                          ? { scale: 1.15 }
                          : undefined
                      }
                      whileTap={
                        userSettings?.animations === "On"
                          ? { scale: 0.9 }
                          : undefined
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        //set unwatched when user clicks on eye
                        handleUnwatchVideo(file);
                      }}
                    >
                      <Eye
                        className={cn(
                          "h-auto w-4 mr-0.5 stroke-[2.3px]",
                          userSettings?.fontSize === "Medium" && "h-auto w-5",
                          userSettings?.fontSize === "Large" &&
                          "h-auto w-[1.3.5rem]",
                          userSettings?.fontSize === "XLarge" && "h-auto w-7",
                        )}
                      />
                    </motion.div>
                    <span
                      className={cn(
                        "text-sm ",
                        userSettings?.fontSize === "Medium" && "text-base",
                        userSettings?.fontSize === "Large" && "text-lg",
                        userSettings?.fontSize === "XLarge" && "text-2xl",
                      )}
                    >
                      {file.name}
                    </span>
                  </motion.div>
                </>
              ) : (
                <motion.div
                  key={"render-file-name" + file.name + "1"}
                  className={cn(
                    "flex flex-row items-center justify-center gap-1 px-0.5 font-bold",
                  )}
                  initial={
                    userSettings?.animations === "On" ? { x: 20 } : undefined
                  }
                  animate={
                    userSettings?.animations === "On" ? { x: 0 } : undefined
                  }
                  exit={
                    userSettings?.animations === "On" ? { x: 20 } : undefined
                  }
                  transition={{ duration: 0.2, bounce: 0.3, type: "spring" }}
                >
                  <span
                    className={cn(
                      "text-sm",
                      userSettings?.fontSize === "Medium" && "text-base",
                      userSettings?.fontSize === "Large" && "text-lg",
                      userSettings?.fontSize === "XLarge" && "text-2xl",
                    )}
                  >
                    {file.name}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </motion.li>
          <VideoContextMenu
            file={file}
            index={index}
            userSettings={userSettings}
            currentUser={currentUser}
            handleUnwatchVideo={handleUnwatchVideo}
            handleCheckWatched={handleCheckWatched}
            handleWatchVideo={handleWatchVideo}
            handleSliceToWatchVideo={handleSliceToWatchVideo}
            handleSliceToUnwatchVideo={handleSliceToUnwatchVideo}
            key={index + 700}
          />
        </ContextMenuTrigger>
      </ContextMenu>
    </div>
  );
}
