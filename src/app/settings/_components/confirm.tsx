import React from 'react'
import { confirm } from '@tauri-apps/api/dialog'

export default async function ConfirmTurnOffPin() {

    const confirmed = await confirm(`Are you sure you would like to turn off your pin? 
This will allow anyone to access your videos.`, { title: `Turn off PIN?`, type: 'warning' });

    if (confirmed) {
        return true;
    } else {
        return false;
    }

}
