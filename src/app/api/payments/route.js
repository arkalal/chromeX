"use server";

import { auth } from "../../../../src/auth";
import { NextResponse } from "next/server";
import UserCredits from "../../../../models/UserCredits";
import { connectToDatabase } from "../../../../lib/mongodb";
import { validateRequired, validateRange, validateObjectId } from "../../../../utils/validation";

// Credit pricing constants
const CREDIT_UNIT_PRICE = 5; // $5 per 400 credits

// Import the Dodo Payments SDK using CommonJS pattern
const dodopayments = require("dodopayments");

// The documentation might be misleading - sometimes the actual constructor is in a .default property
// We need to check if it exists and use it if it does
const DodoPayments = dodopayments.default || dodopayments;

// Get the API key from environment - this should be the full key with prefix.secret format
const apiKey = process.env.DODO_PAYMENTS_API_KEY;

if (!apiKey) {
  console.error('❌ ERROR: DODO_PAYMENTS_API_KEY is missing from environment variables');
  throw new Error('Missing API key');
}

// Securely initialize the client without logging sensitive data
const client = new DodoPayments({
  headers: {
    Authorization: `Bearer ${apiKey}`
  },
  apiKey: apiKey,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'test_mode',
  debug: process.env.NODE_ENV !== 'production'
});

// Log initialization status without exposing key details
if (process.env.NODE_ENV !== 'production') {
  console.log('✅ Dodo client initialized:', { 
    initialized: !!client, 
    hasSubscriptions: !!client.subscriptions,
    environment: process.env.NODE_ENV
  });
}


/**
 * Secure payment link generation endpoint
 * @param {Request} request - The incoming request
 */
