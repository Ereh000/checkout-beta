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
  Banner,
} from "@shopify/polaris";

import {
  authenticate,
  BASIC_PLAN,
  PLUS_PLAN,
  PLUS_ADVANCED,
  BASIC_PLAN_YEARLY,
  PLUS_PLAN_YEARLY,
  PLUS_ADVANCED_YEARLY,
} from "../shopify.server";

import { useFetcher, useLoaderData } from "@remix-run/react";

export async function loader({ request }) {
  // Import the entire module first
  // const shopify = await import("../server");
  const { BillingInterval } = await import("@shopify/shopify-api");
  // Then authenticate to get the billing object
  const { billing } = await authenticate.admin(request);

  // Check which plans the user has
  const subscriptions = await billing.check({
    plans: [
      BASIC_PLAN,
      PLUS_PLAN,
      PLUS_ADVANCED,
      BASIC_PLAN_YEARLY,
      PLUS_PLAN_YEARLY,
      PLUS_ADVANCED_YEARLY,
    ],
    isTest: true,
  });

  console.log("Subscriptions:", subscriptions);

  // Get billing configuration
  const billingConfig = {
    // Monthly plans
    [BASIC_PLAN]: {
      amount: 19.99,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
    },
    [PLUS_PLAN]: {
      amount: 39.99,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
    },
    [PLUS_ADVANCED]: {
      amount: 49.99,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
    },
    // Yearly plans
    [BASIC_PLAN_YEARLY]: {
      amount: 179.99,
      currencyCode: "USD",
      interval: BillingInterval.Annual,
    },
    [PLUS_PLAN_YEARLY]: {
      amount: 359.99,
      currencyCode: "USD",
      interval: BillingInterval.Annual,
    },
    [PLUS_ADVANCED_YEARLY]: {
      amount: 455.99,
      currencyCode: "USD",
      interval: BillingInterval.Annual,
    },
  };

  // Return plan constants to the client along with active plan and pricing
  return {
    activePlan:
      subscriptions.appSubscriptions.length > 0
        ? subscriptions.appSubscriptions[0].name
        : null,
    planConstants: {
      BASIC_PLAN: BASIC_PLAN,
      PLUS_PLAN: PLUS_PLAN,
      PLUS_ADVANCED: PLUS_ADVANCED,
      BASIC_PLAN_YEARLY: BASIC_PLAN_YEARLY,
      PLUS_PLAN_YEARLY: PLUS_PLAN_YEARLY,
      PLUS_ADVANCED_YEARLY: PLUS_ADVANCED_YEARLY,
    },
    billingConfig,
  };
}

