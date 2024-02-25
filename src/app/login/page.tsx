"use client"

import React, { useState, createRef, useEffect, use } from 'react';
import { getCurrentUserGlobal, getUsers, setCurrentUserGlobal } from '../../../lib/prisma-commands';
import type { User } from "@prisma/client";
import { useRouter } from 'next/navigation';
import { UserAvatar } from '../profiles/_components/user-avatar';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Home() {
    let router = useRouter();

    function ChooseUser() {

        let [users, setUsers] = useState<User[]>();
        let [isLoading, setIsLoading] = useState(true);

        // fetch the user object from db on start
        useEffect(() => {
            getUsers().then((currentUsers) => {
                if (currentUsers && currentUsers.length > 0) {
                    //console.log("currentUsers: ", currentUsers);
                    setUsers(currentUsers);
                    setIsLoading(false);
                } else {
                    setIsLoading(false);
                }
            });
        }, [])

        useEffect(() => {
            if (!isLoading && (users?.length === 0 || users === undefined)) {
                router.push('/profiles/newUser', { scroll: false });
            } else if (!isLoading && users && users?.length > 1) {

                console.log("multiple users found");
                getCurrentUserGlobal().then((GLOBAL_USER) => {
                    if (GLOBAL_USER && GLOBAL_USER?.userId !== -1 && users) {
                        for (const user of users) {
                            if (user.id === GLOBAL_USER.userId) {
                                setUsers([]);
                                setUsers([user]);
                                // ! reset the global user to -1
                                setCurrentUserGlobal({ userId: -1 });
                            }
                        }
                    } else if (!isLoading) {
                        router.push('/profiles', { scroll: false });
                    }
                })
            }
        }, [users, isLoading])


        if (!isLoading && users?.length === 1 && users[0].pin !== null) {
            return (
                <main className="flex flex-col items-center justify-center">
                    <PinInputReturningUser userPin={users[0].pin} userId={users[0].id} />
                </main>
            )
        }


    }

    function PinInputReturningUser({ userPin, userId }: { userPin: string, userId: number }) {

        let randomQuotes = [
            "Just a Second!",
            "Wait a Moment!",
            "Hold On!",
        ]

        let finalQuotes = [
            "Final Step!",
            "The Last One!",
            "Just One More!",
            "Any Second Now!",
            "One More Step!",
        ]

        let failedQuotes = [
            "Try Again!",
            "Incorrect!",
            "One More Time!",
            "Not Quite!",
            "Close!",
            "Missed It!"
        ]

        let welcomeQuotes = [
            "Welcome Back!",
            "Good To See You!",
            "You're Back!",
            "You're In!",
        ]

        let router = useRouter();

        const pinLength = 4;
        const [pins, setPins] = useState(Array(pinLength).fill(''));
        const inputRefs = Array(pinLength).fill(0).map(() => createRef());
        const [currentUser, setCurrentUser] = useState<User>();
        const [isLoading, setIsLoading] = useState(true);

        // focus on the first pin input on component mount
        useEffect(() => {

            if (inputRefs[0] && inputRefs[0].current) {
                (inputRefs[0].current as HTMLInputElement).focus();
            }
        }, []);

        // get the user object to display the avatar
        useEffect(() => {
            getUsers().then((users) => {
                if (users) {
                    for (const user of users) {
                        if (user.id === userId) {
                            setCurrentUser(user);
                            setIsLoading(false);
                        }
                    }
                }
            });

        }, [userId]);

        useEffect(() => {
            if (pins.join('').length === pinLength && isLoading === false) {
                if (pins.join('') === userPin) {
                    router.prefetch('/dashboard');
                    setIsLoading(true);
                    setCurrentUserGlobal({ userId: userId }).then((res) => {
                        if (res == true) {
                            setIsLoading(false);
                            router.push('/dashboard', { scroll: false });
                        }
                    });
                }
            } else if (userPin === "disabled" && !isLoading) {
                router.prefetch('/dashboard');
                setIsLoading(true);
                setCurrentUserGlobal({ userId: userId }).then((res) => {
                    if (res == true) {
                        setIsLoading(false);
                        router.push('/dashboard', { scroll: false });
                    }
                });
            }

        }, [pins, isLoading]);

        const handleChange = (value: any, index: number) => {
            const newPins = [...pins];
            newPins[index] = value;
            setPins(newPins);

            if (inputRefs && value.length === 1 && index < pinLength - 1) {
                (inputRefs[index + 1].current as HTMLInputElement).focus();
            }
        };

        const handleBackspace = (event: any, index: number) => {
            if (event.key === 'Backspace' && !pins[index] && index > 0) {
                const newPins = [...pins];
                newPins[index - 1] = '';
                setPins(newPins);
                (inputRefs[index - 1].current as HTMLInputElement).focus();
            }

            // if its the last pin and they didnt get it right, pressing backspace will clear them all and focus the first input
            if (event.key === 'Backspace' && index === 3 && pins[index]) {
                console.log("backspace pressed");
                setPins(Array(pinLength).fill(''));
                (inputRefs[0].current as HTMLInputElement).focus();
            }
        };



        return (
            <main className='mt-4 flex h-full w-full items-center justify-center'>
                <AnimatePresence mode='wait' onExitComplete={() => {
                    //router.prefetch('/dashboard');
                }}>
                    {pins.join('') !== userPin ? (
                        <motion.div className="flex h-full w-full flex-col items-center justify-center gap-3"
                            key={"NotSignedIn"}
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, bounce: 0.5, type: "spring" }}
                        >
                            <h1 className="w=full h-full select-none py-4 text-center text-4xl font-bold drop-shadow-sm md:text-5xl lg:text-[3.25rem] xl:text-6xl">

                                {
                                    pins.join("").length === 3 && (
                                        finalQuotes[Math.floor(Math.random() * finalQuotes.length)]
                                    )
                                }

                                {
                                    pins.join("").length < 3 && (
                                        randomQuotes[Math.floor(Math.random() * randomQuotes.length)]
                                    )
                                }

                                <AnimatePresence>
                                    <motion.div key={"failed-text"}
                                        animate={(pins.join('').length === 4 && pins.join('') !== userPin) ? { x: [0, -10, 0, 10, 0] } : undefined}
                                        transition={{ duration: 0.2 }}
                                        className='text-destructive drop-shadow-md md:text-4xl lg:text-5xl xl:text-6xl'
                                    >
                                        {
                                            pins.join("").length === 4 && pins.join("") !== userPin && (
                                                failedQuotes[Math.floor(Math.random() * randomQuotes.length)]
                                            )
                                        }
                                    </motion.div>
                                </AnimatePresence>
                            </h1>
                            {(userId && currentUser) && (
                                <div className=''>
                                    <UserAvatar userObject={currentUser} />
                                </div>
                            )}
                            <motion.div className="mt-2 flex space-x-2"
                                animate={(pins.join('').length === 4 && pins.join('') !== userPin) ? { x: [0, -10, 0, 10, 0] } : undefined}
                                transition={{ duration: 0.2 }}

                            >
                                {pins.map((pin, index) => (
                                    <input
                                        key={index}
                                        ref={inputRefs[index] as React.RefObject<HTMLInputElement>}
                                        type="tel" // Use "tel" to get the numeric keyboard on mobile devices
                                        maxLength={1}
                                        value={pin}
                                        onChange={(e) => handleChange(e.target.value, index)}
                                        onKeyDown={(e) => handleBackspace(e, index)}
                                        className={cn("h-20 w-20 rounded border-2 border-muted text-center text-4xl md:h-28 md:w-28 md:text-6xl lg:h-36 lg:w-36 lg:text-8xl xl:h-40 xl:w-40 xl:text-8xl shadow-md font-bold",
                                            (pins.join('').length === 4 && pins.join('') !== userPin) && "border-red-500 focus:outline-none focus:border-red-500",
                                        )}
                                        pattern="\d{4,4}"
                                    />
                                ))}
                            </motion.div>
                            <h2 className="mb-1 text-xl font-medium md:text-2xl lg:text-3xl xl:text-4xl">Enter a <b>pin #</b> to protect your account.</h2>
                            <div className='flex w-full flex-row items-center justify-center'>
                                <Button variant="outline" className='cursor-pointer rounded-lg px-2 py-0 text-lg font-bold text-blue-500 underline underline-offset-2 shadow-sm md:text-2xl lg:text-3xl xl:text-4xl'
                                    onClick={() => {
                                        // create db function for resetting pin
                                    }}
                                >Forgot Pin?</Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key={"SignedIn"} className="mt-3 flex h-full w-full flex-col items-center justify-center rounded-full bg-monotone"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut", stiffness: 100, damping: 20 }}
                        >
                            <Check className='flex h-auto w-60 items-center justify-center text-center text-accent' />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        );
    }

    return (
        <main className="flex h-fit items-center justify-center p-1 px-2">
            <ChooseUser />
        </main>
    );
}
