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
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useCallback, useMemo, useState } from "react";
import { authenticate } from "../shopify.server";
import { data, Form, json, useActionData, useLoaderData } from "@remix-run/react";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  try {
    const response = await admin.graphql(`
      query{
        shop{
          id
        }
      }
    `);
    const shop = await response.json();
    // console.log(shop.data.shop.id);
    return { id: shop.data.shop.id };
  } catch (error) {
    return { message: "owner not found", error: error };
  }
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();

  console.log("formData:", formData);

  const shopId = formData.get("id");
  const customizeName = formData.get("customizeName");
  const paymentMethod = formData.get("paymentMethod");
  const hideType = formData.get("hideType");
  const greaterSmaller = formData.get("greaterSmaller");
  const cartTotal = formData.get("cartTotal");

  const config = JSON.stringify({
    shopId: shopId,
    customizeName: customizeName,
    paymentMethod: paymentMethod,
    hideType: hideType,
    greaterSmaller: greaterSmaller,
    cartTotal: Number(cartTotal),
  });
  console.log("config", config);

  try {
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
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

export default function CustomizationSection() {
  const { id } = useLoaderData();
  const data = useActionData();
  console.log(id, data);

  return (
    <Page
      backAction={{ content: "Settings", url: "#" }}
      title="Hide Payment Method"
      primaryAction={
        <Button url="#" variant="primary">
          Save
        </Button>
      }
    >
      <Body id={id} />
    </Page>
  );
}

export function Body({ id }) {
  const [discountType, setDiscouintType] = useState("cart_total");
  const [greaterOrSmall, setGreaterOrSmall] = useState("greater_than");
  const [amount, setAmount] = useState(0);

  const [parentValue, setParentValue] = useState("");

  const handleChildValue = (childValue) => {
    setParentValue(childValue);
    console.log("Value from child:", childValue[0]);
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
          <Form method="POST">
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
                {/*  */}
                <AutocompleteExample onValueChange={handleChildValue} />
                <input type="hidden" name="paymentMethod" value={parentValue} />
                {/*  */}
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
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* Dropdown 1 */}
                <Select
                  options={[
                    { label: "Cart Total", value: "cart_total" },
                    // { label: "Product", value: "product" },
                    // Add more options as needed
                  ]}
                  placeholder="Select a field"
                  style={{ flex: 1 }}
                  value={discountType}
                  onChange={(value) => setDiscouintType(value)}
                  name="hideType"
                />

                {/* Dropdown 2 */}
                <Select
                  options={[
                    { label: "is greater than", value: "greater_than" },
                    { label: "is less than", value: "less_than" },
                    // Add more options as needed
                  ]}
                  placeholder="Select a condition"
                  style={{ flex: 1 }}
                  value={greaterOrSmall}
                  onChange={(value) => setGreaterOrSmall(value)}
                  name="greaterSmaller"
                />

                {/* Input Field */}
                <TextField
                  placeholder="100"
                  type="number"
                  onChange={(value) => setAmount(value)}
                  value={amount}
                  style={{ flex: 1 }}
                  name="cartTotal"
                />

                {/* Trash Icon */}
                <Icon
                  source="TrashMinor"
                  color="critical"
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>

            {/* Add Condition Button */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Button primary submit fullWidth>
                <div className="">
                  {/* <PlusIcon />  */}
                  <span>Add condition</span>
                </div>
              </Button>
            </div>
          </Form>
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

export function AutocompleteExample({ onValueChange }) {
  const deselectedOptions = useMemo(
    () => [
      { value: "cash_on_delivery", label: "Cash On Delivery" },
      // { value: "antique", label: "Antique" },
    ],
    [],
  );
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(deselectedOptions);

  onValueChange(selectedOptions);

  // console.log(selectedOptions)

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
      const selectedValue = selected.map((selectedItem) => {
        const matchedOption = options.find((option) => {
          return option.value.match(selectedItem);
        });
        return matchedOption && matchedOption.label;
      });

      setSelectedOptions(selected);
      setInputValue(selectedValue[0] || "");
    },
    [options],
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
    <div style={{ height: "" }}>
      <Autocomplete
        options={options}
        selected={selectedOptions}
        onSelect={updateSelection}
        textField={textField}
      />
    </div>
  );
}
