/*
  Warnings:

  - The primary key for the `payment_hide` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `payment_hide` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "payment_hide" DROP CONSTRAINT "payment_hide_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "payment_hide_pkey" PRIMARY KEY ("id");
