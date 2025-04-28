import React, { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  Tabs,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  Divider,
  Box,
  Link,
} from "@shopify/polaris";

export default function MainSubscriptionManage() {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelectedTabIndex(selectedTabIndex),
    [],
  );

  const tabs = [
    {
      id: "monthly",
      content: "Pay Monthly",
      accessibilityLabel: "Pay Monthly",
      panelID: "monthly-content",
    },
    {
      id: "yearly",
      content: (
        <InlineStack gap="200" blockAlign="center">
          Pay Yearly <Badge tone="success">Save 25%</Badge>
        </InlineStack>
      ),
      panelID: "yearly-content",
    },
  ];

  // Prices can be adjusted based on the selected tab (Monthly/Yearly)
  // For simplicity, we'll use the monthly prices shown in the image.
  // You would typically fetch these dynamically or adjust based on state.
  const prices = {
    monthly: {
      basic: "$19.99",
      plus: "$39.99",
      plusAdvanced: "$49.99",
    },
    yearly: {
      // Example yearly prices (adjust as needed)
      basic: "$14.99",
      plus: "$29.99",
      plusAdvanced: "$37.49",
    },
  };

  const selectedBilling = selectedTabIndex === 0 ? "monthly" : "yearly";
  const priceSuffix = selectedTabIndex === 0 ? "/mo" : "/mo"; // Adjust suffix if needed

  const renderPlanFeatures = (plan) => {
    const features = {
      basic: [
        {
          title: "Spotlight Feature",
          description: "Thank You Page App Blocks",
          included: true,
        },
        { title: "Order Status Page App Blocks", included: true },
        { title: "Payment Customizations", included: true },
        { title: "Shipping Customizations", included: true },
        { title: "Order Validations", included: true },
        { title: "Cart & Checkout Links", included: true },
        { title: "Trial Period", description: "7-day", included: false }, // 'included' flag controls the "Included" text
      ],
      plus: [
        {
          title: "Spotlight Feature",
          description: "Checkout App Blocks",
          included: true,
        },
        { title: "Thank You Page App Blocks", included: true },
        { title: "Order Status Page App Blocks", included: true },
        { title: "Payment Customizations", included: true },
        { title: "Shipping Customizations", included: true },
        { title: "Cart & Checkout Links", included: true },
        { title: "Trial Period", description: "7-day", included: false },
      ],
      plusAdvanced: [
        {
          title: "Spotlight Feature",
          description: "Upsell App Blocks",
          included: true,
        },
        { title: "Auto Offer Product or Gift At Checkout", included: true },
        { title: "Surveys & Forms", included: true },
        { title: "Checkout App Blocks", included: true },
        { title: "Thank You Page App Blocks", included: true },
        { title: "Order Status Page App Blocks", included: true },
        { title: "Payment Customizations", included: true },
        { title: "Shipping Customizations", included: true },
        { title: "Cart & Checkout Links", included: true },
        { title: "Trial Period", description: "7-day", included: false },
      ],
    };

    return (
      <BlockStack gap="300">
        {features[plan].map((feature, index) => (
          <React.Fragment key={index}>
            <BlockStack gap="050">
              <Text
                as="h3"
                variant={
                  feature.title === "Spotlight Feature"
                    ? "headingSm"
                    : "headingSm"
                }
                fontWeight={
                  feature.title === "Spotlight Feature" ? "bold" : "medium"
                }
              >
                {feature.title}
              </Text>
              {feature.description && (
                <Text
                  as="p"
                  variant="bodyMd"
                  tone={
                    feature.title === "Spotlight Feature"
                      ? "success"
                      : "subdued"
                  }
                >
                  {feature.description}
                </Text>
              )}
              {feature.included && (
                <Text as="p" variant="bodySm" tone="subdued">
                  Included
                </Text>
              )}
            </BlockStack>
            {index < features[plan].length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </BlockStack>
    );
  };

  return (
    <Page title="Manage Subscription">
      <Box paddingBlockEnd="400">
        <Card padding="0">
          <Tabs
            tabs={tabs}
            selected={selectedTabIndex}
            onSelect={handleTabChange}
            fitted
          />
        </Card>
      </Box>

      {/* Content based on selected tab can be rendered here if needed */}
      {/* For this example, the plans are always visible, only prices might change */}

      <Layout>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <div
                className=""
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <Text variant="headingXl" as="h2" fontWeight="bold">
                  Basic Plan
                </Text>
                <InlineStack align="start" gap="050">
                  <Text as="p" variant="headingXl" fontWeight="bold">
                    {prices[selectedBilling].basic}
                  </Text>
                  <Box paddingBlockStart="100">
                    <Text as="span" variant="bodyMd" tone="subdued">
                      {priceSuffix}
                    </Text>
                  </Box>
                </InlineStack>
                <Button variant="primary" size="large">
                  Try For Free
                </Button>
              </div>
              <Divider />
              {renderPlanFeatures("basic")}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <div
                className=""
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <Text variant="headingXl" as="h2" fontWeight="bold">
                  Plus Plan
                </Text>
                <InlineStack align="start" gap="050">
                  <Text as="p" variant="headingXl" fontWeight="semibold">
                    {prices[selectedBilling].plus}
                  </Text>
                  <Box paddingBlockStart="100">
                    <Text as="span" variant="bodyMd" tone="subdued">
                      {priceSuffix}
                    </Text>
                  </Box>
                </InlineStack>
                <Button variant="primary" size="large">
                  Shopify Plus Only
                </Button>
                <Text alignment="center" as="p" variant="bodySm" tone="subdued">
                  If you are on the Shopify Plus Trial Please Contact Us To
                  Upgrade
                </Text>
              </div>
              <Divider />
              {renderPlanFeatures("plus")}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <div
                className=""
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <Text variant="headingXl" as="h2" fontWeight="bold">
                  Plus Advanced
                </Text>
                <InlineStack align="start" gap="050">
                  <Text as="p" variant="headingXl" fontWeight="semibold">
                    {prices[selectedBilling].plusAdvanced}
                  </Text>
                  <Box paddingBlockStart="100">
                    <Text as="span" variant="bodyMd" tone="subdued">
                      {priceSuffix}
                    </Text>
                  </Box>
                </InlineStack>
                <Button variant="primary" size="large">
                  Shopify Plus Only
                </Button>
                <Text as="p" alignment="center" variant="bodySm" tone="subdued">
                  If you are on the Shopify Plus Trial Please Contact Us To
                  Upgrade
                </Text>
              </div>
              <Divider />
              {renderPlanFeatures("plusAdvanced")}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Box paddingBlockStart="800" paddingBlockEnd="400">
        <InlineStack align="center">
          <Text as="p" variant="bodyMd">
            Have a question or feature request for Checkout Plus?{" "}
            <Link url="#">Contact Us</Link>
          </Text>
        </InlineStack>
      </Box>
    </Page>
  );
}
 







