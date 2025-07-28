"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiZap, FiLoader } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Pricing.module.scss";

const Pricing = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userCredits, setUserCredits] = useState(null);
  const [addingCredits, setAddingCredits] = useState(1);
  
  useEffect(() => {
    if (session?.user) {
      fetchUserCredits();
    }
  }, [session]);
  
  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const handlePayment = async (type, quantity = 1) => {
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get product ID based on type
      const productId = type === 'subscription' 
        ? process.env.NEXT_PUBLIC_DODO_PREMIUM_PRODUCT_ID 
        : process.env.NEXT_PUBLIC_DODO_CREDITS_PRODUCT_ID;
      
      const response = await fetch(`/api/payments?productId=${productId}&type=${type}&quantity=${quantity}`);
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url; // Redirect to Dodo Payments checkout
      } else {
        const error = await response.json();
        console.error('Payment error:', error);
        alert('Failed to process payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const increaseCredits = () => setAddingCredits(prev => prev + 1);
  const decreaseCredits = () => setAddingCredits(prev => prev > 1 ? prev - 1 : 1);
  
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
                {plan.name === "ChromeX Premium" ? (
                  userCredits?.isPremium ? (
                    <button className="btn btn-secondary" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button 
                      className={plan.featured ? "btn btn-cta" : "btn btn-secondary"}
                      onClick={() => handlePayment('subscription')}
                      disabled={loading}
                    >
                      {loading ? <FiLoader className={styles.spinner} /> : plan.cta}
                    </button>
                  )
                ) : (
                  // Extra AI Credits
                  userCredits?.isPremium ? (
                    <div className={styles.creditActions}>
                      <div className={styles.creditCounter}>
                        <button onClick={decreaseCredits} className={styles.counterBtn}>-</button>
                        <span>${addingCredits * 5} ({addingCredits * 400} credits)</span>
                        <button onClick={increaseCredits} className={styles.counterBtn}>+</button>
                      </div>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handlePayment('credits', addingCredits)}
                        disabled={loading}
                      >
                        {loading ? <FiLoader className={styles.spinner} /> : plan.cta}
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary" disabled>
                      Premium users only
                    </button>
                  )
                )}
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
