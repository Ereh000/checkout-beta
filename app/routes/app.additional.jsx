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
import { ArrowLeftIcon, ArrowRightIcon, CircleUpIcon } from "@shopify/polaris-icons"; // Importing Close Icon
import { Link } from "@remix-run/react";

export default function PageExample() {
  // State to control modal visibility
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Page
      backAction={{ content: "Settings", url: "#" }}
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
          onAction: () => { },
        }}
        description="Thank you for using Checkout Plus. Here is an example of using payment customizations on the checkout."
        popoverActions={[{ content: "Dismiss", onAction: () => { } }]}
      >
        <VideoThumbnail
          videoLength={80}
          thumbnailUrl="https://burst.shopifycdn.com/photos/business-woman-smiling-in-office.jpg?width=1850"
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
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Select A Customization">
        <Modal.Section>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Option 1 */}
            <Button fullWidth plain>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Hide Payment Method
                </Text>
                <Text as="span" variant="bodySm" color="subdued">
                  Hide payment methods based on order totals
                </Text>
                <div className="" style={{ width: '2rem' }}>
                  <ArrowRightIcon />
                </div>
              </div>
            </Button>

            {/* Option 2 */}
            <Link >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Change Name of Payment Method
                </Text>
                <Text as="span" variant="bodySm" color="subdued">
                  Update the name of a specific payment method
                </Text>
              </div>
            </Link>

            {/* Option 3 */}
            <Button fullWidth plain>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Reorder Payment Method
                </Text>
                <Text as="span" variant="bodySm" color="subdued">
                  Control the order in which your payment methods are displayed
                </Text>
              </div>
            </Button>

            {/* Option 4 */}
            <Button fullWidth plain>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Don't see what you are looking for?
                </Text>
                <Text as="span" variant="bodySm" color="subdued">
                  Submit a feature request and we will be happy to support your business needs
                </Text>
              </div>
            </Button>
          </div>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

