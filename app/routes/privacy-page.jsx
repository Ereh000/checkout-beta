import React from "react";

export default function PrivacyPage() {
  return (
    <div
      className="privacy-policy-container"
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: "1.5",
        padding: "20px",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Privacy Policy
      </h1>

      <p>
        Variant Title Magic ("the App") provides automatic product title updates
        based on the selected variant ("the Service") to merchants who use
        Shopify to power their stores. This Privacy Policy describes how
        personal information is collected, used, and shared when you install or
        use the App in connection with your Shopify- supported store.
      </p>

      <h2>Personal Information the App Collects</h2>

      <p>
        When you install the App, we are automatically able to access certain
        types of information from your Shopify account:
      </p>

      <ul>
        <li>Store information (store name, domain, owner email)</li>
        <li>Product and variant details (titles, SKUs, options)</li>
        <li>Theme information (for app embed setup)</li>
      </ul>

      <p>
        Additionally, we may collect the following types of personal information
        independently from the Shopify API:
      </p>

      <ul>
        <li>
          Information about store staff accessing the App, such as name and
          email address
        </li>
        <li>
          Basic information about customers who interact with your store,
          including IP address, browser type, and device type
        </li>
      </ul>

      <p>
        We collect personal information directly from the relevant individual,
        through your Shopify account, or using the following technologies:
      </p>

      <ul>
        <li>
          Cookies – data files placed on your device to improve your experience
        </li>
        <li>Log files – track IP, browser type, timestamps, etc.</li>
        <li>
          Web beacons / pixels – used to monitor app usage and performance
        </li>
      </ul>

      <h2>How Do We Use Your Personal Information?</h2>

      <p>We use the information we collect to:</p>

      <ul>
        <li>Provide and operate the Service</li>
        <li>Offer customer support</li>
        <li>Improve our app experience</li>
        <li>
          Notify you about updates, support, or promotions related to the App
        </li>
      </ul>

      <p>
        We do not use this information for behavioral or targeted advertising.
      </p>

      <h2>Sharing Your Personal Information</h2>

      <p>
        We do not sell or rent your personal information. We may share
        information with trusted service providers for infrastructure,
        analytics, or support-related tasks, strictly to provide the Service.
      </p>

      <p>
        We may also share your Personal Information to comply with legal
        obligations or respond to lawful requests (e.g., subpoenas, warrants).
      </p>

      <h2>Your Rights (EU Residents)</h2>

      <p>
        If you are a European resident, you have the right to access, correct,
        or request deletion of your personal data. You may do so by contacting
        us at the email below.
      </p>

      <p>
        Please note your information may be transferred outside of Europe,
        including to servers in the United States and Canada.
      </p>

      <h2>Data Retention</h2>
      <p>
        We retain data only for as long as necessary to provide the Service and
        meet our legal obligations. If you'd like us to delete your data,
        contact us using the details below.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this Privacy Policy to reflect changes to our practices or
        legal requirements. Updates will be posted on this page.
      </p>
      <h2>Contact Us</h2>
      <p>
        For any questions or concerns about this Privacy Policy, or to make a
        data request, please contact us: 
        <ul>
            <li><b>Email:</b> <a href="mailto:support@elevonapps.com">support@elevonapps.com</a> </li>
            <li><b>Address:</b> Honeybee Studio, India</li>
        </ul>
      </p>
    </div>
  );
}
