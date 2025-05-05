import React, { useState } from "react";
import {
  Page,
  LegacyCard,
  MediaCard,
  VideoThumbnail,
  EmptyState,
  Button,
  Modal,
  Text,
  Icon,
  TextContainer,
  Badge,
  DataTable,
  // Link,
} from "@shopify/polaris";
import { ArrowRightIcon } from "@shopify/polaris-icons"; // Importing Close Icon
import { Link, useLoaderData } from "@remix-run/react";
import prisma from "../db.server"; // Import Prisma client
import { authenticate } from "../shopify.server"; // For authentication
import { json } from "@remix-run/node"; // For loader function

// --- Add Loader Function ---
export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  // Fetch Shop GraphQL ID in the loader
  const shopIdResponse = await admin.graphql(
    `#graphql
      query shopInfo {
        shop {
          id
        }
      }`,
  );
  const shopIdData = await shopIdResponse.json();
  const shopGid = shopIdData.data?.shop?.id;

  // const shop = session.shop; // Get shop from session

  // Fetch both types of customizations concurrently
  const [hideCustomizations, messageCustomizations] = await Promise.all([
    prisma.shippingCustomization.findMany({
      where: { shop: shopGid }, // Filter by shop
      orderBy: { createdAt: "desc" }, // Optional: order by creation date
    }),
    prisma.shippingMessage.findMany({
      where: { shop: shopGid }, // Filter by shop
      orderBy: { createdAt: "desc" }, // Optional: order by creation date
    }),
  ]);

  // Combine data and add a 'type' identifier if not already present in the model
  // (Using the default value from the schema)
  const allCustomizations = [...hideCustomizations, ...messageCustomizations];

  return json({ customizations: allCustomizations }); // Return combined data
}
// --- End Loader Function ---

export default function PaymentCustomization() {
  // --- Use loader data ---
  const { customizations } = useLoaderData();
  // State to control modal visibility
  const [isOpen, setIsOpen] = useState(false);

  // --- Prepare data for DataTable ---
  const rows = customizations.map((item) => [
    item.name, // Customization Name
    item.type, // Type (e.g., "Hide Shipping", "Rename Shipping")
    <Badge key={`${item.id}-status`} tone="success">
      Active
    </Badge>,
    <Button key={`${item.id}-edit`} onClick={() => console.log("Edit clicked")}>
      Edit
    </Button>,
  ]);
  // --- End Prepare data for DataTable ---

  return (
    <Page
      backAction={{ content: "Settings", url: "/app" }}
      title="Shipping Customizations"
      primaryAction={
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Create Customization
        </Button>
      }
    >
      {/* Existing content */}
      <MediaCard
        title="How to use Customizations"
        primaryAction={{
          content: "Learn more",
          onAction: () => {},
        }}
        description="Thank you for using Checkout Plus. Here is an example of using shipping customizations on the checkout."
        popoverActions={[{ content: "Dismiss", onAction: () => {} }]}
      >
        <VideoThumbnail
          videoLength={80}
          thumbnailUrl="https://94m.app/images/Shipping-Customizations-Thumbnail.webp"
          onClick={() => console.log("clicked")}
        />
      </MediaCard>

      <br />
      {/* --- Conditional Rendering: DataTable or EmptyState --- */}
      {customizations.length > 0 ? (
        <LegacyCard>
          <DataTable
            columnContentTypes={[
              "text", // Name
              "text", // Type
              // "text", // Shipping Method
              // "numeric", // Conditions count (using Badge component)
              // "text", // Created Date
              "text", // Status (using Badge component)
              "edit",
            ]}
            headings={[
              "Name",
              "Type",
              // "Shipping Method",
              // "Conditions",
              // "Created",
              "Status",
              "Edit",
            ]}
            rows={rows} // Use the prepared rows
          />
        </LegacyCard>
      ) : (
        <LegacyCard sectioned>
          <EmptyState
            heading="No customizations"
            image="https://cdn.shopify.com/shopifycloud/web/assets/v1/2b13a3a6f21ed6ba.svg"
          >
            <p>
              Create a new customization to start customizing your shipping
              methods at checkout.
            </p>
          </EmptyState>
        </LegacyCard>
      )}
      {/* --- End Conditional Rendering --- */}

      {/* Polaris Modal */}
      <div className="shipping_customization_model">
        <Modal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          title="Select A Customization"
        >
          {/* Option 1 */}
          <Modal.Section>
            <Link
              to={"/app/hide-shipping-method"}
              style={{ textDecoration: "none", color: "#000" }}
            >
              <TextContainer>
                <div
                  className="flex justify-between items-center"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div className="">
                    <Text variant="headingMd" as="h5">
                      Hide Shipping Methodd
                    </Text>
                    <p>Hide shipping method based on order totals</p>
                  </div>
                  <div className="">
                    <Icon source={ArrowRightIcon}></Icon>
                  </div>
                </div>
              </TextContainer>
            </Link>
          </Modal.Section>
          {/* Option 2 */}
          <Modal.Section>
            <Link
              to={"/app/shipping-add-message"}
              style={{ textDecoration: "none", color: "#000" }}
            >
              <TextContainer onClick={() => console.log("clicked")}>
                <div
                  className="flex justify-between items-center"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div className="">
                    <Text variant="headingMd" as="h5">
                      Add Message to Shipping Method
                    </Text>
                    <p>Display a message below a shipping method</p>
                  </div>
                  <div className="">
                    <Icon source={ArrowRightIcon}></Icon>
                  </div>
                </div>
              </TextContainer>
            </Link>
          </Modal.Section>

          {/* These Features will be indule later */}
          {/* <Modal.Section>
            <Link style={{ textDecoration: "none", color: "#000" }}>
              <TextContainer onClick={() => console.log("clicked")}>
                <div
                  className="flex justify-between items-center"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div className="">
                    <Text variant="headingMd" as="h5">
                      Reorder Shipping Method
                    </Text>
                    <p>
                      Control the order in which your shipping methods are
                      displayed
                    </p>
                  </div>
                  <div className="">
                    <Icon source={ArrowRightIcon}></Icon>
                  </div>
                </div>
              </TextContainer>
            </Link>
          </Modal.Section>
          <Modal.Section>
            <Link style={{ textDecoration: "none", color: "#000" }}>
              <TextContainer onClick={() => console.log("clicked")}>
                <div
                  className="flex justify-between items-center"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div className="">
                    <Text variant="headingMd" as="h5">
                      Don't see what you looking for
                    </Text>
                    <p>
                      Contact us and we will be happy to support your business
                    </p>
                  </div>
                  <div className="">
                    <Icon source={ArrowRightIcon}></Icon>
                  </div>
                </div>
              </TextContainer>
            </Link>
          </Modal.Section> */}
        </Modal>
      </div>

      <br />
      <br />
    </Page>
  );
}
