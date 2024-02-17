"use client"

import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { set, z } from 'zod'
import { getUserSettings, getUsers, updateSettings, updateUserPin } from '../../../lib/prisma-commands'
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
import { confirm } from '@tauri-apps/api/dialog'
import { writeText } from '@tauri-apps/api/clipboard'
import { useToast } from '@/components/ui/use-toast'

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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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
            }
        }

    };

    // fetch the user object from db on start + get the settings object from the db
    useEffect(() => {
        getUsers().then((users) => {
            if (users) {
                let id = localStorage.getItem('userID');
                if (id) {
                    for (const user of users) {
                        if (user.id === Number(id)) {
                            setCurrentUser(user);
                            break;
                        }
                    }
                }
            }
        })
    }, [])

    useEffect(() => {
        if (currentUser?.id) {
            getUserSettings({ userId: currentUser?.id }).then((settings) => {
                if (settings) {
                    setFormState(settings);
                }
            })
        }
    }, [currentUser])


    return (
        <main className='h-fit w-full'>
            <form className='h-fit w-full' onSubmit={handleSubmit}>
                <h1 className='h-fit w-full select-none bg-tertiary px-1 font-bold'>Settings</h1>
                <ul className='flex h-full w-full flex-col gap-2 p-2'>
                    <li className='flex h-fit flex-col rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>UI / UX</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            <li className='flex h-fit w-full bg-muted'>
                                <h1 className='w-1/2 select-none font-medium'>Theme</h1>
                                <select className='w-1/2 rounded-sm bg-accent font-medium' name='theme'
                                    defaultValue={formState.theme}
                                    onChange={(e) => {
                                        setTheme(e.target.value);
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
                                <select className='w-1/2 rounded-sm bg-accent font-medium' name='fontSize'
                                    defaultValue={formState.fontSize}
                                //onChange={handleInputChange}
                                >
                                    <option className='font-medium'>Small</option>
                                    <option className='font-medium'>Medium</option>
                                    <option className='font-medium'>Large</option>
                                    <option className='font-medium'>XLarge</option>
                                </select>
                            </li>
                            <li className='flex h-fit w-full bg-muted'>
                                <h1 className='w-1/2 select-none font-medium'>Animations</h1>
                                <select className='w-1/2 rounded-sm bg-accent font-medium' name='animations'
                                    defaultValue={formState.animations}
                                //onChange={handleInputChange}
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
                                        <div className='flex w-1/2 flex-row gap-1'>
                                            <TooltipTrigger asChild>
                                                <Info className={cn('h-auto w-4 cursor-pointer',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-7',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-9'
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
                                <select className='w-1/2 rounded-sm bg-accent font-medium' name='autoRename'
                                    defaultValue={formState.autoRename}
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
                                <select className='w-1/2 rounded-sm bg-accent font-medium' name='usePin'
                                    defaultValue={formState.usePin}
                                    onChange={(e) => {
                                        if (e.target.value === 'Off') {
                                            // call a native dialog with tauri api //.. ask if user really wants to disable pin
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
                                            <motion.div className='h-full cursor-pointer rounded-l-sm bg-accent px-1'
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    // copy the pin to clipboard
                                                    if (currentUser?.pin) {
                                                        writeText(currentUser.pin.toString());
                                                        toast({
                                                            title: 'Pin Copied!',
                                                            description: 'Your pin has been copied to the clipboard.',
                                                            duration: 1500,
                                                        })
                                                    }

                                                }}>
                                                <Copy className={cn('h-full w-4',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-7',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-8'
                                                )} />
                                            </motion.div>
                                        )}
                                        <input className={cn('w-full rounded-l-sm bg-accent px-1 font-medium',
                                            locked && 'cursor-not-allowed select-none opacity-50',
                                            !locked && 'rounded-none'
                                        )} type='password' name='pin' maxLength={4} pattern='[0-9]{4}' title='Numbers Only' defaultValue={currentUser.pin.toString()} readOnly={locked}
                                        />
                                        <motion.div className='h-full cursor-pointer rounded-r-sm bg-accent px-1'
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                setLocked(!locked);
                                            }}
                                        >
                                            {locked ? (
                                                <Lock className={cn('h-full w-4',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-7',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-8'
                                                )}
                                                />
                                            ) : (
                                                <Unlock className={cn('h-full w-4 cursor-pointer ',
                                                    formState?.fontSize === "Medium" && 'h-auto w-5',
                                                    formState?.fontSize === "Large" && 'h-auto w-7',
                                                    formState?.fontSize === "XLarge" && 'h-auto w-8'
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
                <Button variant="outline" className='mx-2 select-none' type='submit' >
                    Save
                </Button>
            </form>
        </main>
    )
}

