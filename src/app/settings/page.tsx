"use client"

import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { set, z } from 'zod'
import { deleteProfile, getCurrentUserGlobal, getUserSettings, getUsers, setCurrentUserGlobal, turnOnPin, updateProfilePicture, updateSettings, updateUserPin } from '../../../lib/prisma-commands'
import { useTheme } from 'next-themes'
import { User } from '@prisma/client';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import { ALargeSmall, Check, Copy, Delete, Images, Info, Lock, Moon, Sun, Unlock, UserMinus, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { writeText } from '@tauri-apps/api/clipboard'
import { useToast } from '@/components/ui/use-toast'
import { AlertNoChangesMade, ConfirmChangePin, ConfirmDeleteProfile, ConfirmExitWithoutSave, ConfirmTurnOffPin } from './_components/confirm'
import { useRouter } from 'next/navigation'
import { open } from '@tauri-apps/api/dialog'
import { UserAvatar } from '../profiles/_components/user-avatar'

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
    const [savedChanges, setSavedChanges] = useState(true);

    // this will be used to compare the form state [updated-state] with the savedChangeState [initial-state]
    const [savedChangesFormState, setSavedChangesFormState] = useState({} as any);


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

    // fetch the settings object from db on start && update the formState with it
    useEffect(() => {
        if (currentUser?.id) {
            getUserSettings({ userId: currentUser?.id }).then((settings) => {
                if (settings) {
                    setFormState(settings);
                    setSavedChangesFormState(settings);
                    setSavedChanges(true);
                }
            })
        }
    }, [currentUser])


    // check if the user has a pin set, if not, disable the pin option
    useEffect(() => {
        if (currentUser?.pin === "disabled" && formState.usePin === "On") {
            setLocked(false);
        }
    }, [currentUser])


    // reset the savedChanges state when the formState updates
    useEffect(() => {
        setSavedChanges(false);
    }, [formState])


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
        <main className={cn('h-fit pb-2 w-full',
            formState?.fontSize === "Medium" && 'text-lg',
            formState?.fontSize === "Large" && 'text-xl',
            formState?.fontSize === "XLarge" && 'text-2xl',
        )}>
            <form className='h-fit w-full md:px-16 lg:px-32 xl:px-48' onSubmit={handleSubmit}>

                <ul className='flex h-full w-full flex-col gap-2 p-2'>
                    <li className='flex h-fit flex-col justify-center rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>User</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            {hasMultipleProfiles && (
                                <li className='fit flex max-h-96 w-full items-center justify-between gap-2 bg-muted'>
                                    <div className='flex h-fit w-full flex-row items-center justify-between gap-4 rounded-sm bg-monotone p-5'>
                                        {currentUser && (
                                            <>
                                                <motion.div className='flex w-[60%] cursor-pointer items-center justify-center rounded-sm'
                                                    // whileHover={{ scale: 2 }}
                                                    // transition={{ duration: 1 }}
                                                    style={{
                                                        background: `url(${currentUser?.imagePath})`,
                                                        backgroundSize: 'cover',
                                                    }}
                                                >
                                                    <UserAvatar userObject={currentUser} asChild />
                                                </motion.div>
                                                <div className='flex h-fit w-full flex-col items-center justify-between gap-4 rounded-sm bg-monotone'>

                                                    <TooltipProvider>
                                                        <Tooltip delayDuration={1000}>
                                                            <TooltipTrigger asChild className='flex w-full cursor-pointer flex-row items-center justify-center text-base'>
                                                                <Button variant="outline" className={cn('select-none h-full w-3/4 p-0 flex gap-1',
                                                                    formState?.fontSize === "Medium" && 'text-lg',
                                                                    formState?.fontSize === "Large" && 'text-xl',
                                                                    formState?.fontSize === "XLarge" && 'text-2xl',
                                                                )} onClick={() => {
                                                                    setCurrentUserGlobal({ userId: -1 }).then(() => {
                                                                        router.push('/');
                                                                    })

                                                                }}>
                                                                    Sign Out
                                                                    <UserMinus className={cn('h-auto w-4 cursor-pointer',
                                                                        formState?.fontSize === "Medium" && 'h-auto w-5',
                                                                        formState?.fontSize === "Large" && 'h-auto w-6',
                                                                        formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                                    )} />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className={cn('select-none flex gap-1',
                                                                formState?.fontSize === "Medium" && 'text-lg',
                                                                formState?.fontSize === "Large" && 'text-xl',
                                                                formState?.fontSize === "XLarge" && 'text-2xl',
                                                            )}>
                                                                <div className='text-center font-medium'>
                                                                    <span className='text-center'>
                                                                        Takes you back to the <b>profile selection screen</b>.
                                                                        <br />
                                                                        You are currently signed in as  <b>User {currentUser?.id}</b>.
                                                                    </span>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip delayDuration={1000}>
                                                            <TooltipTrigger asChild className='flex w-full cursor-pointer flex-row items-center justify-center text-base'>
                                                                <Button variant="outline" className={cn('select-none  h-full w-3/4 p-0 flex gap-1',
                                                                    formState?.fontSize === "Medium" && 'text-lg',
                                                                    formState?.fontSize === "Large" && 'text-xl',
                                                                    formState?.fontSize === "XLarge" && 'text-2xl',
                                                                )} onClick={() => {
                                                                    // open a dialog to select a new profile picture
                                                                    open({
                                                                        directory: false,
                                                                        multiple: false,
                                                                        filters: [{
                                                                            name: 'Image',
                                                                            extensions: ['png', 'jpeg', 'jpg', 'gif']
                                                                        }],
                                                                        title: "Select Profile Picture"
                                                                    }).then((result) => {
                                                                        if (result && currentUser) {
                                                                            updateProfilePicture({
                                                                                userId: currentUser?.id,
                                                                                imagePath: result?.toString()
                                                                            }).then(() => {
                                                                                if (currentUser) {

                                                                                    window.location.reload();

                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                                }>
                                                                    Change Avatar
                                                                    <Images className={cn('h-auto w-4 cursor-pointer',
                                                                        formState?.fontSize === "Medium" && 'h-auto w-5',
                                                                        formState?.fontSize === "Large" && 'h-auto w-6',
                                                                        formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                                    )} />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side='bottom' className={cn('select-none flex gap-1',
                                                                formState?.fontSize === "Medium" && 'text-lg',
                                                                formState?.fontSize === "Large" && 'text-xl',
                                                                formState?.fontSize === "XLarge" && 'text-2xl',
                                                            )}>
                                                                <div className='text-center font-medium'>
                                                                    <span className=''>
                                                                        Click to change your <b>profile picture</b>.
                                                                    </span>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    {hasMultipleProfiles && (
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild className='flex w-full cursor-pointer flex-row items-center justify-center text-base'>
                                                                    <Button variant="destructive" className={cn('select-none w-3/4 py-[1px] h-fit  flex flex-row justify-center items-center rounded-sm gap-1',
                                                                        formState?.fontSize === "Medium" && 'text-lg',
                                                                        formState?.fontSize === "Large" && 'text-xl',
                                                                        formState?.fontSize === "XLarge" && 'text-2xl',
                                                                    )} onClick={() => {
                                                                        ConfirmDeleteProfile().then((res) => {
                                                                            if (res) {
                                                                                if (currentUser?.id) {
                                                                                    deleteProfile({ userId: currentUser.id }).then(() => {
                                                                                        setCurrentUserGlobal({ userId: -1 }).then(() => {
                                                                                            router.push('/');
                                                                                        });
                                                                                    });
                                                                                }
                                                                            }
                                                                        });
                                                                    }}>
                                                                        Delete Profile
                                                                        <Delete className={cn('h-auto w-4 cursor-pointer',
                                                                            formState?.fontSize === "Medium" && 'h-auto w-5',
                                                                            formState?.fontSize === "Large" && 'h-auto w-6',
                                                                            formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                                        )} />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent align='center' side='bottom' className={cn('select-none flex gap-1',
                                                                    formState?.fontSize === "Medium" && 'text-lg',
                                                                    formState?.fontSize === "Large" && 'text-xl',
                                                                    formState?.fontSize === "XLarge" && 'text-2xl',
                                                                )}>
                                                                    <div className='font-medium'>
                                                                        <div className='flex flex-col items-center justify-center gap-1'>
                                                                            <div className='flex flex-row gap-0.5'>
                                                                                <span className='rounded-sm font-bold'> Deletes your profile and</span>
                                                                                <b className='text-destructive underline'>
                                                                                    all associated data.</b>
                                                                            </div>
                                                                            <b className='rounded-sm bg-accent px-1'> This action is irreversible.</b>
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>



                                                    )}
                                                </div>
                                            </>
                                        )}



                                    </div>
                                </li>
                            )}

                            {!hasMultipleProfiles && (
                                <li className='flex h-fit w-full items-center justify-center bg-muted'>
                                    <Button variant="outline" className={cn('select-none w-1/2 py-1 h-1/4 flex flex-row justify-center items-center gap-1',
                                        formState?.fontSize === "Medium" && 'text-lg',
                                        formState?.fontSize === "Large" && 'text-xl',
                                        formState?.fontSize === "XLarge" && 'text-2xl',
                                    )} onClick={() => {
                                        router.push("/profiles/newUser")
                                    }}>
                                        Add New Profile
                                        <UserPlus className={cn('h-auto w-4 cursor-pointer',
                                            formState?.fontSize === "Medium" && 'h-auto w-5',
                                            formState?.fontSize === "Large" && 'h-auto w-6',
                                            formState?.fontSize === "XLarge" && 'h-auto w-7'
                                        )} />
                                    </Button>

                                </li>
                            )}

                        </ul>
                    </li>
                    <li className='flex h-fit flex-col justify-center rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>UI / UX</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            <li className='flex h-fit w-full bg-muted'>
                                <div className='flex w-1/2 items-center justify-start gap-1'>
                                    <h1 className='select-none font-medium'>Theme</h1>
                                    <AnimatePresence mode='wait'>
                                        {formState.theme === "Light" ? (
                                            <motion.div
                                                key="light"
                                                animate={{ scale: 1.05 }}
                                                initial={{ scale: 0.95 }}
                                                exit={{ scale: 0.95 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <Sun className={cn('h-auto w-4 cursor-pointer',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-6',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                )} />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="dark"
                                                animate={{ scale: 1.05 }}
                                                initial={{ scale: 0.95 }}
                                                exit={{ scale: 0.95 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <Moon className={cn('h-auto w-4 cursor-pointer',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-6',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                )} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>


                                </div>
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
                                <div className='flex w-1/2 items-center justify-start gap-1'>
                                    <h1 className='select-none font-medium'>Font Size</h1>
                                    <ALargeSmall className={cn('h-auto w-4 cursor-pointer',
                                        formState?.fontSize === "Medium" && 'h-auto w-5',
                                        formState?.fontSize === "Large" && 'h-auto w-6',
                                        formState?.fontSize === "XLarge" && 'h-auto w-7'
                                    )} />
                                </div>
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
                    <li className='flex h-fit flex-col justify-center rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>Application</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            <li className='flex h-fit w-full justify-between bg-muted'>
                                <TooltipProvider>
                                    <Tooltip delayDuration={200}>
                                        <div className='flex w-full flex-row gap-1'>
                                            <TooltipTrigger className='flex w-full flex-row items-center justify-start gap-1'>
                                                <Info className={cn('h-auto w-4 cursor-pointer',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-6',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-7'
                                                )}
                                                />
                                                <h1 className='select-none font-medium'>Auto Rename</h1>
                                            </TooltipTrigger>
                                        </div>
                                        <TooltipContent align='start' side='bottom' className={cn('select-none flex gap-1',
                                            formState?.fontSize === "Medium" && 'text-lg',
                                            formState?.fontSize === "Large" && 'text-xl',
                                            formState?.fontSize === "XLarge" && 'text-2xl',
                                        )}>
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
                                <select className='w-full cursor-pointer rounded-sm bg-accent font-medium' name='autoRename'
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
                    <li className='flex h-fit flex-col justify-center rounded-b-sm bg-muted'>
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
                                                    setSavedChanges(true);
                                                    setSavedChangesFormState(formState);
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
                                                                        setSavedChanges(true);
                                                                        setSavedChangesFormState(formState);
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

                <AnimatePresence
                    mode='wait'
                >
                    <AnimatePresence mode='wait'>
                        {savedChanges ? (
                            <motion.div
                                key="saved"
                                className='flex w-full flex-row items-center gap-2 text-base'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Button variant="outline" className={cn('mx-2 select-none transition-all flex flex-row justify-center items-center gap-1 text-base ',
                                    formState?.fontSize === "Medium" && 'text-lg',
                                    formState?.fontSize === "Large" && 'text-xl',
                                    formState?.fontSize === "XLarge" && 'text-2xl',
                                )} type='submit'>
                                    <Check className={cn('h-5/6 w-4',
                                        formState?.fontSize === "Medium" && 'h-auto w-5',
                                        formState?.fontSize === "Large" && 'h-auto w-6',
                                        formState?.fontSize === "XLarge" && 'h-auto w-7'
                                    )} />
                                    Saved Changes
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="save"
                                className='flex w-full flex-row items-center gap-2 text-base'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Button variant="outline" className={cn('mx-2 select-none transition-all text-base',
                                    formState?.fontSize === "Medium" && 'text-lg',
                                    formState?.fontSize === "Large" && 'text-xl',
                                    formState?.fontSize === "XLarge" && 'text-2xl',
                                    (formState !== savedChangesFormState) && 'animate-pulse duration-400',
                                )} type='submit' onClick={() => {
                                    setSavedChanges(true);
                                    setSavedChangesFormState(formState);
                                }}>
                                    Save
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </AnimatePresence>

            </form>
        </main>
    )
}

