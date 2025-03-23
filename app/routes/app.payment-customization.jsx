import {
  Page,
  Button,
  LegacyCard,
  Grid,
  MediaCard,
  VideoThumbnail,
  EmptyState,
  Layout,
} from "@shopify/polaris";
import React from "react";

export default function PageExample() {
  return (
    <Page
      backAction={{ content: "Settings", url: "#" }}
      title="Payment Customizations"
      primaryAction={
        <Button url="/app/hide-payment" variant="primary">
          Create Customization
        </Button>
      }
    >
      <MediaCard
        title="How to use Payment Customizations"
        primaryAction={{
          content: "Learn more",
          onAction: () => {},
        }}
        description={`Thank you for using Checkout Plus. Here is an example of using payment customizations on the checkout.`}
        popoverActions={[{ content: "Dismiss", onAction: () => {} }]}
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

      <br />
      <br />
    </Page>
  );
}
