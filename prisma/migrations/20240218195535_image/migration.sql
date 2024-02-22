/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pin" TEXT,
    "imagePath" TEXT
);
INSERT INTO "new_User" ("id", "pin") SELECT "id", "pin" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_pin_key" ON "User"("pin");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
