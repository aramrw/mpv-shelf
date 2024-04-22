import Database from "tauri-plugin-sql-api"
import { Video } from "@prisma/client";

export async function getVideo({
    videoPath,
    userId
}: {
    videoPath: string,
    userId: number
}) {


    let db = await Database.load("sqlite:main.db");

    let video: Video[] = [];

    try {
        // Ensure the video table exists with the correct schema including the userId field
        await db.execute(`
            CREATE TABLE IF NOT EXISTS video (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                path TEXT NOT NULL, 
                userId INTEGER,
                watched BOOLEAN NOT NULL DEFAULT 0,
                lastWatchedAt TIMESTAMP DEFAULT (datetime('now')),
                FOREIGN KEY (userId) REFERENCES user(id)
            )
        `);

        video = await db.select("SELECT * from video WHERE path = $1 AND userId = $2", [videoPath, userId])
        // console.log  ("retrived", video[0].path.split("\\").pop(), "as", video[0].watched, "for user", video[0].userId);
        return video[0];
    } catch (e) {
        // console.log (e);

    }

    if (video && video.length !== 0) {
        // console.log  ("video", video);
        return video[0];
    } else {
        return null
    }
}

export async function unwatchVideo({
    videoPath,
    userId
}: {
    videoPath: string,
    userId: number
}) {
    let db = await Database.load("sqlite:main.db");

    // console.log ("updating" + videoPath.split("\\").pop(), "as", "unwatched", "for user", userId, "in database");

    await db.execute("UPDATE video SET watched = 0 WHERE path = $1 AND userId = $2", [videoPath, userId]).catch((e) => {
        // console.log ("error", e);
    });

    return true;
}

export async function userGetAllVideos({
    userId
}: {
    userId: number
}) {
    const db = await Database.load("sqlite:main.db");

    try {
        const folders: Video[] = await db.select("SELECT * from video WHERE userId = $1", [userId])

        if (folders.length !== 0) {
            return folders;
        } else {
            return [];
        }
    } catch (e) {
        // console.log (e);
        await db.close();
        return null;
    }
}