/**
 * Payment configuration utility for handling environment-specific settings
 * This allows different payment modes across different environments
 */

// Determine if we're in production environment
// In Next.js, NODE_ENV is automatically set to 'production' in the production build
const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';

// If we're in the master branch (production), use live mode, otherwise test mode
const PAYMENT_MODE = isProduction ? 'live' : 'test';

// Log the payment mode on startup (helps with debugging)
console.log(`🔔 Dodo Payments initialized in ${PAYMENT_MODE.toUpperCase()} mode`);

// Payment configuration for Dodo Payments
const dodopayConfig = {
  environment: PAYMENT_MODE === 'live' ? 'live_mode' : 'test_mode',
  apiBaseUrl: PAYMENT_MODE === 'live' 
    ? 'https://live.dodopayments.com' 
    : 'https://test.dodopayments.com',
  debug: PAYMENT_MODE !== 'live', // Only enable debug in non-live environments
};

module.exports = {
  dodopayConfig,
  isProduction,
  PAYMENT_MODE,
};
