-- CreateTable
CREATE TABLE "payment_hide" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customizeName" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_hide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_hide_shopId_idx" ON "payment_hide"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_hide_shopId_customizeName_key" ON "payment_hide"("shopId", "customizeName");
