"use client";

import React from "react";
import { motion } from "framer-motion";
import styles from "./CTA.module.scss";

const CTA = () => {
  return (
    <section className={styles.cta}>
      <div className="container">
        <div className={styles.ctaWrapper}>
          <motion.div 
            className={styles.content}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to Transform Your Online Experience?</h2>
            <p>Join thousands of users who are already writing better, faster, and smarter with BrowzPot.</p>
            
            <div className={styles.ctaButtons}>
              <button className="btn btn-cta">
                Add to Chrome — Free
              </button>
              <button className="btn btn-secondary">
                Learn More
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            className={styles.visual}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className={styles.floatingElements}>
              <div className={`${styles.element} ${styles.element1}`}></div>
              <div className={`${styles.element} ${styles.element2}`}></div>
              <div className={`${styles.element} ${styles.element3}`}></div>
              <div className={`${styles.element} ${styles.element4}`}></div>
            </div>
            <div className={styles.chromeIcon}>
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" fill="#4F46E5" />
                <circle cx="50" cy="50" r="20" fill="white" />
                <circle cx="50" cy="50" r="15" fill="#F97316" />
              </svg>
              <div className={styles.iconText}>BrowzPot</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
