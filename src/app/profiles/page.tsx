"use client";

import React, { useEffect, useState } from 'react';
import { getUsers, setCurrentUserGlobal } from '../../../lib/prisma-commands';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation'; // Corrected import for useRouter
import { Grip, GripVertical, Loader2 } from 'lucide-react';
import { UserAvatar } from './_components/user-avatar';
import { cn } from '@/lib/utils';

export default function Profiles() {

    const router = useRouter();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [dragConstraint, setDragConstraint] = useState(0);


    useEffect(() => {
        getUsers().then((users) => {
            if (users) {
                setAllUsers(users);
                setIsLoading(false);
            }
        });
    }, []);

    useEffect(() => {
        setDragConstraint((allUsers.length * 100) - 100);
    }, [])



    return (
        <AnimatePresence>
            <motion.main className="mt-7 flex h-96 w-full flex-col items-center justify-start gap-2 overflow-hidden"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                key={"main"}
            >
                <h1 className='select-none text-2xl font-bold'>Welcome Back!</h1>
                <h2 className='select-none font-medium'>Select Your Profile From The Users Below.</h2>
                <motion.div className={cn('flex h-full w-full  cursor-grab',
                    isGrabbing && 'cursor-grabbing'
                )}
                    initial={{ x: 35 }}
                    animate={{ x: 35 }}
                    exit={{ y: -50 }}

                    drag="x"
                    dragConstraints={{ left: dragConstraint, right: 40 }}
                    onDragStart={() => setIsGrabbing(true)}
                    onDragEnd={() => setIsGrabbing(false)}
                // Additional drag props if needed
                >
                    <AnimatePresence>
                        {allUsers.length !== 0 && (
                            <motion.div className={cn('flex gap-4',
                                // Add a grabbing cursor when dragging
                            )}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}

                            >
                                {allUsers.map((user, index) => (
                                    <div className='flex flex-row items-center justify-center'
                                        key={user.id * 1000 + index}
                                    >
                                        <motion.button
                                            className={cn('flex h-fit w-fit flex-row items-center justify-center',
                                                isGrabbing && 'cursor-grabbing' // Add a grabbing cursor when dragging
                                            )}
                                            key={user.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (isGrabbing) return; // Prevent click event when dragging
                                                setCurrentUserGlobal({ userId: user.id }).then(() => {
                                                    router.push('/home');
                                                });
                                            }}
                                        >
                                            <UserAvatar userObject={user} />
                                        </motion.button>
                                        <GripVertical className='h-auto w-12 px-0 text-primary' />
                                    </div>
                                ))}

                            </motion.div>
                        )}
                        {isLoading && (
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                            >
                                <Loader2 className='h-auto w-20 animate-spin text-accent' />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                {/* Button for adding a new profile */}
            </motion.main>
        </AnimatePresence>
    );
}
