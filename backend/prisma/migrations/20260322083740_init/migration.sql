-- CreateTable
CREATE TABLE "DecisionRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emergencyType" TEXT NOT NULL,
    "bestHospitalName" TEXT NOT NULL,
    "bestHospitalScore" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL
);
