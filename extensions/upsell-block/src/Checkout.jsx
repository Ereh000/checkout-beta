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
  // State management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);
  
  // Hooks
  const { query, applyCartLinesChange } = useApi();
  const cartLines = useCartLines();
  const metafields = useAppMetafields();

  console.log("cartLines:", cartLines);
  console.log("metafields:", metafields);

  // Extract metafield data
  const metafieldData = metafields.find(
    (metafield) => 
      metafield.target.type === "shop" && 
      metafield.metafield.namespace === "settings" && 
      metafield.metafield.key === "upsell"
  )?.metafield.value;

  const metafieldDataProduct = metafields.find(
    (metafield) => 
      metafield.target.type === "product" && 
      metafield.metafield.namespace === "settings" && 
      metafield.metafield.key === "upsell"
  )?.metafield.value;

  console.log("metafieldData:", metafieldData);
  console.log("metafieldDataProduct:", metafieldDataProduct);

  // Helper function to format product IDs for GraphQL query
  const formatProductIds = (productIds) => {
    return productIds.map(id => {
      if (id.startsWith('gid://')) {
        return `"${id}"`;
      }
      return `"gid://shopify/Product/${id}"`;
    }).join(',');
  };

  // Helper function to format products data
  const formatProductsData = (nodes) => {
    return nodes.map((product) => ({
      id: product.id,
      title: product.title,
      price: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: product.priceRange.minVariantPrice.currencyCode,
      }).format(product.priceRange.minVariantPrice.amount),
      image: product.featuredImage?.url,
    }));
  };

  // Fetch products based on metafield data
  const fetchProducts = async (productIds) => {
    const productIdsQuery = formatProductIds(productIds);
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
    return data;
  };

  // Process shop-level metafield data
  const processShopMetafield = async (upsellSettings) => {
    console.log("upsellSettings:", upsellSettings);
    console.log("upsellSettings-> selectedProducts:", upsellSettings.selectedProducts);

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
      console.log("cartProductIds:", cartProductIds);

      const upsellProductsSettings = typeof metafieldDataProduct === 'string'
        ? JSON.parse(metafieldDataProduct)
        : metafieldDataProduct;

      console.log("upsellProductsSettings:", upsellProductsSettings);
      console.log("upsellProductsSettings-> selectedProducts:", upsellProductsSettings);
      
      shouldShowUpsell = cartProductIds.some(id =>
        upsellSettings.selectedProducts.includes(id)
      );
      console.log("shouldShowUpsell", shouldShowUpsell);
    }

    setShowUpsell(shouldShowUpsell);
    console.log("showUpsell", showUpsell);

    if (shouldShowUpsell) {
      setShowUpsell(true);
      console.log("yes show upsell");
      
      // Filter out empty product IDs
      const validUpsellProductIds = upsellSettings.upsellProducts.filter(id => id && id.trim() !== "");
      console.log("validUpsellProductIds:", validUpsellProductIds);

      if (validUpsellProductIds.length === 0) {
        return;
      }

      const data = await fetchProducts(validUpsellProductIds);
      if (data && data.nodes) {
        const formattedProducts = formatProductsData(data.nodes);
        console.log("formattedProducts:", formattedProducts);
        setProducts(formattedProducts);
      }
    }
  };

  // Process product-level metafield data
  const processProductMetafield = async (upsellProductSettings) => {
    console.log("upsellProductSettings:", upsellProductSettings);
    setShowUpsell(true);

    // Filter out empty product IDs
    const validUpsellProductIds = upsellProductSettings.upsellProducts?.filter(id => id && id.trim() !== "") || [];
    console.log("validUpsellProductIds:", validUpsellProductIds);

    if (validUpsellProductIds.length === 0) {
      return;
    }

    const data = await fetchProducts(validUpsellProductIds);
    if (data && data.nodes) {
      const formattedProducts = formatProductsData(data.nodes);
      console.log("formattedProducts:", formattedProducts);
      setProducts(formattedProducts);
    }
  };

  // Main effect to fetch and process data
  useEffect(() => {
    async function checkAndFetchProducts() {
      try {
        // Check if either metafield data source is available
        if (metafieldData) {
          const upsellSettings = typeof metafieldData === 'string'
            ? JSON.parse(metafieldData)
            : metafieldData;
          
          await processShopMetafield(upsellSettings);
        } else if (metafieldDataProduct) {
          const upsellProductSettings = typeof metafieldDataProduct === 'string'
            ? JSON.parse(metafieldDataProduct)
            : metafieldDataProduct;
          
          await processProductMetafield(upsellProductSettings);
        } else {
          console.log("No metafield data available (neither shop nor product)");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error processing upsell data:", error);
        setLoading(false);
      }
    }

    checkAndFetchProducts();
  }, [query, metafieldData, metafieldDataProduct, cartLines]);

  // Add product to cart
  async function handleAdd(productId) {
    console.log(`Adding product ${productId} to cart`);

    try {
      // First, we need to get the variant ID for the product
      const { data } = await query(
        `query {
          node(id: "${productId}") {
            ... on Product {
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }`
      );

      if (data?.node?.variants?.edges?.length > 0) {
        const variantId = data.node.variants.edges[0].node.id;
        console.log(`Adding variant ${variantId} to cart`);

        // Add the product to the cart
        const result = await applyCartLinesChange({
          type: 'addCartLine',
          merchandiseId: variantId,
          quantity: 1
        });

        if (result.type === 'error') {
          console.error('Error adding product to cart:', result.message);
        } else {
          console.log('Product added to cart successfully');
        }
      } else {
        console.error('No variants found for product');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  }

  // Loading state
  if (loading) {
    return (
      <BlockStack spacing="loose">
        <Text>Loading products...</Text>
      </BlockStack>
    );
  }

  // Don't show anything if no upsells should be displayed
  if (!showUpsell || products.length === 0) {
    return null;
  }

  console.log("products:", products);

  // Render upsell products
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