import { confirm, message } from '@tauri-apps/api/dialog'

export async function ConfirmTurnOffPin() {

    const confirmed = await confirm(`Are you sure you would like to turn off your pin? 
This will allow anyone to sign into your profile.`, { title: `Turn off PIN?`, type: 'warning' });

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

export async function AlertNoPinEntered() {
    await message(`You did not enter a pin. If you don't need a pin #, select "Off" in the "Use Pin" setting.`, { title: `No pin entered.`, type: 'error' });

    return;
}

export async function ConfirmDeleteProfile() {
    const confirmed = await confirm(`
    Are you sure you would like to delete your profile? 
    You will lose all data associated with this profile forever.`, { title: `Delete Account?`, type: 'error' });

    if (confirmed) {
        return true;
    } else {
        return false;
    }
}

export async function ConfirmExitWithoutSave() {
    const confirmed = await confirm(`You have unsaved changes. Continue without saving?`,
        { title: `Unsaved Changes`, type: 'warning' })


    if (confirmed) {
        return true;
    } else {
        return false;
    }

}