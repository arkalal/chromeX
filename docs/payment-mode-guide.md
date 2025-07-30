# Dodo Payments Mode Configuration Guide

This guide explains how to configure Dodo Payments to use live mode in production while maintaining test mode in development and staging environments.

## Environment Setup

The payment mode is determined automatically based on the environment:
- **Production (Master Branch)**: Live mode
- **All Other Environments**: Test mode

## API Keys Setup

### For Local Development:
Add to your local `.env.local` file:
```
DODO_PAYMENTS_API_KEY=sk_test_your_test_key
```

### For Staging Environment:
Configure in your CI/CD platform (e.g., Vercel):
```
DODO_PAYMENTS_API_KEY=sk_test_your_test_key
```

### For Production (Master Branch):
Configure in your CI/CD platform (e.g., Vercel):
```
DODO_PAYMENTS_API_KEY=sk_test_your_test_key  # Keep for fallback
DODO_PAYMENTS_LIVE_API_KEY=sk_live_your_live_key
```

## How It Works

1. The `lib/paymentConfig.js` file automatically detects if you're in production by checking:
   ```javascript
   const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
   ```

2. Based on this check, it selects the appropriate mode:
   ```javascript
   const PAYMENT_MODE = isProduction ? 'live' : 'test';
   ```

3. The API routes in `src/app/api/payments/route.js` and `src/app/api/subscriptions/route.js` use this configuration to:
   - Select the correct API key
   - Set the appropriate environment (test_mode vs live_mode)
   - Configure debugging options

## Dodo Payments Dashboard Configuration

1. **Generate Live API Keys**:
   - Log in to your Dodo Payments dashboard at https://app.dodopayments.com/
   - Navigate to Developer → API Keys
   - Ensure you're in the Live mode environment
   - Click "Add API Key"
   - Name it something like "Production-Live"
   - Copy and securely store the key

2. **Copy Products to Live Environment**:
   - In your dashboard's Test mode, find your products
   - Use the "Copy to Live Mode" option for each product
   - Verify all products appear correctly in the Live environment

3. **Verify Configuration**:
   - Check that webhooks are properly configured for both environments
   - Ensure all settings have been replicated to the Live environment

## Testing Your Setup

1. **Deploy to Production**:
   - Make sure your Vercel project has the correct environment variables set
   - Deploy your master branch
   - The app should automatically use Live mode

2. **Monitor First Transactions**:
   - Watch for successful payments
   - Check the Dodo Payments dashboard for transaction records
   - Verify webhook deliveries if applicable
