import {
  reactExtension,
  Banner,
  BlockStack,
  Image,
  InlineLayout,
  Text,
  useApi,
  useTranslate,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const translate = useTranslate();
  const { banner_title, image_url_1, image_url_2, image_url_3, image_url_4, image_url_5, image_url_6 } = useSettings();

  const images1 = [
    { url: image_url_1, alt: "Trust Badge 1" },
    { url: image_url_2, alt: "Trust Badge 2" },
    { url: image_url_3, alt: "Trust Badge 3" },
    { url: image_url_4, alt: "Trust Badge 4" },
    { url: image_url_5, alt: "Trust Badge 5" },
    { url: image_url_6, alt: "Trust Badge 6" },
  ].filter(img => img.url);

  const images2 = [
    { url: image_url_5, alt: "Trust Badge 5" },
    { url: image_url_6, alt: "Trust Badge 6" },
  ].filter(img => img.url);

  return (
    <BlockStack spacing="tight">
      <Text size="medium" emphasis="bold">{banner_title || "Try Our Trust Badges!"}</Text>
      <InlineLayout spacing="base" columns={['20%']} alignment="center">
        {images1.map((image, index) => (
          <Image key={index} source={image.url} alt={image.alt} />
        ))}
      </InlineLayout>
      <InlineLayout spacing="base" columns={['20%']} alignment="center">
        {images2.map((image, index) => (
          <Image key={index} source={image.url} alt={image.alt} />
        ))}
      </InlineLayout>
    </BlockStack>
  );
}