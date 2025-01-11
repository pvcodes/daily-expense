/*
  Warnings:

  - A unique constraint covering the columns `[uid]` on the table `Bin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uid` to the `Bin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bin" ADD COLUMN     "uid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bin_uid_key" ON "Bin"("uid");
