/*
  Warnings:

  - You are about to drop the column `bin` on the `Bin` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Bin` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `Bin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Bin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bin" DROP COLUMN "bin",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bin_name_key" ON "Bin"("name");
