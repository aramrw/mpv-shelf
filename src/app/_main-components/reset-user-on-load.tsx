"use client"

import React, { useEffect } from 'react'
import { closeDatabase } from '../../../lib/prisma-commands/misc-cmds';
import { setCurrentUserGlobal } from '../../../lib/prisma-commands/global/global-cmds';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetUserOnLoad() {

    let router = useRouter();

    useEffect(() => {
        //console.log('resetting user on load');
        //router.prefetch('/login');
        closeDatabase().then(() => {
            setCurrentUserGlobal({ userId: -1 }).then(() => {
                closeDatabase().then(() => {
                    router.push('/login', { scroll: false });
                });

            })
        })

    }, [router])



    return (
        <main className="flex h-1/2 w-full items-center justify-center">
            <Loader2 className="animate-spin text-accent" size={140} />
        </main>
    )
}
