// createupsell.jsx
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
    upsellName: "",
    conditions: {
      selectedProducts: [],
      selectedCollections: [],
      selectionType: "", // Add this line - can be "all" or "specific"
    },
    upsellProducts: ["", "", ""],
  },
  setUpsellData: () => { },
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
        products(first: 50) {
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

    // Check if there's already an upsell with "all" selection type
    const existingAllTypeUpsell = await prisma.upsellSettings.findFirst({
      where: {
        shopId: data.data.shop.id,
        selectionType: "all"
      }
    });

    // Fetch existing upsells for this shop
    const existingUpsells = await prisma.upsellSettings.findMany({
      where: {
        shopId: data.data.shop.id,
      },
      select: {
        upsellName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      products: data.data.products,
      collections: data.data.collections,
      shopId: data.data.shop.id,
      existingUpsells: existingUpsells,
      existingAllTypeUpsell: !!existingAllTypeUpsell
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
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const action = formData.get("action");
  const shopId = formData.get("shopId");

  if (action === "saveUpsellSettings") {
    try {
      const settings = {
        upsellName: formData.get("upsellName"),
        selectedProducts: JSON.parse(formData.get("selectedProducts")),
        selectedCollections: JSON.parse(formData.get("selectedCollections")),
        upsellProducts: JSON.parse(formData.get("upsellProducts")),
        selectionType: formData.get("selectionType") || "specific",
      };

      console.log("settings:", settings);

      // Validate upsell name
      if (!settings.upsellName) {
        throw new Error("Upsell name is required");
      }

      let dbSettings = await prisma.upsellSettings.upsert({
        where: {
          upsellName: settings.upsellName,
        },
        update: {
          shopId: shopId,
          selectedProducts: settings.selectedProducts,
          selectedCollections: settings.selectedCollections,
          upsellProducts: settings.upsellProducts,
          selectionType: settings.selectionType,
        },
        create: {
          shopId: shopId,
          upsellName: settings.upsellName,
          selectedProducts: settings.selectedProducts,
          selectedCollections: settings.selectedCollections,
          upsellProducts: settings.upsellProducts,
          selectionType: settings.selectionType,
        },
      });

      const metaData = {
        shopId: shopId,
        upsellName: formData.get("upsellName"),
        selectedProducts: JSON.parse(formData.get("selectedProducts")),
        selectedCollections: JSON.parse(formData.get("selectedCollections")),
        upsellProducts: JSON.parse(formData.get("upsellProducts")),
        selectionType: formData.get("selectionType") || "specific",
      };

      let metafieldResult = null;
      // Determine where to save the metafield
      let ownerId = shopId;
      // If specific products are selected and selectionType is not "all",
      // we could save to each product's metafield instead of shop
      // This is just a placeholder - you'd need to implement the logic to save to each product
      if (settings.selectedProducts.length > 0 && settings.selectionType !== "all") {
        // For now, we'll still save to the shop, but you could modify this
        // to save to each product if needed
        console.log("Selected products, but selectionType is not 'all'")
        // console.log(settings.selectedProducts[0], settings.selectedProducts[1], settings.selectedProducts[2])
        console.log(JSON.stringify(settings.selectedProducts))
        ownerId = shopId;

        const productIds = settings.selectedProducts; // Replace with your product IDs

        const metafieldData = {
          key: "upsell",
          namespace: "settings",
          type: "json",
          value: JSON.stringify(metaData) // Replace with your JSON data
        };

        for (const productId of productIds) {
          const metafieldResponse = await admin.graphql(
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
                    ...metafieldData,
                    ownerId: productId
                  }
                ]
              }
            }
          );
          console.log(`Metafield added to product ${productId}:`);
        }

        return json({
          success: true,
        });
      }

      if (settings.selectedProducts.length == 0 && settings.selectionType == "all") {
        // Save settings to the metafield
        const metafieldResponse = await admin.graphql(
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
                  key: "upsell",
                  namespace: "settings",
                  ownerId: ownerId,
                  type: "json",
                  value: JSON.stringify(metaData),
                },
              ],
            },
          },
        );

        metafieldResult = await metafieldResponse.json();

        // Check for errors in the metafield update
        if (metafieldResult.data?.metafieldsSet?.userErrors?.length > 0) {
          console.error("Metafield errors:", metafieldResult.data.metafieldsSet.userErrors);
          throw new Error(metafieldResult.data.metafieldsSet.userErrors[0].message);
        }

        return json({
          success: true,
          data: {
            database: dbSettings,
            metafieldResult: metafieldResult,
          },
        });
      }
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

