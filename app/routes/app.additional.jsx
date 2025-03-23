// app/routes/admin.jsx
import React, { useState } from "react";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { Page, Card, TextField, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  try {
    const response = await admin.graphql(`
      query{
        shop{
          id
        }
      }
    `);
    const shop = await response.json();
    // console.log(shop.data.shop.id);
    return { id: shop.data.shop.id };
  } catch (error) {
    return { message: "owner not found", error: error };
  }
}

export async function action({ request }) {
  const { admin } = await authenticate.admin(request); // Adjust authentication as needed for your environment
  const formData = await request.formData();

  console.log("formData:", formData);

  const shopId = formData.get("shopId");
  const thresholdHigh = formData.get("thresholdHigh");
  const discountHigh = formData.get("discountHigh");
  const thresholdLow = formData.get("thresholdLow");
  const discountLow = formData.get("discountLow");

  const config = JSON.stringify({
    shopId: shopId,
    thresholdHigh: Number(thresholdHigh),
    discountHigh: Number(discountHigh),
    thresholdLow: Number(thresholdLow),
    discountLow: Number(discountLow),
  });

  try {
    const response = await admin.graphql(
      `#graphql
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            key
            namespace
            value
            createdAt
            updatedAt
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              key: "discount",
              namespace: "onproduct",
              ownerId: shopId,
              type: "json",
              value: config,
            },
          ],
        },
      },
    );

    const data = await response.json();

    return data;
  } catch (error) {
    console.log(error);
    return json({ error: error.message }, { status: 500 });
  }
}

export default function AdminPage() {
  const data = useActionData();
  const { id } = useLoaderData();
  console.log("actiondata:", data, "shopId:", id);
  const [formData, setFormData] = useState({
    thresholdHigh: "",
    discountHigh: "",
    thresholdLow: "",
    discountLow: "",
  });

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  return (
    <Page title="Dynamic Discount Configuration" fullWidth>
      <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
        <Card sectioned>
          <Form
            method="post"
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <input type="hidden" name="shopId" value={id} />
            <TextField
              label="High Discount Quantity Threshold"
              name="thresholdHigh"
              type="number"
              placeholder="e.g., 5"
              helpText="Minimum quantity for high discount"
              value={formData.thresholdHigh}
              onChange={(value) => handleChange("thresholdHigh", value)}
            />
            <TextField
              label="High Discount Percentage"
              name="discountHigh"
              type="text"
              placeholder="e.g., 0.15 for 15%"
              helpText="Discount rate when threshold is met"
              value={formData.discountHigh}
              onChange={(value) => handleChange("discountHigh", value)}
            />
            <TextField
              label="Low Discount Quantity Threshold"
              name="thresholdLow"
              type="number"
              placeholder="e.g., 3"
              helpText="Minimum quantity for low discount"
              value={formData.thresholdLow}
              onChange={(value) => handleChange("thresholdLow", value)}
            />
            <TextField
              label="Low Discount Percentage"
              name="discountLow"
              type="text"
              placeholder="e.g., 0.10 for 10%"
              helpText="Discount rate when threshold is met"
              value={formData.discountLow}
              onChange={(value) => handleChange("discountLow", value)}
            />
            <Button primary submit>
              Save Configuration
            </Button>
          </Form>
        </Card>
      </div>
    </Page>
  );
}
