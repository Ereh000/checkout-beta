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
  Card,
  DataTable, // Import DataTable
  Badge, // Import Badge
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleUpIcon,
} from "@shopify/polaris-icons"; // Importing Close Icon
import { Link, useLoaderData, json } from "@remix-run/react"; // Import useLoaderData and json
import prisma from "../db.server"; // Import Prisma client
import { authenticate } from "../shopify.server"; // Import authenticate

// --- Add Loader Function ---
export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  // Fetch Shop GraphQL ID
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

  if (!shopGid) {
    console.error("Shop ID not found in loader GraphQL response:", shopIdData);
    throw new Response("Could not retrieve shop identifier.", { status: 500 });
  }

  // Fetch both types of payment customizations concurrently
  const [hideCustomizations, renameCustomizations] = await Promise.all([
    prisma.paymentHide.findMany({
      where: { shopId: shopGid }, // Filter by shop GID
      select: {
        id: true,
        customizeName: true, // Use customizeName as the common name field
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentRename.findMany({
      where: { shopId: shopGid }, // Filter by shop GID
      select: {
        id: true,
        customizeName: true, // Use customizeName as the common name field
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    // Add other prisma queries here if needed (e.g., for reorder)
  ]);

  // Combine data and add a 'type' identifier
  const allCustomizations = [
    ...hideCustomizations.map(item => ({ ...item, type: 'Hide Payment' })),
    ...renameCustomizations.map(item => ({ ...item, type: 'Rename Payment' })),
    // Add other customization types here
  ];

  // Sort combined list by creation date if needed (already sorted by Prisma)
  // allCustomizations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return json({ customizations: allCustomizations }); // Return combined data
}
// --- End Loader Function ---


export default function PaymentCustomization() {
  // State to control modal visibility
  const [isOpen, setIsOpen] = useState(false);
  // --- Use loader data ---
  const { customizations } = useLoaderData();

  // console.log('customizations:', customizations);

  // --- Prepare data for DataTable ---
  const rows = customizations.map((item) => [
    item.customizeName, // Customization Name
    item.type, // Type (e.g., "Hide Payment", "Rename Payment")
    <Badge key={`${item.id}-status`} tone={item.status === 'active' ? 'success' : 'critical'}>
      {item.status === 'active' ? 'Active' : 'Inactive'}
    </Badge>,
    <Button key={`${item.id}-edit`} url={`/app/hide-payment?id=${item.id}`} onClick={() => console.log(`Edit clicked for ${item.id}`)}>
      Edit
    </Button>, // Add Edit button logic later
  ]);
  // --- End Prepare data for DataTable ---

  return (
    <Page
      backAction={{ content: "Settings", url: "/app" }}
      title="Payment Customizations"
      primaryAction={
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Create Customization
        </Button>
      }
    >
      {/* Existing content */}
      <MediaCard
        title="How to use Payment Customizations"
        primaryAction={{
          content: "Learn more",
          onAction: () => {},
        }}
        description="Thank you for using Checkout Plus. Here is an example of using payment customizations on the checkout."
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
              "text", // Status (using Badge component)
              "text", // Edit Action
            ]}
            headings={[
              "Name",
              "Type",
              "Status",
              "Edit",
            ]}
            rows={rows} // Use the prepared rows
          />
        </LegacyCard>
      ) : (
        <LegacyCard sectioned>
          <EmptyState
            heading="No payment customizations yet"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Create a new customization to modify payment options at checkout.</p>
          </EmptyState>
        </LegacyCard>
      )}
      {/* --- End Conditional Rendering --- */}

      {/* Polaris Modal */}
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select A Customization"
      >
        <Modal.Section>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

            {/* Option 1: Hide Payment Method */}
            <Link to={'/app/hide-payment'}
              style={{
                textDecoration: "none",
                color: "#000",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Hide Payment Method
                </Text>
                <Text as="span" variant="bodySm" color="subdued">
                  Hide payment method based on Order totals
                </Text>
              </div>
              <div className="" style={{ width: "1.4rem", display: "flex" }}>
                <ArrowRightIcon />
              </div>
            </Link>

            {/* Option 2: Change Payment Method Name */}
            <Link to={'/app/rename-payment'}
              style={{
                textDecoration: "none",
                color: "#000",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Change Name of Payment Method
                </Text>
                <Text as="span" variant="bodySm" color="subdued">
                  Update the name of a specific payment method
                </Text>
              </div>
              <div className="" style={{ width: "1.4rem", display: "flex" }}>
                <ArrowRightIcon />
              </div>
            </Link>

            {/* Option 3 */}
            <Link
              style={{
                textDecoration: "none",
                color: "#000",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Reorder Payment Method
                </Text>
                <Text as="span" variant="bodySm" color="subdued">
                  Reorder the payment methods to suit your preferences
                </Text>
              </div>
              <div className="" style={{ width: "1.4rem", display: "flex" }}>
                <ArrowRightIcon />
              </div>
            </Link>

            {/* Option 2 */}
            <Link
              style={{
                textDecoration: "none",
                color: "#000",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Don't see what you looking for
                </Text>
                <Text as="span" variant="bodySm" color="subdued">
                  Submit a feature request and we will he happy to support you business need
                </Text>
              </div>
              <div className="" style={{ width: "1.4rem", display: "flex" }}>
                <ArrowRightIcon />
              </div>
            </Link>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
