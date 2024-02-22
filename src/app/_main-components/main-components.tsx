"use client"

import { BadgeHelp, HelpCircle, HelpingHand, MessageCircleQuestion, MessageCircleQuestionIcon, MoveLeft, Sliders } from 'lucide-react'
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';


export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();

    let [isHidden, setIsHidden] = useState(false);

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
        <motion.div className={cn("flex h-8 w-full flex-row items-center justify-between border-b-2 bg-accent p-1 shadow-sm md:h-9 lg:h-10",
            pathname === "/profiles" && "bg-transparent border-none text-background px-2.5 pt-2 shadow-md py-0.5",
            pathname === "/dashboard" && "pl-2.5 drop-shadow-sm",
        )}
            drag="y" // Enable vertical dragging
            dragConstraints={{ top: 0, bottom: 0 }} // Limit dragging to vertical movement within the component's height
            onDragEnd={handleDragEnd} // Handle the drag end event
            animate={{ y: isHidden ? -100 : 0 }} // Adjust this value to control how far the navbar moves up
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <div className='flex w-full flex-row items-center justify-between gap-1'>
                {(pathname === "/settings" ||
                    pathname === "/home" ||
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
                            <MoveLeft className={`h-auto drop-shadow-sm md:w-7 lg:w-8`} />
                        </motion.div>
                    )}
                <motion.div
                    className='cursor-pointer'
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <HelpCircle className={cn(`h-auto md:w-7 lg:w-8 drop-shadow-sm`,
                        pathname === "/profiles" && "text-primary",
                        pathname === "/dashboard" && 'w-7'
                    )} />
                </motion.div>



            </div>

            {(pathname !== "/settings" && !pathname.includes("/profile") && pathname !== "/home" && pathname !== "/") && (
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                >
                    <Link href="/settings">
                        <Sliders className={cn("h-auto cursor-pointer w-6 md:w-8 lg:w-9",
                            pathname === "/dashboard" && 'w-7'
                        )} />
                    </Link>
                </motion.div>
            )}
        </motion.div>
    );
}
