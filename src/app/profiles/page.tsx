"use client";

import React, { lazy, useEffect, useRef, useState } from 'react';
import { closeDatabase } from '../../../lib/prisma-commands/misc-cmds';
import { AnimatePresence, PanInfo, motion } from 'framer-motion';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation'; // Corrected import for useRouter
import { GripVertical, Loader2 } from 'lucide-react';
const UserAvatar = lazy(() => import('./_components/user-avatar').then(module => ({ default: module.UserAvatar })));
import { getUsers } from '../../../lib/prisma-commands/user/user-cmds';
import { setCurrentUserGlobal } from '../../../lib/prisma-commands/global/global-cmds';

import { cn } from '@/lib/utils';
//import { currentMonitor } from '@tauri-apps/api/window';

export default function Profiles() {

  const router = useRouter();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragFieldRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (allUsers.length === 0) {
      closeDatabase().then(() => {
        getUsers().then((users) => {
          if (users) {
            closeDatabase().then(() => {
              setAllUsers(users);
              setIsLoading(false);
            });
          }
        });
      })
    }
  }, [allUsers.length]);

  useEffect(() => {
    const updateOffset = () => {
      if (wrapperRef.current && contentRef.current) {
        const { width } = wrapperRef.current.getBoundingClientRect();
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



  const handleDragStart = (_event: MouseEvent, _info: PanInfo) => {
    setIsGrabbing(true);
  };


  const handleDragEnd = () => {
    setIsGrabbing(false);
  };


  return (
    <AnimatePresence>
      {/* <video className="fixed left-0 top-0 z-[-1] h-full w-full object-cover"
                autoPlay
                muted
                loop
                src='video.mp4'
                key={"video"}
            /> */}
      <motion.main className={cn("flex w-full flex-col items-center justify-center gap-2 overflow-hidden relative select-none shadow-2xl ",
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
          )}>
            <h1 className='animate-gradient-x select-none bg-[linear-gradient(to_right,theme(colors.zinc.600),theme(colors.gray.400),theme(colors.zinc.700),theme(colors.stone.700),theme(colors.stone.300),theme(colors.zinc.300),#333)] bg-[length:200%_auto] bg-clip-text text-center text-4xl font-extrabold text-transparent drop-shadow-lg md:text-5xl lg:text-6xl xl:text-6xl 2xl:text-7xl'>
              Welcome Back!
            </h1>

            <h2 className='animate-gradient-xr select-none bg-[linear-gradient(to_right,theme(colors.zinc.300),theme(colors.gray.100),theme(colors.zinc.400),theme(colors.stone.200),theme(colors.stone.300),theme(colors.white))] bg-[length:200%_auto] bg-clip-text text-center text-2xl font-extrabold text-transparent drop-shadow-lg md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl'>
              Select Your Profile From The Users Below
            </h2>
          </div>
          <motion.div className={cn('relative flex flex-col h-full w-full justify-start items-center py-5 brow rounded-sm pb-8 bg-transparent drop-shadow-md px-4',
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
            //onDrag={handleDrag}
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
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isGrabbing) {
                          router.prefetch('/login');
                          setCurrentUserGlobal({ userId: user.id }).then(() => {
                            return closeDatabase();
                          }).finally(() => {
                            router.push('/login', { scroll: false });
                          });
                        }
                      }}
                    >
                      <motion.button
                        className={cn('flex h-fit w-fit flex-row items-center justify-center',
                          isGrabbing && 'cursor-grabbing' // Add a grabbing cursor when dragging
                        )}
                        key={user.id}
                        whileHover={{ y: 10 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.5, bounce: 0.5, type: "spring" }}

                      >
                        <UserAvatar userObject={user} />
                      </motion.button>
                      {(index !== allUsers.length && allUsers.length >= 3) && <GripVertical className='h-auto w-12 px-0 text-background' />}
                    </div>
                  ))}
                  <div className='flex flex-row items-center justify-center'
                    key={"add profile"}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isGrabbing) {
                        router.prefetch('/profiles/newUser');
                        setCurrentUserGlobal({ userId: -1 }).then(() => {
                          return closeDatabase();
                        }).finally(() => {
                          router.push('/profiles/newUser', { scroll: false });
                        })
                      }

                    }}
                  >
                    <motion.button
                      className={cn('flex h-fit w-fit flex-row items-center justify-center',
                        isGrabbing && 'cursor-grabbing' // Add a grabbing cursor when dragging
                      )}
                      key={"add-prfile2"}
                      whileHover={{ y: 10 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.5, bounce: 0.5, type: "spring" }}

                    >
                      <UserAvatar userObject={allUsers[99]} />
                    </motion.button>
                  </div>
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
          </motion.div >
        </div>
      </motion.main >
    </AnimatePresence >
  );
}
