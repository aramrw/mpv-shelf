import React from 'react'
import { motion } from "framer-motion"
import { Trash2 } from 'lucide-react';
import { SettingSchema } from '@/app/settings/page';
import { cn } from '@/lib/utils';
import { deleteFolder } from '../../../../lib/prisma-commands/folders/folder-cmds';
import { User } from '@prisma/client';


export default function ParentTrashcan(
  { currentUser,
    userSettings,
    folderPaths,
    parentFolderPaths,
    folderPath,
    setFolderPathsHook,
    setParentFolderPathsHook
  }:
    {
      currentUser: User | undefined,
      userSettings: SettingSchema | undefined,
      folderPaths: string[] | undefined,
      parentFolderPaths: string[] | undefined,
      folderPath: string, setFolderPathsHook: (folderPaths: string[]) => void,
      setParentFolderPathsHook: (folderPaths: string[]) => void
    }) {
  return (
    <motion.span
      whileHover={userSettings?.animations === "On" ? { scale: 1.1 } : undefined}
      whileTap={userSettings?.animations === "On" ? { scale: 0.9 } : undefined}
      className='drop-shadow-md'
    >
      <Trash2 className={cn('rounded-lg p-0.5 text-primary hover:bg-background h-auto w-6 drop-shadow-md',
        userSettings?.fontSize === "Medium" && 'h-auto w-7',
        userSettings?.fontSize === "Large" && 'h-auto w-8',
        userSettings?.fontSize === "XLarge" && 'h-auto w-9'
      )} onClick={(e) => {
        e.stopPropagation();
        if (folderPaths && parentFolderPaths && currentUser) {
          deleteFolder({ folderPath, settings: userSettings!, userId: currentUser?.id }).then(() => {
            setFolderPathsHook(folderPaths.filter(path => path !== folderPath));
            setParentFolderPathsHook(parentFolderPaths.filter(path => path !== folderPath));
          });
        }

      }} />
    </motion.span>
  )
}


