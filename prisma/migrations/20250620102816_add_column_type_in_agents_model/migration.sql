/*
  Warnings:

  - Added the required column `type` to the `Agent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Agent` ADD COLUMN `type` ENUM('customer_service', 'sales') NOT NULL;
