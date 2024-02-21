"use client";

import React, { lazy, useEffect, useMemo, useRef, useState } from 'react';
import { getUsers, setCurrentUserGlobal } from '../../../lib/prisma-commands';
import { AnimatePresence, MotionValue, PanInfo, motion, motionValue, useDragControls, useMotionValue, useScroll } from 'framer-motion';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation'; // Corrected import for useRouter
import { GripHorizontal, GripVertical, Loader2, MoveLeft, MoveRight } from 'lucide-react';
const UserAvatar = lazy(() => import('./_components/user-avatar').then(module => ({ default: module.UserAvatar })));

import { cn } from '@/lib/utils';
//import { currentMonitor } from '@tauri-apps/api/window';

export default function Profiles() {

    const router = useRouter();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGrabbing, setIsGrabbing] = useState(false);
    const [switchedSide, setSwitchedSide] = useState(false);
    const [initialDragX, setInitialDragX] = useState<Number>(0);
    const [initialDragY, setInitialDragY] = useState<Number>(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dragFieldRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);
    const [currentHeight, setCurrentHeight] = useState(0);


    useEffect(() => {
        if (allUsers.length === 0) {
            getUsers().then((users) => {
                if (users) {
                    setAllUsers(users);
                    setIsLoading(false);
                }
            });
        }
    }, []);

    useEffect(() => {
        const updateOffset = () => {
            if (wrapperRef.current && contentRef.current) {
                const { width } = wrapperRef.current.getBoundingClientRect();
                const { height } = wrapperRef.current.getBoundingClientRect();
                const screenHeight = window.innerHeight;
                setCurrentHeight(screenHeight);

                const offSetWidth = contentRef.current.clientWidth;
                const newOffset = offSetWidth - width;

                setOffset(newOffset);
            }
        };

        // Set Initial Value
        updateOffset();

        // Check for resizing Events.
        window.addEventListener("resize", updateOffset);
        return () => {
            window.removeEventListener("resize", updateOffset);
        };
    }, []);



    const handleDragStart = (event: MouseEvent, info: PanInfo) => {
        setIsGrabbing(true);
        setInitialDragX(info.point.x); // Store the initial X position at drag start
        setInitialDragY(info.point.y); // Store the initial Y position at drag start
    };

    const handleDrag = (event: MouseEvent, info: PanInfo) => {
        // Only proceed if we have an initial X position
        if (initialDragX !== 0) {
            const currentDragX = info.point.x;
            const currentDragY = info.point.y;
            const draggedRight = currentDragX > initialDragX.valueOf() + 20;
            const draggedLeft = currentDragX < initialDragX.valueOf() - 20;
            const draggedUp = currentDragY > initialDragY.valueOf() + 50;
            const draggedDown = currentDragY > initialDragY.valueOf() - 100;

            // Logic to determine if we should switch sides
            // Example: If on the left (switchedSide is false) and dragged left, don't switch.
            if ((switchedSide && draggedRight) || (!switchedSide && draggedLeft)) {
                if (draggedUp || draggedDown) {
                    setSwitchedSide(!switchedSide);
                }

            }
        }
    };

    const handleDragEnd = () => {
        setIsGrabbing(false);
        setInitialDragX(0); // Reset initial X position
        setInitialDragY(0);
    };


    return (
        <AnimatePresence>
            {/* <motion.video className="fixed left-0 top-0 z-[-1] h-full w-full object-cover"
                autoPlay
                muted
                loop
                src='video.mp4'
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                key={"video"}
            /> */}
            <motion.main className={cn("flex w-full flex-col items-center justify-center gap-2 overflow-hidden relative select-none shadow-2xl",
                allUsers.length >= 3 && 'items-start',
            )}
                ref={wrapperRef}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                key={"main"}
            >
                {/* Element for Constraints Reference */}
                <div
                    ref={dragFieldRef}
                    className='w-full'
                >
                    <div className={cn("mt-7 h-full w-full flex flex-col justify-center items-center",
                        allUsers.length >= 3 && 'w-fit flex flex-col justify-center items-center',
                    )}>
                        <h1 className='animate-gradient-x select-none bg-[linear-gradient(to_right,theme(colors.zinc.300),theme(colors.gray.100),theme(colors.zinc.400),theme(colors.stone.200),theme(colors.stone.300),theme(colors.white))] bg-[length:200%_auto] bg-clip-text text-center text-3xl font-extrabold text-transparent drop-shadow-lg md:text-5xl lg:text-6xl xl:text-6xl 2xl:text-7xl'>
                            Welcome Back!
                        </h1>
                        <h2 className='text-xl font-extrabold text-background drop-shadow-md md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl'>
                            Select Your Profile From The Users Below
                        </h2>
                    </div>
                    <motion.div className={cn('relative flex flex-col h-full w-full justify-start items-center py-5 rounded-sm pb-8 bg-transparent drop-shadow-md px-4',
                        allUsers.length >= 3 && 'items-start cursor-grab w-fit',
                        (allUsers.length >= 3 && isGrabbing) && 'cursor-grabbing',
                    )}
                        ref={contentRef}
                        initial={allUsers.length >= 3 ? { x: 20 } : undefined}
                        animate={allUsers.length >= 3 ? { x: 20 } : undefined}
                        exit={allUsers.length >= 3 ? { y: -50 } : undefined}
                        drag={offset > 0 ? "x" : undefined}
                        {...allUsers.length >= 3 && { drag: "x" }}
                        dragConstraints={dragFieldRef}
                        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                        dragElastic={0.5}
                        onDragStart={handleDragStart}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        transition={{ duration: 0.5, bounce: 0.5, type: "spring", damping: 100 }}
                    >

                        {allUsers.length !== 0 && (
                            <motion.div className={cn(`w-full flex flex-col gap-4 justify-center items-start pt-2 pb-40 relative`,
                            )}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className='flex h-full w-full flex-row items-center justify-center gap-6'>
                                    {allUsers.map((user, index) => (
                                        <div className='flex flex-row items-center justify-center text-background'
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
                                            {(index !== allUsers.length && allUsers.length >= 3) && <GripVertical className='h-auto w-12 px-0 text-background' />}
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
                                </div>

                                {/* <AnimatePresence>
                                    {(allUsers.length >= 3) && (
                                        <motion.div className={cn('relative h-fit w-full mt-4 flex flex-row items-start justify-start bg-background py-0.5 rounded-sm shadow-md px-6 mb-16',
                                        )}
                                            key={"drag me"}
                                            initial={{ x: -1, opacity: 1 }}
                                            exit={{ x: -500, opacity: 0 }}
                                            transition={{ duration: 1.2, bounce: 0.1, type: "spring" }}
                                            animate={dragMeAnimation}
                                            onMouseDown={() => {
                                                setIsGrabbing(true);
                                            }}
                                            drag="x"
                                            onMouseUp={() => setIsGrabbing(false)}
                                            dragConstraints={dragFieldRef2}
                                        >
                                            <motion.span
                                                key={"arrow"}
                                                className={cn(
                                                    'w-fit flex h-fit items-center justify-center gap-2 p-0',
                                                    (switchedSide) && 'flex-row-reverse'
                                                )}
                                                initial={{ x: 0 }}
                                                exit={{ x: -500, opacity: 0 }}
                                                transition={{
                                                    duration: 0.5, // Longer duration to see the effects clearly
                                                    repeat: Infinity,
                                                    bounce: 0.3,
                                                    type: "spring",
                                                    repeatType: "reverse",
                                                }}

                                            >
                                                {!switchedSide ? (
                                                    <MoveRight className='h-auto w-10 drop-shadow-md md:w-12 lg:w-16 xl:w-16' strokeWidth={2} />
                                                ) : (
                                                    <MoveLeft className='h-auto w-10 drop-shadow-md md:w-12 lg:w-16 xl:w-16' strokeWidth={2} />
                                                )}
                                            </motion.span>

                                        </motion.div>
                                    )}

                                </AnimatePresence> */}

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


                    </motion.div >
                </div>
            </motion.main >
        </AnimatePresence >
    );
}
