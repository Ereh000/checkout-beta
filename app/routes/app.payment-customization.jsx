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
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleUpIcon,
} from "@shopify/polaris-icons"; // Importing Close Icon
import { Link } from "@remix-run/react";

export default function PaymentCustomization() {
  // State to control modal visibility
  const [isOpen, setIsOpen] = useState(false);

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
      <LegacyCard sectioned>
        <EmptyState
          heading="Manage your inventory transfers"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Track and receive your incoming inventory from suppliers.</p>
        </EmptyState>
      </LegacyCard>

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
