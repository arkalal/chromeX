"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiX, FiCreditCard, FiRefreshCw, FiZap, FiBarChart2, FiCalendar } from "react-icons/fi";
import styles from "./Dashboard.module.scss";
import Link from "next/link";
import SubscriptionManager from "../../../components/Dashboard/SubscriptionManager";

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

const DashboardContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userCredits, setUserCredits] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');
  const [modalType, setModalType] = useState('premium');
  const [loading, setLoading] = useState(true);

  // Fetch user credits data
  const fetchUserCredits = useCallback(async () => {
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
  }, []);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    try {
      // Only fetch if user has a subscription ID
      if (!userCredits?.subscriptionId) {
        console.log('No subscription ID available');
        return;
      }
      
      console.log('Fetching subscription for ID:', userCredits.subscriptionId);
      const response = await fetch(`/api/subscriptions?subscriptionId=${userCredits.subscriptionId}`);
      
      if (response.ok) {
        const data = await response.json();
        // The API now returns the subscription data directly
        if (data && data.subscription_id) {
          setSubscription(data);
          console.log('Subscription data loaded successfully:', data.subscription_id);
        } else {
          console.warn('Subscription API returned ok but no valid subscription data');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Subscription API error:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }, [userCredits?.subscriptionId]);

  // Handle subscription updates (used by SubscriptionManager)
  const handleSubscriptionUpdate = useCallback(() => {
    // Refresh both subscription and credits data
    fetchSubscription();
    fetchUserCredits();
  }, [fetchSubscription, fetchUserCredits]);

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

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
  }, [searchParams, fetchUserCredits]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
      return;
    }
    
    fetchUserCredits();
    fetchSubscription();
  }, [status, session, router, fetchUserCredits, fetchSubscription]);
  
  // Check if user is premium - redirect to home if not
  useEffect(() => {
    // Skip if still loading or no user credits loaded yet
    if (status === 'loading' || !userCredits) return;
    
    // Allow access if user is premium (even if they've canceled but still in billing period)
    if (!userCredits.isPremium) {
      router.push('/');
    }
  }, [userCredits, router, status]);

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
                      <span>
                        {(userCredits.subscriptionStatus === 'canceled' || 
                          userCredits.subscriptionStatus === 'cancelled' ||
                          (subscription && (subscription.status === 'canceled' || subscription.status === 'cancelled'))) ? 
                          'Cancels on' : 'Renews on'}
                      </span>
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
                
                {/* Subscription Management Section */}
                {userCredits.subscriptionId && subscription ? (
                  <SubscriptionManager 
                    subscription={subscription}
                    onUpdate={handleSubscriptionUpdate}
                  />
                ) : userCredits.subscriptionStatus === 'active' && userCredits.subscriptionId ? (
                  /* Show refresh button when subscription ID exists but data not loaded */
                  <div className={styles.subscriptionManageSection}>
                    <h4>Manage Subscription</h4>
                    <div className={styles.subscriptionBtns}>
                      <button 
                        className={styles.cancelButton}
                        onClick={() => fetchSubscription()}
                      >
                        Load Subscription Details
                      </button>
                    </div>
                    <p className={styles.subscriptionNote}>
                      Subscription ID: {userCredits.subscriptionId}
                    </p>
                    <div className={styles.subscriptionCard}>
                      <p className={styles.loadingNote}>Loading subscription details...</p>
                    </div>
                  </div>
                ) : null}
                
                {!userCredits.subscriptionId && userCredits.subscriptionStatus === 'canceled' && (
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
          
          <div className={styles.creditsBreakdown}>
            {userCredits?.isPremium && (
              <div className={styles.creditDetail}>
                <span className={styles.creditLabel}>Initial Premium Credits:</span>
                <span className={styles.creditValue}>2,000</span>
              </div>
            )}
            {userCredits?.additionalCredits > 0 && (
              <div className={styles.creditDetail}>
                <span className={styles.creditLabel}>Additional Credits:</span>
                <span className={styles.creditValue}>{userCredits.additionalCredits.toLocaleString()}</span>
              </div>
            )}
            {userCredits?.usedCredits > 0 && (
              <div className={styles.creditDetail}>
                <span className={styles.creditLabel}>Credits Used:</span>
                <span className={styles.creditValue}>{userCredits.usedCredits.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className={styles.creditsUsage}>
            <div className={styles.usageHeader}>
              <span>Credit Usage</span>
              <span>{userCredits?.credits || 0} remaining</span>
            </div>
            
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar}
                style={{ width: `${creditUsagePercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className={styles.creditsInfo}>
            <div className={styles.infoItem}>
              <FiZap className={styles.infoIcon} />
              <div>
                <strong>Premium Benefits</strong>
                <p>Unlimited AI text refinement</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <FiBarChart2 className={styles.infoIcon} />
              <div>
                <strong>Credit Usage</strong>
                <p>Each summary uses 10-20 credits</p>
              </div>
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
          
          <div className={styles.statsFooter}>
            Start using ChromeX features to see your usage statistics
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard component with Suspense boundary
const Dashboard = () => {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
};

export default Dashboard;
