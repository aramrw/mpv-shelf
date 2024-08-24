import { cn } from "@/lib/utils";
import {
  Captions,
  CornerLeftDown,
  Folder,
  Folders,
  VideoIcon,
} from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { SettingSchema } from "@/app/settings/page";
import { FileEntry } from "@tauri-apps/api/fs";
import NameFromPath from "../../../../lib/hooks/name-from-path";

export default function ParentTitleAndTags({
  asChild,
  expanded,
  folderPath,
  userSettings,
  files,
  folders,
  subtitleFiles,
  currentFolderColor,
}: {
  asChild: boolean | undefined;
  expanded: boolean | undefined;
  folderPath: string;
  userSettings: SettingSchema | undefined;
  files: FileEntry[];
  folders: FileEntry[];
  subtitleFiles: FileEntry[];
  currentFolderColor: string | undefined;
}) {

  const folderName = NameFromPath({ path: folderPath });

  return (
    <motion.div
      className={cn(
        "flex flex-row items-center justify-start gap-1 font-medium text-primary text-sm text-center ",
      )}
      whileHover={
        userSettings?.animations === "On" && !asChild &&
          folderName.length > 10
          ? { x: -folderName.length * (3 + folders.length + subtitleFiles.length + files.length) }
          : undefined
      }
      transition={{ duration: 2, damping: 0.2, delay: 1.3 }}
    >
      {asChild && !expanded ? (
        <motion.div
          className="flex items-start justify-center"
          key={folderPath + "not expanded5"}
          initial={
            userSettings?.animations === "On"
              ? { y: -20, opacity: 0 }
              : undefined
          }
          animate={
            userSettings?.animations === "On" ? { y: 0, opacity: 1 } : undefined
          }
          exit={
            userSettings?.animations === "On"
              ? { y: -20, opacity: 0 }
              : undefined
          }
          transition={{ duration: 0.3, damping: 0.3 }}
        >
          <Folder
            className={cn(
              "h-auto w-4 stroke-[3px]",
              userSettings?.fontSize === "Medium" && "h-auto w-4",
              userSettings?.fontSize === "Large" && "h-auto w-5",
              userSettings?.fontSize === "XLarge" && "h-auto w-6",
            )}
          />
        </motion.div>
      ) : (
        <motion.div
          className="flex items-start justify-center"
          key={folderPath + "expanded1"}
          initial={
            userSettings?.animations === "On"
              ? { y: -50, opacity: 0 }
              : undefined
          }
          animate={
            userSettings?.animations === "On" ? { y: 0, opacity: 1 } : undefined
          }
          exit={
            userSettings?.animations === "On"
              ? { y: -50, opacity: 0 }
              : undefined
          }
          transition={{ duration: 0.7, bounce: 0.2, type: "spring" }}
        >
          {asChild && expanded && (
            <CornerLeftDown
              className={cn(
                "h-auto w-5 px-0.5",
                userSettings?.fontSize === "Medium" && "h-auto w-6",
                userSettings?.fontSize === "Large" && "h-auto w-7",
                userSettings?.fontSize === "XLarge" && "h-auto w-8",
                files.length < 0 || (folders.length < 0 && "hidden"),
              )}
            />
          )}
        </motion.div>
      )}

      {/************** FOLDER NAME ************** */}
      {folders.length === 0 && files.length === 0 ? (
        <span
          className={cn(
            "line-through",
            userSettings?.fontSize === "Medium" && "text-lg",
            userSettings?.fontSize === "Large" && "text-2xl",
            userSettings?.fontSize === "XLarge" && "text-3xl",
            userSettings?.fontSize === "Medium" && asChild && "text-lg",
            userSettings?.fontSize === "Large" && asChild && "text-xl",
            userSettings?.fontSize === "XLarge" && asChild && "text-2xl",
          )}
        >
          {folderName}
        </span>
      ) : (
        <motion.span
          className={cn(
            "text-base font-bold",
            asChild && "text-sm",
            userSettings?.fontSize === "Medium" && "text-lg",
            userSettings?.fontSize === "Large" && "text-2xl",
            userSettings?.fontSize === "XLarge" && "text-3xl",
            userSettings?.fontSize === "Medium" && asChild && "text-base",
            userSettings?.fontSize === "Large" && asChild && "text-xl",
            userSettings?.fontSize === "XLarge" && asChild && "text-2xl",
            NameFromPath({ path: folderPath }).length > 11 && "text-ellipsis overflow-hidden"
          )}
        >
          {folderName}
        </motion.span>
      )}

      {/************** FOLDERS LENGTH ************** */}
      {folders.length > 0 && (
        <div
          className="flex flex-row items-center justify-center gap-0.5 rounded-md bg-tertiary px-0.5 brightness-[1.15]"
          style={{
            ...(currentFolderColor
              ? { backgroundColor: `${currentFolderColor} ` }
              : {}),
          }}
        >
          <Folders
            className={cn(
              "h-auto w-4 stroke-[2.5px]",
              userSettings?.fontSize === "Medium" && !asChild && "h-auto w-4",
              userSettings?.fontSize === "Large" && !asChild && "h-auto w-5",
              userSettings?.fontSize === "XLarge" && !asChild && "h-auto w-6",
            )}
          />
          <span
            className={cn(
              "text-xs lg:text-sm font-bold",
              userSettings?.fontSize === "Medium" && !asChild && "text-sm",
              userSettings?.fontSize === "Large" && !asChild && "text-base",
              userSettings?.fontSize === "XLarge" && !asChild && "text-lg",
            )}
          >
            {folders.length > 0 && folders.length}
          </span>
        </div>
      )}

      {/************** VIDEOS LENGTH ************** */}
      {files.length > 0 && (
        <div
          className="flex flex-row items-center justify-center text-sm rounded-md bg-tertiary px-0.5 gap-0.5 brightness-[1.15]"
          style={{
            ...(currentFolderColor
              ? { backgroundColor: currentFolderColor }
              : {}),
          }}
        >
          <VideoIcon
            className={cn(
              "h-auto w-4 stroke-[2.3px]",
              userSettings?.fontSize === "Medium" && !asChild && "h-auto w-4",
              userSettings?.fontSize === "Large" && !asChild && "h-auto w-5",
              userSettings?.fontSize === "XLarge" && !asChild && "h-auto w-6",
            )}
          />
          <span
            className={cn(
              "text-xs lg:text-sm font-bold",
              userSettings?.fontSize === "Medium" && !asChild && "text-sm",
              userSettings?.fontSize === "Large" && !asChild && "text-base",
              userSettings?.fontSize === "XLarge" && !asChild && "text-lg",
            )}
          >
            {files.length > 0 && files.length}
          </span>
        </div>
      )}

      {/************** SUBTITLES LENGTH ************** */}
      {subtitleFiles.length > 0 && (
        <div
          className="flex flex-row items-center justify-center text-xs rounded-md bg-tertiary px-0.5 gap-0.5 brightness-[1.15]"
          style={{
            ...(currentFolderColor
              ? { backgroundColor: `${currentFolderColor} ` }
              : {}),
          }}
        >
          <Captions
            className={cn(
              "h-auto w-4",
              userSettings?.fontSize === "Medium" && !asChild && "h-auto w-4",
              userSettings?.fontSize === "Large" && !asChild && "h-auto w-5",
              userSettings?.fontSize === "XLarge" && !asChild && "h-auto w-6",
            )}
          />
          <span
            className={cn(
              "text-xs lg:text-sm font-bold",
              userSettings?.fontSize === "Medium" && !asChild && "text-sm",
              userSettings?.fontSize === "Large" && !asChild && "text-base",
              userSettings?.fontSize === "XLarge" && !asChild && "text-lg",
            )}
          >
            {subtitleFiles.length > 0 && subtitleFiles.length}
          </span>
        </div>
      )}
    </motion.div>
  );
}
