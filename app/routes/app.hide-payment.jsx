// Import necessary components and libraries from Shopify Polaris UI framework
import {
  Card,
  TextField,
  Select,
  Button,
  Icon,
  Page,
  Text,
  Box,
  Grid,
  Autocomplete,
  Modal,
  Listbox,
  Checkbox,
} from "@shopify/polaris";

// Import custom icons for the application
import { DeleteIcon, SearchIcon } from "@shopify/polaris-icons";

// Import React hooks and utilities
import { useCallback, useMemo, useState } from "react";

// Import authentication and API utility functions from shopify.server
import { authenticate } from "../shopify.server";

// Import Remix Run hooks and utilities for handling server-side actions and data fetching
import {
  Form,
  json,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";

// Loader function to fetch shop data from Shopify API
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  try {
    // Query the Shopify GraphQL API to get the shop ID
    const response = await admin.graphql(`
      query{
        shop{
          id
        }
      }
    `);
    const shop = await response.json();

    // Return the shop ID as part of the loader data
    return { id: shop.data.shop.id };
  } catch (error) {
    // Handle errors by returning an error message
    return { message: "owner not found", error: error };
  }
}

// Action function to handle form submissions and update Shopify metafields
export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  // Extract form data submitted via POST request
  const formData = await request.formData();
  console.log("formData->", formData);

  // Parse individual form fields
  const shopId = formData.get("id");
  const customizeName = formData.get("customizeName");
  const paymentMethod = formData.get("paymentMethod");

  // Extract all conditions dynamically from the submitted form data
  const conditionTypes = formData.getAll("conditionType");
  const greaterSmaller = formData.getAll("greaterSmaller");
  const cartTotals = formData.get("cartTotal");
  const selectedProducts = formData.getAll("selectedProducts");
  const countries = formData.get("country");

  // Initialize arrays for different types of conditions
  const cartTotalConditions = [];
  const productConditions = [];
  const shippingCountryConditions = [];

  // Categorize conditions based on their type
  for (let i = 0; i < conditionTypes.length; i++) {
    const conditionType = conditionTypes[i];
    const greaterOrSmall = greaterSmaller[i];
    const amount = Number(cartTotals) || 0;
    const products = selectedProducts[i] ? selectedProducts[i].split(",") : [];
    const country = countries;

    // Assign conditions to respective categories
    switch (conditionType) {
      case "cart_total":
        cartTotalConditions.push({
          greaterOrSmall,
          amount,
        });
        break;
      case "product":
        productConditions.push({
          greaterOrSmall,
          products,
        });
        break;
      case "shipping_country":
        shippingCountryConditions.push({
          greaterOrSmall,
          country,
        });
        break;
      default:
        console.warn(`Unknown condition type: ${conditionType}`);
        break;
    }
  }

  // Construct the configuration object with categorized conditions
  const config = JSON.stringify({
    shopId: shopId,
    customizeName: customizeName,
    paymentMethod: paymentMethod,
    conditions: {
      cartTotal: cartTotalConditions,
      products: productConditions,
      shippingCountry: shippingCountryConditions,
    },
  });

  const configJson = {
    shopId: shopId,
    customizeName: customizeName,
    paymentMethod: paymentMethod,
    conditions: {
      cartTotal: cartTotalConditions,
      products: productConditions,
      shippingCountry: shippingCountryConditions,
    },
  };

  console.log("configJson:", configJson);
  console.log("condition:", configJson.conditions);

  try {
    // Send a GraphQL mutation to update Shopify metafields with the configuration
    const response = await admin.graphql(
      `#graphql
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              key: "hide_payment",
              namespace: "cart",
              ownerId: shopId,
              type: "json",
              value: config,
            },
          ],
        },
      }
    );

    const data = await response.json();

    // Return the response data along with the configuration object
    return json(data);
  } catch (error) {
    // Handle errors by returning an error response
    return json({ error: error.message }, { status: 500 });
  }
}

// Main component rendering the page
export default function CustomizationSection() {
  const { id } = useLoaderData(); // Fetch shop ID from loader data
  const dataa = useActionData(); // Fetch action data after form submission

  console.log("data", dataa);

  return (
    <Page
      backAction={{ content: "Settings", url: "#" }} // Back button navigation
      title="Hide Payment Method" // Page title
    >
      <Body id={id} /> {/* Render the main form body */}
    </Page>
  );
}

// Component responsible for rendering the form fields and interactions
export function Body({ id }) {
  const [parentValue, setParentValue] = useState(""); // Parent value state
  const [customizeName, setCustomizeName] = useState("No name.."); // Customization name state
  const handleChildValue = (childValue) => {
    setParentValue(childValue); // Handle child value change
  };

  // Modal logic for selecting products
  const [modalActive, setModalActive] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentConditionIndex, setCurrentConditionIndex] = useState(null); // Track the active condition index

  // Predefined list of products for selection
  const products = useMemo(
    () => [
      {
        id: "gid://shopify/ProductVariant/46322014617839",
        title: "The Compare at Price Snowboard",
      },
      // Additional product entries can be added here
    ],
    []
  );

  const toggleModal = useCallback(() => {
    setModalActive((active) => !active); // Toggle modal visibility
  }, []);

  const handleSelectProduct = useCallback((id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ); // Add or remove selected products
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (currentConditionIndex !== null) {
      setConditions((prevConditions) =>
        prevConditions.map((c, i) =>
          i === currentConditionIndex
            ? { ...c, selectedProducts: selectedProducts }
            : c
        )
      );
    }
    toggleModal(); // Confirm product selection and close modal
  }, [currentConditionIndex, selectedProducts, toggleModal]);

  const selectedProductTitles = products
    .filter((product) => selectedProducts.includes(product.id))
    .map((product) => product.title)
    .join(", "); // Display selected product titles

  // State to manage the list of conditions
  const [conditions, setConditions] = useState([
    {
      discountType: "cart_total",
      greaterOrSmall: "greater_than",
      amount: 0,
      selectedProducts: [],
      country: "in",
    },
  ]);

  // Function to add a new condition
  const handleAddCondition = () => {
    const newDiscountType = "cart_total"; // Default new condition type
    if (
      conditions.some((condition) => condition.discountType === newDiscountType)
    ) {
      alert("This condition type already exists."); // Prevent duplicate condition types
      return;
    }
    setConditions((prevConditions) => [
      ...prevConditions,
      {
        discountType: newDiscountType,
        greaterOrSmall: "greater_than",
        amount: 0,
        selectedProducts: [],
        country: "in",
      },
    ]);
  };

  // Function to remove a condition
  const handleRemoveCondition = (index) => {
    setConditions((prevConditions) =>
      prevConditions.filter((_, i) => i !== index)
    );
  };

  // Function to handle changes in condition fields
  const handleConditionChange = (index, field, value) => {
    setConditions((prevConditions) =>
      prevConditions.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      )
    );
  };

  const [cartAmount, setCartAmount] = useState(0); // Cart amount state

  // Function to open modal and set current condition index
  const openModalForCondition = (index) => {
    setCurrentConditionIndex(index);
    setSelectedProducts(conditions[index].selectedProducts);
    toggleModal();
  };

  // Validation function
  const fetcher = useFetcher();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Validate customization name
    if (!customizeName || customizeName.trim() === "") {
      newErrors.customizeName = "Customization name is required";
    } else if (customizeName === "No name..") {
      newErrors.customizeName = "Please enter a valid name";
    }

    // Validate payment method
    if (!parentValue || parentValue.trim() === "") {
      newErrors.paymentMethod = "Payment method is required";
    }

    // Validate conditions
    if (conditions.length === 0) {
      newErrors.conditions = "At least one condition is required";
    } else {
      conditions.forEach((condition, index) => {
        if (condition.discountType === "cart_total" && !cartAmount) {
          newErrors[`cartAmount`] = "Cart amount is required";
        }
        if (
          condition.discountType === "product" &&
          condition.selectedProducts.length === 0
        ) {
          newErrors[`products`] = "At least one product must be selected";
        }
        if (
          condition.discountType === "shipping_country" &&
          !condition.country
        ) {
          newErrors[`country`] = "Country is required";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("id", id);
    formData.append("customizeName", customizeName);
    formData.append("paymentMethod", parentValue);

    // Add conditions
    conditions.forEach((condition, index) => {
      formData.append(`conditionType`, condition.discountType);
      formData.append(`greaterSmaller`, condition.greaterOrSmall);
      if (condition.discountType === "cart_total") {
        formData.append(`cartTotal`, cartAmount);
      } else if (condition.discountType === "product") {
        formData.append(
          `selectedProducts`,
          condition.selectedProducts.join(",")
        );
      } else if (condition.discountType === "shipping_country") {
        formData.append(`country`, condition.country);
      }
    });

    try {
      await fetcher.submit(formData, {
        method: "POST",
        action: ".", // Replace with actual route
      });

      // Handle successful submission
      if (fetcher.data?.error) {
        throw new Error(fetcher.data.error);
      }

      // Reset form or show success message
      if (fetcher.state === "idle" && !fetcher.data?.error) {
        // Optional: Reset form here
        // setCustomizeName("");
        // setParentValue("");
        // setConditions([...]);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrors({
        ...errors,
        form: "Failed to save. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Grid>
      <Grid.Cell columnSpan={{ md: 12, lg: 8, xl: 8 }}>
        <Card
          style={{
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
          }}
        >
          <Form method="POST" onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={id} />

            <div className="formdetails">
              {/* Customization Name */}
              <div>
                <label style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  Customization Name
                </label>
                <TextField
                  placeholder="Example: Hide Cash on Delivery (COD) For Large Orders"
                  style={{ width: "100%" }}
                  name="customizeName"
                  value={customizeName}
                  onChange={(e) => {
                    setCustomizeName(e);
                    if (errors.customizeName) {
                      setErrors((prev) => ({
                        ...prev,
                        customizeName: undefined,
                      }));
                    }
                  }}
                  error={errors.customizeName}
                />
                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "12px",
                    color: "#6B7280",
                  }}
                >
                  This is not visible to the customer
                </p>
              </div>

              {/* Select Payment Method */}
              <div style={{ marginTop: "20px" }}>
                <label style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  Select Payment Method
                </label>
                <AutocompleteExample
                  onValueChange={(value) => {
                    handleChildValue(value);
                    if (errors.paymentMethod) {
                      setErrors((prev) => ({
                        ...prev,
                        paymentMethod: undefined,
                      }));
                    }
                  }}
                />
                {errors.paymentMethod && (
                  <div
                    style={{ color: "red", fontSize: "12px", marginTop: "5px" }}
                  >
                    {errors.paymentMethod}
                  </div>
                )}
                <input type="hidden" name="paymentMethod" value={parentValue} />
                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "12px",
                    color: "#6B7280",
                  }}
                >
                  Don't see your payment method? You can type it manually and
                  press Enter to add it to the list.
                </p>
              </div>

              {/* Condition Builder */}
              <div style={{ marginTop: "20px" }}>
                {errors.conditions && (
                  <div
                    style={{
                      color: "red",
                      fontSize: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    {errors.conditions}
                  </div>
                )}
                {conditions.map((condition, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "self-start",
                      gap: "10px",
                      marginBottom: "20px",
                    }}
                  >
                    {/* Dropdown 1 */}
                    <div className="" style={{ flexGrow: 1 }}>
                      <Select
                        options={[
                          { label: "Cart Total", value: "cart_total" },
                          { label: "Product", value: "product" },
                          {
                            label: "Shipping Country",
                            value: "shipping_country",
                          },
                        ]}
                        placeholder="Select a field"
                        style={{ flex: 1 }}
                        value={condition.discountType}
                        onChange={(value) =>
                          handleConditionChange(index, "discountType", value)
                        }
                        name={`conditionType`}
                      />
                    </div>

                    {/* Condition-specific fields */}
                    {condition.discountType === "cart_total" && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <Select
                          options={[
                            { label: "is greater than", value: "greater_than" },
                            { label: "is less than", value: "less_than" },
                          ]}
                          placeholder="Select a condition"
                          style={{ flex: 1 }}
                          value={condition.greaterOrSmall}
                          onChange={(value) =>
                            handleConditionChange(
                              index,
                              "greaterOrSmall",
                              value
                            )
                          }
                          name={`greaterSmaller`}
                        />
                        <TextField
                          placeholder="100"
                          type="number"
                          value={cartAmount}
                          onChange={(value) => {
                            setCartAmount(value);
                            if (errors[`cartAmount`]) {
                              setErrors((prev) => ({
                                ...prev,
                                [`cartAmount`]: undefined,
                              }));
                            }
                          }}
                          style={{ flex: 1 }}
                          name="cartTotal"
                          error={errors[`cartAmount`]}
                        />
                      </div>
                    )}

                    {condition.discountType === "product" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <Select
                          options={[{ label: "is", value: "is" }]}
                          style={{ flex: 1 }}
                          value={condition.greaterOrSmall}
                          onChange={(value) =>
                            handleConditionChange(
                              index,
                              "greaterOrSmall",
                              value
                            )
                          }
                          name={`greaterSmaller`}
                        />
                        <input
                          type="hidden"
                          label="Selected Products"
                          value={condition.selectedProducts.join(", ")}
                          name={`selectedProducts`}
                        />
                        <Button
                          onClick={() => openModalForCondition(index)}
                          disabled={isSubmitting}
                        >
                          Select Products
                        </Button>
                        {errors[`products`] && (
                          <div style={{ color: "red", fontSize: "12px" }}>
                            {errors[`products`]}
                          </div>
                        )}
                      </div>
                    )}

                    {condition.discountType === "shipping_country" && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <Select
                          options={[{ label: "is", value: "is" }]}
                          style={{ flex: 1 }}
                          value={condition.greaterOrSmall}
                          onChange={(value) =>
                            handleConditionChange(
                              index,
                              "greaterOrSmall",
                              value
                            )
                          }
                          name={`greaterSmaller`}
                        />
                        <Select
                          options={[
                            { label: "IN", value: "in" },
                            { label: "CN", value: "cn" },
                          ]}
                          style={{ flex: 1 }}
                          value={condition.country}
                          onChange={(value) => {
                            handleConditionChange(index, "country", value);
                            if (errors[`country`]) {
                              setErrors((prev) => ({
                                ...prev,
                                [`country`]: undefined,
                              }));
                            }
                          }}
                          name={`country`}
                          error={errors[`country`]}
                        />
                      </div>
                    )}

                    {/* Trash Icon */}
                    <Button
                      onClick={() => handleRemoveCondition(index)}
                      disabled={isSubmitting}
                    >
                      <Icon source={DeleteIcon} color="critical" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Condition Button */}
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleAddCondition}
                  disabled={isSubmitting}
                >
                  +Add condition
                </Button>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <Button
                  submit
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                >
                  Submit
                </Button>
              </div>
            </div>
          </Form>

          {/* Product Model */}
          <Modal
            open={modalActive}
            onClose={toggleModal}
            title="Select Products"
            primaryAction={{
              content: "Confirm",
              onAction: handleConfirmSelection,
            }}
            secondaryActions={{
              content: "Cancel",
              onAction: toggleModal,
            }}
          >
            <Modal.Section>
              <Listbox>
                {products.map((product) => (
                  <Listbox.Option
                    key={product.id}
                    value={product.id}
                    selected={selectedProducts.includes(product.id)}
                    onClick={() => handleSelectProduct(product.id)}
                  >
                    <Checkbox
                      label={product.title}
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </Listbox.Option>
                ))}
              </Listbox>
            </Modal.Section>
          </Modal>
        </Card>
      </Grid.Cell>
      <Grid.Cell columnSpan={{ md: 12, lg: 4, xl: 4 }}>
        <Card roundedAbove="sm">
          <Text as="h2" variant="headingSm">
            Online store dashboard
          </Text>
          <Box paddingBlockStart="200">
            <Text as="p" variant="bodyMd">
              View a summary of your online store’s performance.
            </Text>
          </Box>
        </Card>
      </Grid.Cell>
    </Grid>
  );
}

// Custom autocomplete component
export function AutocompleteExample({ onValueChange }) {
  const deselectedOptions = useMemo(
    () => [{ value: "cash_on_delivery", label: "Cash On Delivery" }],
    []
  );

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(deselectedOptions);

  const updateText = useCallback(
    (value) => {
      setInputValue(value);
      if (value === "") {
        setOptions(deselectedOptions);
        return;
      }
      const filterRegex = new RegExp(value, "i");
      const resultOptions = deselectedOptions.filter((option) =>
        option.label.match(filterRegex)
      );
      setOptions(resultOptions);
    },
    [deselectedOptions]
  );

  const updateSelection = useCallback(
    (selected) => {
      const selectedValue = selected.map((selectedItem) => {
        const matchedOption = options.find((option) => {
          return option.value.match(selectedItem);
        });
        return matchedOption && matchedOption.label;
      });
      setSelectedOptions(selected);
      setInputValue(selectedValue[0] || "");
      onValueChange(selectedValue[0] || "");
    },
    [options, onValueChange]
  );

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      value={inputValue}
      prefix={<Icon source={SearchIcon} tone="base" />}
      placeholder="Search"
      autoComplete="off"
    />
  );

  return (
    <div>
      <Autocomplete
        options={options}
        selected={selectedOptions}
        onSelect={updateSelection}
        textField={textField}
      />
    </div>
  );
}