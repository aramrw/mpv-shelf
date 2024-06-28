import Database from "tauri-plugin-sql-api";
import { User, Folder, Video } from "@prisma/client";
import { invoke } from "@tauri-apps/api/tauri";

export async function addFolder({
  userId,
  folderPath,
  expanded,
  asChild,
}: {
  userId: number;
  folderPath: string;
  expanded: boolean;
  asChild: boolean;
}) {
  let db = await Database.load("sqlite:main.db");

  await invoke("generate_random_mono_color").then(async (color: any) => {
    await db
      .execute(
        "INSERT into folder (expanded, path, userId, asChild, color) VALUES ($1, $2, $3, $4, $5)",
        [expanded ? 1 : 0, folderPath, userId, asChild ? 1 : 0, color],
      )
      .then(() => {
        // console.log  ("Created New Folder: ", folderPath.split("\\").pop(), "expanded:", expanded, "for user", userId);
      })
      .catch(async () => {
        await db.close();
        // console.log (e)
        return false;
      });
  });
}

export async function getFolderScrollY({
  userId,
  folderPath
}: {
  userId: number,
  folderPath: string
}) {
  const db = await Database.load("sqlite:main.db");

  try {
    const scrollY: any = await db.select("SELECT scrollY from folder WHERE userId = $1 AND path = $2", [userId, folderPath])

    if (scrollY) {
      return scrollY[0].scrollY;
    }
  } catch (e) {
    // console.log (e);
    await db.close();
    return null;
  }
}

export async function updateFolderScrollY({
  userId,
  folderPath,
  scrollY
}: {
  userId: number,
  folderPath: string,
  scrollY: number
}) {
  const db = await Database.load("sqlite:main.db");

  let result = await db.execute("UPDATE folder SET scrollY = $1 WHERE userId = $2 AND path = $3", [scrollY, userId, folderPath])

	return result.rowsAffected;
}

export async function getFolders({ userId }: { userId: number }) {
  let db = await Database.load("sqlite:main.db");

  try {
    try {
      // Directly return the result of the query
      let folders: Folder[] = await db.select(
        "SELECT * from folder WHERE userId = $1",
        [userId],
      );

      // console.log (`getFolders() => Folders found from user ${userId}:`, folders.length);
      if (folders.length !== 0) {
        return folders;
      } else {
        return [];
      }
    } catch (e) {
      await db.close();
      // console.log (e);
      return [];
    }
  } catch (e) {
    await db.close();
    // console.log (e);
    // Return an empty array or handle the error as needed
    return [];
  }
}

export async function updateFolderExpanded({
  userId,
  folderPath,
  expanded,
  asChild,
}: {
  userId: number;
  folderPath: string;
  expanded: boolean;
  asChild: boolean;
}) {
  let db = await Database.load("sqlite:main.db");

  await db
    .select("SELECT * from folder WHERE PATH = $1 AND userId = $2", [
      folderPath,
      userId,
    ])
    .then(async (folders: unknown) => {
      // console.log ("folders", folders)
      if (Array.isArray(folders) && folders.length !== 0) {
        await db.execute(
          "UPDATE folder SET expanded = $1 WHERE path = $2 AND userId = $3",
          [expanded ? 1 : 0, folderPath, userId],
        );
        // console.log ("Updated", folderPath.split("\\").pop(), "expanded:", expanded, "for user", userId);
      } else {
        await invoke("generate_random_mono_color").then(async (color: any) => {
          await db
            .execute(
              "INSERT into folder (expanded, path, userId, asChild, color) VALUES ($1, $2, $3, $4, $5)",
              [expanded ? 1 : 0, folderPath, userId, asChild ? 1 : 0, color],
            ) /*.then(() => {
                    // console.log ("Created New Folder: ", folderPath.split("\\").pop(), "expanded:", expanded, "for user", userId);
                })*/
            .catch(async () => {
              await db.close();
              // console.log (e)
              return false;
            });
        });
      }
    });

  //await db.close();
  return true;
}


  let db = await Database.load("sqlite:main.db");
  }
export async function deleteFolder({ folderPath }: { folderPath: string }) {
  let db = await Database.load("sqlite:main.db");

  await db.execute("DELETE from folder WHERE path LIKE $1", [`${folderPath}%`]);

  await db.execute("DELETE from video WHERE path LIKE $1", [`${folderPath}%`])
}
