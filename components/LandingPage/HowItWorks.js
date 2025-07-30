"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiChevronRight } from "react-icons/fi";
import styles from "./HowItWorks.module.scss";

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  const steps = [
    {
      title: "Install the Extension",
      description: "Add BrowzPot to your browser with one click. Available on the Chrome Web Store.",
      image: "/step1.png",
    },
    {
      title: "Select Any Text Field",
      description: "Click on any input box, text area, or editable content on any website.",
      image: "/step2.png",
    },
    {
      title: "Access AI Features",
      description: "Use the BrowzPot popup or keyboard shortcuts to write, edit, and improve your text.",
      image: "/step3.png",
    },
    {
      title: "Save & Organize Notes",
      description: "Save important information as notes for easy retrieval in your new tab dashboard.",
      image: "/step4.png",
    }
  ];

  return (
    <section className={styles.howItWorks} id="how-it-works">
      <div className="container">
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>How It Works</h2>
          <p>Get started with BrowzPot in just a few simple steps</p>
        </motion.div>

        <div className={styles.stepsContainer}>
          <div className={styles.stepsNav}>
            {steps.map((step, index) => (
              <motion.button 
                key={index}
                className={`${styles.stepButton} ${activeStep === index ? styles.active : ''}`}
                onClick={() => setActiveStep(index)}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <span className={styles.stepNumber}>{index + 1}</span>
                <div className={styles.stepContent}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <FiChevronRight className={styles.stepIcon} />
              </motion.button>
            ))}
          </div>

          <motion.div 
            className={styles.stepVisual}
            key={activeStep}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.stepImageContainer}>
              <div className={styles.stepImagePlaceholder}>
                {/* Placeholder for step image */}
                <div className={styles.mockupBrowser}>
                  <div className={styles.mockupHeader}>
                    <div className={styles.mockupControls}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className={styles.mockupAddress}>
                      <span>chromewebstore.google.com</span>
                    </div>
                  </div>
                  <div className={styles.mockupContent}>
                    <div className={styles.extensionCard}>
                      <div className={styles.extensionIcon}></div>
                      <div className={styles.extensionInfo}>
                        <div className={styles.extensionTitle}>BrowzPot AI Writing Assistant</div>
                        <div className={styles.extensionRating}>
                          <div className={styles.stars}>★★★★★</div>
                          <span>4.9 (1,243)</span>
                        </div>
                      </div>
                      <div className={styles.installBtn}>
                        {activeStep === 0 ? "Add to Chrome" : 
                         activeStep === 1 ? "Installed" : 
                         activeStep === 2 ? "Using..." : "Saving..."}
                      </div>
                    </div>
                    {activeStep === 1 && (
                      <div className={styles.textFieldHighlight}></div>
                    )}
                    {activeStep === 2 && (
                      <div className={styles.aiAssistant}></div>
                    )}
                    {activeStep === 3 && (
                      <div className={styles.noteSaved}></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
