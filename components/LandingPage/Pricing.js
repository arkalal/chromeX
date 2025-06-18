"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiCheck, FiZap } from "react-icons/fi";
import styles from "./Pricing.module.scss";

const Pricing = () => {
  const plans = [
    {
      name: "ChromeX Premium",
      description: "The complete AI writing and productivity solution.",
      monthlyPrice: 15,
      features: [
        "Unlimited AI writing assistance", 
        "Advanced text refinement",
        "Complete document summarization",
        "In-depth content chat",
        "Note organization system",
        "Email templates",
        "Priority support",
        "All future updates",
      ],
      featured: true,
      cta: "Get Started",
      icon: null,
    },
    {
      name: "Extra AI Credits",
      description: "Additional AI processing power for premium users.",
      monthlyPrice: 5,
      features: [
        "For premium subscribers only",
        "5,000 extra AI tokens",
        "Never run out of AI power", 
        "Rollover unused credits",
        "Perfect for heavy users",
      ],
      featured: false,
      cta: "Add Credits",
      icon: <FiZap />,
    },
  ];
  
  return (
    <section className={styles.pricing} id="pricing">
      <div className="container">
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Simple, Transparent Pricing</h2>
          <p>Powerful AI assistance at an affordable monthly price</p>
        </motion.div>
        
        <div className={styles.planGrid}>
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              className={`${styles.planCard} ${plan.featured ? styles.featured : ""}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              {plan.featured && <div className={styles.bestValue}>Most Popular</div>}
              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>
              
              <div className={styles.planPrice}>
                <span className={styles.currency}>$</span>
                <span className={styles.amount}>{plan.monthlyPrice}</span>
                <span className={styles.period}>/month</span>
              </div>
              
              <ul className={styles.planFeatures}>
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    {plan.icon ? plan.icon : <FiCheck />} <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className={styles.planAction}>
                <button className={plan.featured ? "btn btn-cta" : "btn btn-secondary"}>
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className={styles.guarantee}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className={styles.guaranteeIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className={styles.guaranteeText}>
            <h4>14-Day Money-Back Guarantee</h4>
            <p>Try ChromeX risk-free. If you&apos;re not satisfied within the first 14 days, we&apos;ll refund your payment.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