// Main component
export default function MainCreatUpsell() {
  const [upsellData, setUpsellData] = useState({
    upsellName: "",
    conditions: {
      selectedProducts: [],
      selectedCollections: [],
      selectionType: "", // Add this line
    },
    upsellProducts: ["", "", ""],
  });
  // console.log("upsellData:", upsellData);
  const { shopId, products, collections } = useLoaderData();

  return (
    <UpsellContext.Provider value={{ upsellData, setUpsellData }}>
      <Page
        title="Create Upsell"
        backAction={{ content: "Back", url: "/app/manage-upsell" }}
      >
        <Layout>
          <Layout.Section>
            <Banner title="Note:" onDismiss={() => { }}>
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
  const { upsellData, setUpsellData } = useContext(UpsellContext);

  const handleNameChange = (value) => {
    setUpsellData((prev) => ({
      ...prev,
      upsellName: value,
    }));
  };

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
        value={upsellData.upsellName}
        onChange={handleNameChange}
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
  const { upsellData, setUpsellData } = useContext(UpsellContext);
  const [modalOpen, setModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const { existingAllTypeUpsell } = useLoaderData();
  const allProductsDisabled = existingAllTypeUpsell;

  const fetcher = useFetcher();

  // console.log("upsellData:", upsellData);

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

  const getSelectedProductTitles = () => {
    return products?.edges
      ?.filter((product) =>
        upsellData.conditions.selectedProducts.includes(product.node.id),
      )
      .map((product) => product.node.title);
  };

  const getSelectedCollectionTitles = () => {
    return collections?.edges
      ?.filter((collection) =>
        upsellData.conditions.selectedCollections.includes(collection.node.id),
      )
      .map((collection) => collection.node.handle);
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

  const handleConditionSelect = (type) => {
    setUpsellData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        selectionType: type === "all" ? "all" : "specific",
        // Clear other selections when switching conditions
        selectedProducts:
          type === "product" ? prev.conditions.selectedProducts : [],
        selectedCollections:
          type === "collection" ? prev.conditions.selectedCollections : [],
      },
    }));
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
          <div style={{ marginTop: "8px", marginBottom: "8px" }}>
            {upsellData.conditions.selectionType === "all" && (
              <Text color="subdued" as="span">
                All products will trigger this upsell
                <br />
              </Text>
            )}
            {allProductsDisabled && (
              <Text color="critical" as="span">
                Another upsell is already using "All Products"
                <br />
              </Text>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              plain
              fullWidth
              onClick={() => handleConditionSelect("all")}
              disabled={allProductsDisabled}
            >
              {upsellData.conditions.selectionType === "all"
                ? "Selected"
                : "Select"}
            </Button>
            {upsellData.conditions.selectionType === "all" && (
              <Button
                plain
                destructive
                onClick={() => handleConditionSelect("none")}
              >
                ✕
              </Button>
            )}
          </div>
        </Card>
        <Card>
          <Text fontWeight="bold">Based on product in cart</Text>
          <div style={{ marginTop: "8px", marginBottom: "8px" }}>
            {getSelectedProductTitles()?.map((title) => (
              <Text key={title} color="subdued" as="span">
                {title}
                <br />
              </Text>
            ))}
          </div>
          <Button
            plain
            fullWidth
            onClick={() => {
              handleConditionSelect("product");
              toggleModal("product", true);
            }}
          >
            {upsellData.conditions.selectedProducts.length > 0
              ? "Edit Products"
              : "Select Parent Product"}
          </Button>
        </Card>
        <Card>
          <Text fontWeight="bold">Based on product collection in cart</Text>
          <div style={{ marginTop: "8px", marginBottom: "8px" }}>
            {getSelectedCollectionTitles()?.map((handle) => (
              <Text key={handle} color="subdued" as="span">
                {handle}
                <br />
              </Text>
            ))}
          </div>
          <Button
            plain
            fullWidth
            onClick={() => {
              handleConditionSelect("collection");
              toggleModal("collection", true);
            }}
          >
            {upsellData.conditions.selectedCollections.length > 0
              ? "Edit Collections"
              : "Select Parent Collection"}
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

  // Function to check if a product is already selected in another slot
  const isProductSelectedElsewhere = (productId, currentIndex) => {
    return upsellData.upsellProducts.some(
      (id, index) => id === productId && index !== currentIndex
    );  
  };

  const saveAllSettings = () => {
    fetcher.submit(
      {
        action: "saveUpsellSettings",
        upsellName: upsellData.upsellName, // Add this line
        selectedProducts: JSON.stringify(
          upsellData.conditions.selectedProducts,
        ),
        selectedCollections: JSON.stringify(
          upsellData.conditions.selectedCollections,
        ),
        upsellProducts: JSON.stringify(upsellData.upsellProducts),
        selectionType: upsellData.conditions.selectionType, // Add this line
        shopId: shopId,
      },
      { method: "POST" },
    );
  };

  // console.log("saveAllSettings", upsellData);

  const getProductTitle = (productId) => {
    return (
      products?.edges?.find((product) => product.node.id === productId)?.node
        .title || ""
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
          {products?.edges?.map((product) => {
            const isSelectedElsewhere = isProductSelectedElsewhere(product.node.id, index);
            return (
              <Checkbox
                key={product.node.id}
                label={
                  <>
                    {product.node.title}
                    {isSelectedElsewhere && (
                      <Text color="critical" as="span"> (already selected in another slot)</Text>
                    )}
                  </>
                }
                checked={upsellData.upsellProducts[index] === product.node.id}
                disabled={isSelectedElsewhere}
                onChange={() => handleProductSelection(index, product.node.id)}
              />
            );
          })}
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
            <div style={{ marginTop: "8px", marginBottom: "8px" }}>
              {upsellData.upsellProducts[index] && (
                <Text color="subdued" as="span">
                  {getProductTitle(upsellData.upsellProducts[index])}
                  <br />
                </Text>
              )}
            </div>
            <Button plain fullWidth onClick={() => toggleModal(index, true)}>
              {upsellData.upsellProducts[index]
                ? "Change Product"
                : "Select Product"}
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
