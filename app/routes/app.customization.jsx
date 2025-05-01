import React, { useState, useCallback, useEffect } from "react";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  TextField,
  Text,
  Button,
  Select,
  Icon,
  Tooltip,
  Popover,
  ColorPicker,
  Banner,
} from "@shopify/polaris";
import { QuestionCircleIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { json, useFetcher, useLoaderData } from "@remix-run/react";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  // fetch checkout profile id
  const checkoutProfileId = await admin.graphql(`
    query {
        checkoutProfiles(first: 1, query: "is_published:true") {
            nodes{
            id
            }
        }
    }
  `);

  const checkoutProfileIdData = await checkoutProfileId.json();
  const checkoutId = checkoutProfileIdData.data.checkoutProfiles.nodes[0].id;
  console.log("checkoutId", checkoutId);

  // fetch checkout profile stylings -----
  const checkoutProfileStylings = await admin.graphql(
    `
   query GetCheckoutBranding($checkoutProfileId: ID!) {
      checkoutBranding(checkoutProfileId: $checkoutProfileId) {
        designSystem {
          colors{
            schemes{
              scheme1{
                base{
                  background
                  text
                  accent
                }
                control{
                  background
                  border
                  accent
                  text
                }
                primaryButton{
                  background
                  text
                  accent
                  hover{
                    background
                    text
                    accent
                  }
                }
                secondaryButton{
                  background
                  text
                  accent
                  hover{
                    background
                  }
                }
              }
            }
          }
        }
      }
    }`,
    {
      variables: { checkoutProfileId: checkoutId },
    },
  );

  const checkoutProfileStylingsData = await checkoutProfileStylings.json();
  console.log(
    "checkoutProfileStylingsData",
    checkoutProfileStylingsData.data.checkoutBranding,
  );

  const checkoutBranding = checkoutProfileStylingsData.data?.checkoutBranding;
  if (!checkoutBranding || !checkoutBranding.designSystem) {
    console.error("Checkout profile not found or missing design system");
    return json({
      success: false,
      errors: ["Checkout profile not found or missing design system"],
      checkoutProfileStylingsDataColors: null,
    });
  }

  const checkoutProfileStylingsDataColors =
    checkoutBranding.designSystem.colors;

  return json({
    success: true,
    checkoutProfileStylingsDataColors,
  });
}

