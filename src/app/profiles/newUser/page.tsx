"use client"

import React, { createRef, useEffect, useState } from 'react'
import { createNewUser } from '../../../../lib/prisma-commands';
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';

export default function NewUser() {

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
                createNewUser({ userPin: pins.join('') }).then(() => {
                    router.push('/profiles');
                });
            }

        }, [pins]);

        return (
            <main className="mt-4 flex flex-col items-center justify-center">
                <motion.h1 className="text-2xl font-medium">Create New Profile</motion.h1>
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
                            className="h-12 w-12 rounded border-2 border-gray-300 text-center text-xl"
                            pattern="[0-9]*" // Ensure only numbers can be inputted
                        />
                    ))}
                </div>
                <h2 className="text-lg">Enter a <b>pin</b> to protect your account.</h2>
            </main>
        );
    }

    return (
        <main>
            <PinInputNewUser />
        </main>
    )
}
