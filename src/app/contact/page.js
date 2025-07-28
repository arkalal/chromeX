"use client";

import React from "react";
import Link from "next/link";
import { FiLinkedin, FiTwitter, FiMail, FiArrowLeft } from "react-icons/fi";
import styles from "./page.module.scss";

const ContactPage = () => {
  return (
    <div className={styles.contactContainer}>
      <div className={styles.contactWrapper}>
        <Link href="/" className={styles.backLink}>
          <FiArrowLeft /> Back to Home
        </Link>

        <div className={styles.contactHeader}>
          <h1>Get In Touch</h1>
          <p>
            Have questions about ChromeX? We&apos;re here to help! Feel free to reach out
            through any of the channels below.
          </p>
        </div>

        <div className={styles.contactCard}>
          <div className={styles.founderInfo}>
            <div className={styles.founderDetails}>
              <h2>Founder</h2>
              <h3>Arka Lal Chakravarty</h3>
              <p>
                Thank you for your interest in ChromeX! I&apos;m excited to hear your
                feedback, answer your questions, or discuss potential
                collaborations.
              </p>
            </div>
          </div>

          <div className={styles.contactMethods}>
            <div className={styles.contactMethod}>
              <div className={styles.contactIcon}>
                <FiMail size={24} />
              </div>
              <div className={styles.contactInfo}>
                <h3>Email</h3>
                <a href="mailto:admin@arkalalchakravarty.com">
                  admin@arkalalchakravarty.com
                </a>
                <p>For general inquiries, support, and feedback</p>
              </div>
            </div>

            <div className={styles.contactMethod}>
              <div className={styles.contactIcon}>
                <FiLinkedin size={24} />
              </div>
              <div className={styles.contactInfo}>
                <h3>LinkedIn</h3>
                <a
                  href="https://www.linkedin.com/in/arkalal/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  linkedin.com/in/arkalal
                </a>
                <p>Connect professionally and stay updated</p>
              </div>
            </div>

            <div className={styles.contactMethod}>
              <div className={styles.contactIcon}>
                <FiTwitter size={24} />
              </div>
              <div className={styles.contactInfo}>
                <h3>X (Twitter)</h3>
                <a
                  href="https://x.com/arka_codes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  x.com/arka_codes
                </a>
                <p>Follow for updates and quick interactions</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.responsePromise}>
          <h3>Our Response Commitment</h3>
          <p>
            We aim to respond to all inquiries within 24-48 hours during business
            days. Thank you for your patience and for choosing ChromeX!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
