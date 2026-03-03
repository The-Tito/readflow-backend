-- AlterTable
ALTER TABLE "attempts" ALTER COLUMN "max_possible_score" SET DEFAULT 100.0;

-- AlterTable
ALTER TABLE "user_streaks" ADD COLUMN     "average_iri" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "best_iri" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "total_sessions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_t48_completed" INTEGER NOT NULL DEFAULT 0;
