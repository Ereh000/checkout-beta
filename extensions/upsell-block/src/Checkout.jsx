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
  Heading,
  BlockLayout,
  Link,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const {
    layout,
    heading,
    buttonText,
    buttonStyle,
    buttonAppearance,
    buttonPosition,
  } = useSettings();
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);

  // Hooks
  const { query, applyCartLinesChange } = useApi();
  const cartLines = useCartLines();
  const metafields = useAppMetafields();

  // Extract metafield data
  const shopMetafield = metafields.find(
    (metafield) =>
      metafield.target.type === "shop" &&
      metafield.metafield.namespace === "settings" &&
      metafield.metafield.key === "upsell",
  )?.metafield.value;

  const productMetafield = metafields.find(
    (metafield) =>
      metafield.target.type === "product" &&
      metafield.metafield.namespace === "settings" &&
      metafield.metafield.key === "upsell",
  )?.metafield.value;

  // console.log("shopMetafield:", shopMetafield);
  // console.log("productMetafield:", productMetafield);

  // Parse metafield data
  const parseMetafieldData = (data) => {
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  };

  // Helper function to format product IDs for GraphQL query
  const formatProductIds = (productIds) => {
    if (!productIds || !Array.isArray(productIds)) return "";

    return productIds
      .filter((id) => id && id.trim() !== "")
      .map((id) => {
        if (id.startsWith("gid://")) {
          return `"${id}"`;
        }
        return `"gid://shopify/Product/${id}"`;
      })
      .join(",");
  };

  // Helper function to format products data
  const formatProductsData = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return [];

    return nodes
      .filter((product) => product != null) // Filter out null/undefined products
      .map((product) => ({
        id: product.id,
        title: product.title,
        price: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: product.priceRange?.minVariantPrice?.currencyCode || "USD",
        }).format(product.priceRange?.minVariantPrice?.amount || 0),
        image: product.featuredImage?.url,
      }));
  };

  // Fetch products based on product IDs
  const fetchProducts = async (productIds) => {
    if (!productIds || productIds.length === 0) return { nodes: [] };

    const productIdsQuery = formatProductIds(productIds);
    if (!productIdsQuery) return { nodes: [] };

    try {
      const { data } = await query(
        `query {
        nodes(ids: [${productIdsQuery}]) {
          ... on Product {
            id
            title
            featuredImage {
              url
            }
            handle
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

      // Ensure data and nodes exist before returning
      if (!data || !data.nodes) {
        console.error("Invalid response format:", data);
        return { nodes: [] };
      }

      // console.log("data.nodes:", data.nodes);

      return data;
    } catch (error) {
      console.error("Error fetching products:", error);
      return { nodes: [] };
    }
  };

  // Check if cart contains products from selected products list
  const cartContainsSelectedProducts = (cartProductIds, selectedProducts) => {
    if (
      !selectedProducts ||
      !Array.isArray(selectedProducts) ||
      selectedProducts.length === 0
    ) {
      return false;
    }

    return cartProductIds.some((id) => selectedProducts.includes(id));
  };

  // Process shop-level metafield data
  const processShopMetafield = async (upsellSettings) => {
    if (!upsellSettings) return;

    // Get cart product IDs
    const cartProductIds = cartLines.map((line) => line.merchandise.product.id);
    // console.log("cartProductIds:", cartProductIds);
    // console.log("upsellSettings:", upsellSettings);

    // Check if we should show upsells based on cart contents and settings
    let shouldShowUpsell = false;
    let upsellProductIds = [];

    // First check if any specific product-based upsells match the cart
    if (upsellSettings.selectedProducts) {
      // console.log(
      //   "upsellSettings.selectedProducts:",
      //   upsellSettings.selectedProducts,
      // );

      // Check if any cart product is in the selectedProducts list
      shouldShowUpsell = cartContainsSelectedProducts(
        cartProductIds,
        upsellSettings.selectedProducts,
      );

      if (shouldShowUpsell) {
        upsellProductIds = upsellSettings.upsellProducts || [];
      }
    }

    // If no specific product upsells matched, check if we should show all-type upsells
    if (!shouldShowUpsell && upsellSettings.selectionType === "all") {
      shouldShowUpsell = true;
      upsellProductIds = upsellSettings.upsellProducts || [];
    }

    setShowUpsell(shouldShowUpsell);

    if (shouldShowUpsell) {
      // Filter out empty product IDs
      const validUpsellProductIds = (upsellProductIds || []).filter(
        (id) => id && id.trim() !== "",
      );

      if (validUpsellProductIds.length === 0) return;

      const data = await fetchProducts(validUpsellProductIds);
      if (data && data.nodes && Array.isArray(data.nodes)) {
        const formattedProducts = formatProductsData(data.nodes);
        setProducts(formattedProducts);
      }
    }
  };

  // Process product-level metafield data
  const processProductMetafield = async (upsellProductSettings) => {
    if (!upsellProductSettings) return;

    setShowUpsell(true);

    // Filter out empty product IDs
    const validUpsellProductIds = (
      upsellProductSettings.upsellProducts || []
    ).filter((id) => id && id.trim() !== "");

    if (validUpsellProductIds.length === 0) return;

    // console.log("validUpsellProductIds:", validUpsellProductIds);

    const data = await fetchProducts(validUpsellProductIds);
    if (data && data.nodes) {
      const formattedProducts = formatProductsData(data.nodes);
      // console.log("formattedProducts:", formattedProducts);
      setProducts(formattedProducts);
    }
  };

  // Add product to cart
  const handleAdd = async (productId) => {
    if (!productId) return;

    try {
      // First, we need to get the variant ID for the product
      const { data } = await query(
        `query {    
          node(id: "${productId}") {
            ... on Product {
              title 
              handle
              variants(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }`,
      );

      if (data?.node?.variants?.edges?.length > 0) {
        const variantId = data.node.variants.edges[0].node.id;

        // Add the product to the cart
        const result = await applyCartLinesChange({
          type: "addCartLine",
          merchandiseId: variantId,
          quantity: 1,
        });

        if (result.type === "error") {
          console.error("Error adding product to cart:", result.message);
        }
      } else {
        console.error("No variants found for product");
      }
    } catch (error) {
      console.error("Error adding product to cart:", error);
    }
  };

  // Main effect to fetch and process data
  useEffect(() => {
    async function checkAndFetchProducts() {
      try {
        const upsellSettings = parseMetafieldData(shopMetafield);
        const upsellProductSettings = parseMetafieldData(productMetafield);

        // console.log("upsellSettings:", upsellSettings);
        // console.log("upsellProductSettings:", upsellProductSettings);

        // Check if either metafield data source is available
        // if (upsellSettings) {
        //   await processShopMetafield(upsellSettings);
        // } else if (upsellProductSettings) {
        //   await processProductMetafield(upsellProductSettings);
        // }
        if (upsellProductSettings) {
          await processProductMetafield(upsellProductSettings);
        } else if (upsellSettings) {
          await processShopMetafield(upsellSettings);
        }
      } catch (error) {
        console.error("Error processing upsell data:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAndFetchProducts();
  }, [query, shopMetafield, productMetafield, cartLines]);

  // Loading state
  // if (loading) {
  //   return (
  //     <BlockStack spacing="loose">
  //       <Text>Loading products...</Text>
  //     </BlockStack>
  //   );
  // }

  // Don't show anything if no upsells should be displayed
  if (!showUpsell || products.length === 0) {
    return null;
  }

  // const layoutSelectted = "Default";

  console.log("products & set:", products);

  // Render upsell products
  return (
    <BlockStack>
      <Text size="large" level={2} emphasis="bold">
        {heading || "You may also like"}
      </Text>
      {layout === "column" ? (
        <ColumnLayout
          handleAdd={handleAdd}
          products={products}
          buttonAppearance={buttonAppearance}
          buttonText={buttonText}
          buttonStyle={buttonStyle}
          buttonPosition={buttonPosition}
        />
      ) : (
        <>
          <BlockStack border="base" cornerRadius="base" padding="base">
            {products.map((product) => (
              <View
                key={product.id}
                borderRadius="base"
                alignment="center"
                direction="horizontal"
              >
                <InlineLayout spacing="base" columns={["12%", "fill"]}>
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
                  <InlineLayout
                    blockAlignment="center"
                    spacing="none"
                    columns={["fill", "70px"]}
                  >
                    <BlockLayout blockAlignment="center" spacing="none">
                      {/* <View> */}
                      <Heading size="medium">{product.title}</Heading>
                      <Text size="small" appearance="subdued">
                        {product.price}
                      </Text>
                      {/* </View> */}
                    </BlockLayout>
                    <Button
                      appearance={buttonAppearance || "monochrome"}
                      kind={buttonStyle || "secondary"}
                      onPress={() => handleAdd(product.id)}
                    >
                      {buttonText || "ADD"}
                    </Button>
                  </InlineLayout>
                </InlineLayout>
              </View>
            ))}
          </BlockStack>
        </>
      )}
    </BlockStack>
  );
}

function ColumnLayout({ products, handleAdd, buttonAppearance, buttonText, buttonStyle, buttonPosition }) {

  return (
    <InlineLayout
      columns={["fill", "fill"]}
      spacing="base"
      // border="base"
      // padding="base"
      // borderRadius="base"
    >
      {products.map((product) => (
        <View key={product.id}>
          <BlockStack spacing="base">
            <View border="base" cornerRadius="base">
              <Image
                source={product.image}
                accessibilityLabel={product.title}
                aspectRatio={1} // Adjust as needed
                fit="cover"
                cornerRadius="base"
              />
            </View>
            <BlockStack maxBlockSize={`100%`} spacing="none">
              <Text size="base" emphasis="bold">
                {product.title}
              </Text>
              <Text appearance="subdued" strikethrough>
                {product.price}
              </Text>
            </BlockStack>
            <Button
              appearance={buttonAppearance || "monochrome"}
              kind={buttonStyle || "primary"}
              onPress={() => handleAdd(product.id)} // This now correctly calls the passed handleAdd
            >
              {buttonText || "ADD"}
            </Button>
          </BlockStack>
        </View>
      ))}
    </InlineLayout>
  );
}