// Main Customization Component
export default function CustomizationSettings() {
  const { checkoutProfileStylingsDataColors } = useLoaderData();
  console.log(
    "checkoutProfileStylingsDataColors",
    checkoutProfileStylingsDataColors,
  );

  const scheme1 = checkoutProfileStylingsDataColors
    ? checkoutProfileStylingsDataColors.schemes.scheme1
    : null;
  // console.log("scheme1", scheme1);

  const [selectedProfile, setSelectedProfile] = useState("default");
  const fetcher = useFetcher();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form state to track all color values
  const [colorValues, setColorValues] = useState({
    scheme1Background: scheme1 ? scheme1.base.background : "#ffffff",
    scheme1Foreground: scheme1 ? scheme1.base.text : "#545454",
    scheme1Accent: scheme1 && scheme1.base.accent ? scheme1.base.accent : "#1773b0",
    primaryButtonBackground: scheme1
      ? scheme1.primaryButton.background
      : "#1773b0",
    primaryButtonForeground: scheme1 ? scheme1.primaryButton.text : "#ffffff",
    primaryButtonAccent: scheme1 ? scheme1.primaryButton.accent : "#1773b0",
    primaryButtonBackgroundHover: scheme1
      ? scheme1.primaryButton.hover.background
      : "#2092e0",
    primaryButtonForegroundHover: scheme1
      ? scheme1.primaryButton.hover.text
      : "#ffffff",
    primaryButtonAccentHover: scheme1
      ? scheme1.primaryButton.hover.accent
      : "#1773b0",
    secondaryButtonBackground: scheme1
      ? scheme1.secondaryButton.background
      : "#ffffff",
    secondaryButtonForeground: scheme1
      ? scheme1.secondaryButton.text
      : "#1773b0",
    secondaryButtonAccent: scheme1 ? scheme1.secondaryButton.accent : "#1773b0",
    controlBackground: scheme1 ? scheme1.control.background : "#ffffff",
    controlForeground: scheme1 ? scheme1.control.text : "#545454",
    controlAccent: scheme1 ? scheme1.control.accent : "#1773b0",
    controlBorder: scheme1 ? scheme1.control.border : "#d9d9d9",
  });

  // Update color value handler
  const handleColorChange = (field, value) => {
    setColorValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectChange = useCallback(
    (value) => setSelectedProfile(value),  
    [],
  );

  // Handle form submission
  const handleSaveColors = () => {
    const formData = new FormData();

    // Add all color values to form data
    Object.entries(colorValues).forEach(([key, value]) => {
      formData.append(key, value);
    });

    fetcher.submit(formData, { method: "post", action: "/api/customization" });
  };

  // Add reset handler
  const handleReset = () => {
    fetcher.submit(
      { action: "reset" },
      { method: "post", action: "/api/customization" },
    );
  };

  // Handle response from action
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setSuccessMessage("Checkout colors updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(
          fetcher.data.error || "Failed to update checkout colors",
        );
        setTimeout(() => setErrorMessage(""), 5000);
      }
    }
  }, [fetcher.data]);

  const profileOptions = [
    { label: "Default Profile", value: "default" },
    { label: "Profile 1", value: "profile1" },
    // Add other profiles here
  ];

  return (
    <Page>
      <BlockStack gap="500">
        {/* Success/Error Messages */}
        {successMessage && (
          <Banner
            title={successMessage}
            tone="success"
            onDismiss={() => setSuccessMessage("")}
          ></Banner>
        )}
        {errorMessage && (
          <Banner tone="critical" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Banner>
        )}

        {/* Top Controls */}
        <InlineStack align="end" gap="200">
          <Select
            label="Select profile"
            labelInline
            options={profileOptions}
            onChange={handleSelectChange}
            value={selectedProfile}
          />
          <Button onClick={handleReset} loading={fetcher.state !== "idle"}>
            Reset to default
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveColors}
            loading={fetcher.state !== "idle"}
          >
            Save
          </Button>
        </InlineStack>

        {/* Settings Card */}
        <Card>
          <BlockStack gap="500">
            {/* Scheme 1 Section */}
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">
                Scheme 1 (Left side)
              </Text>
              <Text as="p" color="subdued">
                Use for the main content area on the left side
              </Text>
              <InlineGrid columns={3} gap="400">
                <ColorInput
                  label="Background"
                  value={colorValues.scheme1Background}
                  onChange={(value) =>
                    handleColorChange("scheme1Background", value)
                  }
                />
                <ColorInput
                  label="Foreground (Text)"
                  value={colorValues.scheme1Foreground}
                  onChange={(value) =>
                    handleColorChange("scheme1Foreground", value)
                  }
                />
                <ColorInput
                  label="Accent (Icons & indicators)"
                  value={colorValues.scheme1Accent}
                  onChange={(value) =>
                    handleColorChange("scheme1Accent", value)
                  }
                />
              </InlineGrid>
            </BlockStack>

            {/* Primary Button Section */}
            <BlockStack gap="300">
              <InlineStack gap="100" blockAlign="center" wrap={false}>
                <Text variant="headingMd" as="h2">
                  Primary button
                </Text>
                <Tooltip content="Use for primary action buttons">
                  <Icon source={QuestionCircleIcon} color="base" />
                </Tooltip>
              </InlineStack>
              <Text as="p" color="subdued">
                Use for primary action buttons
              </Text>
              <InlineGrid columns={3} gap="400">
                <ColorInput
                  label="Background"
                  value={colorValues.primaryButtonBackground}
                  onChange={(value) =>
                    handleColorChange("primaryButtonBackground", value)
                  }
                />
                <ColorInput
                  label="Foreground (Text)"
                  value={colorValues.primaryButtonForeground}
                  onChange={(value) =>
                    handleColorChange("primaryButtonForeground", value)
                  }
                />
                <ColorInput
                  label="Accent (Icons & indicators)"
                  value={colorValues.primaryButtonAccent}
                  onChange={(value) =>
                    handleColorChange("primaryButtonAccent", value)
                  }
                />
              </InlineGrid>
              <InlineGrid columns={3} gap="400">
                <ColorInput
                  label="Background (Hover)"
                  value={colorValues.primaryButtonBackgroundHover}
                  onChange={(value) =>
                    handleColorChange("primaryButtonBackgroundHover", value)
                  }
                />
                <ColorInput
                  label="Foreground (Hover)"
                  value={colorValues.primaryButtonForegroundHover}
                  onChange={(value) =>
                    handleColorChange("primaryButtonForegroundHover", value)
                  }
                />
                <ColorInput
                  label="Accent (Hover)"
                  value={colorValues.primaryButtonAccentHover}
                  onChange={(value) =>
                    handleColorChange("primaryButtonAccentHover", value)
                  }
                />
              </InlineGrid>
            </BlockStack>

            {/* Secondary Button Section */}
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">
                Secondary button
              </Text>
              <Text as="p" color="subdued">
                Use for secondary action buttons
              </Text>
              <InlineGrid columns={3} gap="400">
                <ColorInput
                  label="Background"
                  value={colorValues.secondaryButtonBackground}
                  onChange={(value) =>
                    handleColorChange("secondaryButtonBackground", value)
                  }
                />
                <ColorInput
                  label="Foreground (Text)"
                  value={colorValues.secondaryButtonForeground}
                  onChange={(value) =>
                    handleColorChange("secondaryButtonForeground", value)
                  }
                />
                <ColorInput
                  label="Accent (Icons & indicators)"
                  value={colorValues.secondaryButtonAccent}
                  onChange={(value) =>
                    handleColorChange("secondaryButtonAccent", value)
                  }
                />
              </InlineGrid>
            </BlockStack>

            {/* Control Color Section */}
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">
                Control color
              </Text>
              <Text as="p" color="subdued">
                Use for form controls (such as input fields, checkboxes, and
                dropdowns)
              </Text>
              <InlineGrid columns={2} gap="400">
                <ColorInput
                  label="Background"
                  value={colorValues.controlBackground}
                  onChange={(value) =>
                    handleColorChange("controlBackground", value)
                  }
                />
                <ColorInput
                  label="Foreground (Text)"
                  value={colorValues.controlForeground}
                  onChange={(value) =>
                    handleColorChange("controlForeground", value)
                  }
                />
                <ColorInput
                  label="Accent (Icons & indicators)"
                  value={colorValues.controlAccent}
                  onChange={(value) =>
                    handleColorChange("controlAccent", value)
                  }
                />
                <ColorInput
                  label="Border"
                  value={colorValues.controlBorder}
                  onChange={(value) =>
                    handleColorChange("controlBorder", value)
                  }
                />
              </InlineGrid>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
      <br />
      <br />
    </Page>
  );
}

