-- CreateTable
CREATE TABLE "DecisionRecord" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emergencyType" TEXT NOT NULL,
    "bestHospitalName" TEXT NOT NULL,
    "bestHospitalScore" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,

    CONSTRAINT "DecisionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalState" (
    "id" TEXT NOT NULL,
    "beds" INTEGER NOT NULL,
    "occupancy" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricRecord" (
    "id" SERIAL NOT NULL,
    "route" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "isError" BOOLEAN NOT NULL,
    "emergencyType" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricRecord_pkey" PRIMARY KEY ("id")
);
