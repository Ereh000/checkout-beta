import {
  reactExtension,
  Text,
  useSettings,
  PaymentIcon,
  InlineStack,
  BlockSpacer,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { 
    banner_title, 
    image_1_icon, 
    image_2_icon, 
    image_3_icon, 
    image_4_icon, 
    image_5_icon
  } = useSettings();

  // Create an array of payment icons from settings
  const paymentIcons = [
    image_1_icon,
    image_2_icon,
    image_3_icon,
    image_4_icon,
    image_5_icon
  ].filter(icon => icon && icon !== "none");

  return (
    <>
      <InlineStack inlineAlignment="center" blockAlignment="center">
        <Text size="medium" emphasis="bold">{banner_title || "Try Our Payment Icons"}</Text>
      </InlineStack>
      <BlockSpacer spacing="loose" />
      <InlineStack inlineAlignment="center" blockAlignment="center">
        {paymentIcons.map((iconName, index) => (
          <PaymentIcon key={index} name={iconName} />
        ))}
      </InlineStack>
    </>
  );
}