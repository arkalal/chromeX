"use client";

import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import styles from "../legal.module.scss";

const TermsOfService = () => {
  const lastUpdated = "July 28, 2025";

  return (
    <div className={styles.legalContainer}>
      <div className={styles.legalWrapper}>
        <Link href="/" className={styles.backLink}>
          <FiArrowLeft /> Back to Home
        </Link>

        <div className={styles.legalHeader}>
          <h1>Terms of Service</h1>
          <p>Last Updated: {lastUpdated}</p>
        </div>

        <div className={styles.legalContent}>
          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to
              and use of the ChromeX browser extension and website
              (collectively, the &quot;Service&quot;). Please read these Terms
              carefully before using the Service.
            </p>
            <p>
              By accessing or using the Service, you agree to be bound by these
              Terms. If you disagree with any part of the Terms, you may not
              access or use the Service.
            </p>
          </section>

          <section>
            <h2>2. Intellectual Property Rights</h2>
            <p>
              The Service and its original content, features, and functionality
              are and will remain the exclusive property of ChromeX and its
              licensors. The Service is protected by copyright, trademark, and
              other laws.
            </p>
            <p>
              Our trademarks and trade dress may not be used in connection with
              any product or service without the prior written consent of
              ChromeX.
            </p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information
              that is accurate, complete, and current at all times. Failure to
              do so constitutes a breach of the Terms, which may result in
              immediate termination of your account on our Service.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to
              access the Service and for any activities or actions under your
              password.
            </p>
            <p>
              You agree not to disclose your password to any third party. You
              must notify us immediately upon becoming aware of any breach of
              security or unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2>4. User Content</h2>
            <p>
              Our Service allows you to create, save, and share certain content,
              including text notes and AI-generated content (&quot;User Content&quot;).
            </p>
            <p>
              You retain all rights to your User Content. However, by creating
              and saving content through our Service, you grant us a worldwide,
              non-exclusive, royalty-free license to use, reproduce, modify, and
              display your User Content solely for the purpose of providing and
              improving the Service.
            </p>
            <p>
              You represent and warrant that your User Content does not violate
              third-party rights, including copyright, trademark, privacy,
              personality, or other personal or proprietary rights.
            </p>
          </section>

          <section>
            <h2>5. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>
                Infringe upon or violate our intellectual property rights or the
                intellectual property rights of others
              </li>
              <li>
                Harass, abuse, insult, harm, defame, slander, disparage,
                intimidate, or discriminate
              </li>
              <li>Submit false or misleading information</li>
              <li>
                Upload or transmit viruses or any other type of malicious code
              </li>
              <li>Collect or track the personal information of others</li>
              <li>
                Interfere with or circumvent the security features of the
                Service
              </li>
            </ul>
          </section>

          <section>
            <h2>6. AI Services and Content</h2>
            <p>
              Our Service utilizes artificial intelligence models provided by
              OpenAI (GPT-4o). While we strive to ensure the quality and
              appropriateness of AI-generated content, we do not guarantee its
              accuracy, completeness, or suitability for any purpose.
            </p>
            <p>
              You understand and acknowledge that AI-generated content may
              sometimes produce unexpected, inaccurate, offensive, or misleading
              results. You are solely responsible for evaluating and verifying
              any content generated using our Service.
            </p>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>
              In no event shall ChromeX, nor its directors, employees, partners,
              agents, suppliers, or affiliates, be liable for any indirect,
              incidental, special, consequential, or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses, resulting from:
            </p>
            <ul>
              <li>
                Your access to or use of or inability to access or use the
                Service
              </li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>
                Unauthorized access, use, or alteration of your transmissions or
                content
              </li>
            </ul>
          </section>

          <section>
            <h2>8. Disclaimer</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is
              provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;
              basis. The Service is provided without warranties of any kind,
              whether express or implied.
            </p>
          </section>

          <section>
            <h2>9. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of India, without regard to its conflict of law provisions.
            </p>
            <p>
              Our failure to enforce any right or provision of these Terms will
              not be considered a waiver of those rights. If any provision of
              these Terms is held to be invalid or unenforceable by a court, the
              remaining provisions of these Terms will remain in effect.
            </p>
          </section>

          <section>
            <h2>10. Changes to These Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time.
              We will provide notice of any changes by updating the &quot;Last Updated&quot;
              date at the top of this page.
            </p>
            <p>
              By continuing to access or use our Service after those revisions
              become effective, you agree to be bound by the revised terms. If
              you do not agree to the new terms, please stop using the Service.
            </p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
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

export default TermsOfService;
