// @ts-check

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

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  console.log("paymentMethod:", input.paymentMethods);

  // Map over payment methods and modify their names
  const updatedMethods = input.paymentMethods.map((method) => {
    // Example: Rename "Cash On Delivery" to "Cash On Delivery 20%"
    if (method.name === "Cash on Delivery (COD)") {
      console.log("method->", method.name);
      return {
        ...method,
        name: "Cash On Delivery 20%",
      };
    }
    return method;
  });

  // Return the updated payment methods
  return {
    operations: updatedMethods.map((method) => ({
      rename: {
        paymentMethodId: method.id,
        name: method.name,
      },
    })),
  };
}
