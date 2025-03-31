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
  Banner,
} from "@shopify/polaris";
import { useState, createContext, useContext } from "react";
import { authenticate } from "../shopify.server";
import { useLoaderData, useFetcher, json } from "@remix-run/react";
import prisma from "../db.server";

// Create a context to share data between components
export const UpsellContext = createContext({
  upsellData: {
    conditions: {
      selectedProducts: [],
      selectedCollections: [],
    },
    upsellProducts: ["", "", ""],
  },
  setUpsellData: () => {},
});

// Loader function to fetch initial data
export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(`
      query {
        shop {
          id
        }
        products(first: 10) {
          edges {
            node {
              id
              title
            }
          }
        }
        collections(first: 10) {
          edges {
            node {
              id
              handle
            }
          }
        }
      }
    `);
    const data = await response.json();
    if (!data || !data.data) {
      throw new Error("Failed to fetch data from Shopify API.");
    }
    return {
      products: data.data.products,
      collections: data.data.collections,
      shopId: data.data.shop.id,
    };
  } catch (error) {
    console.error("Loader error:", error.message);
    return json(
      { error: "An error occurred while loading data.", success: false },
      { status: 500 },
    );
  }
}

// Action function to handle form submissions
export async function action({ request }) {
  const formData = await request.formData();
  const action = formData.get("action");
  const shopId = formData.get("shopId");

  console.log("shopId", shopId);

  if (action === "saveUpsellSettings") {
    try {
      const settings = {
        selectedProducts: JSON.parse(formData.get("selectedProducts")),
        selectedCollections: JSON.parse(formData.get("selectedCollections")),
        upsellProducts: JSON.parse(formData.get("upsellProducts")),
      };

      console.log("Saving settings:", settings);

      // Check if a record with the given shopId exists
      const existingRecord = await prisma.upsellsettings.findUnique({
        where: { shopId: shopId },
      });

      let dbSettings;

      if (existingRecord) {
        // Update the existing record
        dbSettings = await prisma.upsellsettings.update({
          where: { shopId: shopId }, // Changed from id: shopId to shopId: shopId
          data: {
            selectedProducts: settings.selectedProducts,
            selectedCollections: settings.selectedCollections,
            upsellProducts: settings.upsellProducts,
          },
        });
      } else {
        // Create a new record
        dbSettings = await prisma.upsellsettings.create({
          data: {
            shopId: shopId,
            selectedProducts: settings.selectedProducts,
            selectedCollections: settings.selectedCollections,
            upsellProducts: settings.upsellProducts,
          },
        });
      }

      console.log("Database record saved:", dbSettings);

      return json({
        success: true,
        data: {
          database: dbSettings,
        },
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      return json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }
  }
}

// Helper function for safe JSON parsing
function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Main component
export default function MainCreatUpsell() {
  const [upsellData, setUpsellData] = useState({
    conditions: {
      selectedProducts: [],
      selectedCollections: [],
    },
    upsellProducts: ["", "", ""],
  });
  const { shopId, products, collections } = useLoaderData();

  return (
    <UpsellContext.Provider value={{ upsellData, setUpsellData }}>
      <Page title="Create Upsell">
        <Layout>
          <Layout.Section>
            <Banner title="Note:" onDismiss={() => {}}>
              <p>
                After selecting the product you want to upsell, make sure to
                finish setting up your upsells by adding our upsell extension in
                the checkout editor. Please contact us if you need assistance.
              </p>
            </Banner>
            <CreateUpsell />
            <ConditionToDisplayUpsellSection
              products={products}
              collections={collections}
            />
            <SelectProductForUpsell shopId={shopId} products={products} />
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <LegacyCard title="Tags" sectioned>
              <p>Add tags to your order.</p>
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </Page>
    </UpsellContext.Provider>
  );
}

// Step #1: Name Your Upsell
export function CreateUpsell() {
  return (
    <Card>
      <Text as="h3" variant="headingMd">
        Step #1: Name Your Upsell
      </Text>
      <div style={{ height: "6px" }}></div>
      <p style={{ fontWeight: "bold", marginTop: "10px", marginBottom: "5px" }}>
        Upsell Name
      </p>
      <TextField
        placeholder="Example: Upsell our best product"
        style={{ width: "100%" }}
      />
      <p style={{ marginTop: "5px", fontSize: "12px", color: "#6B7280" }}>
        This is not visible to the customer
      </p>
    </Card>
  );
}

// Step #2: Condition To Display Upsell
export function ConditionToDisplayUpsellSection({ products, collections }) {
  const fetcher = useFetcher();
  const { upsellData, setUpsellData } = useContext(UpsellContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

  const handleSelection = (type, id) => {
    setUpsellData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [type === "product" ? "selectedProducts" : "selectedCollections"]:
          prev.conditions[
            type === "product" ? "selectedProducts" : "selectedCollections"
          ].includes(id)
            ? prev.conditions[
                type === "product" ? "selectedProducts" : "selectedCollections"
              ].filter((item) => item !== id)
            : [
                ...prev.conditions[
                  type === "product"
                    ? "selectedProducts"
                    : "selectedCollections"
                ],
                id,
              ],
      },
    }));
  };

  const toggleModal = (type, isOpen) => {
    if (type === "product") setModalOpen(isOpen);
    if (type === "collection") setCollectionModalOpen(isOpen);
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
      <Text style={{ marginTop: "5px", fontSize: "14px", color: "#6B7280" }}>
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
      {renderModal(
        "product",
        modalOpen,
        products,
        upsellData.conditions.selectedProducts,
        () => toggleModal("product", false),
      )}
      {renderModal(
        "collection",
        collectionModalOpen,
        collections,
        upsellData.conditions.selectedCollections,
        () => toggleModal("collection", false),
      )}
    </Card>
  );
}

