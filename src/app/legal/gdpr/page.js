"use client";

import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import styles from "../legal.module.scss";

const GDPRPage = () => {
  const lastUpdated = "July 28, 2025";

  return (
    <div className={styles.legalContainer}>
      <div className={styles.legalWrapper}>
        <Link href="/" className={styles.backLink}>
          <FiArrowLeft /> Back to Home
        </Link>

        <div className={styles.legalHeader}>
          <h1>GDPR Compliance</h1>
          <p>Last Updated: {lastUpdated}</p>
        </div>

        <div className={styles.legalContent}>
          <section>
            <h2>1. Introduction</h2>
            <p>
              This GDPR Compliance Statement explains how BrowzPot (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) complies with the 
              General Data Protection Regulation (GDPR) with respect to the personal data we process. BrowzPot 
              is committed to ensuring the protection of personal data and respecting the privacy rights of 
              individuals in the European Economic Area (EEA).
            </p>
          </section>

          <section>
            <h2>2. Data Controller</h2>
            <p>
              For the purposes of the GDPR, BrowzPot acts as a data controller for personal data 
              processed through our services. This means we determine the purposes and means of processing 
              personal data.
            </p>
            <p>
              Our contact information is:
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:admin@arkalalchakravarty.com">admin@arkalalchakravarty.com</a>
            </p>
          </section>

          <section>
            <h2>3. Legal Basis for Processing</h2>
            <p>
              We process personal data on the following legal bases:
            </p>
            <ul>
              <li>
                <strong>Consent:</strong> Where you have given clear consent for us to process your personal data 
                for a specific purpose.
              </li>
              <li>
                <strong>Contract:</strong> Where processing is necessary for the performance of a contract to which 
                you are a party, or to take steps at your request before entering into a contract.
              </li>
              <li>
                <strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate interests or 
                the legitimate interests of a third party, except where such interests are overridden by your 
                interests or fundamental rights and freedoms.
              </li>
              <li>
                <strong>Legal Obligation:</strong> Where processing is necessary for compliance with a legal obligation 
                to which we are subject.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Your Rights Under GDPR</h2>
            <p>
              The GDPR provides the following rights for individuals:
            </p>
            <ul>
              <li>
                <strong>Right to access:</strong> You have the right to request a copy of the personal data we hold about you.
              </li>
              <li>
                <strong>Right to rectification:</strong> You have the right to request correction of any inaccurate 
                personal data we hold about you.
              </li>
              <li>
                <strong>Right to erasure:</strong> You have the right to request erasure of your personal data in 
                certain circumstances.
              </li>
              <li>
                <strong>Right to restrict processing:</strong> You have the right to request restriction of processing 
                of your personal data in certain circumstances.
              </li>
              <li>
                <strong>Right to data portability:</strong> You have the right to receive the personal data you have 
                provided to us in a structured, commonly used and machine-readable format, and to transmit this data 
                to another controller.
              </li>
              <li>
                <strong>Right to object:</strong> You have the right to object to processing of your personal data 
                in certain circumstances.
              </li>
              <li>
                <strong>Rights related to automated decision making and profiling:</strong> You have rights related 
                to automated decision making and profiling.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. How to Exercise Your Rights</h2>
            <p>
              To exercise any of your rights, please contact us at <a href="mailto:admin@arkalalchakravarty.com">admin@arkalalchakravarty.com</a>.
            </p>
            <p>
              We will respond to your request within one month of receipt. This period may be extended by two further 
              months where necessary, taking into account the complexity and number of requests.
            </p>
          </section>

          <section>
            <h2>6. Data Protection Measures</h2>
            <p>
              We have implemented appropriate technical and organizational measures to ensure a level of security 
              appropriate to the risk, including:
            </p>
            <ul>
              <li>Encryption of personal data where appropriate</li>
              <li>Regular security assessments and testing</li>
              <li>Access controls and authentication measures</li>
              <li>Data minimization and purpose limitation practices</li>
              <li>Staff training on data protection and security</li>
            </ul>
          </section>

          <section>
            <h2>7. International Data Transfers</h2>
            <p>
              When we transfer personal data outside the EEA, we ensure that appropriate safeguards are in place to 
              protect your data, such as:
            </p>
            <ul>
              <li>Transfers to countries with an adequacy decision by the European Commission</li>
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Other appropriate safeguards as required by the GDPR</li>
            </ul>
          </section>

          <section>
            <h2>8. Data Retention</h2>
            <p>
              We retain personal data only for as long as necessary for the purposes for which it was collected, 
              or for legal or regulatory reasons. Our specific retention periods for different types of data are 
              outlined in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2>9. Data Breach Notification</h2>
            <p>
              In the event of a personal data breach, we will notify the relevant supervisory authority within 72 hours 
              of becoming aware of the breach, where feasible, unless the breach is unlikely to result in a risk to the 
              rights and freedoms of natural persons.
            </p>
            <p>
              We will also notify affected individuals without undue delay if the breach is likely to result in a high 
              risk to their rights and freedoms.
            </p>
          </section>

          <section>
            <h2>10. Data Protection Officer</h2>
            <p>
              While we currently do not have a designated Data Protection Officer, for any GDPR-related inquiries, 
              please contact us at <a href="mailto:admin@arkalalchakravarty.com">admin@arkalalchakravarty.com</a>.
            </p>
          </section>

          <section>
            <h2>11. Complaints</h2>
            <p>
              If you are concerned about how we are processing your personal data, you have the right to lodge a complaint 
              with the supervisory authority in your country of residence, place of work, or where the alleged infringement 
              has occurred.
            </p>
            <p>
              We encourage you to contact us first with any concerns, and we will do our best to resolve your issue promptly.
            </p>
          </section>

          <section>
            <h2>12. Updates to This Statement</h2>
            <p>
              We may update this GDPR Compliance Statement from time to time. When we do, we will revise the &quot;Last Updated&quot; 
              date at the top of this page.
            </p>
          </section>

          <section>
            <h2>13. Contact Us</h2>
            <p>
              If you have any questions about our GDPR compliance or data protection practices, please contact us at:
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

export default GDPRPage;
