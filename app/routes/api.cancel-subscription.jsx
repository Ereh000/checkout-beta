import { json } from "@remix-run/node";
import { authenticate, BASIC_PLAN } from "../shopify.server"; // Adjust path if needed

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method Not Allowed" }, { status: 405 });
  }

  //   const { session, billing } = await authenticate.admin(request);
  const { billing } = await authenticate.admin(request);

  try {
    const billingCheck = await billing.require({
      plans: [BASIC_PLAN],
      onFailure: async () => billing.request({ plan: MONTHLY_PLAN }),
    });

    const subscription = billingCheck.appSubscriptions[0];
    const cancelledSubscription = await billing.cancel({
      subscriptionId: subscription.id,
      isTest: true,
      prorate: true,
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    // Check if it's a Shopify API error response
    let errorMessage = "An unknown error occurred during cancellation.";
    if (error.response && error.response.errors) {
      // Try to extract a more specific error message
      errorMessage = JSON.stringify(error.response.errors);
    } else if (error.message) {
      errorMessage = error.message;
    }
    return json({ success: false, error: errorMessage }, { status: 500 });
  }
  return null;
};

// No loader needed for this action-only route
// export const loader = () => {
//   throw new Response("Not Found", { status: 404 });
// };
