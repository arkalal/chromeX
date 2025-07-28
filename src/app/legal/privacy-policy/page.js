"use client";

import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import styles from "../legal.module.scss";

const PrivacyPolicy = () => {
  const lastUpdated = "July 28, 2025";

  return (
    <div className={styles.legalContainer}>
      <div className={styles.legalWrapper}>
        <Link href="/" className={styles.backLink}>
          <FiArrowLeft /> Back to Home
        </Link>

        <div className={styles.legalHeader}>
          <h1>Privacy Policy</h1>
          <p>Last Updated: {lastUpdated}</p>
        </div>

        <div className={styles.legalContent}>
          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to ChromeX (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;). We are committed to protecting your privacy and
              personal information. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our
              Chrome extension and related services.
            </p>
            <p>
              By using ChromeX, you agree to the collection and use of
              information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <h3>2.1 Information You Provide</h3>
            <p>
              We may collect information that you voluntarily provide when using
              our extension, including:
            </p>
            <ul>
              <li>Account information (email, name, profile data)</li>
              <li>
                User content (notes, prompts, and other content you create)
              </li>
              <li>Communication data (when you contact us for support)</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <p>
              When you use our extension, we may collect certain information
              automatically, including:
            </p>
            <ul>
              <li>
                Usage data (features used, interactions with the extension)
              </li>
              <li>
                Technical data (browser type, device information, IP address)
              </li>
              <li>Extension performance metrics</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Understand how users interact with our extension</li>
              <li>
                Detect, investigate, and prevent fraudulent or illegal
                activities
              </li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>4. AI Features and Data Processing</h2>
            <p>
              ChromeX uses OpenAI&apos;s GPT-4o model to provide AI-assisted
              writing features. When you use our AI features:
            </p>
            <ul>
              <li>
                Text input you provide for AI processing is sent to
                OpenAI&apos;s servers in accordance with their privacy policies
              </li>
              <li>
                We do not permanently store the content of your requests to the
                AI model unless explicitly saved as notes
              </li>
              <li>
                AI-generated content is processed in compliance with applicable
                data protection laws
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Information Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>
                <strong>Service Providers:</strong> Third parties who provide
                services on our behalf (hosting, analytics, customer support)
              </li>
              <li>
                <strong>Business Transfers:</strong> If we are involved in a
                merger, acquisition, or sale of assets
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights
              </li>
            </ul>
            <p>
              We do not sell your personal information to third parties for
              advertising or marketing purposes.
            </p>
          </section>

          <section>
            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. However, no method of
              transmission over the Internet or electronic storage is 100%
              secure.
            </p>
          </section>

          <section>
            <h2>7. Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have certain rights regarding
              your personal information, including:
            </p>
            <ul>
              <li>Access to your personal information</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of your information</li>
              <li>Restriction or objection to processing</li>
              <li>Data portability</li>
              <li>Withdrawal of consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{" "}
              <a href="mailto:admin@arkalalchakravarty.com">
                admin@arkalalchakravarty.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2>8. Children&apos;s Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 13.
              We do not knowingly collect personal information from children
              under 13. If we become aware that we have collected personal
              information from a child under 13, we will take steps to delete
              such information.
            </p>
          </section>

          <section>
            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the &quot;Last Updated&quot; date.
            </p>
          </section>

          <section>
            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <p>
              <a href="mailto:admin@arkalalchakravarty.com">
                admin@arkalalchakravarty.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
