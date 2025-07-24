"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiZap, FiPlus, FiMinus } from 'react-icons/fi';
import Link from 'next/link';
import styles from './Credits.module.scss';

// Credit product ID for flexible credits purchase
const CREDITS_PRODUCT_ID = 'pdt_wMjEgFWeY9k9lt8NGgrd0';

// Credit pricing: $5 per 100 credits (5 cents per credit)
const CREDIT_UNIT_PRICE = 5; // $5 per 100 credits
const CREDITS_PER_UNIT = 100; // 100 credits per unit

const CreditsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creditUnits, setCreditUnits] = useState(1); // Default to 1 unit ($5)
  const [isLoading, setIsLoading] = useState(false);
  
  // Derived values
  const totalCredits = creditUnits * CREDITS_PER_UNIT;
  const totalPrice = creditUnits * CREDIT_UNIT_PRICE;
  
  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/api/auth/signin');
    return null;
  }
  
  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Functions to handle credit manipulation
  const incrementCredits = () => {
    setCreditUnits(prev => prev + 1);
  };
  
  const decrementCredits = () => {
    setCreditUnits(prev => prev > 1 ? prev - 1 : 1); // Prevent going below 1 unit
  };
  
  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      // Use credit units as quantity (each unit is 100 credits worth $5)
      const response = await fetch(`/api/payments?productId=${CREDITS_PRODUCT_ID}&type=credits&quantity=${creditUnits}`);
      
      if (!response.ok) {
        throw new Error('Failed to create payment');
      }
      
      const data = await response.json();
      if (data.url) {
        // Redirect to payment page
        window.location.href = data.url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to process purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={styles.creditsPageContainer}>
      <div className={styles.creditsHeader}>
        <Link href="/dashboard" className={styles.backButton}>
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <h1>Purchase AI Credits</h1>
        <p>Customize your credit package to fit your needs</p>
      </div>
      
      <motion.div 
        className={styles.flexibleCreditCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.creditHeader}>
          <h3>AI Credits</h3>
        </div>
        
        <div className={styles.creditCounter}>
          <button 
            className={styles.counterButton}
            onClick={decrementCredits}
            disabled={creditUnits <= 1}
            aria-label="Decrease credits"
          >
            <FiMinus />
          </button>
          
          <div className={styles.creditDisplay}>
            <div className={styles.creditAmount}>
              <FiZap className={styles.zapIcon} />
              <span>{totalCredits}</span>
            </div>
            <p className={styles.creditsLabel}>credits</p>
          </div>
          
          <button 
            className={styles.counterButton}
            onClick={incrementCredits}
            aria-label="Increase credits"
          >
            <FiPlus />
          </button>
        </div>
        
        <div className={styles.creditPriceInfo}>
          <div className={styles.creditPrice}>
            <span className={styles.dollarSign}>$</span>
            <span className={styles.priceAmount}>{totalPrice}</span>
          </div>
          
          <div className={styles.valueText}>
            {(totalCredits / totalPrice).toFixed(1)} credits per dollar
          </div>
        </div>
      </motion.div>
      
      <div className={styles.checkoutSection}>
        <button 
          className={styles.purchaseButton} 
          onClick={handlePurchase} 
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : `Purchase ${totalCredits} Credits for $${totalPrice}`}
        </button>
        
        <p className={styles.secureText}>
          Secure payment processing by Dodo Payments
        </p>
      </div>
    </div>
  );
};

export default CreditsPage;
