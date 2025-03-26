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

export default function MainCreatUpsell() {
  return (
    <Page title="Create Upsell">
      <Layout>
        <Layout.Section>
          <CreateUpsell />
          {/* <ConditionToDisplayUpsellSection /> */}
          <ConditionToDisplayUpsellSection />
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

export function ConditionToDisplayUpsellSection1() {
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
          onClick={() => console.log("Parent Product selected")}
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
    </Card>
  );
}

export function ConditionToDisplayUpsellSection() {
  const [modalOpen, setModalOpen] = useState(false); // State to manage modal visibility
  const [selectedProducts, setSelectedProducts] = useState([]); // State to store selected product IDs

  // Function to open the modal
  const handleOpenModal = () => {
    setModalOpen(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
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
      {/* {modalOpen && ( */}
      <Modal
        //   open={true}
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
            <Checkbox
              label="The Complete Snowboard"
              checked={selectedProducts.includes("product_id_1")}
              onChange={() => handleProductSelection("product_id_1")}
            />
            <Checkbox
              label="The Hidden Snowboard"
              checked={selectedProducts.includes("product_id_2")}
              onChange={() => handleProductSelection("product_id_2")}
            />
            <Checkbox
              label="The Inventory Not Tracked Snowboard"
              checked={selectedProducts.includes("product_id_3")}
              onChange={() => handleProductSelection("product_id_3")}
            />
          </div>
        </Modal.Section>
      </Modal>
      {/* )} */}
    </Card>
  );
}
