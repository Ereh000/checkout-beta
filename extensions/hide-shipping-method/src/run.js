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

  console.log("Response deliveryGroups", input.cart.deliveryGroups);

  const operations = input.cart.deliveryGroups.flatMap(group =>
    group.deliveryOptions
      .filter(option => option.title == "Standard") // Replace with the method to hide
      .map(option => ({
        hide: {
          deliveryOptionHandle: option.handle,
        },
      }))
  );

  return { operations };
}
