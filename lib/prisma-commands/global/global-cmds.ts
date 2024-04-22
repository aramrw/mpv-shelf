import Database from "tauri-plugin-sql-api"
import { Global } from "@prisma/client";


export async function setCurrentUserGlobal({ userId }: { userId: number }) {
    const db = await Database.load("sqlite:main.db");

    // Use a constant ID since there will only ever be one record in this table.
    const GLOBAL_ID = 'GID99844589388427';

    try {

        // Ensure the global table exists
        await db.execute(`
            CREATE TABLE IF NOT EXISTS global (
                id TEXT PRIMARY KEY, 
                userId INTEGER NOT NULL
            )
        `);

        // Set the current user. The ON CONFLICT clause is used to upsert the userId for the constant ID.
        await db.execute(`
            INSERT INTO global (id, userId) 
            VALUES ($1, $2)
            ON CONFLICT(id) DO UPDATE SET 
            userId = excluded.userId
        `, [GLOBAL_ID, userId]);

    } catch (e) {
        await db.close();
        // console.log (e);
        return false
    }

    return true
}

export async function getCurrentUserGlobal() {
    const db = await Database.load("sqlite:main.db");

    const GLOBAL_ID = 'GID99844589388427';

    try {
        // Ensure the global table exists
        await db.execute(`
        CREATE TABLE IF NOT EXISTS global (
        id TEXT PRIMARY KEY, 
        userId INTEGER NOT NULL
        )`);

        const GLOBAL_USER: Global[] = await db.select("SELECT * from global WHERE id = $1", [GLOBAL_ID])

        if (GLOBAL_USER) {
            //await db.close();
            return GLOBAL_USER[0];
        }

        return null;
    } catch (e) {
        await db.close();
        // console.log (e);
        return null;
    }

}