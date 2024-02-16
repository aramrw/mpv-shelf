/*
  Warnings:

  - You are about to drop the column `folderId` on the `Video` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL,
    "watched" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Video" ("id", "path", "watched") SELECT "id", "path", "watched" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE UNIQUE INDEX "Video_path_key" ON "Video"("path");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
