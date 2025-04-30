import {
  reactExtension,
  View,
  useSettings,
  Image,
  Heading,
  Text,
  InlineLayout,
  BlockStack,
} from "@shopify/ui-extensions-react/checkout";

// --------------------- Checkout Page Block Rendering -------------------------------
export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

// --------------------- Thankyou Page Block Rendering -------------------------------
const thankYouRender = reactExtension("purchase.thank-you.block.render", () => (
  <Extension />
));
export { thankYouRender };

// --------------------- Orddr Status Page Block Rendering -------------------------------
const orderDetailsRender = reactExtension(
  "customer-account.order-status.block.render",
  () => <Extension />,
);

export { orderDetailsRender };

function Extension() {
  const {
    title,
    imageSize,
    textAlignment,
    textSize,
    image_1_url,
    section_1_text,
  } = useSettings();

  console.log(
    "title",
    title,
    "imagesize",
    imageSize,
    "textSize",
    textSize,
    "image_1_url",
    image_1_url,
    "section_1_text",
    section_1_text,
  ); // Add this line for debugging
  // Convert imageSize to a string with 'px' for styling
  const imageSizeStyle = `${imageSize || 120}px`;

  return (
    <BlockStack border="base" cornerRadius="base" padding="base">
      {/* <BlockSpacer spacing="loose" /> */}
      <View inlineAlignment={"start"}>
        <Heading>{title || "Add Testimonials Or List Badges"}</Heading>
      </View>

      {/* first block */}
      {/* <BlockSpacer spacing="loose" />  */}
      <InlineLayout
        columns={[`${imageSizeStyle}`, "10px", "fill"]}
        inlineAlignment={textAlignment || "end"}
        blockAlignment="center"
      >
        <View padding="base">
          <Image
            source={
              image_1_url
                ? image_1_url
                : "https://cdn.shopify.com/s/files/1/0669/9591/3009/files/eco-checkout.png?v=1702968669"
            }
            // fit="cover"
            // aspectRatio={1}
            // width={imageSizeStyle}
            // height={imageSizeStyle}
          />
        </View>
        
        <View inlineAlignment={textAlignment || "left"}>
          {/* <BlockSpacer spacing="loose" /> */}
          <BlockStack>
            <Heading>{"Easy & Return"}</Heading>
            <Text size={textSize || "none"}>
              {section_1_text ||
                "We have a 30-day return policy, which means you have 30 days after receiving your item to request a return."}
            </Text>
          </BlockStack>  
        </View>
      </InlineLayout>
      {/* <BlockSpacer spacing="loose" /> */}
    </BlockStack>
  );
}
