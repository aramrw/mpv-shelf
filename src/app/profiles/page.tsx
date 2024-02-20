"use client";

import React, { useEffect, useState } from 'react';
import { getUsers, setCurrentUserGlobal } from '../../../lib/prisma-commands';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation'; // Corrected import for useRouter
import { Grip, GripVertical, Loader2 } from 'lucide-react';
import { UserAvatar } from './_components/user-avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
        setDragConstraint((allUsers.length * 100) - 515);
    }, [])



    return (
        <AnimatePresence>
            <motion.main className="mt-7 flex h-1/2 w-full flex-col items-center justify-center gap-2 overflow-hidden md:h-[88%]"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                key={"main"}
            >
                <h1 className='select-none text-2xl font-bold md:text-3xl lg:text-4xl xl:text-5xl'>Welcome Back!</h1>
                <h2 className='md:text-1xl select-none text-lg font-medium lg:text-2xl xl:text-3xl'>Select Your Profile From The Users Below.</h2>
                <motion.div className={cn('flex flex-col h-full w-full cursor-grab justify-start items-center',
                    allUsers.length >= 4 && 'items-start',
                    (allUsers.length >= 4 && isGrabbing) && 'cursor-grabbing',
                )}
                    initial={allUsers.length >= 4 ? { x: 20 } : undefined}
                    animate={allUsers.length >= 4 ? { x: 20 } : undefined}
                    exit={allUsers.length >= 4 ? { y: -50 } : undefined}
                    {...allUsers.length >= 4 && { drag: "x" }}
                    dragConstraints={{ left: dragConstraint, right: 20 }}
                    onDragStart={() => setIsGrabbing(true)}
                    onDragEnd={() => setIsGrabbing(false)}
                    onMouseDown={(e) => {
                        setIsGrabbing(true);
                    }}
                    onMouseUp={(e) => {
                        e.preventDefault();
                        setIsGrabbing(false);
                    }}
                >
                    <AnimatePresence>
                        {allUsers.length !== 0 && (
                            <motion.div className={cn('flex gap-4 justify-center items-center',

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
                                                if (!isGrabbing) {
                                                    setCurrentUserGlobal({ userId: user.id }).then(() => {
                                                        router.push('/home');
                                                    });
                                                }
                                            }}
                                        >
                                            <UserAvatar userObject={user} />
                                        </motion.button>
                                        {(index !== allUsers.length && allUsers.length >= 4) && <GripVertical className='h-auto w-12 px-0 text-primary' />}
                                    </div>
                                ))}
                                <div className='flex flex-row items-center justify-center'
                                    key={"add profile"}
                                >
                                    <motion.button
                                        className={cn('flex h-fit w-fit flex-row items-center justify-center',
                                            isGrabbing && 'cursor-grabbing' // Add a grabbing cursor when dragging
                                        )}
                                        key={"add-prfile2"}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (!isGrabbing) {
                                                setCurrentUserGlobal({ userId: -1 }).then(() => {
                                                    router.push('/profiles/newUser');
                                                });
                                            }

                                        }}
                                    >
                                        <UserAvatar userObject={allUsers[99]} />
                                    </motion.button>
                                </div>

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
                        {/* <div className='mt-5 flex h-fit w-full flex-row items-center justify-center'>
                            <Button variant="outline" className='cursor-pointer text-blue-500 underline underline-offset-2'
                                onClick={() => {
                                    router.push('/profiles/newUser');
                                }}
                            >Add New Profile</Button>
                        </div> */}
                    </AnimatePresence>
                </motion.div>
            </motion.main>
        </AnimatePresence >
    );
}
