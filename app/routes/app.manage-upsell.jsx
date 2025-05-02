import React, { useState } from "react";
import { json, useFetcher, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  Page,
  LegacyCard,
  IndexTable,
  Text,
  Button,
  ButtonGroup,
  Toast,
  Modal,
  TextContainer,
  EmptyState,
  MediaCard,
  VideoThumbnail,
} from "@shopify/polaris";

// Add loader function
export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(`
      query {
        shop {
          id
        }
      }
    `);
    const data = await response.json();
    // const { shop } = data;

    // Fetch all upsells for this shop
    const upsells = await prisma.upsellSettings.findMany({
      where: {
        shopId: data.data.shop.id,
      },
      select: {
        id: true,
        upsellName: true,
        selectionType: true,
        selectedProducts: true,
        selectedCollections: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { upsells };
  } catch (error) {
    console.error("Loader error:", error);
    return { upsells: [] };
  }
}

// Add action function for delete
export async function action({ request }) {
  const formData = await request.formData();
  const id = formData.get("id");

  try {
    await prisma.upsellSettings.delete({
      where: {
        id: parseInt(id),
      },
    });
    return json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return json(
      { success: false, error: "Failed to delete upsell" },
      { status: 500 },
    );
  }
}

export default function ManageUpsell() {
  const { upsells } = useLoaderData();
  const fetcher = useFetcher();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUpsell, setSelectedUpsell] = useState(null);

  const handleDeleteClick = (upsell) => {
    setSelectedUpsell(upsell);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedUpsell) {
      fetcher.submit(
        { action: "delete", id: selectedUpsell.id },
        { method: "POST" },
      );
      setDeleteModalOpen(false);
      setSelectedUpsell(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSelectedUpsell(null);
  };

  const getConditionType = (upsell) => {
    console.log("upsell:", upsell);
    if (upsell.selectedProducts && upsell.selectedProducts.length > 0) {
      return "Selected Products";
    } else if (
      upsell.selectedCollections &&
      upsell.selectedCollections.length > 0
    ) {
      return "Selected Collections";
    } else {
      return "All Products";
    }
  };

  const rowMarkup = upsells.map((upsell, index) => (
    <IndexTable.Row id={upsell.id} key={upsell.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold">
          {upsell.upsellName}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd">
          {/* {getConditionType(upsell)} */}
          {upsell.selectionType === "all"
            ? "All Products"
            : getConditionType(upsell)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {new Date(upsell.createdAt).toLocaleDateString()}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <ButtonGroup>
          <Button plain url={`/app/create-upsell?id=${upsell.id}`}>
            Edit
          </Button>
          <Button
            variant="primary"
            tone="critical"
            onClick={() => handleDeleteClick(upsell)}
          >
            Delete
          </Button>
        </ButtonGroup>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Manage Upsells"
      primaryAction={
        <Button variant="primary" url="/app/create-upsell">
          Create Upsell
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

      <LegacyCard>
        <IndexTable
          resourceName={{ singular: "Upsell", plural: "Upsells" }}
          itemCount={upsells.length}
          headings={[
            { title: "Upsell Name" },
            { title: "Condition Type" },
            { title: "Created Date" },
            { title: "Actions" },
          ]}
          selectable={false}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>

      {upsells.length === 0 && (
        <LegacyCard sectioned>
          <EmptyState
            heading="No upsells created yet"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Create your first upsell to start boosting your sales.</p>
          </EmptyState>
        </LegacyCard>
      )}

      <Modal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        title="Delete Upsell"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleDeleteConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleDeleteCancel,
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>
              Are you sure you want to delete the upsell "
              {selectedUpsell?.upsellName}"? This action cannot be undone.
            </p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
