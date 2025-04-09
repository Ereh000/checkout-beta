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
  // useAppMetafields,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { query } = useApi();


  // const metaData = useAppMetafields();
  // console.log("firstMetaData", metaData);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await query(
          `query {
            products(first: 3) {
              nodes {
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
          }`,
        );

        const formattedProducts = data.products.nodes.map((product) => ({
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
