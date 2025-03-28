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
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server"
import { useLoaderData } from "@remix-run/react";

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
      }
    `)

    const products = await response.json();
    return { products }
  } catch (error) {
    return { error: error, status: 500, success: false }
  }
}

export default function MainCreatUpsell() {
  const { products } = useLoaderData();
  // console.log('Raw products data:', products);
  console.log('Products edges:', products?.data?.products?.edges);
  return (
    <Page title="Create Upsell">
      <Layout>
        <Layout.Section>
          <CreateUpsell />
          {/* <ConditionToDisplayUpsellSection /> */}
          <br />
          <ConditionToDisplayUpsellSection products={products} />
        </Layout.Section>
        {/* One Third */}
        <Layout.Section variant="oneThird">
          <LegacyCard title="Tags" sectioned>
            <p>Add tags to your order.</p>
          </LegacyCard>
        </Layout.Section>
      </Layout>
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

export function ConditionToDisplayUpsellSection({ products }) {
  const [modalOpen, setModalOpen] = useState(false); // State to manage modal visibility
  const [selectedProducts, setSelectedProducts] = useState([]); // State to store selected product IDs
  const [selectedCollections, setSelectedCollections] = useState([]); // State to store selected product IDs

  // console.log('selectedProducts', selectedProducts)

  // Function to open the modal
  const handleOpenModal = () => {
    setModalOpen(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Function to open the modal
  const handleOpenCollectionModal = () => {
    setModalOpen(true);
  };

  // Function to close the modal
  const handleCollectionCloseModal = () => {
    setModalOpen(false);
  };

  // Function to handle product selection
  const handleProductSelection = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Function to handle product selection
  const handleCollectionSelection = (collectionId) => {
    if (selectedProducts.includes(collectionId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== collectionId));
    } else {
      setSelectedProducts([...selectedCollections, collectionId]);
    }
  };

  return (
    <Card
      style={{
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #E5E7EB",
      }}
    >
      {/* Title */}
      <Text as="h3" variant="headingMd">
        Step #2: Condition To Display Upsell
      </Text>

      {/* Subtitle */}
      <Text
        as="p"
        style={{ marginTop: "5px", fontSize: "14px", color: "#6B7280" }}
      >
        This will be used as the trigger for displaying the upsell
      </Text>

      {/* Buttons for condition selection */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* All Products */}
        <Button
          plain
          fullWidth
          onClick={() => console.log("All Products selected")}
          style={{ width: "200px" }}
        >
          All Products
          <br />
          <small>Select</small>
        </Button>

        {/* Based on product in cart */}
        <Button
          plain
          fullWidth
          onClick={handleOpenModal}
          style={{ width: "200px" }}
        >
          Based on product in cart
          <br />
          <small>Select Parent Product</small>
        </Button>

        {/* Based on collection in cart */}
        <Button
          plain
          fullWidth
          onClick={handleOpenCollectionModal}
          style={{ width: "200px" }}
        >
          Based on product in cart
          <br />
          <small>Select Parent Product</small>
        </Button>

        {/* Based on product collection in cart */}
        <Button
          plain
          fullWidth
          onClick={() => console.log("Collection selected")}
          style={{ width: "200px" }}
        >
          Based on product collection in cart
          <br />
          <small>Select Collection</small>
        </Button>
      </div>

      {/* Modal for selecting products */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Add product"
        primaryAction={{
          content: "Add",
          disabled: selectedProducts.length === 0,
          onAction: handleCloseModal,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseModal,
          },
        ]}
      >
        <Modal.Section>
          {/* Search field for products */}
          <TextField
            placeholder="Search products"
            style={{ marginBottom: "10px" }}
          />
          <div
            className=""
            style={{ display: "flex", flexDirection: "column" }}
          >
            {products.data?.products?.edges?.map((product) => {
              return (
                <Checkbox
                  label={product.node.title}
                  checked={selectedProducts.includes(product.node.id)}
                  onChange={() => handleProductSelection(product.node.id)}
                />
              )
            })}
          </div>
        </Modal.Section>
      </Modal>

      {/* Modal for selecting collections */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Add product"
        primaryAction={{
          content: "Add",
          disabled: selectedProducts.length === 0,
          onAction: handleCloseModal,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseModal,
          },
        ]}
      >
        <Modal.Section>
          {/* Search field for products */}
          <TextField
            placeholder="Search products"
            style={{ marginBottom: "10px" }}
          />
          <div
            className=""
            style={{ display: "flex", flexDirection: "column" }}
          >
            {products.data?.products?.edges?.map((product) => {
              return (
                <Checkbox
                  label={product.node.title}
                  checked={selectedProducts.includes(product.node.id)}
                  onChange={() => handleProductSelection(product.node.id)}
                />
              )
            })}
          </div>
        </Modal.Section>
      </Modal>
    </Card>
  );
}
