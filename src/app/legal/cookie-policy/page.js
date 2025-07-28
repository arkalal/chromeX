"use client";

import React from "react";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import styles from "../legal.module.scss";

const CookiePolicy = () => {
  const lastUpdated = "July 28, 2025";

  return (
    <div className={styles.legalContainer}>
      <div className={styles.legalWrapper}>
        <Link href="/" className={styles.backLink}>
          <FiArrowLeft /> Back to Home
        </Link>

        <div className={styles.legalHeader}>
          <h1>Cookie Policy</h1>
          <p>Last Updated: {lastUpdated}</p>
        </div>

        <div className={styles.legalContent}>
          <section>
            <h2>1. Introduction</h2>
            <p>
              This Cookie Policy explains how ChromeX (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and similar 
              technologies to recognize you when you visit our website and use our Chrome extension. 
              It explains what these technologies are and why we use them, as well as your rights to 
              control our use of them.
            </p>
          </section>

          <section>
            <h2>2. What Are Cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you 
              visit a website or use an application. Cookies are widely used by website owners and application 
              developers to make their platforms work, or to work more efficiently, as well as to provide reporting information.
            </p>
            <p>
              Cookies set by the website owner or application developer (in this case, ChromeX) are called 
              &quot;first-party cookies&quot;. Cookies set by parties other than the website owner are called &quot;third-party cookies&quot;. 
              Third-party cookies enable third-party features or functionality to be provided on or through the website 
              or application (such as advertising, interactive content and analytics).
            </p>
          </section>

          <section>
            <h2>3. Why Do We Use Cookies?</h2>
            <p>
              We use first-party and third-party cookies for several reasons. Some cookies are required for technical 
              reasons for our website and extension to operate, and we refer to these as &quot;essential&quot; or &quot;strictly necessary&quot; 
              cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on 
              our website and with our extension. Third parties may also serve cookies through our website and extension for 
              analytics and other purposes.
            </p>
            <p>The specific types of cookies we use include:</p>
            <h3>3.1 Essential Cookies</h3>
            <p>
              These cookies are strictly necessary to provide you with services available through our website and extension 
              and to use some of their features, such as access to secure areas. Because these cookies are strictly necessary 
              to deliver the website and extension, you cannot refuse them without impacting how our website and extension function.
            </p>
            <h3>3.2 Performance and Functionality Cookies</h3>
            <p>
              These cookies are used to enhance the performance and functionality of our website and extension but are 
              non-essential to their use. However, without these cookies, certain functionality may become unavailable.
            </p>
            <h3>3.3 Analytics and Customization Cookies</h3>
            <p>
              These cookies collect information that is used either in aggregate form to help us understand how our 
              website and extension are being used or how effective our marketing campaigns are, or to help us customize 
              our website and extension for you.
            </p>
          </section>

          <section>
            <h2>4. How Can You Control Cookies?</h2>
            <p>
              Most browsers allow you to refuse to accept cookies and to delete them. The methods for doing so vary from 
              browser to browser, and from version to version. You can obtain up-to-date information about blocking and 
              deleting cookies via the support pages provided by your browser operator.
            </p>
            <p>
              Please note that blocking all cookies will have a negative impact upon the usability of many websites and 
              applications. If you block cookies, you may not be able to use all the features on our website and extension.
            </p>
          </section>

          <section>
            <h2>5. Browser Extension Storage and Access</h2>
            <p>
              As a Chrome extension, ChromeX may also use browser storage mechanisms like localStorage, Chrome Storage API, 
              and IndexedDB to store information locally on your device. This storage is used to:
            </p>
            <ul>
              <li>Save your preferences and settings</li>
              <li>Store your notes and other content you create</li>
              <li>Cache data to improve performance</li>
              <li>Remember your authentication state</li>
            </ul>
          </section>

          <section>
            <h2>6. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time in order to reflect, for example, changes to the 
              cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this 
              Cookie Policy regularly to stay informed about our use of cookies and related technologies.
            </p>
            <p>
              The date at the top of this Cookie Policy indicates when it was last updated.
            </p>
          </section>

          <section>
            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies or other technologies, please contact us at:
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

export default CookiePolicy;