export default function MainSubscriptionManage() {
  const { activePlan, planConstants, billingConfig } = useLoaderData();
  const {
    BASIC_PLAN,
    PLUS_PLAN,
    PLUS_ADVANCED,
    BASIC_PLAN_YEARLY,
    PLUS_PLAN_YEARLY,
    PLUS_ADVANCED_YEARLY,
  } = planConstants || {};

  console.log("Active Plan:", activePlan);

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const upgradeFetcher = useFetcher(); // Rename existing fetcher for clarity
  const cancelFetcher = useFetcher(); // Add a new fetcher for cancellation
  const isUpgrading = upgradeFetcher.state !== "idle";
  const isCancelling = cancelFetcher.state !== "idle";

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

  // Use dynamic pricing from billing config
  const prices = {
    monthly: {
      basic: billingConfig[BASIC_PLAN]
        ? `$${billingConfig[BASIC_PLAN].amount}`
        : "$19.99",
      plus: billingConfig[PLUS_PLAN]
        ? `$${billingConfig[PLUS_PLAN].amount}`
        : "$39.99",
      plusAdvanced: billingConfig[PLUS_ADVANCED]
        ? `$${billingConfig[PLUS_ADVANCED].amount}`
        : "$49.99",
    },
    yearly: {
      basic: billingConfig[BASIC_PLAN_YEARLY]
        ? `$${billingConfig[BASIC_PLAN_YEARLY].amount}`
        : "$179.99",
      plus: billingConfig[PLUS_PLAN_YEARLY]
        ? `$${billingConfig[PLUS_PLAN_YEARLY].amount}`
        : "$359.99",
      plusAdvanced: billingConfig[PLUS_ADVANCED_YEARLY]
        ? `$${billingConfig[PLUS_ADVANCED_YEARLY].amount}`
        : "$455.99",
    },
  };

  // Calculate monthly equivalent for yearly plans for display
  const yearlyMonthlyEquivalent = {
    basic: billingConfig[BASIC_PLAN_YEARLY]
      ? `$${(billingConfig[BASIC_PLAN_YEARLY].amount / 12).toFixed(2)}`
      : "$14.99",
    plus: billingConfig[PLUS_PLAN_YEARLY]
      ? `$${(billingConfig[PLUS_PLAN_YEARLY].amount / 12).toFixed(2)}`
      : "$29.99",
    plusAdvanced: billingConfig[PLUS_ADVANCED_YEARLY]
      ? `$${(billingConfig[PLUS_ADVANCED_YEARLY].amount / 12).toFixed(2)}`
      : "$37.99",
  };

  const selectedBilling = selectedTabIndex === 0 ? "monthly" : "yearly";
  const priceSuffix = selectedTabIndex === 0 ? "/mo" : "/mo"; // Adjust suffix if needed

  // For yearly billing, we'll show the monthly equivalent
  const displayPrices =
    selectedTabIndex === 0 ? prices.monthly : yearlyMonthlyEquivalent;

  // For yearly billing, we'll show the total yearly price in a smaller text
  const yearlyTotalPrices = prices.yearly;

  const handleSubscribe = (plan) => {
    upgradeFetcher.submit( // Use the upgradeFetcher
      {
        plan,
        billingType: selectedBilling,
      },
      { method: "post", action: "/api/upgrade-subscription" },
    );
  };

  // Add a handler for cancellation
  const handleCancelSubscription = () => {
    // You might want to add a confirmation dialog here
    cancelFetcher.submit(
      {}, // No specific data needed, the action will find the active plan
      { method: "post", action: "/api/cancel-subscription" }
    );
  };

  // Helper function to check if a plan is active
  const isPlanActive = (planName) => {
    if (!activePlan) return false;

    // Map the plan names to match the ones returned by the billing API
    const planMapping = {
      basic: BASIC_PLAN,
      plus: PLUS_PLAN,
      plusAdvanced: PLUS_ADVANCED,
      basicYearly: BASIC_PLAN_YEARLY,
      plusYearly: PLUS_PLAN_YEARLY,
      plusAdvancedYearly: PLUS_ADVANCED_YEARLY,
    };

    return activePlan === planMapping[planName];
  };

  // Get human-readable plan name for the banner
  const getReadablePlanName = () => {
    if (!activePlan) return "";

    if (activePlan === BASIC_PLAN) return "Basic Plan";
    if (activePlan === PLUS_PLAN) return "Plus Plan";
    if (activePlan === PLUS_ADVANCED) return "Plus Advanced Plan";

    return activePlan; // Fallback to the raw plan name
  };

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
      {activePlan && (
        <>
          <Banner
            title={`You are currently subscribed to the ${getReadablePlanName()}`}
            tone="success"
          >
            <BlockStack gap="200"> {/* Use BlockStack for vertical spacing */}
              <p>
                You can upgrade your plan at any time to access more features.s
              </p>
              {/* Add Cancel Button Here */}
              <Box> {/* Wrap button for layout control if needed */}
                <Button 
                  onClick={handleCancelSubscription}
                  loading={isCancelling}
                  disabled={isCancelling || isUpgrading} // Disable if any action is in progress
                  destructive // Use destructive style for cancellation
                >
                  Cancel Subscription
                </Button>
              </Box>
              {/* Display cancellation success/error message */}
              {cancelFetcher.data?.success === false && (
                 <Banner title="Cancellation Failed" tone="critical">
                   <p>{cancelFetcher.data.error || "An unknown error occurred."}</p>
                 </Banner>
              )}
               {/* Optionally show a success message, though the page might reload or banner disappear */}
               {cancelFetcher.data?.success === true && (
                 <Banner title="Subscription Cancelled" tone="success">
                   <p>Your subscription has been cancelled successfully.</p>
                 </Banner>
               )}
            </BlockStack>
          </Banner>
          <br />
        </>
      )}

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
                    {displayPrices.basic}
                  </Text>
                  <Box paddingBlockStart="100">
                    <Text as="span" variant="bodyMd" tone="subdued">
                      {priceSuffix}
                    </Text>
                  </Box>
                </InlineStack>
                {selectedTabIndex === 1 && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    {yearlyTotalPrices.basic} billed annually
                  </Text>
                )}
                <Button
                  onClick={() =>
                    handleSubscribe(
                      selectedTabIndex === 0 ? "basic" : "basicYearly",
                    )
                  }
                  variant="primary"
                  size="large"
                  loading={
                    isUpgrading && // Use isUpgrading
                    (upgradeFetcher.formData?.get("plan") === "basic" ||
                      upgradeFetcher.formData?.get("plan") === "basicYearly")
                  }
                  disabled={
                    isPlanActive("basic") || isPlanActive("basicYearly") || isCancelling || isUpgrading // Also disable if cancelling/upgrading
                  }
                >
                  {isPlanActive("basic") || isPlanActive("basicYearly")
                    ? "Current Plan"
                    : "Try For Free"}
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
                  <Text as="p" variant="headingXl" fontWeight="bold">
                    {displayPrices.plus}
                  </Text>
                  <Box paddingBlockStart="100">
                    <Text as="span" variant="bodyMd" tone="subdued">
                      {priceSuffix}
                    </Text>
                  </Box>
                </InlineStack>
                {selectedTabIndex === 1 && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    {yearlyTotalPrices.plus} billed annually
                  </Text>
                )}
                <Button
                  onClick={() =>
                    handleSubscribe(
                      selectedTabIndex === 0 ? "plus" : "plusYearly",
                    )
                  }
                  variant="primary"
                  size="large"
                  loading={
                    isUpgrading && // Use isUpgrading
                    (upgradeFetcher.formData?.get("plan") === "plus" ||
                      upgradeFetcher.formData?.get("plan") === "plusYearly")
                  }
                  disabled={isPlanActive("plus") || isPlanActive("plusYearly") || isCancelling || isUpgrading} // Also disable if cancelling/upgrading
                >
                  {/* Corrected: Check for 'plus' or 'plusYearly' */}
                  {isPlanActive("plus") || isPlanActive("plusYearly")
                    ? "Current Plan"
                    : "Plus Plan"}
                </Button>
                {/* Corrected: Check for 'plus' or 'plusYearly' */}
                {isPlanActive("plus") || isPlanActive("plusYearly") ? (
                  <Text as="p" variant="bodySm" tone="success">
                    Your active subscription
                  </Text>
                ) : (
                  <Text
                    alignment="center"
                    as="p"
                    variant="bodySm"
                    tone="subdued"
                  >
                    If you are on the Shopify Plus Trial Please Contact Us To
                    Upgrade
                  </Text>
                )}
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
                  <Text as="p" variant="headingXl" fontWeight="bold">
                    {displayPrices.plusAdvanced}
                  </Text>
                  <Box paddingBlockStart="100">
                    <Text as="span" variant="bodyMd" tone="subdued">
                      {priceSuffix}
                    </Text>
                  </Box>
                </InlineStack>
                {selectedTabIndex === 1 && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    {yearlyTotalPrices.plusAdvanced} billed annually
                  </Text>
                )}
                <Button
                  onClick={() =>
                    handleSubscribe(
                      selectedTabIndex === 0 ? "plusAdvanced" : "plusAdvancedYearly",
                    )
                  }
                  variant="primary"
                  size="large"
                  loading={
                    isUpgrading && // Use isUpgrading
                    (upgradeFetcher.formData?.get("plan") === "plusAdvanced" ||
                      upgradeFetcher.formData?.get("plan") === "plusAdvancedYearly")
                  }
                   /* Corrected: Check for 'plusAdvanced' or 'plusAdvancedYearly' */
                  disabled={isPlanActive("plusAdvanced") || isPlanActive("plusAdvancedYearly")}
                >
                  {isPlanActive("plusAdvanced") || isPlanActive("plusAdvancedYearly")
                    ? "Current Plan"
                    : "Plus Advanced Plan"}
                </Button>
                {isPlanActive("plusAdvanced") || isPlanActive("plusAdvancedYearly") ? (
                  <Text as="p" variant="bodySm" tone="success">
                    Your active subscription
                  </Text>
                ) : (
                  <Text
                    as="p"
                    alignment="center"
                    variant="bodySm"
                    tone="subdued"
                  >
                    If you are on the Shopify Plus Trial Please Contact Us To
                    Upgrade
                  </Text>
                )}
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

