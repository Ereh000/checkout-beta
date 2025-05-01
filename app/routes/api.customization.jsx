import { authenticate } from "../shopify.server";
import { json } from "@remix-run/react";

// Add action function to handle form submission
export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  console.log("Form Data:", formData);

  // fetch checkout profile id
  const checkoutProfileId = await admin.graphql(`
        query {
        checkoutProfiles(first: 1, query: "is_published:true") {
            nodes{
            id
            }
        }
    }`);

  const checkoutProfileIdData = await checkoutProfileId.json();
  const checkoutId = checkoutProfileIdData.data.checkoutProfiles.nodes[0].id;
  console.log("checkoutId", checkoutId);

  // Check if this is a reset action
  if (formData.get("action") === "reset") {
    const resetResponse = await admin.graphql(
      `
      mutation ResetCheckoutStyles($checkoutProfileId: ID!) {
        checkoutBrandingUpsert(checkoutProfileId: $checkoutProfileId, checkoutBrandingInput: null) {
          userErrors {
            field
            message
          }
        }
      }
      `,
      {
        variables: {
          checkoutProfileId: checkoutId,
        },
      },
    );

    const resetData = await resetResponse.json();

    if (resetData.data?.checkoutBrandingUpsert?.userErrors?.length > 0) {
      return json({
        success: false,
        errors: resetData.data.checkoutBrandingUpsert.userErrors,
      });
    }

    return json({ success: true });
  }

  // Extract color values from form data
  const colorSettings = {
    scheme1: {
      background: formData.get("scheme1Background"),
      foreground: formData.get("scheme1Foreground"),
      accent: formData.get("scheme1Accent"),
    },
    primaryButton: {
      background: formData.get("primaryButtonBackground"),
      foreground: formData.get("primaryButtonForeground"),
      accent: formData.get("primaryButtonAccent"),
      backgroundHover: formData.get("primaryButtonBackgroundHover"),
      foregroundHover: formData.get("primaryButtonForegroundHover"),
      accentHover: formData.get("primaryButtonAccent"),
    },
    secondaryButton: {
      background: formData.get("secondaryButtonBackground"),
      backgroundHover: formData.get("secondaryButtonBackground"),
      foreground: formData.get("secondaryButtonForeground"),
      accent: formData.get("secondaryButtonAccent"),
    },
    control: {
      background: formData.get("controlBackground"),
      foreground: formData.get("controlForeground"),
      accent: formData.get("controlAccent"),
      border: formData.get("controlBorder"),
    },
  };

  try {
    // return true;

    // Update checkout appearance via GraphQL
    const response = await admin.graphql(
      `
          mutation ChangeColorScheme1($checkoutBrandingInput: CheckoutBrandingInput!, $checkoutProfileId: ID!) {
              checkoutBrandingUpsert(checkoutBrandingInput: $checkoutBrandingInput, checkoutProfileId: $checkoutProfileId) {
                  checkoutBranding {
                  designSystem {
                  colors {
                      schemes {
                      scheme1 {
                          base {
                          background
                          text
                          }
                          control {
                          background
                          border
                          selected {
                              background
                              border
                          }
                          }
                          primaryButton {
                          hover {
                              background
                          }
                          }
                      }
                      }
                  }
                  }
                  }
                  userErrors {
                  field
                  message
                  }
              }
          }
          `,
      {
        variables: {
          checkoutProfileId: checkoutId,
          checkoutBrandingInput: {
            designSystem: {
              colors: {
                schemes: {
                  scheme1: {
                    base: {
                      background: colorSettings.scheme1.background,
                      text: colorSettings.scheme1.foreground,
                    },
                    control: {
                      background: colorSettings.control.background,
                      border: colorSettings.control.border,
                      accent: colorSettings.control.accent,
                      text: colorSettings.control.foreground,
                    },
                    primaryButton: {
                      background: colorSettings.primaryButton.background,
                      text: colorSettings.primaryButton.foreground,
                      accent: colorSettings.primaryButton.accent,
                      hover: {
                        background: colorSettings.primaryButton.backgroundHover,
                        text: colorSettings.primaryButton.foreground,
                        accent: colorSettings.primaryButton.accent,
                      },
                    },
                    secondaryButton: {
                      background: colorSettings.secondaryButton.background,
                      text: colorSettings.secondaryButton.foreground,
                      accent: colorSettings.secondaryButton.accent,
                      hover: {
                        background:
                          colorSettings.secondaryButton.backgroundHover,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    );

    const responseData = await response.json();

    if (responseData.data?.checkoutBrandingUpsert?.userErrors?.length > 0) {
      return json({
        success: false,
        errors: responseData.data.checkoutBrandingUpsert.userErrors,
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error updating checkout branding:", error);
    return json({ success: false, error: error.message });
  }
}
