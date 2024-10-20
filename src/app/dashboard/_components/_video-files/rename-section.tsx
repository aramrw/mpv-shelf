import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger, } from '@/components/ui/context-menu'
import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronDownIcon, ChevronUp, ChevronUpIcon, ChevronsDownUpIcon, ChevronsUpIcon, Eye, EyeOff, FilePenIcon, FolderInput, FolderInputIcon, PencilLineIcon, ScanEyeIcon } from 'lucide-react'
import { SettingSchema } from '@/app/settings/page'
import { FileEntry } from '@tauri-apps/api/fs'
import type { User, } from "@prisma/client";
import DynTextSpan from '@/app/_main-components/_icon_components/dyn-text-size-span'
import DynCustomIcon from '@/app/_main-components/_icon_components/dyn-custom-icon'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'


export default function RenameContent({
  userSettings,
  file,
  currentUser,
  index,
  handleUnwatchVideo,
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
  return (
    <Dialog>
      <ContextMenuSub>
        <ContextMenuSubTrigger inset>
          <DynTextSpan text='Rename' userSettings={userSettings} />
          <DynCustomIcon Icon={FilePenIcon} userSettings={userSettings} className='ml-1' />
        </ContextMenuSubTrigger>
        {/************** RENAME CURRENT ****************/}
        <ContextMenuSubContent className="mx-2 font-medium">
          <ContextMenuItem className='flex flex-row cursor-pointer gap-1' >
            <DialogTrigger className='flex gap-1 w-full justify-between' >
              <DynTextSpan text="Current" userSettings={userSettings} />
              <DynCustomIcon Icon={PencilLineIcon} userSettings={userSettings} className='ml-1' />
            </DialogTrigger>
          </ContextMenuItem>
          {/************** RENAME TO ****************/}
          <ContextMenuSeparator className='my-1 h-[1px] bg-accent' />
          <ContextMenuItem className='cursor-pointer'>
            <Dialog>
              <DialogTrigger className='flex gap-1 w-full justify-between' >
                <DynTextSpan text="From Bottom" userSettings={userSettings} />
                <DynCustomIcon Icon={ChevronUpIcon} userSettings={userSettings} />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </ContextMenuItem>
          <ContextMenuItem className='cursor-pointer' >
            <div className='flex gap-1 w-full justify-between'>
              <DynTextSpan text="From Top" userSettings={userSettings} />
              <DynCustomIcon Icon={ChevronDownIcon} userSettings={userSettings} />
            </div>
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

