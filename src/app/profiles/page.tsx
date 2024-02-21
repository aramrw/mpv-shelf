"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { getUsers, setCurrentUserGlobal } from '../../../lib/prisma-commands';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation'; // Corrected import for useRouter
import { ArrowRight, Grip, GripVertical, Loader2, MoveRight } from 'lucide-react';
import { UserAvatar } from './_components/user-avatar';
import { cn } from '@/lib/utils';

export default function Profiles() {

    const router = useRouter();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [dragConstraint, setDragConstraint] = useState(0);
    const [windowWidth, setWindowWidth] = useState(0);


    useEffect(() => {
        getUsers().then((users) => {
            if (users) {
                setAllUsers(users);
                setIsLoading(false);
            }
        });
    }, []);


    useEffect(() => {

        const updateWindowDimensions = () => {
            const newWidth = window.innerWidth;
            setWindowWidth(newWidth);
            console.log("updating width");

            if (windowWidth >= 768 && window.innerWidth <= 1023) {
                router.refresh();
            }
        };

        window.addEventListener("resize", updateWindowDimensions);
        updateWindowDimensions();

        return () => window.removeEventListener("resize", updateWindowDimensions)

    }, []);

    const constraint = useMemo(() => {
        let itemWidth = 102;
        let itemSpacing = 83;

        if (windowWidth >= 768 && window.innerWidth <= 1023) {
            itemWidth = 172;
            itemSpacing = 83;
        } else if (windowWidth >= 1024 && window.innerWidth <= 1279) {
            itemWidth = 182;
            itemSpacing = 130;
        } else if (windowWidth >= 1280 && windowWidth <= 1535) {
            itemWidth = 252;
            itemSpacing = 130;
        } else if (windowWidth >= 1536) {
            itemWidth = 253;
            itemSpacing = 130;
        }

        const viewportWidth = windowWidth - 500; // 20px padding on each side of the container
        const totalWidth = (itemWidth + itemSpacing) * allUsers.length - itemSpacing;
        return viewportWidth - totalWidth;
    }, [allUsers.length, windowWidth]);

    useEffect(() => {
        setDragConstraint(constraint);
    }, [constraint]);

    useEffect(() => {


    }, [allUsers.length, windowWidth]);


    return (
        <AnimatePresence>
            <motion.main className={cn("mt-7 flex w-full md:h-[88%] flex-col items-center justify-center gap-2 overflow-hidden ",
                allUsers.length >= 3 && 'items-start',
            )}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                key={"main"}
            >
                <div className={cn("",
                    allUsers.length >= 3 && 'w-full flex flex-col justify-start items-center',
                )}>
                    <h1 className='select-none text-center text-2xl font-bold md:text-3xl lg:text-4xl xl:text-5xl'>Welcome Back!</h1>
                    <h2 className='md:text-1xl select-none text-lg font-medium lg:text-2xl xl:text-3xl'>Select Your Profile From The Users Below.</h2>
                </div>
                <motion.div className={cn('flex flex-col h-full w-fit justify-start items-center py-5',
                    allUsers.length >= 3 && 'items-start cursor-grab',
                    (allUsers.length >= 3 && isGrabbing) && 'cursor-grabbing',
                )}
                    initial={allUsers.length >= 3 ? { x: 20 } : undefined}
                    animate={allUsers.length >= 3 ? { x: 20 } : undefined}
                    exit={allUsers.length >= 3 ? { y: -50 } : undefined}
                    {...allUsers.length >= 3 && { drag: "x" }}
                    dragConstraints={{ left: dragConstraint, right: 20 }}
                    onDragStart={() => setIsGrabbing(true)}
                    onDragEnd={() => setIsGrabbing(false)}
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
                                            whileHover={{ y: 10 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.5, bounce: 0.5, type: "spring" }}
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
                                        {(index !== allUsers.length && allUsers.length >= 3) && <GripVertical className='h-auto w-12 px-0 text-primary' />}
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
                                        whileHover={{ y: 10 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ duration: 0.5, bounce: 0.5, type: "spring" }}
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

                    </AnimatePresence>
                    <AnimatePresence>
                        <motion.div className={cn('mt-10 w-96 flex flex-row items-center justify-start bg-accent px-1 py-1 rounded-sm shadow-md',
                        )}
                            initial={{ x: -500, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -500 }}
                            transition={{ duration: 0.5, bounce: 0.5, type: "spring" }}
                            {...isGrabbing && { animate: { x: 0 } }}
                            onMouseDown={(e) => {
                                setIsGrabbing(true);
                            }}
                            onMouseUp={(e) => {
                                setIsGrabbing(false);
                            }}
                        >
                            <motion.span
                                className='flex items-center justify-center gap-2 px-4'
                                animate={{ x: [100, 0, 0] }}
                                transition={{ duration: 1, repeat: Infinity, bounce: 0.5, type: "spring", repeatType: "reverse" }}
                            >
                                <span className={`font-medium drop-shadow-md xl:text-4xl`}>
                                    Drag Me
                                </span>
                                <MoveRight className='h-auto w-16 drop-shadow-md' strokeWidth={1.2} />
                            </motion.span>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </motion.main>
        </AnimatePresence >
    );
}
