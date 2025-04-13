import React, { useState, useEffect } from "react";
import {
  BlockStack,
  Button,
  Image,
  InlineLayout,
  reactExtension,
  Text,
  View,
  useApi,
  useMetafield,
  useAppMetafields,
  useCartLines,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);
  const { query } = useApi();
  const cartLines = useCartLines();

  console.log("cartLines:", cartLines);

  // Fetch the metafield data
  const metafields = useAppMetafields();
  console.log("metafields:", metafields);
  const metafieldData = metafields.find(
    (metafield) => metafield.target.type == "shop" && metafield.metafield.namespace === "settings" && metafield.metafield.key === "upsell"
  )?.metafield.value;
  const metafieldDataProduct = metafields.find(
    (metafield) => metafield.target.type == "product" && metafield.metafield.namespace === "settings" && metafield.metafield.key === "upsell"
  )?.metafield.value;

  console.log("metafieldData:", metafieldData);

  useEffect(() => {
    async function checkAndFetchProducts() {
      if (!metafieldData) {
        setLoading(false);
        return;
      }

      try {
        // Parse the metafield JSON data
        const upsellSettings = typeof metafieldData === 'string'
          ? JSON.parse(metafieldData)
          : metafieldData;
        // 
        const upsellProductsSettings = typeof metafieldDataProduct === 'string'
          ? JSON.parse(metafieldDataProduct)
          : metafieldDataProduct;

        console.log("upsellSettings:", upsellSettings);
        console.log("upsellProductsSettings:", upsellProductsSettings);
        console.log("upsellSettings-> selectedProducts:", upsellSettings.selectedProducts);
        console.log("upsellProductsSettings-> selectedProducts:", upsellProductsSettings.selectedProducts);

        // Check if we should show upsells based on cart contents and settings
        let shouldShowUpsell = false;

        console.log("shouldShowUpsell", shouldShowUpsell);

        // If selection type is 'all', always show upsells
        if (upsellSettings.selectionType === 'all') {
          console.log("upsellSettings.selectionType", upsellSettings.selectionType);
          shouldShowUpsell = true;
        } else {
          // Check if any cart product is in the selectedProducts list
          const cartProductIds = cartLines.map(line => line.merchandise.product.id);
          console.log("cartProductIds:", cartProductIds)
          shouldShowUpsell = cartProductIds.some(id =>
            upsellProductsSettings.selectedProducts.includes(id)
          );
          // setShowUpsell(true);
          console.log("shouldShowUpsell", shouldShowUpsell);
        }

        setShowUpsell(shouldShowUpsell);

        console.log("showUpsell", showUpsell);

        if (shouldShowUpsell) {
          setShowUpsell(true);
          console.log("yes show upsell")
          // Filter out empty product IDs
          const validUpsellProductIds = upsellSettings.upsellProducts.filter(id => id && id.trim() !== "");
          console.log("validUpsellProductIds:", validUpsellProductIds);

          if (validUpsellProductIds.length === 0) {
            setLoading(false);
            return;
          }

          // Create the query with product IDs
          const productIdsQuery = validUpsellProductIds.map(id => `"${id}"`).join(',');
          console.log("productIdsQuery:", productIdsQuery);

          const { data } = await query(
            `query {
              nodes(ids: [${productIdsQuery}]) {
                ... on Product {
                  id
                  title
                  featuredImage {
                    url
                  }
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }`
          );

          console.log("data:", data);

          const formattedProducts = data.nodes.map((product) => ({
            id: product.id,
            title: product.title,
            price: new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: product.priceRange.minVariantPrice.currencyCode,
            }).format(product.priceRange.minVariantPrice.amount),
            image: product.featuredImage?.url,
          }));

          console.log("formattedProducts:", formattedProducts);

          setProducts(formattedProducts);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error processing upsell data:", error);
        setLoading(false);
      }
    }

    checkAndFetchProducts();
  }, [query, metafieldData, cartLines]);

  if (loading) {
    return (
      <BlockStack spacing="loose">
        <Text>Loading products...</Text>
      </BlockStack>
    );
  }

  if (!showUpsell || products.length === 0) {
    return null; // Don't show anything if no upsells should be displayed
  }

  console.log("products:", products);

  return (
    <BlockStack spacing="loose">
      <Text size="medium" emphasis="bold">You may also like</Text>
      {products.map((product) => (
        <View
          key={product.id}
          borderRadius="base"
          alignment="center"
          direction="horizontal"
        >
          <InlineLayout spacing="base" columns={["12%", "fill", "12%"]}>
            <Image
              source={product.image}
              accessibilityLabel={product.title}
              cornerRadius="base"
              border="base"
              aspectRatio={1}
              fit="cover"
              width={80}
              height={80}
            />
            <BlockStack spacing="none">
              <Text size="medium">{product.title}</Text>
              <Text size="small" appearance="subdued">
                {product.price}
              </Text>
            </BlockStack>
            <Button kind="secondary" onPress={() => handleAdd(product.id)}>
              Add
            </Button>
          </InlineLayout>
        </View>
      ))}
    </BlockStack>
  );
}

function handleAdd(productId) {
  console.log(`Product ${productId} added to cart`);
  // Add logic to update cart via Storefront API
}
