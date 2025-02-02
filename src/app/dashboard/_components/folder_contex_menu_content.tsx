import { SettingSchema } from '@/app/settings/page';
import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/tauri';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { randomizeFolderColor } from '../../../../lib/prisma-commands/misc-cmds';
import { FolderInput, FolderInputIcon, Palette, PaletteIcon, SquareIcon } from 'lucide-react';
import DynCustomIcon from '@/app/_main-components/_icon_components/dyn-custom-icon';
import DynTextSpan from '@/app/_main-components/_icon_components/dyn-text-size-span';

export default function FolderContexMenuContent({
  folderPath, userSettings, setCurrentFolderColor
}:
  {
    folderPath: string,
    userSettings: SettingSchema | undefined,
    setCurrentFolderColor: Dispatch<SetStateAction<string | undefined>>
  }) {

  const colors = {
    red: "#CD5C5C",
    orange: "#E79256",
    yellow: "#F1D85C",
    green: "#6ECB90",
    blue: "#7CBDE5",
    purple: "#AD7FE7"
  };

  return (
    <ContextMenuContent>
      <ContextMenuItem
        className="flex cursor-pointer items-center gap-1 font-medium"
        onClick={(e) => {
          if (e.button === 0) {
            invoke("show_in_folder", { path: `${folderPath}` });
          }
        }}
      >
        <DynTextSpan text={"Open In Explorer"} userSettings={userSettings} />
        <DynCustomIcon Icon={FolderInputIcon} userSettings={userSettings} />
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuSub>
        <ContextMenuSubTrigger className='flex flex-row gap-1'>
          <DynTextSpan text={"Randomize Color"} userSettings={userSettings} />
          <DynCustomIcon Icon={PaletteIcon} userSettings={userSettings} />
        </ContextMenuSubTrigger>
        <ContextMenuSubContent
          sideOffset={7}
          className='w-fit min-w-[1px] max-w-fit p-0.5 grid grid-flow-row grid-cols-3'>
          {Object.entries(colors).map((color, i) => (
            <ContextMenuItem
              key={i}
              className="flex cursor-pointer items-center gap-1 font-medium max-w-fit p-0.5 "
              onClick={() => {
                randomizeFolderColor(folderPath, color[0]).then(
                  (color: any) => {
                    console.log(color);
                    setCurrentFolderColor(color);
                  },
                );
              }}
            >
              <SquareIcon
                className={cn(
                  "h-auto w-6",
                  userSettings?.fontSize === "Medium" && "h-auto w-6",
                  userSettings?.fontSize === "Large" && "h-auto w-7",
                  userSettings?.fontSize === "XLarge" && "h-auto w-7",
                )}
                style={{ color: color[1], fill: color[1] }}
              />
            </ContextMenuItem>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuContent>

  )
}

