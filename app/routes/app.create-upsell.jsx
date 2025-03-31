import {
  Card,
  TextField,
  Text,
  Page,
  Layout,
  LegacyCard,
  Button,
  Modal,
  Checkbox,
  List,
  Banner,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(`
      query{
        products(first: 10){
          edges{
            node{
              id
              title
            }
          }
        }
        collections(first: 10){
            edges{
                node{
                    id
                    handle
                }
            }
        }
      }
    `);

    const data = await response.json();
    // console.log(data?.data?.products?.edges);
    return {
      products: data?.data?.products,
      collections: data?.data?.collections,
    };
  } catch (error) {
    return { error: error, status: 500, success: false };
  }
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "saveUpsellSettings") {
    try {
      const settings = {
        selectedProducts: JSON.parse(formData.get("selectedProducts")),
        selectedCollections: JSON.parse(formData.get("selectedCollections")),
        upsellProducts: JSON.parse(formData.get("upsellProducts")),
      };

      console.log("settings", settings);
      return { settings };

      const response = await admin.graphql(
        `
        mutation setMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              namespace
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
        {
          variables: {
            metafields: [
              {
                namespace: "upsell_app",
                key: "upsell_settings",
                value: JSON.stringify(settings),
                type: "json",
              },
            ],
          },
        },
      );

      const data = await response.json();
      return json({ success: true, data });
    } catch (error) {
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }
}

export default function MainCreatUpsell() {
  const { products, collections } = useLoaderData();
  //   console.log("Raw products data:", products);
  //   console.log("collection data:", products);
  return (
    <Page title="Create Upsell">
      <Layout>
        <Layout.Section>
          <Banner title="Note: " onDismiss={() => {}}>
            <p>
              After selecting the product you want to upsell make sure to finish
              setting up your upsells by adding our upsell extension in the
              checkout editor. Please contact us if you need assistance.
            </p>
          </Banner>
          <br />
          <CreateUpsell />
          {/* <ConditionToDisplayUpsellSection /> */}
          <br />
          <ConditionToDisplayUpsellSection
            products={products}
            collections={collections}
          />
          <br />
          <SelectProductForUpsell products={products} />
        </Layout.Section>
        {/* One Third */}
        <Layout.Section variant="oneThird">
          <LegacyCard title="Tags" sectioned>
            <p>Add tags to your order.</p>
          </LegacyCard>
        </Layout.Section>
      </Layout>
      <br />
    </Page>
  );
}

export function CreateUpsell() {
  return (
    <Card>
      {/* Title */}
      <Text as="h3" variant="headingMd">
        Step #1: Name Your Upsell
      </Text>
      <div className="spacer" style={{ height: "6px" }}></div>

      {/* Form Field Label */}
      <p
        as="label"
        style={{ fontWeight: "bold", marginTop: "10px", marginBottom: "5px" }}
      >
        Upsell Name
      </p>

      {/* Input Field */}
      <TextField
        placeholder="Example: Upsell our best product"
        style={{ width: "100%" }}
      />

      {/* Helper Text */}
      <p
        as="p"
        style={{ marginTop: "5px", fontSize: "12px", color: "#6B7280" }}
      >
        This is not visible to the customer
      </p>
    </Card>
  );
}

export function ConditionToDisplayUpsellSection({ products, collections }) {
  const fetcher = useFetcher();
  const [modalOpen, setModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);

  //   console.log("selectedProducts", selectedProducts, selectedCollections);

  const toggleModal = (type, isOpen) => {
    if (type === "product") setModalOpen(isOpen);
    if (type === "collection") setCollectionModalOpen(isOpen);
  };

  const handleSelection = (type, id) => {
    const setter =
      type === "product" ? setSelectedProducts : setSelectedCollections;
    const selected =
      type === "product" ? selectedProducts : selectedCollections;

    setter(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  };

  const renderModal = (type, isOpen, items, selected, onClose) => (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Add ${type === "product" ? "Product" : "Collection"}`}
      primaryAction={{
        content: "Add",
        disabled: selected.length === 0,
        onAction: onClose,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <TextField
          placeholder={`Search ${type}s`}
          style={{ marginBottom: "10px" }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items?.edges?.map((item) => (
            <Checkbox
              key={item.node.id}
              label={type === "product" ? item.node.title : item.node.handle}
              checked={selected.includes(item.node.id)}
              onChange={() => handleSelection(type, item.node.id)}
            />
          ))}
        </div>
      </Modal.Section>
    </Modal>
  );

  // Add save function
  const saveSettings = () => {
    fetcher.submit(
      {
        action: "saveUpsellSettings",
        selectedProducts: JSON.stringify(selectedProducts),
        selectedCollections: JSON.stringify(selectedCollections),
        upsellProducts: JSON.stringify([]), // This will be filled by SelectProductForUpsell
      },
      { method: "POST" },
    );
  };

  // Add save button at the end of the component
  return (
    <Card
      style={{
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #E5E7EB",
      }}
    >
      <Text as="h3" variant="headingMd">
        Step #2: Condition To Display Upsell
      </Text>
      <Text
        as="p"
        style={{ marginTop: "5px", fontSize: "14px", color: "#6B7280" }}
      >
        This will be used as the trigger for displaying the upsell
      </Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        <Card>
          <Text fontWeight="bold">All Products</Text>
          <Button
            plain
            fullWidth
            onClick={() => console.log("All Products selected")}
          >
            Select
          </Button>
        </Card>
        <Card>
          <Text fontWeight="bold">Based on product in cart</Text>
          <Button plain fullWidth onClick={() => toggleModal("product", true)}>
            Select Parent Product
          </Button>
        </Card>
        <Card>
          <Text fontWeight="bold">Based on product collection in cart</Text>
          <Button
            plain
            fullWidth
            onClick={() => toggleModal("collection", true)}
          >
            Select Parent Collection
          </Button>
        </Card>
      </div>
      {renderModal("product", modalOpen, products, selectedProducts, () =>
        toggleModal("product", false),
      )}
      {renderModal(
        "collection",
        collectionModalOpen,
        collections,
        selectedCollections,
        () => toggleModal("collection", false),
      )}
      <div style={{ marginTop: "20px" }}>
        <Button onClick={saveSettings} primary>
          Save Conditions
        </Button>
      </div>
      {fetcher.state === "submitting" && (
        <Banner status="info">Saving settings...</Banner>
      )}
      {fetcher.state === "idle" && fetcher.data?.success && (
        <Banner status="success">Settings saved successfully!</Banner>
      )}
      {fetcher.state === "idle" && fetcher.data?.error && (
        <Banner status="critical">Error: {fetcher.data.error}</Banner>
      )}
    </Card>
  );
}

export function SelectProductForUpsell({ products }) {
  const fetcher = useFetcher();
  const [modals, setModals] = useState([false, false, false]); // State to manage modal visibility for each product
  const [selectedProducts, setSelectedProducts] = useState(["", "", ""]); // State to store selected product IDs

  //   console.log("selectedProducts->", selectedProducts);

  const toggleModal = (index, isOpen) => {
    setModals((prev) => prev.map((open, i) => (i === index ? isOpen : open)));
  };

  const handleProductSelection = (index, productId) => {
    setSelectedProducts((prev) =>
      prev.map((id, i) => (i === index ? productId : id)),
    );
    toggleModal(index, false); // Close the modal after selection
  };

  const renderModal = (index) => (
    <Modal
      open={modals[index]}
      onClose={() => toggleModal(index, false)}
      title={`Select Product ${index + 1}`}
      primaryAction={{
        content: "Add",
        disabled: !selectedProducts[index],
        onAction: () => toggleModal(index, false),
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: () => toggleModal(index, false),
        },
      ]}
    >
      <Modal.Section>
        <TextField
          placeholder="Search products"
          style={{ marginBottom: "10px" }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {products?.edges?.map((product) => (
            <Checkbox
              key={product.node.id}
              label={product.node.title}
              checked={selectedProducts[index] === product.node.id}
              onChange={() => handleProductSelection(index, product.node.id)}
            />
          ))}
        </div>
      </Modal.Section>
    </Modal>
  );

  // Add save function
  const saveUpsellProducts = () => {
    fetcher.submit(
      {
        action: "saveUpsellSettings",
        selectedProducts: JSON.stringify([]),
        selectedCollections: JSON.stringify([]),
        upsellProducts: JSON.stringify(selectedProducts),
      },
      { method: "POST" },
    );
  };

  return (
    <Card
      style={{
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #E5E7EB",
      }}
    >
      <Text as="h3" variant="headingMd">
        Step #3: Select Products to Offer at Checkout
      </Text>
      <Text
        as="p"
        style={{ marginTop: "5px", fontSize: "14px", color: "#6B7280" }}
      >
        These products will be offered at checkout as upsells if they are not
        already in the cart
      </Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {["Product 1", "Product 2", "Product 3"].map((label, index) => (
          <Card key={index}>
            <Text fontWeight="bold">{label}</Text>
            <hr style={{ border: "none", height: "0px" }} />
            <Button
              plain
              fullWidth
              onClick={() => toggleModal(index, true)}
              style={{ width: "200px" }}
            >
              Select Product
            </Button>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: "20px" }}>
        <Button onClick={saveUpsellProducts} primary>
          Save Selected Products
        </Button>
      </div>
      {modals.map((_, index) => renderModal(index))}
      {fetcher.state === "submitting" && (
        <Banner status="info">Saving settings...</Banner>
      )}
      {fetcher.state === "idle" && fetcher.data?.success && (
        <Banner status="success">Settings saved successfully!</Banner>
      )}
      {fetcher.state === "idle" && fetcher.data?.error && (
        <Banner status="critical">Error: {fetcher.data.error}</Banner>
      )}
    </Card>
  );
}
