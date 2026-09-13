-- CreateEnum
CREATE TYPE "TraitKind" AS ENUM ('origin', 'education', 'interest', 'work', 'event');

-- CreateEnum
CREATE TYPE "Provenance" AS ENUM ('matched', 'inferred', 'self_declared');

-- CreateEnum
CREATE TYPE "ContributionKind" AS ENUM ('hosted', 'vouched', 'referred', 'reviewed', 'attended', 'stayed');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traits" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" "TraitKind" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "provenance" "Provenance" NOT NULL DEFAULT 'self_declared',

    CONSTRAINT "traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouches" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "note" TEXT,
    "noteSubjectId" TEXT,
    "consentToDisplay" BOOLEAN NOT NULL DEFAULT false,
    "stays" INTEGER,
    "sharedEvents" INTEGER,

    CONSTRAINT "vouches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "pricePerNight" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "photoColor" TEXT NOT NULL,
    "tags" TEXT[],

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "day" INTEGER NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_reviews" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "day" INTEGER NOT NULL,

    CONSTRAINT "guest_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "kind" "ContributionKind" NOT NULL,
    "day" INTEGER NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_content" (
    "memberId" TEXT NOT NULL,
    "intro" TEXT,
    "bio" TEXT,
    "guestBook" JSONB,

    CONSTRAINT "generated_content_pkey" PRIMARY KEY ("memberId")
);

-- CreateIndex
CREATE INDEX "traits_memberId_idx" ON "traits"("memberId");

-- CreateIndex
CREATE INDEX "traits_key_idx" ON "traits"("key");

-- CreateIndex
CREATE INDEX "vouches_toId_idx" ON "vouches"("toId");

-- CreateIndex
CREATE UNIQUE INDEX "vouches_fromId_toId_key" ON "vouches"("fromId", "toId");

-- CreateIndex
CREATE INDEX "listings_hostId_idx" ON "listings"("hostId");

-- CreateIndex
CREATE INDEX "reviews_hostId_idx" ON "reviews"("hostId");

-- CreateIndex
CREATE INDEX "guest_reviews_subjectId_idx" ON "guest_reviews"("subjectId");

-- CreateIndex
CREATE INDEX "contributions_memberId_idx" ON "contributions"("memberId");

-- AddForeignKey
ALTER TABLE "traits" ADD CONSTRAINT "traits_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_toId_fkey" FOREIGN KEY ("toId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_noteSubjectId_fkey" FOREIGN KEY ("noteSubjectId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
