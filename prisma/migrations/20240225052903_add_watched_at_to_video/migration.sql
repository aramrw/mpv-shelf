/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pin" TEXT NOT NULL,
    "imagePath" TEXT,
    "color" TEXT,
    "scrollY" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("color", "id", "imagePath", "pin", "scrollY") SELECT "color", "id", "imagePath", "pin", "scrollY" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
