import Database from "tauri-plugin-sql-api";
import { User, Video } from "@prisma/client";

export async function getVideo({
  videoPath,
  userId,
}: {
  videoPath: string;
  userId: number;
}) {
  let db = await Database.load("sqlite:main.db");

  let video: Video[] = [];

  try {
    video = await db.select(
      "SELECT * from video WHERE path = $1 AND userId = $2",
      [videoPath, userId],
    );
    // console.log  ("retrived", video[0].path.split("\\").pop(), "as", video[0].watched, "for user", video[0].userId);
    return video[0];
  } catch (e) {
    // console.log (e);
  }

  if (video && video.length !== 0) {
    // console.log  ("video", video);
    return video[0];
  } else {
    return null;
  }
}


export async function updateVideoWatched({
  videoPath,
  user,
  watched,
}: {
  videoPath: string;
  user: User | undefined;
  watched: boolean;
}) {
  console.log("Updating watched: ", videoPath.split("\\").pop(), "as", watched, "for user", user?.id);

  let db = await Database.load("sqlite:main.db");

  try {
    await db.execute(`
			CREATE UNIQUE INDEX IF NOT EXISTS idx_video_user_path ON video(userId, path)
        `);

    // Check if the video already exists in the database
    const videos: Video[] = await db.select(
      "SELECT * from video WHERE path = $1 AND userId = $2",
      [videoPath, user?.id],
    );

    if (videos.length === 0) {
      // Insert new video record if it does not exist
      await db.execute(
        "INSERT INTO video (path, userId, watched, lastWatchedAt) VALUES ($1, $2, $3, (datetime('now', 'localtime')))",
        [videoPath, user?.id, watched ? 1 : 0],
      );
    } else {
      // Update existing video record
      await db.execute(
        "UPDATE video SET watched = $3, lastWatchedAt = (datetime('now', 'localtime')) WHERE path = $1 AND userId = $2",
        [videoPath, user?.id, watched ? 1 : 0],
      );
    }
  } catch (e) {
    await db.close();
    console.error(`failed to update: ${videoPath}\nfor user: ${user?.id}\n${e}`);
    return false;
  }

  return true;
}

export async function unwatchVideo({
  videoPath,
  userId,
}: {
  videoPath: string;
  userId: number;
}) {
  let db = await Database.load("sqlite:main.db");

  // console.log ("updating" + videoPath.split("\\").pop(), "as", "unwatched", "for user", userId, "in database");

  await db
    .execute("UPDATE video SET watched = 0 WHERE path = $1 AND userId = $2", [
      videoPath,
      userId,
    ])
    .catch((e) => {
      // console.log ("error", e);
    });

  return true;
}

export async function userGetAllVideos({ userId }: { userId: number }) {
  const db = await Database.load("sqlite:main.db");

  try {
    const folders: Video[] = await db.select(
      "SELECT * from video WHERE userId = $1",
      [userId],
    );

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
