-- CreateTable
CREATE TABLE "ShippingMessage" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shippingMethodToHide" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingMessage_shop_idx" ON "ShippingMessage"("shop");
