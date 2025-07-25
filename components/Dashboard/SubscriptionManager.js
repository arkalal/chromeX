"use client";

import { useState, useEffect } from 'react';
import { LuLoader } from 'react-icons/lu';
import { BsInfoCircle } from 'react-icons/bs';
import { MdWarning } from 'react-icons/md';
import styles from '../../src/app/dashboard/Dashboard.module.scss';
import { BsCheckCircleFill } from 'react-icons/bs';
import { MdCancel } from 'react-icons/md';

const SubscriptionManager = ({ subscription, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [directCancelMode, setDirectCancelMode] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState('');

  // If subscription is not provided but we need to enable direct cancellation
  useEffect(() => {
    // If no subscription data but we're in the component, offer direct cancellation
    if (!subscription) {
      const urlParams = new URLSearchParams(window.location.search);
      const subId = urlParams.get('subscriptionId') || '';
      if (subId) {
        setSubscriptionId(subId);
      }
    }
  }, [subscription]);
  
  // Display direct cancellation form if no subscription data is available
  if (!subscription && !directCancelMode) {
    return (
      <div className={styles.subscriptionActions}>
        <button 
          className={styles.cancelButton}
          onClick={() => setDirectCancelMode(true)}
        >
          Manage Subscription Directly
        </button>
        <p className={styles.errorNote}>Unable to load subscription details automatically</p>
      </div>
    );
  }
  
  // Direct subscription management mode (fallback when API fails)
  if (!subscription && directCancelMode) {
    return (
      <div className={styles.confirmCancelContainer}>
        <h4>Direct Subscription Management</h4>
        <p>Enter your subscription ID to manage your subscription directly:</p>
        
        <div className={styles.directCancelForm}>
          <input
            type="text"
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            placeholder="Enter subscription ID"
            className={styles.subscriptionInput}
          />
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.cancelButton}
              onClick={async () => {
                if (!subscriptionId.trim()) {
                  alert('Please enter a valid subscription ID');
                  return;
                }
                
                if (confirm('Are you sure you want to cancel this subscription?')) {
                  setLoading(true);
                  try {
                    const response = await fetch('/api/subscriptions', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        subscriptionId, 
                        cancelAtPeriodEnd: true
                      })
                    });
                    
                    if (response.ok) {
                      alert('Subscription canceled successfully!');
                      if (onUpdate) onUpdate();
                    } else {
                      const error = await response.json();
                      alert(`Error: ${error.message || 'Failed to cancel subscription'}`);
                    }
                  } catch (err) {
                    alert('Error connecting to server');
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <LuLoader className={styles.spinnerIcon} /> Processing...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </button>
            
            <button 
              className={styles.backButton}
              onClick={() => setDirectCancelMode(false)}
              disabled={loading}
            >
              Back
            </button>
          </div>
          
          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Check if it's a valid date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    
    // Convert snake_case to Title Case
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Handle various API response formats for detecting cancellation
  const checkCancellationStatus = () => {
    return subscription?.cancel_at_period_end === true || 
      subscription?.metadata?.cancelAtPeriodEnd === 'true' ||
      (subscription?.status === 'active' && subscription?.canceled_at) ||
      subscription?.status === 'cancelled' ||
      subscription?.status === 'canceled';
  };
  
  const isScheduledForCancellation = checkCancellationStatus();

  const handleRenewSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          action: 'renew'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to renew subscription');
      }

      // Call the parent component's update function to refresh subscription data
      if (onUpdate) onUpdate();
      
    } catch (err) {
      setError(err.message || 'An error occurred while renewing your subscription');
      console.error('Subscription renewal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCancelDialog = () => {
    setShowConfirmCancel(true);
    setCancelAtPeriodEnd(true); // Default to canceling at period end
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the correct subscription_id field from the API response
      const subId = subscription.subscription_id || subscription.id;
      console.log('Cancelling subscription with ID:', subId);
      
      const response = await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId: subId,
          cancelAtPeriodEnd
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setShowConfirmCancel(false);
      
      // Call the parent component's update function to refresh subscription data
      if (onUpdate) onUpdate();
      
    } catch (err) {
      setError(err.message || 'An error occurred while canceling your subscription');
      console.error('Subscription cancellation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.subscriptionManagerContainer}>
      <h3>Subscription Management</h3>
      
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}
      
      <div className={styles.subscriptionDetails}>
        <div className={styles.subscriptionDetail}>
          <span className={styles.detailLabel}>Plan:</span>
          <span className={styles.detailValue}>Premium Plan</span>
        </div>
        
        <div className={styles.subscriptionDetail}>
          <span className={styles.detailLabel}>Status:</span>
          <span className={`${styles.detailValue} ${(subscription.status === 'canceled' || subscription.status === 'cancelled') ? styles.canceled : ''}`}>
            {formatStatus(subscription.status)}
            {isScheduledForCancellation && subscription.status === 'active' && (
              <span className={styles.cancelScheduled}> (Cancels at period end)</span>
            )}
          </span>
        </div>
        
        <div className={styles.subscriptionDetail}>
          <span className={styles.detailLabel}>Current Period:</span>
          <span className={styles.detailValue}>
            {formatDate(subscription.current_period_start || subscription.previous_billing_date)} - {formatDate(subscription.current_period_end || subscription.next_billing_date)}
          </span>
        </div>
        
        {subscription.cancel_at_period_end && (
          <div className={styles.cancellationNotice}>
            <MdCancel />
            <span>Your subscription will be canceled on {formatDate(subscription.current_period_end)}</span>
          </div>
        )}
      </div>

      <div className={styles.subscriptionActions}>
        {!showConfirmCancel ? (
          <div className={styles.managerActions}>
            {subscription.status === 'active' && !isScheduledForCancellation && (
              <button 
                className={styles.cancelButton}
                onClick={openCancelDialog}
                disabled={loading}
              >
                Cancel Subscription
              </button>
            )}
            
            {subscription.status === 'active' && isScheduledForCancellation && (
              <button 
                className={styles.renewButton}
                onClick={handleRenewSubscription}
                disabled={loading}
              >
                Resume Subscription
              </button>
            )}
            
            {subscription.status === 'on_hold' && (
              <button 
                className={styles.renewButton}
                onClick={handleRenewSubscription}
                disabled={loading}
              >
                Renew Subscription
              </button>
            )}
          </div>
        ) : (
          <div className={styles.confirmCancelContainer}>
            <h4>Cancel Subscription</h4>
            <div className={styles.cancelInfo}>
              <BsInfoCircle className={styles.infoIcon} />
              <p>Your subscription will remain active until the end of your current billing period. You can continue to use the service until {formatDate(subscription.current_period_end || subscription.next_billing_date)}.</p>
            </div>
            
            <div className={styles.confirmButtons}>
              <button 
                onClick={() => setShowConfirmCancel(false)}
                className={styles.backButton}
                disabled={loading}
              >
                Go Back
              </button>
              <button 
                onClick={handleCancelSubscription}
                className={styles.confirmCancelButton}
                disabled={loading}
              >
                {loading ? <LuLoader className={styles.spinnerIcon} /> : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;
