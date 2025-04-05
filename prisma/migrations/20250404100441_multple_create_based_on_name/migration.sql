/*
  Warnings:

  - Made the column `upsellName` on table `UpsellSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UpsellSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopId" TEXT NOT NULL,
    "upsellName" TEXT NOT NULL,
    "selectedProducts" JSONB NOT NULL,
    "selectedCollections" JSONB NOT NULL,
    "upsellProducts" JSONB NOT NULL,
    "selectionType" TEXT NOT NULL DEFAULT 'specific',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UpsellSettings" ("createdAt", "id", "selectedCollections", "selectedProducts", "selectionType", "shopId", "updatedAt", "upsellName", "upsellProducts") SELECT "createdAt", "id", "selectedCollections", "selectedProducts", "selectionType", "shopId", "updatedAt", "upsellName", "upsellProducts" FROM "UpsellSettings";
DROP TABLE "UpsellSettings";
ALTER TABLE "new_UpsellSettings" RENAME TO "UpsellSettings";
CREATE UNIQUE INDEX "UpsellSettings_upsellName_key" ON "UpsellSettings"("upsellName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
