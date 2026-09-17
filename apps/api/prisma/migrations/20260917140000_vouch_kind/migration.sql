-- How a tie came to exist (invite | event | friend | stay). Drives "who you brought in" and tie weight.
ALTER TABLE "vouches" ADD COLUMN "kind" TEXT;
