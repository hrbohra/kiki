-- Kiki is weeks-long sublets that cover rent: a listing's price and a trip's budget are per week,
-- not per night. Rename the columns and convert the stored nightly figures (x7, to the nearest 5).
ALTER TABLE "listings" RENAME COLUMN "pricePerNight" TO "pricePerWeek";
UPDATE "listings" SET "pricePerWeek" = ROUND("pricePerWeek" * 7 / 5.0) * 5;
ALTER TABLE "trips" RENAME COLUMN "budgetPerNight" TO "budgetPerWeek";
UPDATE "trips" SET "budgetPerWeek" = "budgetPerWeek" * 7;
