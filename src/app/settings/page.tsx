"use client"

import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { getCurrentUserGlobal, getUserSettings, getUsers, setCurrentUserGlobal, turnOnPin, updateSettings, updateUserPin } from '../../../lib/prisma-commands'
import { useTheme } from 'next-themes'
import { User } from '@prisma/client';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Copy, Info, Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { writeText } from '@tauri-apps/api/clipboard'
import { useToast } from '@/components/ui/use-toast'
import { AlertNoChangesMade, ConfirmChangePin, ConfirmTurnOffPin } from './_components/confirm'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
    theme: z.enum(['Light', 'Dark']),
    fontSize: z.enum(['Small', 'Medium', 'Large', 'XLarge']),
    animations: z.enum(['On', 'Off']),
    autoRename: z.enum(['On', 'Off']),
    usePin: z.enum(['On', 'Off']),
})

export type SettingSchema = z.infer<typeof formSchema>

export default function Settings() {

    const { toast } = useToast();
    const { setTheme } = useTheme();

    const [formState, setFormState] = useState({
        theme: 'Light',
        fontSize: 'Small',
        animations: 'On',
        autoRename: 'Off',
        usePin: 'On'
    });

    const [currentUser, setCurrentUser] = useState<User>();
    const [locked, setLocked] = useState(true);
    const [hasMultipleProfiles, setHasMultipleProfiles] = useState(false);

    let router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (currentUser?.pin === "disabled" && formState.usePin === "On") {

        }
        // Collect form data directly from the form elements
        const formData = new FormData(e.currentTarget);
        const formValues = {
            theme: formData.get('theme'),
            fontSize: formData.get('fontSize'),
            animations: formData.get('animations'),
            autoRename: formData.get('autoRename'),
            usePin: formData.get('usePin')
        };

        let newPin = formData.get('pin');

        // Validate form data
        const validationResult = formSchema.safeParse(formValues);
        if (!validationResult.success) {
            console.error("Validation failed", validationResult.error);
            return;
        }

        //console.log(validationResult.data);
        //Assuming updateSettings is a function that updates your SQLite config table
        if (currentUser?.id)
            updateSettings({ formData: validationResult.data, userId: currentUser?.id });
        if (currentUser?.pin) {
            if (newPin && newPin !== currentUser?.pin.toString()) {
                updateUserPin({ userId: currentUser.id, newPin: newPin.toString() });
            } else if (formState.usePin === "Off") {
                updateUserPin({ userId: currentUser.id, newPin: "disabled" });
            }
        }


    };

    // fetch the user object from db on start 
    useEffect(() => {
        getUsers().then((users) => {
            if (users) {
                getCurrentUserGlobal().then((GLOBAL_USER) => {
                    for (const user of users) {
                        if (user.id === GLOBAL_USER?.userId) {
                            setCurrentUser(user);
                            break;
                        }
                    }
                });

                if (users.length > 1) {
                    setHasMultipleProfiles(true);
                }
            }

        })
    }, [])

    // fetch the settings object from db on start
    useEffect(() => {
        if (currentUser?.id) {
            getUserSettings({ userId: currentUser?.id }).then((settings) => {
                if (settings) {
                    //console.log("settings", settings);
                    setFormState(settings);
                    //console.log("formState", formState);
                }
            })
        }
    }, [currentUser])

    useEffect(() => {
        if (currentUser?.pin === "disabled" && formState.usePin === "On") {
            setLocked(false);
        }
    }, [currentUser])

    function ToastClickToSee() {

        toast({
            className: 'cursor-pointer',
            title: 'Pin Copied!',
            description: `Click to see pin.`,
            duration: 1500,

            onClick: () => {
                if (currentUser?.pin) {
                    toast({
                        className: 'cursor-pointer',
                        description: `UserID: ${currentUser.id}・Pin: ${currentUser.pin}`,
                        duration: 1500,
                    });
                }
            }
        })

    }


    return (
        <main className={cn('h-fit w-full',
            formState?.fontSize === "Medium" && 'text-lg',
            formState?.fontSize === "Large" && 'text-xl',
            formState?.fontSize === "XLarge" && 'text-2xl',
        )}>
            <form className='h-fit w-full' onSubmit={handleSubmit}>
                <h1 className='h-fit w-full select-none bg-tertiary px-1 font-bold'>Settings</h1>
                <ul className='flex h-full w-full flex-col gap-2 p-2'>
                    <li className='flex h-fit flex-col rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>User</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            {hasMultipleProfiles && (
                                <li className='flex h-fit w-full justify-between bg-muted'>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={1}>
                                            <div className='flex w-1/2 flex-row items-center gap-1'>
                                                <TooltipTrigger asChild>
                                                    <Info className={cn('h-auto w-4 cursor-pointer',
                                                        formState?.fontSize === "Medium" && 'h-auto w-5',
                                                        formState?.fontSize === "Large" && 'h-auto w-6',
                                                        formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                    )}
                                                    />
                                                </TooltipTrigger>
                                                <h1 className='w-1/2 select-none font-medium'>Sign Out</h1>
                                            </div>
                                            <TooltipContent>
                                                <div className='font-medium'>
                                                    <span className=''>
                                                        Takes you back to the <b>profile selection screen</b>.
                                                        <br />
                                                        You are currently signed in as  <b>User {currentUser?.id}</b>.
                                                    </span>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <Button variant="outline" className='w-1/2 font-medium' onClick={() => {
                                        setCurrentUserGlobal({ userId: -1 }).then(() => {
                                            router.push('/');
                                        })

                                    }}>
                                        Sign Out
                                    </Button>
                                </li>
                            )}

                        </ul>
                    </li>
                    <li className='flex h-fit flex-col rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>UI / UX</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            <li className='flex h-fit w-full bg-muted'>
                                <h1 className='w-1/2 select-none font-medium'>Theme</h1>
                                <select className='w-1/2 cursor-pointer rounded-sm bg-accent font-medium' name='theme'
                                    value={formState.theme}
                                    onChange={(e) => {
                                        setFormState({ ...formState, theme: e.target.value })
                                        setTheme(e.target.value.toLowerCase());

                                    }}
                                    onLoad={(e) => {
                                        setTheme(formState.theme);
                                    }}
                                >
                                    <option className='font-medium'>Light</option>
                                    <option className='font-medium'>Dark</option>
                                </select>
                            </li>
                            <li className='flex h-fit w-full bg-muted'>
                                <h1 className='w-1/2 select-none font-medium'>Font Size</h1>
                                <select className='w-1/2 cursor-pointer rounded-sm bg-accent font-medium' name='fontSize'
                                    value={formState.fontSize}
                                    onChange={(e) => {
                                        setFormState({ ...formState, fontSize: e.target.value })
                                    }}
                                >
                                    <option className='font-medium'>Small</option>
                                    <option className='font-medium'>Medium</option>
                                    <option className='font-medium'>Large</option>
                                    <option className='font-medium'>XLarge</option>
                                </select>
                            </li>
                            <li className='flex h-fit w-full bg-muted'>
                                <h1 className='w-1/2 select-none font-medium'>Animations</h1>
                                <select className='w-1/2 cursor-pointer rounded-sm bg-accent font-medium' name='animations'
                                    value={formState.animations}
                                    onChange={(e) => {
                                        setFormState({ ...formState, animations: e.target.value })
                                    }}

                                >
                                    <option className='font-medium'>On</option>
                                    <option className='font-medium'>Off</option>
                                </select>
                            </li>
                        </ul>
                    </li>
                    <li className='flex h-fit flex-col rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>Application</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            <li className='flex h-fit w-full justify-between bg-muted'>
                                <TooltipProvider>
                                    <Tooltip delayDuration={1}>
                                        <div className='flex w-1/2 flex-row items-center gap-1'>
                                            <TooltipTrigger>
                                                <Info className={cn('h-auto w-4 cursor-pointer',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-6',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                )}
                                                />
                                            </TooltipTrigger>
                                            <h1 className='w-1/2 select-none font-medium'>Auto Rename</h1>
                                        </div>
                                        <TooltipContent>
                                            <div className='font-medium'>
                                                <span className='font-bold'>
                                                    Renames subtitle files to match video.
                                                </span>
                                                <br />
                                                <span className='font-bold'>Note:</span> Subtitle files must be in the <b>same directory</b> as the video file,
                                                <br />
                                                as mpv auto loads subtitles if the names are the same.
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <select className='w-1/2 cursor-pointer rounded-sm bg-accent font-medium' name='autoRename'
                                    value={formState.autoRename}
                                    onChange={(e) => {
                                        setFormState({ ...formState, autoRename: e.target.value });
                                    }}
                                >
                                    <option className='font-medium'>On</option>
                                    <option className='font-medium'>Off</option>
                                </select>
                            </li>

                        </ul>
                    </li>
                    <li className='flex h-fit flex-col rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>Security</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            <li className='flex h-fit w-full justify-between bg-muted'>
                                <h1 className='w-1/2 select-none font-medium'>Use Pin</h1>
                                <select className='w-1/2 cursor-pointer rounded-sm bg-accent font-medium' name='usePin'
                                    value={formState.usePin}
                                    onChange={(e) => {
                                        if (e.target.value === 'Off') {
                                            // call a native dialog with tauri api //.. ask if user really wants to disable pin
                                            ConfirmTurnOffPin().then((confirmed) => {
                                                if (confirmed) {
                                                    setFormState({ ...formState, usePin: "Off" });

                                                }
                                            });

                                        } else if (e.target.value === 'On') {
                                            setFormState({ ...formState, usePin: "On" });
                                        }
                                    }}
                                >
                                    <option className='font-medium'>On</option>
                                    <option className='font-medium'>Off</option>
                                </select>
                            </li>
                            {(formState.usePin === 'On' && currentUser?.pin) && (
                                <li className='flex h-fit w-full bg-muted'>
                                    <h1 className='w-1/2 select-none font-medium'>Pin</h1>
                                    <div className={cn('flex w-1/2 flex-row',
                                    )}>
                                        {!locked && (
                                            <motion.div className={cn('flex h-full cursor-pointer flex-row items-center justify-center rounded-l-sm bg-accent px-1',

                                            )}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    // copy the pin to clipboard
                                                    if (currentUser?.pin) {
                                                        writeText(currentUser.pin.toString());
                                                        ToastClickToSee();
                                                    }

                                                }}>
                                                <Copy className={cn('h-5/6 w-4',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-6',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                )}
                                                />
                                            </motion.div>
                                        )}
                                        <input className={cn('w-full rounded-l-sm bg-accent px-1 font-medium',
                                            locked && 'cursor-not-allowed select-none opacity-50 focus:outline-none',
                                            !locked && 'rounded-none',
                                            currentUser.pin === "disabled" && formState.usePin === "On" && "animate-pulse text-white",
                                        )} type='password' name='pin' maxLength={4} pattern='[0-9]{4}' title='Numbers Only' placeholder={currentUser.pin === "disabled" && formState.usePin === "On" ? "Enter a pin #" : `••••`} readOnly={locked} onChange={(e) => {
                                            if (e.target.value.length === 4) {
                                                // ask the user if they want to change the pin 
                                                if (currentUser.pin)
                                                    if (currentUser?.id && e.target.value === currentUser.pin.toString()) {
                                                        AlertNoChangesMade().then(() => {
                                                            setLocked(true);
                                                        });
                                                    } else {
                                                        ConfirmChangePin().then((confirm) => {
                                                            if (confirm) {
                                                                setLocked(true);
                                                                if (currentUser?.pin) {
                                                                    if (currentUser?.id && e.target.value !== currentUser.pin.toString()) {
                                                                        updateUserPin({ userId: currentUser.id, newPin: e.target.value }).then(() => {
                                                                            setCurrentUser({ ...currentUser, pin: e.target.value });

                                                                            toast({
                                                                                title: 'Pin Changed!',
                                                                                description: 'Your pin has been updated.',
                                                                                duration: 1500,
                                                                            });
                                                                        });
                                                                        turnOnPin({ userId: currentUser.id })
                                                                    }
                                                                }

                                                            }
                                                        });
                                                    }

                                            }
                                        }}
                                        />
                                        <motion.div className='flex h-full cursor-pointer flex-row items-center justify-center rounded-r-sm bg-accent px-1'
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setLocked(!locked);
                                            }}
                                        >
                                            {locked ? (
                                                <Lock className={cn('h-5/6 w-4',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-6',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                )}
                                                />
                                            ) : (
                                                <Unlock className={cn('h-5/6 w-4 cursor-pointer ',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-6',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                )}
                                                />
                                            )}

                                        </motion.div>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </li>
                </ul>
                <Button variant="outline" className={cn('mx-2 select-none',
                    formState?.fontSize === "Medium" && 'text-lg',
                    formState?.fontSize === "Large" && 'text-xl',
                    formState?.fontSize === "XLarge" && 'text-2xl',
                )} type='submit' >
                    Save
                </Button>
            </form>
        </main>
    )
}

