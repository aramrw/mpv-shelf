import Database from "tauri-plugin-sql-api";
import { User } from "@prisma/client";
import { SettingSchema } from "@/app/settings/page";
import { invoke } from "@tauri-apps/api/tauri";
import { updateSettings } from "../settings/setting-cmds";

export async function getUsers() {
  const db = await Database.load("sqlite:main.db");

  let users: User[] = [];

  try {
    users = await db.select("SELECT * from user");
  } catch (e) {
    // console.log  (e);
  }

  if (users.length !== 0) {
    // console.log  ("confirmed users", users);
    return users;
  } else {
    // console.log  ("users", users);
    return null;
  }
}

export async function createNewUser({
  userPin,
  formData,
}: {
  userPin: string;
  formData: SettingSchema;
}) {
  let db = await Database.load("sqlite:main.db");

  // console.log  ("Attemping to create new user");

  try {
    // Attempt to insert a new user with a color if provided
    // This assumes you want to insert the color only if it doesn't already exist in the table
    // If the color is not provided or is an empty string, this will skip the attempt to insert the color

    let currentColor = "";

    await invoke("generate_random_color").then(async (color: any) => {
      await db
        .execute(`INSERT OR IGNORE INTO user (pin, color) VALUES ($1, $2)`, [
          userPin,
          color,
        ])
        .then(() => {
          currentColor = color.toString();
        });
    });

    if (currentColor !== "") {
      console.log("creating settings for new user");
      await db
        .select("SELECT * from user WHERE color = $1", [currentColor])
        .then(async (user: any) => {
          if (user.length === 1) {
            updateSettings({ formData, userId: user[0].id });
          }
          await db.close();
          return user;
        });
    }
  } catch (e) {
    // console.log  (e);
    await db.close();
    return false;
  }
}
