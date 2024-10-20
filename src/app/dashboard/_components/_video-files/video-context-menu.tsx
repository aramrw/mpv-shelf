import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, } from '@/components/ui/context-menu'
import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, ChevronUpIcon, FolderInputIcon, ScanEyeIcon } from 'lucide-react'
import { SettingSchema } from '@/app/settings/page'
import { FileEntry } from '@tauri-apps/api/fs'
import type { User, } from "@prisma/client";
import { invoke } from '@tauri-apps/api/tauri'
import CustomEyeIcon from '@/app/_main-components/_icon_components/eye-icon'
import CustomEyeOffIcon from '@/app/_main-components/_icon_components/eye-off-icon'
import DynTextSpan from '@/app/_main-components/_icon_components/dyn-text-size-span'
import DynCustomIcon from '@/app/_main-components/_icon_components/dyn-custom-icon'

export default function VideoContextMenu({
  userSettings,
  file,
  currentUser,
  index,
  handleUnwatchVideo,
  handleCheckWatched,
  handleWatchVideo,
  handleSliceToWatchVideo,
  handleSliceToUnwatchVideo
}: {
  userSettings: SettingSchema | undefined,
  file: FileEntry,
  currentUser: User | undefined,
  index: number, handleUnwatchVideo: (file: FileEntry) => void,
  handleCheckWatched: (file: FileEntry) => boolean,
  handleWatchVideo: (file: FileEntry) => void,
  handleSliceToWatchVideo: (index: number) => void,
  handleSliceToUnwatchVideo: (index: number) => void
}) {
  return <ContextMenuContent className={cn(``,
    userSettings?.animations === "Off" && ``
  )}
  >
    <ContextMenuItem className='cursor-pointer gap-1 font-medium'
      onClick={(e) => {
        e.stopPropagation();
        if (e.button === 0) {
          invoke('show_in_folder', { path: `${file.path}` });
        }
      }}
    >
      <DynTextSpan text="Open In Explorer" userSettings={userSettings} />
      <DynCustomIcon Icon={FolderInputIcon} userSettings={userSettings} />
    </ContextMenuItem>
    {/* 
    <ContextMenuSeparator className='my-1 h-[1px] bg-accent' />
    <RenameContent
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
		*/}
    <ContextMenuSeparator className='my-1 h-[1px] bg-accent' />
    <ContextMenuSub>
      <ContextMenuSubTrigger inset>
        <DynTextSpan text='Watch' userSettings={userSettings} />
        <DynCustomIcon Icon={ScanEyeIcon} userSettings={userSettings} className='ml-1' />
      </ContextMenuSubTrigger>
      {/************** SET WATCHED & WATCH ****************/}
      <ContextMenuSubContent className="mx-2 font-medium">
        {handleCheckWatched(file) ? (
          <ContextMenuItem
            className='flex flex-row cursor-pointer gap-1 justify-between'
            onClick={(e) => {
              e.stopPropagation()
              handleWatchVideo(file)
            }}
          >
            <DynTextSpan text="Set Watched" userSettings={userSettings} />
            <div className='flex'>
              <CustomEyeIcon userSettings={userSettings} />
              <DynCustomIcon Icon={ChevronDownIcon} userSettings={userSettings} className='opacity-0' />
            </div>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            className='flex flex-row justify-between cursor-pointer gap-1'
            onClick={(e) => {
              e.stopPropagation();
              if (currentUser) {
                handleUnwatchVideo(file)
              }
            }}
          >
            <DynTextSpan text="Unwatch" userSettings={userSettings} />
            <div className='flex'>
              <CustomEyeOffIcon userSettings={userSettings} />
              <DynCustomIcon Icon={ChevronUpIcon} userSettings={userSettings} className='opacity-0' />
            </div>
          </ContextMenuItem>
        )}
        {/************** UNWATCH & WATCH TO ****************/}
        <ContextMenuSeparator className='my-1 h-[1px] bg-accent' />
        <ContextMenuItem className='cursor-pointer'
          onClick={(e) => {
            e.stopPropagation();
            if (currentUser?.id) {
              handleSliceToUnwatchVideo(index)
            }
          }}
        >
          <div className='flex gap-1 w-full justify-between'>
            <DynTextSpan text="Unwatch To" userSettings={userSettings} />
            <div className='flex'>
              <CustomEyeOffIcon userSettings={userSettings} />
              <DynCustomIcon Icon={ChevronUpIcon} userSettings={userSettings} />
            </div>
          </div>
        </ContextMenuItem>
        <ContextMenuItem className='cursor-pointer'
          onClick={(e) => {
            e.stopPropagation();
            //e.stopPropagation();
            if (currentUser) {
              handleSliceToWatchVideo(index)
            }
          }}
        >
          <div className='flex gap-1 w-full justify-between'>
            <DynTextSpan text="Watch To" userSettings={userSettings} />
            <div className='flex'>
              <CustomEyeIcon userSettings={userSettings} />
              <DynCustomIcon Icon={ChevronDownIcon} userSettings={userSettings} />
            </div>
          </div>
        </ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent >
}
