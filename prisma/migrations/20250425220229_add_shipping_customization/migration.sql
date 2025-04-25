-- CreateTable
CREATE TABLE "shipping_customizations" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shippingMethodToHide" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipping_customizations_shop_idx" ON "shipping_customizations"("shop");
