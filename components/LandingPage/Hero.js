"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiZap, FiEdit3, FiMessageSquare } from "react-icons/fi";
import styles from "./Hero.module.scss";

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Supercharge Your Browser with AI Writing Assistant
          </motion.h1>

          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Write better emails, documents, and messages anywhere on the web.
            Refine your text, get summaries, and chat with any content using
            BrowzPot AI.
          </motion.p>

          <motion.div
            className={styles.buttons}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <button className="btn btn-cta">
              Add to Chrome <span className={styles.free}>— Free</span>
            </button>
            <button className="btn btn-secondary">Watch Demo</button>
          </motion.div>

          <motion.div
            className={styles.features}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <div className={styles.feature}>
              <FiEdit3 /> <span>Write anywhere on the web</span>
            </div>
            <div className={styles.feature}>
              <FiZap /> <span>Powered by GPT-4o</span>
            </div>
            <div className={styles.feature}>
              <FiMessageSquare /> <span>Chat with any webpage</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className={styles.imageContainer}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className={styles.browser}>
            <div className={styles.browserHeader}>
              <div className={styles.browserButtons}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className={styles.browserAddress}>
                <div className={styles.addressBar}>mail.google.com</div>
              </div>
            </div>
            <div className={styles.browserContent}>
              <div className={styles.emailInterface}>
                <div className={styles.emailHeader}>
                  <div className={styles.recipient}>To: client@example.com</div>
                  <div className={styles.subject}>
                    Subject: Project Proposal
                  </div>
                </div>
                <div className={styles.emailBody}>
                  <div className={styles.textContent}>
                    I am writing to follow up on our discussion...
                  </div>
                  <div className={styles.aiPopup}>
                    <div className={styles.aiHeader}>
                      <div className={styles.aiLogo}>BrowzPot</div>
                      <div className={styles.aiOptions}>
                        <button>Refine</button>
                        <button className={styles.active}>Rewrite</button>
                        <button>Summarize</button>
                      </div>
                    </div>
                    <div className={styles.aiSuggestion}>
                      <p>
                        I am writing to follow up on our recent discussion about
                        the project proposal. I have outlined the key
                        deliverables and timeline as requested. Please review
                        and let me know if you would like any adjustments before
                        we proceed to the next phase.
                      </p>
                    </div>
                    <div className={styles.aiActions}>
                      <button className={styles.applyButton}>Apply</button>
                      <button>Regenerate</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.glowEffect}></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
