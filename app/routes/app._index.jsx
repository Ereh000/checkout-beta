import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  TextContainer,
  Grid,
  Icon,
  MediaCard,
  VideoThumbnail,
} from "@shopify/polaris";

import {
  AlertCircleIcon,
  CartUpIcon,
  CartIcon,
  CreditCardSecureIcon,
  DeliveryFilledIcon,
  GiftCardIcon,
  OrderFulfilledIcon,
  ShareIcon,
  StoreIcon,
  ToggleOffIcon,
  AppsIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { json, useLoaderData } from "@remix-run/react";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query GetCheckoutProfile {
      checkoutProfiles(first: 1, query: "is_published:true") {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `);

  const data = await response.json();
  const checkoutProfile = data.data.checkoutProfiles.edges[0].node;
  console.log("checkoutProfile", checkoutProfile);

  // const checkoutProfileId = checkoutProfile.id;
  // Extract the numeric ID from the GID
  const profileId = checkoutProfile.id.split("/").pop();

  return json({
    checkoutProfileId: profileId,
    shop: session.shop.split(".myshopify.com")[0], // Get shop name without domain
  });
}

// import { Redirect

export default function Index() {
  return (
    <Page>
      <br />
      <Layout>
        <Grid>
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 8, xl: 8 }}>
            <PaymentAndShippingCustomizations />
          </Grid.Cell>
          {/*  */}
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }}>
            <MediaCard
              portrait
              title="Getting Started with Checkout Plus"
              primaryAction={{
                content: "Learn more",
                onAction: () => {},
              }}
              description="Thank you for using Checkout Plus. Here is an in depth guide on how to get customize your checkout using Checkout Plus."
              popoverActions={[{ content: "Dismiss", onAction: () => {} }]}
            >
              <VideoThumbnail
                videoLength={80}
                thumbnailUrl="https://94m.app/images/Getting-Started-Thumbnail.webp"
                onClick={() => console.log("clicked")}
              />
            </MediaCard>
          </Grid.Cell>
          {/* row 2 */}
          <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 8, xl: 8 }}>
            <ExtensionsSection />
          </Grid.Cell>
        </Grid>
      </Layout>
      <br />
      <br />
    </Page>
  );
}

export function PaymentAndShippingCustomizations() {
  return (
    <Card sectioned>
      <div>
        <h2 style={{ marginBottom: "20px", fontWeight: "bold" }}>
          Payment & Shipping Customizations
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Payment Customizations */}
          <Card>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Icon source={CreditCardSecureIcon} color="base" />
                <div>
                  <strong>Payment Customizations</strong>
                  <p
                    style={{
                      marginTop: "5px",
                      fontSize: "14px",
                      color: "#6B7280",
                    }}
                  >
                    Hide, modify or reorder your payment options at checkout
                  </p>
                </div>
              </div>
              <Button variant="primary" url="/app/payment-customization">
                Manage
              </Button>
            </div>
          </Card>

          {/* Shipping Customizations */}
          <Card>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Icon source={DeliveryFilledIcon} color="base" />
                <div>
                  <strong>Shipping Customizations</strong>
                  <p
                    style={{
                      marginTop: "5px",
                      fontSize: "14px",
                      color: "#6B7280",
                    }}
                  >
                    Add a message or hide your shipping methods
                  </p>
                </div>
              </div>
              <Button url="/app/shipping-customizations" variant="primary">
                Manage
              </Button>
            </div>
          </Card>

          {/* Order Validations */}
          {/* <Card>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Icon source={AlertCircleIcon} color="critical" />
                <div>
                  <strong>Order Validations</strong>
                  <p
                    style={{
                      marginTop: "5px",
                      fontSize: "14px",
                      color: "#6B7280",
                    }}
                  >
                    Block suspicious orders based on address, customer tags, etc
                  </p>
                </div>
              </div>
              <Button variant="primary">Comming Soon</Button> 
            </div>
          </Card> */}
        </div>
      </div>
    </Card>
  );
}

function ExtensionsSection() {
  // checkoutProfileId response: id: 'gid://shopify/CheckoutProfile/1314324837',
  const { checkoutProfileId, shop } = useLoaderData();

  return (
    <Card>
      <div>
        <h2 style={{ marginBottom: "20px", fontWeight: "bold" }}>Extensions</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {/* Checkout Extensions */}
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
              }}
            >
              <div
                className="icon"
                style={{
                  display: "flex",
                  alignTtems: "baseline",
                  width: "3rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px 15px",
                  aspectRatio: "1/1",
                }}
              >
                <CartIcon />
              </div>
              <strong style={{ marginTop: "10px" }}>Checkout Extensions</strong>
              <p
                style={{
                  marginTop: "5px",
                  color: "#6B7280",
                  textAlign: "left",
                }}
              >
                Custom messages, gift message, trust badges, etc
              </p>
              <br />
              <Button
                onClick={() => {
                  const url = `https://admin.shopify.com/store/${shop}/settings/checkout/editor/profiles/${checkoutProfileId}?page=checkout`;
                  window.open(url, "_blank"); // Opens the URL in a new tab
                }}
                plain
                style={{ marginTop: "10px" }}
              >
                Get Started
              </Button>
            </div>
          </Card>

          {/* Thank You Extensions */}
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
              }}
            >
              <div
                className="icon"
                style={{
                  display: "flex",
                  alignTtems: "baseline",
                  width: "3rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px 15px",
                  aspectRatio: "1/1",
                }}
              >
                <StoreIcon />
              </div>
              <strong style={{ marginTop: "10px" }}>
                Thank You Extensions
              </strong>
              <p
                style={{
                  marginTop: "5px",
                  color: "#6B7280",
                  textAlign: "left",
                }}
              >
                Custom messages, share social media, contact info, etc
              </p>
              <br />
              <Button
                onClick={() => {
                  const url = `https://admin.shopify.com/store/${shop}/settings/checkout/editor/profiles/${checkoutProfileId}?page=thank-you`;
                  window.open(url, "_blank"); // Opens the URL in a new tab
                }}
                plain
                style={{ marginTop: "10px" }}
              >
                Get Started
              </Button>
            </div>
          </Card>

          {/* Order Status Extensions */}
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
              }}
            >
              <div
                className="icon"
                style={{
                  display: "flex",
                  alignTtems: "baseline",
                  width: "3rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px 15px",
                  aspectRatio: "1/1",
                }}
              >
                <OrderFulfilledIcon />
              </div>
              <strong style={{ marginTop: "10px" }}>
                Order Status Extensions
              </strong>
              <p
                style={{
                  marginTop: "5px",
                  color: "#6B7280",
                  textAlign: "left",
                }}
              >
                Custom messages, share social media, contact info, etc
              </p>
              <br />
              <Button
                plain
                onClick={() => {
                  const url = `https://admin.shopify.com/store/${shop}/settings/checkout/editor/profiles/${checkoutProfileId}?page=order-status`;
                  window.open(url, "_blank"); // Opens the URL in a new tab
                }}
                style={{ marginTop: "10px" }}
              >
                Get Started
              </Button>
            </div>
          </Card>

          {/* Upsells */}
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
              }}
            >
              <div
                className="icon"
                style={{
                  display: "flex",
                  alignTtems: "baseline",
                  width: "3rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px 15px",
                  aspectRatio: "1/1",
                }}
              >
                <CartUpIcon />
              </div>
              <strong style={{ marginTop: "10px" }}>Upsells</strong>
              <p
                style={{
                  marginTop: "5px",
                  color: "#6B7280",
                  textAlign: "left",
                }}
              >
                Offer advanced customizations like upsells
              </p>
              <br />
              {/* Add the url prop here */}
              <Button
                plain
                url="/app/manage-upsell"
                style={{ marginTop: "10px" }}
              >  
                Manage
              </Button>
            </div>
          </Card>

          {/* Automatic Product Offer */}
          {/* <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
              }}
            >
              <div
                className="icon"
                style={{
                  display: "flex",
                  alignTtems: "baseline",
                  width: "3rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px 15px",
                  aspectRatio: "1/1",
                }}
              >
                <CartIcon />
              </div>
              <strong style={{ marginTop: "10px" }}>
                Automatic Product Offer
              </strong>
              <p
                style={{
                  marginTop: "5px",
                  color: "#6B7280",
                  textAlign: "left",
                }}
              >
                Auto offer a gift or product to the cart at checkout
              </p>
              <br />
              <Button plain style={{ marginTop: "10px" }}>
                Manage
              </Button>
            </div>
          </Card> */}

          {/* Survey or Form */}
          {/* <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
              }}
            >
              <div
                className="icon"
                style={{
                  display: "flex",
                  alignTtems: "baseline",
                  width: "3rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px 15px",
                  aspectRatio: "1/1",
                }}
              >
                <CartIcon />
              </div>
              <strong style={{ marginTop: "10px" }}>Survey or Form</strong>
              <p
                style={{
                  marginTop: "5px",
                  color: "#6B7280",
                  textAlign: "left",
                }}
              >
                Create a survey or form to collect customer information
              </p>
              <br />
              <Button plain style={{ marginTop: "10px" }}>
                Manage
              </Button>
            </div>
          </Card> */}

          {/* Explore more extension */}
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "left",
              }}
            >
              <div
                className="icon"
                style={{
                  display: "flex",
                  alignTtems: "baseline",
                  width: "3rem",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "12px 15px",
                  aspectRatio: "1/1",
                }}
              >
                <AppsIcon />
              </div>
              <strong style={{ marginTop: "10px" }}>Explore more extensions</strong>
              <p
                style={{
                  marginTop: "5px",
                  color: "#6B7280",
                  textAlign: "left",
                }}
              >
                Browse more extensions for your store
              </p>
              <br />
              <Button
                onClick={() => {
                  const url = `https://admin.shopify.com/store/${shop}/settings/checkout/editor/profiles/${checkoutProfileId}?page=checkout`;
                  window.open(url, "_blank"); // Opens the URL in a new tab
                }}
                plain
                style={{ marginTop: "10px" }}
              >
                See more option
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}
