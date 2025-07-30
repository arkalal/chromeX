"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiEdit2,
  FiMessageCircle,
  FiFileText,
  FiBookOpen,
} from "react-icons/fi";
import { SiGmail, SiGoogledocs, SiX, SiLinkedin } from "react-icons/si";
import { BsGlobe } from "react-icons/bs";
import styles from "./Features.module.scss";

const Features = () => {
  const features = [
    {
      icon: <FiEdit2 />,
      title: "Write & Refine Anywhere",
      description:
        "Create, edit, and refine your text in any input field across the web. Perfect for emails, social media, and documents.",
    },
    {
      icon: <FiMessageCircle />,
      title: "Chat With Any Content",
      description:
        "Ask questions and get insights from any webpage. Summarize articles, understand documentation, or extract key information.",
    },
    {
      icon: <FiFileText />,
      title: "Smart Note Taking",
      description:
        "Capture ideas and information with AI-powered notes that automatically organize and categorize your thoughts.",
    },
    {
      icon: <FiBookOpen />,
      title: "New Tab Dashboard",
      description:
        "Access all your saved notes directly from your new tab page. Create, view, and search your ideas effortlessly.",
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className={styles.features} id="features">
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Supercharge Your Browser Experience</h2>
          <p>
            BrowzPot brings powerful AI writing and research tools wherever you
            browse.
          </p>
        </motion.div>

        <motion.div
          className={styles.featureGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              className={styles.featureCard}
              key={index}
              variants={featureVariants}
            >
              <div className={styles.iconWrapper}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className={styles.showcase}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className={styles.showcaseContent}>
            <h3>
              Seamless Integration <span>with Your Workflow</span>
            </h3>
            <p>
              BrowzPot works with the tools you already use. Whether you&apos;re
              drafting an email, writing a document, or researching online, our
              AI assistant is just a click away.
            </p>

            <div className={styles.integrations}>
              <div className={styles.integration}>
                <div className={styles.integrationIcon}>
                  <SiGmail />
                </div>
                <span>Gmail</span>
              </div>
              <div className={styles.integration}>
                <div className={styles.integrationIcon}>
                  <SiGoogledocs />
                </div>
                <span>Google Docs</span>
              </div>
              <div className={styles.integration}>
                <div className={styles.integrationIcon}>
                  <SiX />
                </div>
                <span>X</span>
              </div>
              <div className={styles.integration}>
                <div className={styles.integrationIcon}>
                  <SiLinkedin />
                </div>
                <span>LinkedIn</span>
              </div>
              <div className={styles.integration}>
                <div className={styles.integrationIcon}>
                  <BsGlobe />
                </div>
                <span>Any Website</span>
              </div>
            </div>
          </div>

          <div className={styles.showcaseImage}>
            <div className={styles.floatingBox}>
              <div className={styles.floatingBoxHeader}>
                <div className={styles.floatingBoxIcon}>
                  <span>BrowzPot</span>
                </div>
                <div className={styles.floatingBoxActions}>
                  <button>
                    <span></span>
                  </button>
                </div>
              </div>
              <div className={styles.floatingBoxContent}>
                <div className={styles.tabButtons}>
                  <button className={styles.active}>Write</button>
                  <button>Summarize</button>
                  <button>Chat</button>
                </div>
                <div className={styles.inputArea}>
                  <div className={styles.inputText}>
                    Write a professional email declining a job offer...
                  </div>
                  <div className={styles.promptButtons}>
                    <button>Formal</button>
                    <button>Grateful</button>
                    <button>Concise</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
