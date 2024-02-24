"use client"

import { HelpCircle, MoveLeft, Sliders } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useScrollTop } from '../../../lib/hooks/scroll-y-check';
import { ModeToggle } from './mode-toggle';


export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const scrolled = useScrollTop();

    let [isHidden, setIsHidden] = useState(false);


    // fetch the user object from db on start and set the current user
    // useEffect(() => {
    //     getUsers().then((users) => {
    //         if (users?.length !== 0 && users) {
    //             getCurrentUserGlobal().then((GLOBAL_USER) => {
    //                 if (GLOBAL_USER && GLOBAL_USER?.userId !== -1) {
    //                     for (const user of users) {
    //                         if (user.id === Number(GLOBAL_USER?.userId)) {
    //                             setCurrentUser(user);
    //                             break;
    //                         }
    //                     }
    //                 } else {
    //                     //router.prefetch('/');
    //                     router.push('/', { scroll: false });
    //                 }
    //             });
    //         } else {

    //             router.push('/profiles/createUser');
    //         }

    //     })

    // }, [])


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
        <motion.div className={cn("z-50 top-0 sticky flex h-8 w-full flex-row items-center justify-between border-b-2 bg-accent p-1 shadow-sm md:h-9 lg:h-10",
            pathname === "/profiles" && "bg-transparent border-none text-background px-2.5 pt-2 shadow-md py-0.5",
            pathname === "/dashboard" && "pl-2.5 drop-shadow-sm",
            scrolled && "bg-accent"
        )}
            drag="y" // Enable vertical dragging
            dragConstraints={{ top: 0, bottom: 0 }} // Limit dragging to vertical movement within the component's height
            onDragEnd={handleDragEnd} // Handle the drag end event
            animate={{ y: isHidden ? -100 : 0 }} // Adjust this value to control how far the navbar moves up
            transition={{ type: 'spring', stiffness: 300 }}
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
                <motion.div
                    className='flex cursor-pointer'
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <HelpCircle className={cn(`h-auto md:w-6 lg:w-7 drop-shadow-md`,
                        pathname === "/profiles" && "text-primary",
                        pathname === "/dashboard" && 'w-6'
                    )} />
                </motion.div>



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

        </motion.div>
    );
}