// Helper component for Color Input Field
function ColorInput({ label, value, helpText, onChange }) {
  const [fieldValue, setFieldValue] = useState(value);
  const [popoverActive, setPopoverActive] = useState(false);
  const [color, setColor] = useState({
    hue: 0,
    brightness: 1,
    saturation: 1,
  });

  // Basic validation for hex color
  const isValidHex = /^$|^#([0-9A-Fa-f]{3}){1,2}$/.test(fieldValue);

  const togglePopoverActive = useCallback(
    () => setPopoverActive((active) => !active),
    [],
  );

  const handleValueChange = useCallback(
    (newValue) => {
      setFieldValue(newValue);
      if (onChange) onChange(newValue);
    },
    [onChange],
  );

  const handleColorChange = useCallback(
    (color) => {
      setColor(color);

      // Convert HSB to hex
      const { hue, brightness, saturation } = color;

      let r, g, b;

      const h = hue / 360;
      const s = saturation;
      const v = brightness;

      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);

      switch (i % 6) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;
        case 1:
          r = q;
          g = v;
          b = p;
          break;
        case 2:
          r = p;
          g = v;
          b = t;
          break;
        case 3:
          r = p;
          g = q;
          b = v;
          break;
        case 4:
          r = t;
          g = p;
          b = v;
          break;
        case 5:
          r = v;
          g = p;
          b = q;
          break;
      }

      const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };

      const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      setFieldValue(hexColor);
      if (onChange) onChange(hexColor);
    },
    [onChange],
  );

  const activator = (
    <div
      onClick={togglePopoverActive}
      style={{
        cursor: "pointer",
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        border: "1px solid var(--p-border-subdued)",
        backgroundColor:
          isValidHex && fieldValue ? fieldValue : "var(--p-surface-disabled)",
        transition: "border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--p-border-hovered)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--p-border-subdued)";
      }}
    />
  );

  return (
    <BlockStack gap="100">
      <InlineStack gap="100" blockAlign="center" wrap={false}>
        <Text as="p" variant="bodyMd">
          {label}
        </Text>
        {helpText && (
          <Tooltip content={helpText}>
            <Icon source={QuestionCircleIcon} color="base" />
          </Tooltip>
        )}
      </InlineStack>
      <InlineStack gap="200" wrap={false} blockAlign="center">
        <div style={{ flexGrow: 1 }}>
          <TextField
            label={label}
            labelHidden
            value={fieldValue}
            onChange={handleValueChange}
            autoComplete="off"
            error={
              !isValidHex && fieldValue !== "" ? "Invalid hex color" : undefined
            }
          />
        </div>
        <div
          className="pop_box"
          style={{ border: "1px solid #ccc", borderRadius: "50%" }}
        >
          <Popover
            active={popoverActive}
            activator={
              <div
                onClick={togglePopoverActive}
                style={{
                  cursor: "pointer",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "1px solid var(--p-border-subdued)",
                  backgroundColor:
                    isValidHex && fieldValue
                      ? fieldValue
                      : "var(--p-surface-disabled)",
                  transition: "border-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--p-border-hovered)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--p-border-subdued)";
                }}
              />
            }
            onClose={togglePopoverActive}
            preferredAlignment="right"
          >
            <div style={{ padding: "22px" }}>
              <ColorPicker onChange={handleColorChange} color={color} />
            </div>
          </Popover>
        </div>
      </InlineStack>
    </BlockStack>
  );
}
