// @ts-check

// Use JSDoc annotations for type safety
/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

// The configured entrypoint for the 'purchase.payment-customization.run' extension target
/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */

// metafields response example value ----------
// configJson: {
//   shopId: 'gid://shopify/Shop/74655760623',
//   customizeName: 'New Name',
//   paymentMethod: 'Cash On Delivery',
//   condition: {
//    cartTotal: [ { greaterOrSmall: 'greater_than', amount: 0 } ],
//    products: [ { greaterOrSmall: 'is', products: [Array] } ],
//    shippingCountry: [ { greaterOrSmall: 'is', country: 'in' } ]
//   }
// }

export function run(input) {
  const cart = input.cart;
  const metafield = input.shop.metafield;

  // Return early if no metafield is found
  if (!metafield?.value) {
    return NO_CHANGES;
  }

  try {
    const parsed = JSON.parse(metafield.value);
    console.log("metafield", parsed);

    // Extract configuration from metafield
    const conditions = parsed.conditions || {};
    const paymentMethod = parsed.paymentMethod;

    // Initialize conditions with defaults if not provided
    const metaCartTotal = conditions.cartTotal?.[0] || {};
    const metaProducts = conditions.products?.[0] || {};
    const metaShippingCountry = conditions.shippingCountry?.[0] || {};

    // Set configuration values from metafield
    const MIN_CART_TOTAL =
      metaCartTotal.amount && parseFloat(metaCartTotal.amount);
    const cartTotalComparison = metaCartTotal.greaterOrSmall || "greater_than";

    const EXCLUDED_PRODUCT_IDS = [
      "gid://shopify/ProductVariant/46322014617839",
      "gid://shopify/ProductVariant/46322014617839",
    ];
    // const EXCLUDED_PRODUCT_IDS = metaProducts.products || [];
    const productsComparison = metaProducts.greaterOrSmall || "is";

    const EXCLUDED_COUNTRIES = metaShippingCountry.country
      ? [metaShippingCountry.country]
      : [];
    const countryComparison = metaShippingCountry.greaterOrSmall || "is";

    // Get current cart total
    const cartTotal = parseFloat(input.cart.cost.totalAmount.amount ?? "0.0");

    // Condition 1: Cart total check
    let totalCondition = false;
    if (cartTotalComparison === "greater_than") {
      totalCondition = cartTotal <= MIN_CART_TOTAL;
    } else if (cartTotalComparison === "less_than") {
      totalCondition = cartTotal >= MIN_CART_TOTAL;
    }

    // Condition 2: Products check
    let productCondition = false;
    if (productsComparison === "is") {
      productCondition = input.cart.lines
        .filter((line) => line.merchandise.__typename === "ProductVariant")
        .map((line) => ({
          productVariant: {
            id: line.merchandise.id,
          },
        }))
        .some((line) => EXCLUDED_PRODUCT_IDS.includes(line.productVariant.id));
    } else if (productsComparison === "is_not") {
      productCondition = !input.cart.lines
        .filter((line) => line.merchandise.__typename === "ProductVariant")
        .some((line) =>
          EXCLUDED_PRODUCT_IDS.includes(line.merchandise.product.id),
        );
    }

    // Condition 3: Shipping country check
    let countryCondition = false;
    if (countryComparison === "is") {
      countryCondition = cart.deliveryGroups.some(
        (group) =>
          group.deliveryAddress?.countryCode &&
          EXCLUDED_COUNTRIES.includes(group.deliveryAddress.countryCode),
      );
    } else if (countryComparison === "is_not") {
      countryCondition = !cart.deliveryGroups.some(
        (group) =>
          group.deliveryAddress?.countryCode &&
          EXCLUDED_COUNTRIES.includes(group.deliveryAddress.countryCode),
      );
    }

    console.log(
      "Conditions:",
      "totalCondition",
      totalCondition,
      "productCondition",
      productCondition,
      "countryCondition",
      countryCondition,
      "MIN_CART_TOTAL",
      MIN_CART_TOTAL,
      "paymentMethod",
      paymentMethod,
    );

    const shouldHideCOD =
      totalCondition || countryCondition || productCondition;

    if (!shouldHideCOD) {
      console.log("No conditions met to hide the payment method.");
      return NO_CHANGES;
    }

    // Find the payment method to hide
    const hidePaymentMethod = input.paymentMethods.find((method) =>
      method.name.includes("Cash on Delivery"),
    );

    if (!hidePaymentMethod) {
      return NO_CHANGES;
    }

    return {
      operations: [
        {
          hide: {
            paymentMethodId: hidePaymentMethod.id,
          },
        },
      ],
    };
  } catch (error) {
    console.error("Error parsing metafield or processing conditions:", error);
    return NO_CHANGES;
  }
}
