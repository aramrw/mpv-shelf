"use client"

import React, { createRef, useEffect, useState } from 'react'
import { createNewUser, getUsers, setCurrentUserGlobal } from '../../../lib/prisma-commands';
import { AnimatePresence, motion } from "framer-motion";
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './_components/user-avatar';
import { useRouter } from 'next/navigation';
import { Loader, Loader2 } from 'lucide-react';

export default function Profiles() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // fetch the user object from db on start
    useEffect(() => {
        getUsers().then((users) => {
            if (users) {
                setAllUsers(users);
                setIsLoading(false);
            }
        })
    }, [])

    return (
        <AnimatePresence>
            <motion.main className="flex flex-col items-center justify-center gap-2 p-4"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                key={"main"}
            >
                <h1 className='select-none text-2xl font-bold'>Welcome Back!</h1>
                <h2 className='select-none font-medium'>Select Your Profile From The Users Below.</h2>
                <div className='flex h-fit w-fit flex-row items-center justify-center gap-4'>

                    <AnimatePresence>
                        {allUsers.length !== 0 ? (
                            <>
                                {allUsers.map((user, index) => (
                                    <motion.button
                                        className='flex h-fit w-fit flex-row items-center justify-center'
                                        key={user.id * index}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            if (user.id)
                                                setCurrentUserGlobal({ userId: user.id }).then(() => {
                                                    router.push('/home');
                                                })
                                        }}
                                    >
                                        <UserAvatar userObject={user} />
                                    </motion.button>
                                ))}
                            </>
                        ) : (
                            <>
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    key={"loading"}>
                                    {isLoading && <Loader2 className='h-auto w-20 animate-spin text-accent' />}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                </div>
                <Button variant="outline" className='mt-2 cursor-pointer text-blue-500 underline underline-offset-2'
                    onClick={() => {
                        router.push('/profiles/newUser')
                    }}
                >Add New Profile</Button>
            </motion.main>
        </AnimatePresence>
    )


}

