-- CreateTable
CREATE TABLE "category_discounts" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tiers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_discounts_categoryId_key" ON "category_discounts"("categoryId");

-- AddForeignKey
ALTER TABLE "category_discounts" ADD CONSTRAINT "category_discounts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "course_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add categoryId to coupons
ALTER TABLE "coupons" ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "coupons_categoryId_idx" ON "coupons"("categoryId");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "course_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
