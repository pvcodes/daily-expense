/*
  Warnings:

  - A unique constraint covering the columns `[day,userId]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Budget_day_key";

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "day" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "img_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Budget_day_userId_key" ON "Budget"("day", "userId");
