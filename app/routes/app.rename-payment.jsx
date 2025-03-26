// Import necessary components and libraries from Shopify Polaris UI framework
import {
  Card,
  TextField,
  Button,
  Page,
  Text,
  Box,
  Grid,
  Autocomplete,
} from "@shopify/polaris";

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

/**
 * Loader function to fetch shop data from Shopify API.
 * This function is called on the server side to load data before rendering the page.
 */
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request); // Authenticate the admin user
  try {
    // Query the Shopify GraphQL API to get the shop ID
    const response = await admin.graphql(`
      query {
        shop {
          id
        }
      }
    `);
    const shop = await response.json(); // Parse the JSON response
    // Return the shop ID as part of the loader data
    return { id: shop.data.shop.id };
  } catch (error) {
    // Handle errors by returning an error message
    return { message: "owner not found", error: error };
  }
}

/**
 * Action function to handle form submissions and update Shopify metafields.
 * This function is called when a form is submitted via POST request.
 */
export async function action({ request }) {
  const { admin } = await authenticate.admin(request); // Authenticate the admin user
  // Extract form data submitted via POST request
  const formData = await request.formData();
  console.log("formData->", formData);

  // Parse individual form fields
  const shopId = formData.get("id");
  const customizeName = formData.get("customizeName");
  const paymentMethod = formData.get("paymentMethod");
  const newName = formData.get("new_name");

  // Construct the configuration object with categorized conditions
  const config = JSON.stringify({
    shopId: shopId,
    customizeName: customizeName,
    paymentMethod: paymentMethod,
    newName: newName,
  });

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
              key: "payment_method",
              namespace: "rename",
              ownerId: shopId,
              type: "json",
              value: config,
            },
          ],
        },
      },
    );
    const data = await response.json(); // Parse the JSON response
    return data; // Return the updated metafield data
  } catch (error) {
    // Handle errors by returning an error response
    return json({ error: error.message }, { status: 500 });
  }
}

/**
 * Main component rendering the page.
 * This is the default export and represents the main page of the application.
 */
export default function CustomizationSection() {
  const data = useActionData(); // Fetch action data after form submission
  const { id } = useLoaderData(); // Fetch shop ID from loader data
  console.log("data->", data);

  return (
    <Page
      backAction={{ content: "Settings", url: "#" }} // Back button navigation
      title="Payment Method Name" // Page title
    >
      <Body id={id} /> {/* Render the main form body */}
    </Page>
  );
}

/**
 * Component responsible for rendering the form fields and interactions.
 * This component handles user input, validation, and form submission.
 */
