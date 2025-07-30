"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import styles from "./FAQ.module.scss";

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "How does BrowzPot work?",
      answer: "BrowzPot is a browser extension that integrates AI capabilities directly into your browsing experience. It works by analyzing the content of the page you're viewing or the text you're writing, and provides AI-powered assistance like writing suggestions, summarization, and more."
    },
    {
      question: "Is my data secure with BrowzPot?",
      answer: "Yes, your privacy is our top priority. All data processing happens through secure channels, and we don't store your personal content or browsing history. Our AI models only process the data needed to provide the service you request, and nothing more."
    },
    {
      question: "Will BrowzPot slow down my browser?",
      answer: "No, BrowzPot is designed to be lightweight and efficient. The extension uses minimal resources when idle and intelligently manages memory usage. The AI processing happens on our secure servers, not on your device, ensuring smooth performance."
    },
    {
      question: "Can I use BrowzPot on any website?",
      answer: "Yes! BrowzPot works on virtually any website where you can input text or read content. This includes email services, social media platforms, document editors, and more. Some websites with strict content security policies might have limitations."
    },
    {
      question: "What's the difference between the free and paid versions?",
      answer: "The free version gives you limited daily AI interactions and basic features. Paid plans offer unlimited usage, advanced writing capabilities, more powerful summarization, in-depth chatting with content, and additional features like note organization and team collaboration."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription at any time from your account settings. If you cancel, you'll continue to have access to paid features until the end of your current billing period. We also offer a 14-day money-back guarantee for new subscribers."
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className={styles.faq} id="faq">
      <div className="container">
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about BrowzPot</p>
        </motion.div>
        
        <div className={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              className={`${styles.faqItem} ${activeIndex === index ? styles.active : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <button 
                className={styles.faqQuestion} 
                onClick={() => toggleAccordion(index)}
                aria-expanded={activeIndex === index}
              >
                <span>{faq.question}</span>
                {activeIndex === index ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              
              <div 
                className={styles.faqAnswer}
                style={{ 
                  maxHeight: activeIndex === index ? '500px' : '0',
                  opacity: activeIndex === index ? 1 : 0
                }}
              >
                <p>{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className={styles.supportLink}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p>
            Still have questions? <a href="#contact">Contact our support team</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
