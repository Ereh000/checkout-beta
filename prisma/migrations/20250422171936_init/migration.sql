-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellSettings" (
    "id" SERIAL NOT NULL,
    "shopId" TEXT NOT NULL,
    "upsellName" TEXT NOT NULL,
    "selectedProducts" JSONB NOT NULL,
    "selectedCollections" JSONB NOT NULL,
    "upsellProducts" JSONB NOT NULL,
    "selectionType" TEXT NOT NULL DEFAULT 'specific',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpsellSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_renames" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customizeName" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "newName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_renames_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UpsellSettings_upsellName_key" ON "UpsellSettings"("upsellName");
