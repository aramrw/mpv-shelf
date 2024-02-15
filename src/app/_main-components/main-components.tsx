"use client"

import { HelpCircle, Settings, Sliders } from 'lucide-react'
import React, { useState } from 'react'
import { motion } from 'framer-motion'

export function Navbar() {
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
        <motion.div className="flex h-8 w-full flex-row items-center justify-between border-b-2 bg-accent p-1 shadow-sm"
            drag="y" // Enable vertical dragging
            dragConstraints={{ top: 0, bottom: 0 }} // Limit dragging to vertical movement within the component's height
            onDragEnd={handleDragEnd} // Handle the drag end event
            animate={{ y: isHidden ? -100 : 0 }} // Adjust this value to control how far the navbar moves up
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <motion.div
                className='cursor-pointer'
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
            >
                <HelpCircle />
            </motion.div>

            <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
            >
                <Sliders className="h-full w-fit cursor-pointer" />
            </motion.div>

        </motion.div>
    );
}
