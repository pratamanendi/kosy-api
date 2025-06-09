/*
  Warnings:

  - A unique constraint covering the columns `[product_id,meta_key]` on the table `ProductMeta` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductMeta_product_id_meta_key_key" ON "ProductMeta"("product_id", "meta_key");
