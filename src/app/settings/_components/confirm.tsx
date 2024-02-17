import React from 'react'
import { confirm, message } from '@tauri-apps/api/dialog'

export async function ConfirmTurnOffPin() {

    const confirmed = await confirm(`Are you sure you would like to turn off your pin? 
This will allow anyone to access your videos.`, { title: `Turn off PIN?`, type: 'warning' });

    if (confirmed) {
        return true;
    } else {
        return false;
    }

}

export async function ConfirmChangePin() {
    const confirmed = await confirm(`Are you sure you would like to change your pin?`, { title: `Change PIN?`, type: 'warning' });

    if (confirmed) {
        return true;
    } else {
        return false;
    }
}

export async function AlertNoChangesMade() {
    await message(`You entered the same pin. No changes were made.`, { title: `Pin is the same.`, type: 'error' });

    return;
}