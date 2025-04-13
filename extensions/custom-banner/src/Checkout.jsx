import {
  reactExtension,
  Banner,
  BlockStack,
  Text,
  useSettings,
  useTranslate,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { banner_title, banner_message, show_icon } = useSettings();
  
  return (
    <BlockStack padding="base">  
      <Banner
        status="info"
        title={banner_title || "With Checkout Plus You Can Add Custom Messages"}
        icon={show_icon !== 0 ? "info" : undefined}
      >
        <BlockStack spacing="tight">
          {banner_message ? (
            <Text>
              {banner_message}
            </Text>
          ) : <Text>
            Communicate important information to your customers and even include dynamic
            content like the total $1.00 or even add 👉
          </Text>}
        </BlockStack>
      </Banner>
    </BlockStack>
  );
}