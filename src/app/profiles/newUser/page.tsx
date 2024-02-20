"use client"

import React, { createRef, useEffect, useState } from 'react'
import { createNewUser } from '../../../../lib/prisma-commands';
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { SettingSchema } from '@/app/settings/page';
import { cn } from '@/lib/utils';


export default function NewUser() {

    const [formData, setFormState] = useState<SettingSchema>({
        theme: 'Light',
        fontSize: 'Small',
        animations: 'On',
        autoRename: 'Off',
        usePin: 'On'
    });

    let router = useRouter();

    function PinInputNewUser() {
        const pinLength = 4;
        const [pins, setPins] = useState(Array(pinLength).fill(''));
        const inputRefs = Array(pinLength).fill(0).map(() => createRef());

        const handleChange = (value: any, index: number) => {
            const newPins = [...pins];
            newPins[index] = value;
            setPins(newPins);

            if (value.length === 1 && index < pinLength - 1) {
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
        };

        useEffect(() => {
            (inputRefs[0].current as HTMLInputElement).focus();
        }, []);

        useEffect(() => {
            console.log(pins.join(''));
            if (pins.join('').length === pinLength) {
                createNewUser({ userPin: pins.join(''), formData: formData }).then(() => {
                    router.push('/profiles');
                });
            }

        }, [pins]);

        return (
            <AnimatePresence>
                <motion.main className="mt-4 flex flex-col items-center justify-center"

                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    key={1}
                >
                    <UserPlus className={cn("h-auto w-10 md:w-14 lg:w-16 xl:w-20 text-primary",

                    )} />
                    <motion.h1 className="text-2xl font-medium md:text-3xl lg:text-4xl xl:text-5xl">Create New Profile</motion.h1>
                    <div className="my-4 flex space-x-2">
                        {pins.map((pin, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index] as React.RefObject<HTMLInputElement>}
                                type="tel" // Use "tel" to get the numeric keyboard on mobile devices
                                maxLength={1}
                                value={pin}
                                onChange={(e) => handleChange(e.target.value, index)}
                                onKeyDown={(e) => handleBackspace(e, index)}
                                className={cn("h-20 w-20 rounded border-2 border-gray-300 text-center text-xl md:h-28 md:w-28 md:text-4xl shadow-md font-bold",
                                )}
                                pattern="[0-9]*" // Ensure only numbers can be inputted
                            />
                        ))}
                    </div>
                    <h2 className="text-lg">Enter a <b>pin #</b> to protect your account.</h2>
                    <h3 className='rounded-sm bg-accent px-1 font-medium'>
                        <b>Note:</b> You can change / turn this off later.
                    </h3>
                </motion.main>
            </AnimatePresence>
        );
    }

    return (
        <main>
            <PinInputNewUser />
        </main>
    )
}
