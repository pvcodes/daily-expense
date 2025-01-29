/*
  Warnings:

  - A unique constraint covering the columns `[mid]` on the table `MonthlyExpense` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mid` to the `MonthlyExpense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MonthlyExpense" ADD COLUMN     "mid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyExpense_mid_key" ON "MonthlyExpense"("mid");
