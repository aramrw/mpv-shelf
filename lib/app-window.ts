import { confirm } from '@tauri-apps/api/dialog'
import { title } from 'process'

export async function setupAppWindow() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow

    return appWindow
}

export async function settingsOnCloseListener() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow

    let unlisten = appWindow.onCloseRequested(async (e) => {
        e.preventDefault()

        await confirm('You have unsaved changes. Continue without saving?', {
            title:
                'Unsaved Changes!',
            type: 'warning',
        }).then((result) => {
            if (result) {
                appWindow.close()
            }
        })
    });

    return unlisten
}