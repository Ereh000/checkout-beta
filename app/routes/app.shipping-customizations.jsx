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
  // Link,
} from "@shopify/polaris";
import { ArrowRightIcon } from "@shopify/polaris-icons"; // Importing Close Icon
import { Link } from "@remix-run/react";

export default function PaymentCustomization() {
  // State to control modal visibility
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Page
      backAction={{ content: "Settings", url: "#" }}
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

      {/* Polaris Modal */}
      <div className="shipping_customization_model">
        <Modal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          title="Select A Customization"
        >
          {/* Option 1 */}
          <Modal.Section>
            <Link to={'/app/hide-shipping-method'} style={{ textDecoration: "none", color: "#000" }}>
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
            <Link to={'/app/shipping-add-message'} style={{ textDecoration: "none", color: "#000" }}>
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
          {/* Option 3 */}
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
          {/* Option 4 */}
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
          </Modal.Section>
        </Modal>
      </div>
    </Page>
  );
}
