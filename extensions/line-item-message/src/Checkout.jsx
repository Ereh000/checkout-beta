import {
  reactExtension,
  Text,
  useSettings,
} from "@shopify/ui-extensions-react/checkout";

reactExtension("purchase.checkout.cart-line-item.render-after", () => (
  <Extension />
));

export default function Extension() {
  const { message_text, text_tone } = useSettings();

  const tone = text_tone ?? "critical";

  return (
    <>
      {message_text ? (
        <Text appearance={tone} size="extraSmall">{message_text}</Text>
      ) : (
        <Text appearance={tone} size="extraSmall">20% Off on Today Deal</Text>
      )}
    </>
  );
}