export async function GET(request) {
  try {
    // Authenticate user
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the URL params with validation
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type'); // 'subscription' or 'credits'
    const quantityParam = searchParams.get('quantity') || '1';
    
    // Validate required parameters
    if (!validateRequired({ productId, type }, ['productId', 'type'])) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    // Validate parameter types
    if (type !== 'subscription' && type !== 'credits') {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }
    
    // Convert and validate quantity
    const quantity = parseInt(quantityParam, 10);
    if (isNaN(quantity) || !validateRange(quantity, 1, 100)) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }
    
    // Base URL for redirection after payment - security enhanced version
    let baseUrl;
    
    // Get the request headers for URL determination
    const host = request.headers.get('host') || '';
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';
    
    // In production, always use the configured base URL
    if (process.env.NODE_ENV === 'production') {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      
      // Ensure we have a valid base URL
      if (!baseUrl) {
        console.error('NEXT_PUBLIC_BASE_URL is not set in production environment');
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
      }
    } 
    // In development, dynamically determine the base URL
    else {
      // Use the request origin if available
      if (origin) {
        baseUrl = origin;
      }
      // Use referer as fallback
      else if (referer) {
        const refererUrl = new URL(referer);
        baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      }
      // Use host as last resort
      else if (host) {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        baseUrl = `${protocol}://${host}`;
      }
      // Default local development URL
      else {
        baseUrl = process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000';
      }
      
      // For development logging only
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development redirect base URL:', baseUrl);
      }
    }
    
    // Create more specific redirect URLs with proper format for auto-redirection
    const redirectSuccessUrl = `${baseUrl}/dashboard?payment=success&type=${type}`;
    const redirectCancelUrl = `${baseUrl}/dashboard?payment=cancelled&type=${type}`;
    
    // Create payment link based on type
    let paymentLink;
    
    if (type === 'subscription') {
      console.log('Creating subscription payment link...');
      try {
        // Using exact format from Dodo documentation
        // Log the request details for debugging (excluding sensitive info)
        console.log('Subscription request details:', {
          has_payment_link: true,
          has_customer_info: !!session.user.email,
          product_id: productId,
          quantity: parseInt(quantity),
          has_redirect: !!redirectSuccessUrl
        });
        
        // Format request according to Dodo API requirements
        // Documentation shows billing field is required for subscriptions
        const subscriptionData = {
          payment_link: true,
          customer: {
            email: session.user.email,
            name: session.user.name || session.user.email.split('@')[0]
          },
          product_id: productId,
          quantity: parseInt(quantity),
          return_url: redirectSuccessUrl,
          cancel_url: redirectCancelUrl,
          auto_redirect: true, // Enable automatic redirect after payment
          // Required field - billing address information
          billing: {
            city: 'Not Provided', // Default placeholder values
            country: 'IN',       // Using India as default country code
            state: 'Not Provided',
            street: 'Not Provided',
            zipcode: 10001       // Default zipcode
          },
          metadata: {
            userId: session.user.id,
            type: "premium_subscription",
            redirect_success: redirectSuccessUrl,
            redirect_cancel: redirectCancelUrl
          }
        };
        
        console.log('Request data:', JSON.stringify(subscriptionData, null, 2));
        
        // Try the subscription creation with proper error logging
        try {
          paymentLink = await client.subscriptions.create(subscriptionData);
        } catch (subError) {
          console.error('Subscription API error details:', subError);
          // If available, log the response body
          if (subError.response) {
            console.error('Response status:', subError.response.status);
            try {
              const errorBody = await subError.response.text();
              console.error('Response body:', errorBody);
            } catch (e) {}
          }
          throw subError; // Re-throw to be caught by the outer catch
        }
        
        // Log the successful response
        console.log('Subscription created successfully with ID:', paymentLink?.subscription_id);
        
        // Log entire response structure (safely) to debug the URL property name
        const safeResponseObj = JSON.parse(JSON.stringify(paymentLink));
        console.log('Full subscription response structure:', safeResponseObj);
        
        // Check for payment_link which is the property used in the docs example
        if (paymentLink.payment_link) {
          console.log('Found payment_link URL:', paymentLink.payment_link);
          // Return immediately with the payment link URL
          return NextResponse.json({ url: paymentLink.payment_link });
        } else {
          console.log('No payment_link property found, available properties:', Object.keys(paymentLink));
        }
      } catch (error) {
        console.error('Subscription payment link error:', error);
        return NextResponse.json({ error: `Payment link generation failed: ${error.message || 'Unknown error'}` }, { status: 500 });
      }
    } else if (type === 'credits') {
      // For additional credits
      console.log('Creating credits payment link...');
      try {
        // Create payment request data with required billing field
        const paymentData = {
          payment_link: true,
          customer: {
            email: session.user.email,
            name: session.user.name || session.user.email.split('@')[0]
          },
          // Keep product_cart for incremental/decremental credit selection feature
          product_cart: [
            {
              product_id: productId,
              quantity: parseInt(quantity)
            }
          ],
          // Force USD currency and only allow credit/debit card payments to match desired checkout flow
          currency: "usd", // Force USD currency for all users globally
          allowed_payment_method_types: [
            "credit", "debit" // Only allow card payments to match the first image UI
          ],
          return_url: redirectSuccessUrl,
          cancel_url: redirectCancelUrl,
          auto_redirect: true, // Enable automatic redirect after payment
          // Required billing field with minimal information to match USD checkout flow
          billing: {
            city: 'Not Provided',
            country: 'US',        // Using US as default to match USD currency checkout flow
            state: 'Not Provided',
            street: 'Not Provided',
            zipcode: 10001       // Default US zipcode
          },
          metadata: {
            userId: session.user.id,
            type: "credits_purchase",
            quantity: quantity.toString(), // Convert to string as required by Dodo API
            creditsAmount: (parseInt(quantity) * 400).toString(), // Each unit is 400 credits worth $5
            unitPrice: CREDIT_UNIT_PRICE.toString(), // $5 per unit
            totalPrice: (parseInt(quantity) * CREDIT_UNIT_PRICE).toString(), // Total price in dollars
            redirect_success: redirectSuccessUrl + `&credits=${parseInt(quantity) * 400}`,
            redirect_cancel: redirectCancelUrl
          }
        };

        // Log comprehensive payment request details for debugging
        console.log('Credits payment request:', JSON.stringify({
          ...paymentData,
          has_product_cart: Array.isArray(paymentData.product_cart),
          product_cart_length: paymentData.product_cart?.length || 0,
          currency: paymentData.currency,
          allowed_payment_types: paymentData.allowed_payment_method_types,
          billing_country: paymentData.billing?.country
        }, null, 2));
        
        // Create a payment link for credits purchase using the Dodo Payments API
        paymentLink = await client.payments.create(paymentData);
        
        // Log the successful response
        console.log('Credits payment created successfully');
        
        // Log entire response structure to debug URL property
        const safeCreditsResponse = JSON.parse(JSON.stringify(paymentLink));
        console.log('Credits payment response:', safeCreditsResponse);
        
        // Check for payment_link property and return immediately if found
        if (paymentLink.payment_link) {
          console.log('Found payment_link URL for credits:', paymentLink.payment_link);
          return NextResponse.json({ url: paymentLink.payment_link });
        }
      } catch (error) {
        // Enhanced error logging for detailed debugging
        console.error('Credits payment link error:', error);
        
        // Extract detailed error information if available
        const errorDetails = {
          message: error.message || 'Unknown error',
          code: error.code,
          status: error.status,
          response: error.response?.data || error.response?.body,
          type: error.type
        };
        
        console.error('Detailed error information:', JSON.stringify(errorDetails, null, 2));
        
        // Log detailed error information but return generic error to client
        console.error('Detailed payment error:', JSON.stringify(errorDetails, null, 2));
        
        // Return a generic error message in production to avoid leaking implementation details
        return NextResponse.json({
          error: process.env.NODE_ENV === 'production' 
            ? "Payment processing failed. Please try again later." 
            : `Payment link generation failed: ${error.message || 'Unknown error'}`
        }, { status: error.status || 500 });
      }
    }
    
    // Check for any valid URL property in the response
    // The API returns payment_link instead of checkout_url
    if (!paymentLink || (!paymentLink.payment_link && !paymentLink.checkout_url && !paymentLink.url)) {
      console.error('Missing payment URL in response:', paymentLink);
      return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 });
    }
    
    // Use payment_link property which is the correct field according to Dodo API documentation
    // Fallback to other potential URL properties if payment_link doesn't exist
    const paymentUrl = paymentLink.payment_link || paymentLink.checkout_url || paymentLink.url;
    
    if (!paymentUrl) {
      console.error('No payment URL found in response:', paymentLink);
      return NextResponse.json({ error: 'Payment link was not returned by the payment processor' }, { status: 500 });
    }
    
    return NextResponse.json({ url: paymentUrl });
  } catch (error) {
    console.error("Payment link generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
