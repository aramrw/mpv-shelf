"use client"

import { ArrowBigLeft, HelpCircle, MoveLeft, Settings, Sliders } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { WebviewWindow } from '@tauri-apps/api/window';
import { setCurrentUserGlobal, setupAppWindow } from '../../../lib/prisma-commands';

export function Navbar() {
    let [isHidden, setIsHidden] = useState(false);
    const [appWindow, setAppWindow] = useState<WebviewWindow>()

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setupAppWindow().then((appWindow) => {
            setAppWindow(appWindow)
        })
    })

    useEffect(() => {
        appWindow?.onCloseRequested((e) => {
            e.preventDefault()
            setCurrentUserGlobal({ userId: -1 }).then(() => {
                appWindow?.close()
            })
        })

    }, [appWindow])

    // Function to handle the end of a drag event
    const handleDragEnd = (event: any, info: any) => {
        // Determine if the drag was upwards significantly
        // "info.point.y" gives the endpoint of the drag relative to the drag start
        // Adjust the threshold according to your needs
        if (info.offset.y < -50) {
            setIsHidden(true);
        }
    };

    return (
        <motion.div className="flex h-8 w-full flex-row items-center justify-between border-b-2 bg-accent p-1 shadow-sm"
            drag="y" // Enable vertical dragging
            dragConstraints={{ top: 0, bottom: 0 }} // Limit dragging to vertical movement within the component's height
            onDragEnd={handleDragEnd} // Handle the drag end event
            animate={{ y: isHidden ? -100 : 0 }} // Adjust this value to control how far the navbar moves up
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <div className='flex w-full flex-row items-center justify-between gap-1'>
                {(pathname === "/settings" ||
                    pathname === "/" ||
                    pathname === "/profiles/newUser"
                ) && (
                        <motion.div
                            className='cursor-pointer rounded-sm bg-muted px-1'
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => {
                                router.back();
                            }}
                        >
                            <MoveLeft />
                        </motion.div>
                    )}
                <motion.div
                    className='cursor-pointer'
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <HelpCircle />
                </motion.div>



            </div>

            {(pathname !== "/settings" && !pathname.includes("/profile") && pathname !== "/") && (
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <Link href="/settings">
                        <Sliders className="h-full w-fit cursor-pointer" />
                    </Link>
                </motion.div>
            )}




        </motion.div>
    );
}
