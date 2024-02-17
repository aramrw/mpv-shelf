"use client"

import { Button } from '@/components/ui/button'
import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { updateSettings } from '../../../lib/prisma-commands'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
    theme: z.enum(['Light', 'Dark']),
    fontSize: z.enum(['Small', 'Medium', 'Large', 'XLarge']),
    animations: z.enum(['On', 'Off'])
})

export type SettingSchema = z.infer<typeof formSchema>

export default function Settings() {

    const [formState, setFormState] = useState({
        theme: 'light',
        fontSize: 'small',
        animations: 'on'
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Collect form data directly from the form elements
        const formData = new FormData(e.currentTarget);
        const formValues = {
            theme: formData.get('theme'),
            fontSize: formData.get('fontSize'),
        };

        // Validate form data
        const validationResult = formSchema.safeParse(formValues);
        if (!validationResult.success) {
            console.error("Validation failed", validationResult.error);
            return;
        }

        //console.log(validationResult.data);
        //Assuming updateSettings is a function that updates your SQLite config table
        updateSettings({ formData: validationResult.data });
    };


    return (
        <main className='h-fit w-full'>
            <form className='h-fit w-full' onSubmit={handleSubmit}>
                <h1 className='h-fit w-full select-none bg-tertiary px-1 font-bold'>Settings</h1>
                <ul className='flex h-full w-full flex-col p-2'>
                    <li className='flex h-fit flex-col rounded-b-sm bg-muted'>
                        <h1 className='select-none rounded-t-sm bg-accent px-1 font-bold'>UI / UX</h1>
                        <ul className='flex flex-col gap-3 p-2'>
                            <li className='flex h-fit w-full bg-muted'>
                                <h1 className='w-1/2 select-none font-medium'>Theme</h1>
                                <select className='w-1/2 rounded-sm font-medium' name='theme'
                                    value={formState.theme}
                                //onChange={handleInputChange}
                                >
                                    <option className='font-medium'>Light</option>
                                    <option className='font-medium'>Dark</option>
                                </select>
                            </li>
                            <li className='flex h-fit w-full bg-muted'>
                                <h1 className='w-1/2 select-none font-medium'>Font Size</h1>
                                <select className='w-1/2 rounded-sm font-medium' name='fontSize'
                                    value={formState.fontSize}
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
                                <select className='w-1/2 rounded-sm font-medium' name='fontSize'
                                    value={formState.animations}
                                //onChange={handleInputChange}
                                >
                                    <option className='font-medium'>On</option>
                                    <option className='font-medium'>Off</option>
                                </select>
                            </li>
                        </ul>
                    </li>
                </ul>
                <Button variant="outline" className='m-2' type='submit' >
                    Save
                </Button>
            </form>
        </main>
    )
}