// export const action = async ({ request }) => {
//   // Import server-side modules only in server functions
//   const { billing, authenticate, BASIC_PLAN, PLUS_PLAN, PLUS_ADVANCED } =
//     await import("../server");
//   const { session } = await authenticate.admin(request);
//   const shop = session.shop.replace(".mycom", "");

//   const formData = await request.formData();
//   const plan = formData.get("plan");
//   const billingType = formData.get("billingType");

//   console.log("Form Data:", formData);

//   // Determine which plan to use based on the form data
//   switch (plan) {
//     case "basic":
//       await billing.require({
//         plans: [BASIC_PLAN],
//         onFailure: async () =>
//           billing.request({
//             plan: BASIC_PLAN,
//             isTest: true,
//             returnUrl: `https://admin.com/store/${shop}/apps/checkout-deploy-2/app/subscription-manage`,
//           }),
//       });
//       break;
//     case "plus":
//       await billing.require({
//         plans: [PLUS_PLAN],
//         onFailure: async () =>
//           billing.request({
//             plan: PLUS_PLAN,
//             isTest: true,
//             returnUrl: `https://admin.com/store/${shop}/apps/checkout-deploy-2/app/subscription-manage`,
//           }),
//       });
//       break;
//     case "plusAdvanced":
//       await billing.require({
//         plans: [PLUS_ADVANCED],
//         onFailure: async () =>
//           billing.request({
//             plan: PLUS_ADVANCED,
//             isTest: true,
//             returnUrl: `https://admin.com/store/${shop}/apps/checkout-deploy-2/app/subscription-manage`,
//           }),
//       });
//       break;
//   }

//   return { success: true };
// };