// Step #3: Select Products to Offer at Checkout
export function SelectProductForUpsell({ products, shopId }) {
  const fetcher = useFetcher();
  const { upsellData, setUpsellData } = useContext(UpsellContext);
  const [modals, setModals] = useState([false, false, false]);

  const toggleModal = (index, isOpen) => {
    setModals((prev) => prev.map((open, i) => (i === index ? isOpen : open)));
  };

  const handleProductSelection = (index, productId) => {
    setUpsellData((prev) => ({
      ...prev,
      upsellProducts: prev.upsellProducts.map((id, i) =>
        i === index ? productId : id,
      ),
    }));
    toggleModal(index, false);
  };

  const saveAllSettings = () => {
    fetcher.submit(
      {
        action: "saveUpsellSettings",
        selectedProducts: JSON.stringify(
          upsellData.conditions.selectedProducts,
        ),
        selectedCollections: JSON.stringify(
          upsellData.conditions.selectedCollections,
        ),
        upsellProducts: JSON.stringify(upsellData.upsellProducts),
        shopId: shopId,
      },
      { method: "POST" },
    );
  };

  const renderModal = (index) => (
    <Modal
      open={modals[index]}
      onClose={() => toggleModal(index, false)}
      title={`Select Product ${index + 1}`}
      primaryAction={{
        content: "Add",
        disabled: !upsellData.upsellProducts[index],
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
              checked={upsellData.upsellProducts[index] === product.node.id}
              onChange={() => handleProductSelection(index, product.node.id)}
            />
          ))}
        </div>
      </Modal.Section>
    </Modal>
  );

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
      <Text style={{ marginTop: "5px", fontSize: "14px", color: "#6B7280" }}>
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
            <Button plain fullWidth onClick={() => toggleModal(index, true)}>
              Select Product
            </Button>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: "20px" }}>
        <Button onClick={saveAllSettings} primary>
          Save All Settings
        </Button>
      </div>
      {modals.map((_, index) => renderModal(index))}
      {fetcher.state === "submitting" && (
        <Banner status="info">Saving all settings...</Banner>
      )}
      {fetcher.state === "idle" && fetcher.data?.success && (
        <Banner status="success">All settings saved successfully!</Banner>
      )}
      {fetcher.state === "idle" && fetcher.data?.error && (
        <Banner status="critical">Error: {fetcher.data.error}</Banner>
      )}
    </Card>
  );
}
