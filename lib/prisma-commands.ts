import Database from "tauri-plugin-sql-api"
import { User, Folder, Video } from "@prisma/client";
import { SettingSchema } from "@/app/settings/page";

export async function getUsers() {
    const db = await Database.load("sqlite:main.db");

    let users: User[] = [];

    try {
        users = await db.select(
            "SELECT * from user"
        )
    } catch (e) {
        console.log("error", e);
    }

    return users;
}

export async function createNewUser({
    userPin
}: {
    userPin: string
}) {
    let db = await Database.load("sqlite:main.db");

    await db.execute(
        "CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY AUTOINCREMENT, pin TEXT NOT NULL)"
    ).catch((e) => {
        console.log("error", e);
    })

    await db.execute(
        "INSERT into user (pin) VALUES ($1)", [userPin]
    ).catch((e) => {
        console.log("error", e);
    });

}

export async function addFolder({
    userId,
    folderPath
}: {
    userId: number,
    folderPath: string
}) {
    let db = await Database.load("sqlite:main.db");

    await db.execute("CREATE TABLE IF NOT EXISTS folder (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, path TEXT NOT NULL UNIQUE, FOREIGN KEY (userId) REFERENCES user(id))")

    await db.execute("INSERT into folder (userId, path) VALUES ($1, $2)", [userId, folderPath])

}

export async function getFolders({
    userId
}: {
    userId: number
}) {
    let db = await Database.load("sqlite:main.db");

    console.log("userId", userId);

    try {
        // Directly return the result of the query
        let folders: Folder[] = await db.select("SELECT * from folder WHERE userId = $1", [userId]);
        //console.log("folders", folders);
        return folders;
    } catch (e) {
        console.log(e);
        // Return an empty array or handle the error as needed
        return [];
    }
}

export async function deleteFolder({
    folderPath,
}: {
    folderPath: string

}) {
    let db = await Database.load("sqlite:main.db");

    await db.execute("DELETE from folder WHERE path = $1", [folderPath])
}

export async function updateVideoWatched({
    videoPath,
}: {
    videoPath: string,
}) {

    console.log("Updating: ", videoPath);

    // first check if the video exists, if not make it.
    // ps: videos ONLY get created HERE. 

    //console.log("videoPath", videoPath);

    let db = await Database.load("sqlite:main.db");

    try {
        await db.select("SELECT * from video WHERE path = ($1)", [videoPath]).then(async (res: any) => {
            if (res.length === 0) {
                await db.execute("INSERT into video (path, watched) VALUES ($1, $2)", [videoPath, 1])
            } else {
                await db.execute("UPDATE video SET watched = 1 WHERE path = ($1)", [videoPath])
            }
        })
    } catch (e) {
        console.log(e);
        // if this error gets thrown it means the Video table hasnt been created yet
        await db.execute("CREATE TABLE IF NOT EXISTS video (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL UNIQUE, watched BOOLEAN NOT NULL DEFAULT 0)")
    }



}

export async function getVideo({
    videoPath,
}: {
    videoPath: string,
}) {
    let db = await Database.load("sqlite:main.db");

    // let video: Video = {
    //     id: -1,
    //     path: "",
    //     watched: false
    // };

    let video: any;

    try {
        video = await db.select("SELECT * from video WHERE path = ($1)", [videoPath])
    } catch (e) {
        console.log(e);
        // if this error gets thrown it means the Video table hasnt been created yet
        await db.execute("CREATE TABLE IF NOT EXISTS video (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL UNIQUE, watched BOOLEAN NOT NULL DEFAULT 0)")
    }


    if (video.length !== 0) {
        //console.log("video", video);
        return video[0];
    } else {
        return null
    }

}

export async function unwatchVideo({
    videoPath,
}: {
    videoPath: string,
}) {
    let db = await Database.load("sqlite:main.db");

    console.log("videoPath", videoPath);

    await db.execute("UPDATE video SET watched = 0 WHERE path = ($1)", [videoPath])
}

export async function updateSettings({
    formData,
    userId
}: {
    formData: SettingSchema
    userId: number
}) {
    const db = await Database.load("sqlite:main.db");

    await db.execute("CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL UNIQUE, theme TEXT NOT NULL, fontSize TEXT NOT NULL, animations TEXT NOT NULL, autoRename TEXT NOT NULL, FOREIGN KEY (userId) REFERENCES user(id))").catch((e) => {
        console.log("error", e);
    });

    await db.execute(`
        INSERT INTO settings (userId, theme, fontSize, animations, autoRename)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT(userId) DO UPDATE SET
        theme = excluded.theme,
        fontSize = excluded.fontSize,
        animations = excluded.animations,
        autoRename = excluded.autoRename
    `, [userId, formData.theme, formData.fontSize, formData.animations, formData.autoRename]).catch((e) => {
        console.log("error", e);
    });
}

export async function updateUserPin({
    userId,
    newPin
}: {
    userId: number,
    newPin: string
}) {
    const db = await Database.load("sqlite:main.db");

    await db.execute("UPDATE user SET pin = $1 WHERE id = $2", [newPin, userId])
}