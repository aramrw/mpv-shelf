import React from 'react'
import { motion } from "framer-motion"
import { Trash2 } from 'lucide-react';
import { SettingSchema } from '@/app/settings/page';
import { cn } from '@/lib/utils';
import { deleteFolder } from '../../../../lib/prisma-commands';


export default function Trashcan({ asChild, userSettings, folderPaths, parentFolderPaths, folderPath, setFolderPathsHook, setParentFolderPathsHook }: { asChild: boolean | undefined, userSettings: SettingSchema | undefined, folderPaths: string[] | undefined, parentFolderPaths: string[] | undefined, folderPath: string, setFolderPathsHook: (folderPaths: string[]) => void, setParentFolderPathsHook: (folderPaths: string[]) => void }) {
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
                // trigger the delete folder db command
                if (folderPaths && parentFolderPaths) {
                    deleteFolder({ folderPath }).then(() => {
                        setFolderPathsHook(folderPaths.filter(path => path !== folderPath));
                        setParentFolderPathsHook(parentFolderPaths.filter(path => path !== folderPath));
                    });
                }

            }} />
        </motion.span>
    )
}


