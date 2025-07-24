"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiX, FiCreditCard, FiRefreshCw, FiZap, FiBarChart2, FiCalendar } from "react-icons/fi";
import styles from "./Dashboard.module.scss";
import Link from "next/link";

// Thank You Modal Component
const ThankYouModal = ({ type, onClose }) => {
  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={styles.modal}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX />
        </button>
        
        <div className={styles.modalIcon}>
          {type === 'premium' ? (
            <FiCreditCard size={40} />
          ) : (
            <FiZap size={40} />
          )}
        </div>
        
        <h2>Thank You!</h2>
        
        {type === 'premium' ? (
          <p>
            Your ChromeX Premium subscription is now active. Enjoy unlimited AI writing,
            advanced refinement, and 2,000 credits to start with!
          </p>
        ) : (
          <p>
            Your additional AI credits have been added to your account.
            Keep creating amazing content without limits!
          </p>
        )}
        
        <button className="btn btn-cta" onClick={onClose}>
          Get Started
        </button>
      </motion.div>
    </motion.div>
  );
};

// Payment Failed Modal Component
const PaymentFailedModal = ({ errorMessage, onClose }) => {
  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={`${styles.modal} ${styles.errorModal}`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          <FiX />
        </button>
        
        <div className={styles.modalIcon}>
          <FiRefreshCw size={40} />
        </div>
        
        <h2>Payment Failed</h2>
        
        <p>
          {errorMessage || "Something went wrong with your payment. Please try again or contact support if the issue persists."}
        </p>
        
        <div className={styles.modalButtonGroup}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <Link href="/credits" className="btn btn-cta">
            Try Again
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userCredits, setUserCredits] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');
  const [modalType, setModalType] = useState('premium');
  const [loading, setLoading] = useState(true);
  
  // Check payment status from URL params
  useEffect(() => {
    // Check for payment status in URL params
    const paymentStatus = searchParams.get('status');
    const type = searchParams.get('type');
    const credits = searchParams.get('credits');
    const paymentId = searchParams.get('payment_id');
    
    // Handle failed payments
    if (paymentStatus === 'failed') {
      console.log('Payment failed, showing failure modal');
      // Get error message if available
      const errorCode = searchParams.get('errorCode') || '';
      const errorMessage = searchParams.get('message') || 'Your payment could not be processed. Please try again.';
      
      // Show failure modal with error message
      setFailureMessage(`${errorMessage} ${errorCode ? `(Code: ${errorCode})` : ''}`);
      setShowFailureModal(true);
      
      // Remove query params to avoid showing modal on page refresh
      window.history.replaceState({}, document.title, '/dashboard');
      return;
    }
    
    // Check multiple possible query parameter formats for payment success
    // Dodo may redirect with either payment_status=success or payment=success
    if (paymentStatus === 'succeeded' || searchParams.get('payment_status') === 'success' || searchParams.get('payment') === 'success') {
      // If credits parameter exists, it's a credits purchase, otherwise check type
      setModalType(credits ? 'credits' : type === 'subscription' ? 'premium' : 'credits');
      setShowModal(true);
      
      // Force refresh user credits data to show updated balance
      fetchUserCredits();
      
      // Remove query params to avoid showing modal on page refresh
      window.history.replaceState({}, document.title, '/dashboard');
    }
  }, [searchParams]);
  
  // Fetch user credits data
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
      return;
    }
    
    fetchUserCredits();
  }, [status, session, router]);
  
  const fetchUserCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const cancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/user/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel_subscription'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data);
        alert('Your subscription has been canceled. You will continue to have access until the end of your current billing period.');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };
  
  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }
  
  const creditUsagePercentage = userCredits?.credits ? 
    Math.min(100, Math.max(0, (userCredits.credits / 2000) * 100)) : 0;
  
  return (
    <div className={styles.dashboardContainer}>
      {showModal && (
        <ThankYouModal 
          type={modalType} 
          onClose={() => setShowModal(false)} 
        />
      )}
      
      {showFailureModal && (
        <PaymentFailedModal 
          errorMessage={failureMessage}
          onClose={() => setShowFailureModal(false)} 
        />
      )}
      
      <div className={styles.dashboardHeader}>
        <div>
          <h1>My Dashboard</h1>
          <p>Manage your subscription and AI credits</p>
        </div>
        <Link href="/" className={styles.homeLink}>
          Back to Home
        </Link>
      </div>
      
      <div className={styles.dashboardGrid}>
        <div className={`${styles.dashboardCard} ${styles.planCard}`}>
          <div className={styles.cardHeader}>
            <h2>Subscription Plan</h2>
            <FiCreditCard className={styles.cardIcon} />
          </div>
          
          <div className={styles.planDetails}>
            <div className={styles.planName}>
              {userCredits?.isPremium ? (
                <>
                  <span className={styles.planBadge}>Premium</span>
                  <span className={styles.planPrice}>$15/month</span>
                </>
              ) : (
                <span>Free Plan</span>
              )}
            </div>
            
            {userCredits?.isPremium && (
              <>
                <div className={styles.planInfo}>
                  <div className={styles.infoItem}>
                    <FiCalendar />
                    <div>
                      <span>Started on</span>
                      <p>{formatDate(userCredits.planStartDate)}</p>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <FiCalendar />
                    <div>
                      <span>Renews on</span>
                      <p>{formatDate(userCredits.planEndDate)}</p>
                    </div>
                  </div>
                </div>
                
                <div className={styles.planStatus}>
                  <span>Status: </span>
                  <span className={styles.statusBadge}>
                    {userCredits.subscriptionStatus === 'active' ? 'Active' : 'Canceled'}
                  </span>
                </div>
                
                {userCredits.subscriptionStatus === 'active' && (
                  <button 
                    className={`btn ${styles.cancelBtn}`} 
                    onClick={cancelSubscription}
                  >
                    Cancel Subscription
                  </button>
                )}
                
                {userCredits.subscriptionStatus === 'canceled' && (
                  <Link href="/#pricing" className="btn btn-cta">
                    Renew Subscription
                  </Link>
                )}
              </>
            )}
            
            {!userCredits?.isPremium && (
              <Link href="/#pricing" className="btn btn-cta">
                Upgrade to Premium
              </Link>
            )}
          </div>
        </div>
        
        <div className={`${styles.dashboardCard} ${styles.creditsCard}`}>
          <div className={styles.cardHeader}>
            <h2>AI Credits</h2>
            <FiZap className={styles.cardIcon} />
          </div>
          
          <div className={styles.creditsAmount}>
            <span>{userCredits?.credits || 0}</span>
            <p>available credits</p>
          </div>
          
          <div className={styles.creditsUsage}>
            <div className={styles.usageHeader}>
              <span>Credit Usage</span>
              <span>{userCredits?.credits || 0} / 2000</span>
            </div>
            
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar}
                style={{ width: `${creditUsagePercentage}%` }}
              ></div>
            </div>
          </div>
          
          <Link href="/credits" className="btn btn-secondary">
            <FiZap /> Add More Credits
          </Link>
        </div>
        
        <div className={`${styles.dashboardCard} ${styles.usageCard}`}>
          <div className={styles.cardHeader}>
            <h2>Usage Stats</h2>
            <FiBarChart2 className={styles.cardIcon} />
          </div>
          
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>0</span>
              <span className={styles.statLabel}>Documents Summarized</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>0</span>
              <span className={styles.statLabel}>Texts Refined</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>0</span>
              <span className={styles.statLabel}>Notes Created</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>0</span>
              <span className={styles.statLabel}>Chat Sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
