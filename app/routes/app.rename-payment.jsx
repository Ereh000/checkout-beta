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

// Import custom icons for the application
// import { DeleteIcon, SearchIcon } from "@shopify/polaris-icons";

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

    const data = await response.json();
    return data;

  } catch (error) {
    // Handle errors by returning an error response
    return json({ error: error.message }, { status: 500 });
  }
}

// Main component rendering the page
export default function CustomizationSection() {
  const data = useActionData(); // Fetch action data after form submission
  const { id } = useLoaderData(); // Fetch shop ID from loader data

  console.log('data->', data);

  return (
    <Page
      backAction={{ content: "Settings", url: "#" }} // Back button navigation
      title="Payment Method Name" // Page title
    >
      <Body id={id} /> {/* Render the main form body */}
    </Page>
  );
}

// Component responsible for rendering the form fields and interactions
export function Body({ id }) {
  const [parentValue, setParentValue] = useState("");
  const [customizeName, setCustomizeName] = useState("");
  const [newName, setNewName] = useState("");
  const fetcher = useFetcher();
  const [errors, setErrors] = useState({});

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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setErrors({});

    const formData = new FormData();
    formData.append("id", id);
    formData.append("customizeName", customizeName.trim());
    formData.append("paymentMethod", parentValue.trim());
    formData.append("new_name", newName.trim());

    try {
      await fetcher.submit(formData, { method: "POST", action: "." });

      if (fetcher.data?.error) {
        throw new Error(fetcher.data.error);
      }

      if (fetcher.state === "idle" && !fetcher.data?.error) {
        setCustomizeName("");
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

              <div style={{ marginTop: "20px" }}>
                <label style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  Select Payment Method
                </label>
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
                {errors.paymentMethod && (
                  <div
                    style={{ color: "red", fontSize: "12px", marginTop: "5px" }}
                  >
                    {errors.paymentMethod}
                  </div>
                )}
                <input type="hidden" name="paymentMethod" value={parentValue} />
              </div>

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
      <Grid.Cell columnSpan={{ md: 12, lg: 4, xl: 4 }}>
        <Card roundedAbove="sm">
          <Text as="h2" variant="headingSm">
            Conditions
          </Text>
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

export function AutocompleteExample({ onValueChange }) {
  const deselectedOptions = useMemo(
    () => [{ value: "cash_on_delivery", label: "Cash on Delivery (COD)" }],
    [],
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
        option.label.match(filterRegex),
      );
      setOptions(resultOptions);  
    },
    [deselectedOptions],
  );

  const updateSelection = useCallback(
    (selected) => {
      const selectedValue = selected.map(
        (item) => options.find((o) => o.value.match(item))?.label,
      );
      setSelectedOptions(selected);
      setInputValue(selectedValue[0] || "");
      onValueChange(selectedValue[0] || "");
    },
    [options, onValueChange],
  );

  return (
    <Autocomplete
      options={options}
      selected={selectedOptions}
      onSelect={updateSelection}
      textField={
        <Autocomplete.TextField
          // placeholder="Search or enter custom payment method"
          onChange={updateText}
          value={inputValue}
        />
      }
    />
  );
}
