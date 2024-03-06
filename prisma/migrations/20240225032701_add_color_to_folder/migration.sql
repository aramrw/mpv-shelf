/*
  Warnings:

  - Added the required column `color` to the `Folder` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Folder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "expanded" BOOLEAN NOT NULL DEFAULT false,
    "asChild" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL,
    CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Folder" ("asChild", "expanded", "id", "path", "userId") SELECT "asChild", "expanded", "id", "path", "userId" FROM "Folder";
DROP TABLE "Folder";
ALTER TABLE "new_Folder" RENAME TO "Folder";
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
