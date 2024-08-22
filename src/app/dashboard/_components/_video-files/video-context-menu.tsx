import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, } from '@/components/ui/context-menu'
import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Eye, EyeOff, FolderInput } from 'lucide-react'
import { SettingSchema } from '@/app/settings/page'
import { FileEntry } from '@tauri-apps/api/fs'
import type { User, } from "@prisma/client";
import { invoke } from '@tauri-apps/api/tauri'
import EyeIcon from '@/app/_main-components/_icon_components/eye-icon'
import CustomEyeIcon from '@/app/_main-components/_icon_components/eye-icon'
import CustomEyeOffIcon from '@/app/_main-components/_icon_components/eye-off-icon'

export default function VideoContextMenu({ userSettings, file, currentUser, index, handleUnwatchVideo, handleCheckWatched, handleWatchVideo, handleSliceToWatchVideo, handleSliceToUnwatchVideo }:
  { userSettings: SettingSchema | undefined, file: FileEntry, currentUser: User | undefined, index: number, handleUnwatchVideo: (file: FileEntry) => void, handleCheckWatched: (file: FileEntry) => boolean, handleWatchVideo: (file: FileEntry) => void, handleSliceToWatchVideo: (index: number) => void, handleSliceToUnwatchVideo: (index: number) => void }) {
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
      <span className={cn("",
        userSettings?.fontSize === "Medium" && 'text-base',
        userSettings?.fontSize === "Large" && 'text-lg',
        userSettings?.fontSize === "XLarge" && 'text-xl'
      )}>Open In Explorer</span>
      <FolderInput className={cn('h-auto w-4',
        userSettings?.fontSize === "Medium" && 'h-auto w-5',
        userSettings?.fontSize === "Large" && 'h-auto w-6',
        userSettings?.fontSize === "XLarge" && 'h-auto w-7'
      )} />
    </ContextMenuItem>
    <ContextMenuSeparator className='my-1 h-[1px] bg-accent' />
    <ContextMenuSub>
      <ContextMenuSubTrigger className={cn('gap-1 font-medium',
        userSettings?.fontSize === "Medium" && 'text-base',
        userSettings?.fontSize === "Large" && 'text-lg',
        userSettings?.fontSize === "XLarge" && 'text-xl'
      )}
        inset>Watch
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="mx-2 overflow-hidden rounded-md border bg-popover p-1 font-medium text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
        {handleCheckWatched(file) ? (
          <ContextMenuItem
            className='flex cursor-pointer gap-1'
            onClick={(e) => {
              e.stopPropagation()
              handleWatchVideo(file)
            }}
          >
            <span className={cn("",
              userSettings?.fontSize === "Medium" && 'text-base',
              userSettings?.fontSize === "Large" && 'text-lg',
              userSettings?.fontSize === "XLarge" && 'text-xl'
            )}>Set Watched</span>

            <CustomEyeIcon userSettings={userSettings} />
          </ContextMenuItem>
        ) : (
          <ContextMenuItem className='flex cursor-pointer gap-1'
            onClick={(e) => {
              e.stopPropagation();
              if (currentUser) {
                handleUnwatchVideo(file)
              }
            }}
          >
            <span className={cn("",
              userSettings?.fontSize === "Medium" && 'text-base',
              userSettings?.fontSize === "Large" && 'text-lg',
              userSettings?.fontSize === "XLarge" && 'text-xl'
            )}>Unwatch</span>

            <CustomEyeOffIcon userSettings={userSettings} />
          </ContextMenuItem>
        )}
        <ContextMenuSeparator className='my-1 h-[1px] bg-accent' />
        <ContextMenuItem className='cursor-pointer'
          onClick={(e) => {
            e.stopPropagation();
            if (currentUser?.id) {
              handleSliceToUnwatchVideo(index)
            }
          }}
        >
          <div className='flex gap-1'>
            <span className={cn("",
              userSettings?.fontSize === "Medium" && 'text-base',
              userSettings?.fontSize === "Large" && 'text-lg',
              userSettings?.fontSize === "XLarge" && 'text-xl'
            )}>Unwatch To</span>
            <div className='flex'>
              <CustomEyeOffIcon userSettings={userSettings} />
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
            //e.stopPropagation();
            if (currentUser) {
              handleSliceToWatchVideo(index)
            }
          }}
        >
          <div className='flex gap-1 w-full justify-between'>
            <span className={cn("",
              userSettings?.fontSize === "Medium" && 'text-base',
              userSettings?.fontSize === "Large" && 'text-lg',
              userSettings?.fontSize === "XLarge" && 'text-xl'
            )}>Watch To</span>
            <div className='flex'>
              <CustomEyeIcon userSettings={userSettings} />
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
}
