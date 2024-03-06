/*
  Warnings:

  - You are about to alter the column `pin` on the `User` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - A unique constraint covering the columns `[id]` on the table `Global` will be added. If there are existing duplicate values, this will fail.
  - Made the column `pin` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Video_path_key";

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "theme" TEXT NOT NULL,
    "fontSize" TEXT NOT NULL,
    "animations" TEXT NOT NULL,
    "autoRename" TEXT NOT NULL,
    "usePin" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pin" INTEGER NOT NULL,
    "imagePath" TEXT,
    "color" TEXT
);
INSERT INTO "new_User" ("color", "id", "imagePath", "pin") SELECT "color", "id", "imagePath", "pin" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Global_id_key" ON "Global"("id");
