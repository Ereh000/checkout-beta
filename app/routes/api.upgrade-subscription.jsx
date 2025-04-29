import {
  authenticate,
  BASIC_PLAN,
  BASIC_PLAN_YEARLY,
  PLUS_ADVANCED,
  PLUS_ADVANCED_YEARLY,
  PLUS_PLAN,
  PLUS_PLAN_YEARLY,
} from "../shopify.server";
import { json } from "@remix-run/node";

export const action = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
    const shop = session.shop.replace(".myshopify.com", "");

  const formData = await request.formData();
  const plan = formData.get("plan");
  //   const billingType = formData.get("billingType");

    const returnUrl = `https://admin.shopify.com/store/${shop}/apps/checkout-deploy-2/app/subscription-manage`;
//   const returnUrl = `https://admin.shopify.com/store/athatake/apps/checkout-deploy-2/app`;

  console.log("Form Data:", plan);

  if (plan === "basic") {
    await billing.require({
      plans: [BASIC_PLAN],
      onFailure: async () =>
        billing.request({
          plan: BASIC_PLAN,
          isTest: true,
          returnUrl: returnUrl,
        }),
    });
  }
  if(plan === "plus") {
    await billing.require({
      plans: [PLUS_PLAN],
      onFailure: async () =>
        billing.request({
          plan: PLUS_PLAN,
          isTest: true,
          returnUrl: returnUrl,
        }),
    });
  }
  if(plan === "plusAdvanced") {
    await billing.require({
      plans: [PLUS_ADVANCED],
      onFailure: async () =>
        billing.request({
          plan: PLUS_ADVANCED,
          isTest: true,
          returnUrl: returnUrl,
        }),
    });
  }
  if(plan === "basicYearly") {
    await billing.require({
      plans: [BASIC_PLAN_YEARLY],
      onFailure: async () =>
        billing.request({
          plan: BASIC_PLAN_YEARLY,
          isTest: true,
          returnUrl: returnUrl,
        }),
    });
  }
  if(plan === "plusYearly") {
    await billing.require({
      plans: [PLUS_PLAN_YEARLY],
      onFailure: async () =>
        billing.request({
          plan: PLUS_PLAN_YEARLY,
          isTest: true,
          returnUrl: returnUrl,
        }),
    });
  }
  if(plan === "plusAdvancedYearly") {
    await billing.require({
      plans: [PLUS_ADVANCED_YEARLY],
      onFailure: async () =>
        billing.request({
          plan: PLUS_ADVANCED_YEARLY,
          isTest: true,
          returnUrl: returnUrl,
        }),
    });
  }

  return json({ success: true, plan });
};

// export const loader = async ({ request }) => {
//   const { billing, session } = await authenticate.admin(request);

//   const shop = session.shop.replace(".myshopify.com", "");

//   await billing.require({
//     plans: [BASIC_PLAN],
//     // returnUrl: returnUrl,
//     onFailure: async () =>
//       billing.request({
//         plan: MONTHLY_PLAN,
//         isTest: true,
//         returnUrl: returnUrl,
//       }),
//   });

//   // App logic
//   return null;
// };
