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
import { DeleteIcon, SearchIcon } from "@shopify/polaris-icons";
import { useCallback, useMemo, useState } from "react";
import { authenticate } from "../shopify.server";
import { Form, json, useActionData, useLoaderData } from "@remix-run/react";

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
    return { id: shop.data.shop.id };
  } catch (error) {
    return { message: "owner not found", error: error };
  }
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  console.log("formaData->", formData);
  const shopId = formData.get("id");
  const customizeName = formData.get("customizeName");
  const paymentMethod = formData.get("paymentMethod");
  const conditions = [];
  for (let i = 0; i < formData.getAll("hideType").length; i++) {
    conditions.push({
      discountType: formData.get(`hideType-${i}`),
      greaterOrSmall: formData.get(`greaterSmaller-${i}`),
      amount: Number(formData.get(`cartTotal-${i}`)),
      selectedProducts: formData.get(`selectedProducts-${i}`),
      country: formData.get(`country-${i}`),
    });
  }
  const config = JSON.stringify({
    shopId: shopId,
    customizeName: customizeName,
    paymentMethod: paymentMethod,
    conditions: conditions,
  });
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
  return (
    <Page
      backAction={{ content: "Settings", url: "#" }}
      title="Hide Payment Method"
      primaryAction={
        <Button url="#" variant="primary" submit>
          Save
        </Button>
      }
    >
      <Body id={id} />
    </Page>
  );
}

export function Body({ id }) {
  const [parentValue, setParentValue] = useState("");

  const [customizeName, setCustomizeName] = useState("No name..");

  const handleChildValue = (childValue) => {
    setParentValue(childValue);
  };

  // Here's select product model logic
  const [modalActive, setModalActive] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const products = useMemo(
    () => [
      { id: 1, title: "Gift Card" },
      { id: 2, title: "$10" },
      { id: 3, title: "$25" },
      { id: 4, title: "$50" },
      { id: 5, title: "$100" },
    ],
    [],
  );

  const toggleModal = useCallback(
    () => setModalActive((active) => !active),
    [],
  );

  const handleSelectProduct = useCallback((id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const handleConfirmSelection = useCallback(() => {
    toggleModal();
  }, [toggleModal]);

  const selectedProductTitles = products
    .filter((product) => selectedProducts.includes(product.id))
    .map((product) => product.title)
    .join(", ");

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
    setConditions((prevConditions) => [
      ...prevConditions,
      {
        discountType: "cart_total",
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
      prevConditions.filter((_, i) => i !== index),
    );
  };

  // Function to handle changes in condition fields
  const handleConditionChange = (index, field, value) => {
    setConditions((prevConditions) =>
      prevConditions.map((c, i) =>
        i === index ? { ...c, [field]: value } : c,
      ),
    );
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
                  value={customizeName}
                  onChange={(value) => setCustomizeName(value)}
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
                <AutocompleteExample onValueChange={handleChildValue} />
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
                {conditions.map((condition, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
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
                          handleConditionChange(
                            index,
                            "discountType",
                            value,
                          )
                        }
                        name={`hideType-${index}`}
                      />
                    </div>
                    {/* Dropdown 2 */}
                    {condition.discountType === "cart_total" && (
                      <div
                        className=""
                        style={{ display: "flex", gap: "10px" }}
                      >
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
                              value,
                            )
                          }
                          name={`greaterSmaller-${index}`}
                        />
                        {/* Input Field */}
                        <TextField
                          placeholder="100"
                          type="number"
                          value={condition.amount}
                          onChange={(e) =>
                            handleConditionChange(index, "amount", Number(e))
                          }
                          style={{ flex: 1 }}
                          name={`cartTotal-${index}`}
                        />
                      </div>
                    )}
                    {condition.discountType === "product" && (
                      <div
                        className=""
                        style={{ display: "flex", gap: "10px" }}
                      >
                        <Select
                          options={[{ label: "is", value: "is" }]}
                          style={{ flex: 1 }}
                          value={condition.greaterOrSmall}
                          onChange={(value) =>
                            handleConditionChange(
                              index,
                              "greaterOrSmall",
                              value,
                            )
                          }
                          name={`greaterSmaller-${index}`}
                        />
                        <input
                          type="hidden"
                          label="Selected Products"
                          value={condition.selectedProducts.join(", ")}
                          name={`selectedProducts-${index}`}
                        />
                        <Button onClick={toggleModal}>Select Products</Button>
                      </div>
                    )}
                    {condition.discountType === "shipping_country" && (
                      <div
                        className=""
                        style={{ display: "flex", gap: "10px" }}
                      >
                        <Select
                          options={[{ label: "is", value: "is" }]}
                          style={{ flex: 1 }}
                          value={condition.greaterOrSmall}
                          onChange={(value) =>
                            handleConditionChange(
                              index,
                              "greaterOrSmall",
                              value,
                            )
                          }
                          name={`greaterSmaller-${index}`}
                        />
                        <Select
                          options={[
                            { label: "IN", value: "in" },
                            { label: "CN", value: "cn" },
                          ]}
                          style={{ flex: 1 }}
                          value={condition.country}
                          onChange={(value) =>
                            handleConditionChange(index, "country", value)
                          }
                          name={`country-${index}`}
                        />
                      </div>
                    )}
                    {/* Trash Icon */}
                    <Icon
                      source={DeleteIcon}
                      color="critical"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleRemoveCondition(index)}
                    />
                  </div>
                ))}
              </div>
              {/* Add Condition Button */}
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleAddCondition}
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
                  // onClick={handleAddCondition}
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

export function AutocompleteExample({ onValueChange }) {
  const deselectedOptions = useMemo(
    () => [{ value: "cash_on_delivery", label: "Cash On Delivery" }],
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
    [options, onValueChange],
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
