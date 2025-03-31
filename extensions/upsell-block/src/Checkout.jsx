// new backup.jsx not working

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
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { query } = useApi();

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch metafield
        const { data: metafieldData } = await query(
          `query {
            shop {
              metafield(key: "upsell_app", namespace: "upsell_settings") {
                value
              }
            }
          }`
        );

        console.log('metafieldData', metafieldData)

        const settings = metafieldData.shop.metafield
          ? JSON.parse(metafieldData.shop.metafield.value)
          : { upsellProducts: [] };

        const upsellProductIds = settings.upsellProducts;

        // Fetch products
        const productsQuery = `
          query {
            nodes(ids: ${JSON.stringify(upsellProductIds)}) {
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
          }
        `;

        const { data: productsData } = await query(productsQuery);

        const formattedProducts = productsData.nodes.map((product) => ({
          id: product.id,
          title: product.title,
          price: new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: product.priceRange.minVariantPrice.currencyCode,
          }).format(product.priceRange.minVariantPrice.amount),
          image: product.featuredImage?.url,
        }));

        setProducts(formattedProducts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    }

    fetchProducts();
  }, [query]);

  if (loading) {
    return (
      <BlockStack spacing="loose">
        <Text>Loading products...</Text>
      </BlockStack>
    );
  }

  return (
    <BlockStack spacing="loose">
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