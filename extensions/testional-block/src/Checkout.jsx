import {
  reactExtension,
  InlineLayout,
  View,
  useSettings,
  Image,
  Heading,
  BlockSpacer,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  // const settings = useSettings();
  // console.log("settings", settings);

  return (
    <View>
      <BlockSpacer spacing="loose" />
      <Heading>Add Testimonials Or List Badges</Heading>
      {/* first block */}
      <BlockSpacer spacing="loose" />
      <InlineLayout inlineAlignment="center" columns={["17%", "fill"]}>
        <View padding="">
          <Image source="https://cdn.shopify.com/s/files/1/0669/9591/3009/files/eco-checkout.png?v=1702968669" />
        </View>
        <View padding="base">
          We have a 30-day return policy, which means you have 30 days after
          receiving your item to request a return.
        </View>
      </InlineLayout>
      {/* second block */}
      <BlockSpacer spacing="loose" />
      <InlineLayout inlineAlignment="center" columns={["17%", "fill"]}>
        <View padding="">
          <Image source="https://cdn.shopify.com/s/files/1/0669/9591/3009/files/Review_checkout.png?v=1702968902" />
        </View>
        <View inlineAlignment="center" padding="base">
          We have a 30-day return policy, which means you have 30 days after
          receiving your item to request a return.
        </View>
      </InlineLayout>
      <BlockSpacer spacing="loose" />
    </View>
  );
}
