/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('SENSOR', 'LIGHT', 'PUMP');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "PumpAction" AS ENUM ('ON', 'OFF');

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_createdById_fkey";

-- DropTable
DROP TABLE "Post";

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL DEFAULT 'SENSOR',
    "location" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterData" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION NOT NULL,
    "ph" DOUBLE PRECISION NOT NULL,
    "dissolvedOxygen" DOUBLE PRECISION NOT NULL,
    "turbidity" DOUBLE PRECISION NOT NULL,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "WaterData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LightData" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intensity" DOUBLE PRECISION NOT NULL,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "LightData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PumpLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "PumpAction" NOT NULL,
    "duration" INTEGER,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "PumpLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterData" ADD CONSTRAINT "WaterData_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LightData" ADD CONSTRAINT "LightData_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PumpLog" ADD CONSTRAINT "PumpLog_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
