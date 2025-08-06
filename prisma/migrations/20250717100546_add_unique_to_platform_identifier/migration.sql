/*
  Warnings:

  - A unique constraint covering the columns `[platform_identifier]` on the table `ConnectedPlatform` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ConnectedPlatform_platform_identifier_key` ON `ConnectedPlatform`(`platform_identifier`);
