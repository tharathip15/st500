-- CreateTable
CREATE TABLE "WaterData" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION NOT NULL,
    "pH" DOUBLE PRECISION NOT NULL,
    "dissolvedOxygen" DOUBLE PRECISION NOT NULL,
    "turbidity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WaterData_pkey" PRIMARY KEY ("id")
);