export function Body({ id }) {
  const [parentValue, setParentValue] = useState(""); // State for selected payment method
  const [customizeName, setCustomizeName] = useState(""); // State for customization name
  const [newName, setNewName] = useState(""); // State for new payment method name
  const fetcher = useFetcher(); // Utility for submitting forms and fetching data
  const [errors, setErrors] = useState({}); // State for form validation errors

  /**
   * Function to validate the form inputs.
   * Ensures that required fields are filled and meet specific criteria.
   */
  const validateForm = () => {
    const newErrors = {};
    if (!customizeName.trim()) {
      newErrors.customizeName = "Customization name is required";
    } else if (customizeName.trim().length < 3) {
      newErrors.customizeName = "Name must be at least 3 characters long";
    } else if (customizeName === "No name..") {
      newErrors.customizeName = "Please enter a valid name";
    }
    if (!parentValue.trim()) {
      newErrors.paymentMethod = "Payment method is required";
    }
    if (!newName.trim()) {
      newErrors.newName = "New Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  /**
   * Function to handle form submission.
   * Validates the form, submits the data, and handles success or error responses.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // Stop if validation fails
    setErrors({}); // Clear previous errors

    const formData = new FormData(); // Create a new FormData object
    formData.append("id", id);
    formData.append("customizeName", customizeName.trim());
    formData.append("paymentMethod", parentValue.trim());
    formData.append("new_name", newName.trim());

    try {
      await fetcher.submit(formData, { method: "POST", action: "." }); // Submit the form data
      if (fetcher.data?.error) {
        throw new Error(fetcher.data.error); // Handle server-side errors
      }
      if (fetcher.state === "idle" && !fetcher.data?.error) {
        setCustomizeName(""); // Reset form fields on success
        setParentValue("");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrors((prev) => ({
        ...prev,
        form: "Failed to save. Please try again.",
      }));
    }
  };

  return (
    <Grid>
      {/* Left Column: Form Fields */}
      <Grid.Cell columnSpan={{ md: 12, lg: 8, xl: 8 }}>
        <Card
          style={{
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
          }}
        >
          {/* Form for customizing payment methods */}
          <Form method="POST" onSubmit={handleSubmit}>
            {/* Hidden input for shop ID */}
            <input type="hidden" name="id" value={id} />
            <div className="formdetails">
              {/* Customization Name Field */}
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
                    if (errors.customizeName && e.trim().length >= 3) {
                      setErrors((prev) => ({
                        ...prev,
                        customizeName: undefined,
                      }));
                    }
                  }}
                  error={errors.customizeName}
                />
                {/* Helper text for customization name */}
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
              {/* Payment Method Selection Field */}
              <div style={{ marginTop: "20px" }}>
                <label style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  Select Payment Method
                </label>
                {/* Autocomplete component for selecting payment methods */}
                <AutocompleteExample
                  onValueChange={(value) => {
                    setParentValue(value);
                    if (errors.paymentMethod && value.trim()) {
                      setErrors((prev) => ({
                        ...prev,
                        paymentMethod: undefined,
                      }));
                    }
                  }}
                />
                {/* Error message for payment method selection */}
                {errors.paymentMethod && (
                  <div
                    style={{ color: "red", fontSize: "12px", marginTop: "5px" }}
                  >
                    {errors.paymentMethod}
                  </div>
                )}
                {/* Hidden input for selected payment method */}
                <input type="hidden" name="paymentMethod" value={parentValue} />
              </div>
              {/* General form error message */}
              {errors.form && (
                <div
                  style={{
                    color: "red",
                    textAlign: "center",
                    marginTop: "10px",
                  }}
                >
                  {errors.form}
                </div>
              )}
              {/* New Name Field */}
              <div className="" style={{ marginTop: "20px" }}>
                <label style={{ marginBottom: "5px" }}>New Name</label>
                <TextField
                  name="new_name"
                  placeholder="Example: Cash on Delivery 20%"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e);
                    if (errors.newName && e.trim().length >= 3) {
                      setErrors((prev) => ({
                        ...prev,
                        newName: undefined,
                      }));
                    }
                  }}
                  error={errors.newName}
                />
              </div>
              {/* Save Button */}
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <Button
                  submit
                  variant="primary"
                  fullWidth
                  loading={fetcher.state === "submitting"}
                >
                  Save
                </Button>
              </div>
            </div>
          </Form>
        </Card>
      </Grid.Cell>
      {/* Right Column: Sidebar Information */}
      <Grid.Cell columnSpan={{ md: 12, lg: 4, xl: 4 }}>
        <Card roundedAbove="sm">
          {/* Title for the sidebar section */}
          <Text as="h2" variant="headingSm">
            Conditions
          </Text>
          {/* Information about conditions */}
          <Box paddingBlockStart="200">
            <Text as="p" variant="bodyMd">
              The payment method will always have the updated name if there are
              no conditions set
            </Text>
          </Box>
        </Card>
      </Grid.Cell>
    </Grid>
  );
}

/**
 * Component for the Autocomplete dropdown.
 * Allows users to search and select a payment method.
 */
export function AutocompleteExample({ onValueChange }) {
  // Predefined list of payment methods
  const deselectedOptions = useMemo(
    () => [{ value: "cash_on_delivery", label: "Cash on Delivery (COD)" }],
    [],
  );

  const [selectedOptions, setSelectedOptions] = useState([]); // State for selected options
  const [inputValue, setInputValue] = useState(""); // State for input value
  const [options, setOptions] = useState(deselectedOptions); // State for available options

  /**
   * Function to update the input text and filter options.
   */
  const updateText = useCallback(
    (value) => {
      setInputValue(value);
      if (value === "") {
        setOptions(deselectedOptions); // Reset options if input is empty
        return;
      }
      const filterRegex = new RegExp(value, "i"); // Create a regex for filtering
      const resultOptions = deselectedOptions.filter((option) =>
        option.label.match(filterRegex),
      );
      setOptions(resultOptions); // Update options based on the filter
    },
    [deselectedOptions],
  );

  /**
   * Function to update the selected payment method.
   */
  const updateSelection = useCallback(
    (selected) => {
      const selectedValue = selected.map(
        (item) => options.find((o) => o.value.match(item))?.label,
      );
      setSelectedOptions(selected); // Update selected options
      setInputValue(selectedValue[0] || ""); // Update input value
      onValueChange(selectedValue[0] || ""); // Notify parent component of the change
    },
    [options, onValueChange],
  );

  return (
    <Autocomplete
      options={options} // List of available payment methods
      selected={selectedOptions} // Currently selected payment method(s)
      onSelect={updateSelection} // Handler for when an option is selected
      textField={
        <Autocomplete.TextField
          onChange={updateText} // Handler for text input changes
          value={inputValue} // Current value of the text input
        />
      }
    />
  );
}
