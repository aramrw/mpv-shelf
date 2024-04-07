import {
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ContextMenu } from "@/components/ui/context-menu";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eye, Film } from "lucide-react";
import { SettingSchema } from "@/app/settings/page";
import { FileEntry } from "@tauri-apps/api/fs";
import type { User, Video } from "@prisma/client";
import {
  closeDatabase,
  updateVideoWatched,
} from "../../../../../lib/prisma-commands";
import { invoke } from "@tauri-apps/api/tauri";
import VideoContextMenu from "./video-context-menu";

export default function VideoFile({
  userSettings,
  file,
  files,
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

  return (
    <div>
      <ContextMenu key={"context-menu" + index}>
        <ContextMenuTrigger>
          <motion.li
            className={cn(
              "flex flex-col items-start justify-center gap-1 border-b-2 py-1.5 px-4 cursor-pointer overflow-hidden",
              index === files.length - 1 && "rounded-b-md border-none",
              userSettings?.animations === "Off" && "hover:opacity-50",
              index % 2 && "brightness-150",
              !(index % 2) && "brightness-[1.35]",
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
              userSettings?.animations === "On" ? { x: 0.5 } : undefined
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
                file.name?.length > 65
                  ? { width: "-100%" }
                  : undefined
              }
              transition={{ duration: 1, damping: 0.2 }}
            >
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
              {/* Check if the file's path matches any video's path in prismaVideos to render an eye next to the film */}
              {prismaVideos.some((video) => {
                if (video?.path === file?.path && video?.watched) {
                  return true;
                } else {
                  return false;
                }
              }) ? (
                <motion.div
                  className={cn(
                    `flex flex-row items-center justify-center gap-1 rounded-sm px-0.5 font-bold`,
                    {
                      /* watched video notification */
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
                  whileHover={
                    userSettings?.animations === "On" ? { x: 1.5 } : undefined
                  }
                  transition={{ duration: 0.5, bounce: 0.4, type: "spring" }}
                >
                  <motion.div
                    key={index + "watched-video-file-name" + "eye-icon"}
                    className={cn(
                      "",
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
                        "h-auto w-5 mr-0.5 ",
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
              ) : (
                <motion.div
                  key={"render-file-name" + file.name + "1"}
                  className={cn(
                    "flex flex-row items-center justify-center gap-1 rounded-sm px-0.5 font-bold",
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
          {/* VideoContextMenu was moved out of the motion.li, if something is wrong it might be this */}
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
