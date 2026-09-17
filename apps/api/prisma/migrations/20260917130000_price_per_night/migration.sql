-- Kiki's own app prices per night ("£38 / night"), so the per-week reframe from earlier today
-- is withdrawn: rename the two money columns back and convert the stored weekly figures.
ALTER TABLE "listings" RENAME COLUMN "pricePerWeek" TO "pricePerNight";
UPDATE "listings" SET "pricePerNight" = ROUND("pricePerNight" / 7.0);
ALTER TABLE "trips" RENAME COLUMN "budgetPerWeek" TO "budgetPerNight";
UPDATE "trips" SET "budgetPerNight" = ROUND("budgetPerNight" / 7.0);
