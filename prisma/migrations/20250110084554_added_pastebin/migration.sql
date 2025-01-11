-- CreateTable
CREATE TABLE "Bin" (
    "id" SERIAL NOT NULL,
    "bin" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "isMarkdown" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Bin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bin" ADD CONSTRAINT "Bin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
