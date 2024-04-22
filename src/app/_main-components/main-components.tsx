"use client"
// import React, { useEffect, useState } from 'react'
import { motion, /*useMotionValueEvent, useScroll*/ } from 'framer-motion'
import { HelpCircle, MoveLeft, Sliders } from 'lucide-react'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useScrollTop } from '../../../lib/hooks/scroll-y-check';
import { useEffect } from 'react';
import { confirm } from '@tauri-apps/api/dialog';
import { closeDatabase } from '../../../lib/prisma-commands';
import { emit, listen, once } from '@tauri-apps/api/event';

export function Navbar() {

    const router = useRouter();
    const pathname = usePathname();
    const scrolled = useScrollTop();


    useEffect(() => {
        const handleWindowClose = async () => {
            const { appWindow } = await import('@tauri-apps/api/window');
            const unlisten = appWindow.onCloseRequested((event) => {
                event.preventDefault();
                closeDatabase().then(() => {
                    appWindow.close();
                })
            });

            return () => {
                unlisten.then((unlisten) => unlisten());
            }
        };

        const close_db = listen("quit_app", () => {
            //console.log("quitting app");
            closeDatabase().then(() => {
                emit("db_closed");
            })
        });

        handleWindowClose();

        return () => {
            close_db.then((unlisten) => unlisten());
        }

    }, [])


    return (
        <div className={cn("z-50 top-0 sticky flex h-8 w-full flex-row items-center justify-between border-b-2 bg-accent p-1 shadow-sm md:h-9 lg:h-10 lg:px-16 xl:px-36 2xl:px-48",
            pathname === "/profiles" && "bg-transparent border-none text-background px-2.5 pt-2 shadow-md py-0.5",
            pathname === "/dashboard" && "pl-2 drop-shadow-sm",
            scrolled && "bg-red-500"
        )}
        >
            <div className='flex w-full flex-row items-center justify-between gap-1'>
                {(pathname === "/settings" ||
                    pathname === "/login" ||
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
                            <MoveLeft className={`h-auto drop-shadow-lg md:w-7 lg:w-8`} />
                        </motion.div>
                    )}
            </div>

            {(pathname !== "/settings" && !pathname.includes("/profile") && pathname !== "/login" && pathname !== "/") && (
                <Link href="/settings" scroll={false} className='' >
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        className=''
                    >

                        <Sliders className={cn("h-auto cursor-pointer w-6 md:w-8 lg:w-9 drop-shadow-md",
                            pathname === "/dashboard" && 'w-7'
                        )} />

                    </motion.div>
                </Link>
            )}

        </div>
    );
}
