-- CreateEnum
CREATE TYPE "RequestState" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "TripState" AS ENUM ('open', 'upcoming', 'past');

-- CreateTable
CREATE TABLE "stay_requests" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "fromDay" INTEGER NOT NULL,
    "toDay" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL,
    "message" TEXT,
    "state" "RequestState" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "stay_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fromDay" INTEGER NOT NULL,
    "toDay" INTEGER NOT NULL,
    "nights" INTEGER NOT NULL,
    "budgetPerNight" INTEGER NOT NULL,
    "state" "TripState" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_offers" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "nights" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "requestedFromDay" INTEGER NOT NULL,
    "requestedToDay" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stay_requests_hostId_state_idx" ON "stay_requests"("hostId", "state");

-- CreateIndex
CREATE INDEX "stay_requests_guestId_idx" ON "stay_requests"("guestId");

-- CreateIndex
CREATE INDEX "trips_authorId_idx" ON "trips"("authorId");

-- CreateIndex
CREATE INDEX "trip_offers_tripId_idx" ON "trip_offers"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_userId_key_key" ON "idempotency_keys"("userId", "key");

-- AddForeignKey
ALTER TABLE "stay_requests" ADD CONSTRAINT "stay_requests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay_requests" ADD CONSTRAINT "stay_requests_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stay_requests" ADD CONSTRAINT "stay_requests_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_offers" ADD CONSTRAINT "trip_offers_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_offers" ADD CONSTRAINT "trip_offers_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
