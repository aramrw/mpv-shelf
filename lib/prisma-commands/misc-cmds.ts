import Database from "tauri-plugin-sql-api"
import { Video } from "@prisma/client";
import { invoke } from '@tauri-apps/api/tauri';


// scroll hooks need to be moved to /hooks 
export async function updateUserScrollY({
    userId,
    scrollY
}: {
    userId: number,
    scrollY: number
}) {
    const db = await Database.load("sqlite:main.db");

    await db.execute("UPDATE user SET scrollY = $1 WHERE id = $2", [scrollY, userId])
}

export async function getUserScrollY({
    userId
}: {
    userId: number
}) {
    const db = await Database.load("sqlite:main.db");

    try {
        const scrollY: any = await db.select("SELECT scrollY from user WHERE id = $1", [userId])

        if (scrollY) {
            return scrollY[0].scrollY;
        }
    } catch (e) {
        // console.log (e);
        await db.close();
        return null;
    }
}

export async function closeDatabase() {
    const db = await Database.load("sqlite:main.db");
    await db.close();
}

export async function randomizeFolderColor({ folderPath }: { folderPath: string }) {
    const db = await Database.load("sqlite:main.db");

    return invoke("generate_random_mono_color").then(async (color: any) => {
        await db.execute("UPDATE folder SET color = $1 WHERE path = $2 ", [color, folderPath]);
        return color;
    });
}

export async function getFolderColor({ folderPath }: { folderPath: string }) {
    const db = await Database.load("sqlite:main.db");

    return await db.select("SELECT color FROM folder WHERE path = $1", [folderPath]);
}
