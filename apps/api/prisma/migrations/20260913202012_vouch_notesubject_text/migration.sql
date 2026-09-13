/*
  Warnings:

  - You are about to drop the column `noteSubjectId` on the `vouches` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "vouches" DROP CONSTRAINT "vouches_noteSubjectId_fkey";

-- AlterTable
ALTER TABLE "vouches" DROP COLUMN "noteSubjectId",
ADD COLUMN     "noteSubject" TEXT;
