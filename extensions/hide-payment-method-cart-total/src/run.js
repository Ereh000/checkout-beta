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

export function run(input) {
  const cart = input.cart;
  const metafield = input.shop.metafield;

  const parsed = JSON.parse(metafield.value);

  console.log('metafield', parsed)
  // let cartTotall = parsed.cartTotal;

  // Configuration values - replace with your store's specific requirements
  const EXCLUDED_PRODUCT_IDS = [8915385155823, 8915385123055]; // Product IDs to exclude
  const EXCLUDED_COUNTRIES = ["US", "CA"]; // Country codes to exclude
  const MIN_CART_TOTAL = parsed.cartTotal; // Minimum cart total in store currency
  // const MIN_CART_TOTAL = 1000; // Minimum cart total in store currency
  // const EXCLUDED_CUSTOMER_TAGS = ["wholesale", "vip"]; // Customer tags to exclude

  // Conditions -------------

  // Condition 1: Cart total is less than minimum
  const cartTotal = parseFloat(input.cart.cost.totalAmount.amount ?? "0.0");
  const totalCondition = cartTotal < MIN_CART_TOTAL;

  // Condition 2: Cart contains excluded products
  const productCondition = input.cart.lines
    .filter((line) => line.merchandise.__typename === "ProductVariant")
    .map((line) => ({
      productVariant: {
        id: line.merchandise.id,
      },
    }))
    .some((line) => EXCLUDED_PRODUCT_IDS.includes(line.productVariant.id));

  // Condition 3: Shipping address is from excluded country
  const countryCondition = cart.deliveryGroups.some(
    (group) =>
      group.deliveryAddress?.countryCode &&
      EXCLUDED_COUNTRIES.includes(group.deliveryAddress.countryCode),
  );

  // Condition 4: Customer has excluded tag

  // will do later.........

  // Conditions ------------- Ends

  console.log(
    "totalCondition",
    totalCondition,
    "productCondition",
    productCondition,
    "countryCondition",
    countryCondition,
  );

  const shouldHideCOD = totalCondition || productCondition || countryCondition;

  // Get the cart total from the function input, and return early if it's below 100
  if (!shouldHideCOD) {
    // You can use STDERR for debug logs in your function
    console.error(
      "Cart total is not high enough, no need to hide the payment method.",
    );
    return NO_CHANGES;
  }

  // Find the payment method to hide
  const hidePaymentMethod = input.paymentMethods.find((method) =>
    method.name.includes("Cash on Delivery"),
  );

  if (!hidePaymentMethod) {
    return NO_CHANGES;
  }

  // The @shopify/shopify_function package applies JSON.stringify() to your function result
  // and writes it to STDOUT
  return {
    operations: [
      {
        hide: {
          paymentMethodId: hidePaymentMethod.id,
        },
      },
    ],
  };
}
