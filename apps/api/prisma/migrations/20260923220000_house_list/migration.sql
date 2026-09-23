-- House list: rules, things a host would love, and what a guest would look after.
-- Additive only: a new table and a defaulted column. Existing rows are untouched.

ALTER TABLE "stay_requests" ADD COLUMN "commitments" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "house_items" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "detail" TEXT,
    "kind" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "house_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "house_items_listingId_idx" ON "house_items"("listingId");

ALTER TABLE "house_items" ADD CONSTRAINT "house_items_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
