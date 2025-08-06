/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Platform` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Platform` ADD COLUMN `slug` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Platform_slug_key` ON `Platform`(`slug`);
