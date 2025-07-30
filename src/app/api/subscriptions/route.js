"use server";

import { auth } from "../../../../src/auth";
import { NextResponse } from "next/server";
import DodoPayments from 'dodopayments';

// Import our payment configuration utility
import { dodopayConfig, PAYMENT_MODE } from "../../../../lib/paymentConfig";

// Initialize Dodo client
const initDodoClient = () => {
  // Using the same environment variable name in all environments
  // The key value will be different between environments
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  
  if (!apiKey) {
    console.error(`❌ Missing Dodo ${PAYMENT_MODE.toUpperCase()} API key in environment variables`);
    return null;
  }
  
  // Simple format check to ensure API key looks valid before using
  if (apiKey.length < 32) {
    console.error(`❌ Invalid Dodo ${PAYMENT_MODE.toUpperCase()} API key format (too short)`);
    return null;
  }
  
  // Mask the API key for logging
  const maskedKey = apiKey.substring(0, 5) + '*****' + apiKey.substring(apiKey.length - 5);
  console.log(`${PAYMENT_MODE.toUpperCase()} API key format check: ${maskedKey} (length: ${apiKey.length})`);
  
  try {
    // Check if key starts with appropriate prefix based on mode
    const expectedPrefix = PAYMENT_MODE === 'live' ? ['pk_live', 'sk_live', 'dodo_live'] : ['pk_test', 'sk_test', 'dodo_test'];
    if (!expectedPrefix.some(prefix => apiKey.startsWith(prefix))) {
      console.warn(`⚠️ ${PAYMENT_MODE.toUpperCase()} API key may have incorrect format, missing expected prefix`);
    }
    
    const client = new DodoPayments({
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      apiKey: apiKey, // Include both methods of authentication
      environment: dodopayConfig.environment,
      debug: dodopayConfig.debug
    });
    
    console.log(`✅ Dodo client initialized in ${PAYMENT_MODE.toUpperCase()} mode, client.subscriptions exists: ${!!client.subscriptions}`);
    return client;
  } catch (error) {
    console.error(`❌ Failed to initialize Dodo ${PAYMENT_MODE.toUpperCase()} client:`, error);
    return null;
  }
};

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the subscription ID from the query parameters
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    
    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    // Initialize Dodo client
    const client = initDodoClient();
    if (!client) {
      return NextResponse.json({ error: "Failed to initialize payment gateway" }, { status: 500 });
    }

    // Fetch subscription details
    console.log(`Attempting to fetch subscription with ID: ${subscriptionId}`);
    
    try {
      const subscription = await client.subscriptions.retrieve(subscriptionId);
      
      // Log full subscription data (with sensitive info redacted)
      console.log(`Subscription retrieved successfully: ${JSON.stringify({
        id: subscription?.id || 'undefined',
        status: subscription?.status,
        current_period_end: subscription?.current_period_end,
        cancel_at_period_end: subscription?.cancel_at_period_end
      })}`);
      
      // Return the full subscription data directly
      return NextResponse.json(subscription, { status: 200 });
    } catch (subscriptionError) {
      console.error(`Failed to retrieve subscription ${subscriptionId}:`, subscriptionError);
      
      // Return a more detailed error response
      return NextResponse.json({
        error: 'Failed to retrieve subscription',
        message: subscriptionError.message || 'Unknown error',
        subscriptionId: subscriptionId,
        providerError: subscriptionError.response?.data || null
      }, { status: subscriptionError.status || 500 });
    }
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    
    // Provide detailed error information for debugging
    const errorDetails = {
      message: error.message || 'Unknown error',
      status: error.status || 500
    };
    
    return NextResponse.json({ error: 'Failed to retrieve subscription', details: errorDetails }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the request body for optional cancel parameters
    const body = await request.json();
    const { subscriptionId, cancelAtPeriodEnd = true } = body;
    
    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    // Initialize Dodo client
    const client = initDodoClient();
    if (!client) {
      return NextResponse.json({ error: "Failed to initialize payment gateway" }, { status: 500 });
    }

    console.log(`Attempting to cancel subscription: ${subscriptionId}, cancelAtPeriodEnd: ${cancelAtPeriodEnd}`);

    // Cancel the subscription using update method with status: 'cancelled'
    // Since Dodo Payments SDK doesn't have a direct cancel method
    const result = await client.subscriptions.update(subscriptionId, {
      status: 'cancelled',
      cancel_at_period_end: cancelAtPeriodEnd
    });

    console.log(`Subscription cancelled successfully:`, JSON.stringify(result, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: cancelAtPeriodEnd 
        ? "Subscription will be cancelled at the end of the billing period" 
        : "Subscription cancelled immediately",
      data: result
    }, { status: 200 });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    // Provide detailed error information for debugging
    const errorDetails = {
      message: error.message || 'Unknown error',
      status: error.status || 500
    };
    
    return NextResponse.json({ error: 'Failed to cancel subscription', details: errorDetails }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the request body for subscription update parameters
    const body = await request.json();
    const { subscriptionId, action, newProductId, quantity } = body;
    
    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: "Action is required (renew, update)" }, { status: 400 });
    }

    // Initialize Dodo client
    const client = initDodoClient();
    if (!client) {
      return NextResponse.json({ error: "Failed to initialize payment gateway" }, { status: 500 });
    }

    let result;
    
    // Handle different subscription actions
    switch (action) {
      case 'renew':
        console.log(`Attempting to manually renew subscription: ${subscriptionId}`);
        // Manually trigger a renewal
        result = await client.subscriptions.renew(subscriptionId);
        console.log(`Subscription renewal initiated:`, JSON.stringify(result, null, 2));
        return NextResponse.json({ 
          success: true, 
          message: "Subscription renewal initiated",
          data: result
        }, { status: 200 });
        
      case 'update':
        if (!newProductId) {
          return NextResponse.json({ error: "New product ID is required for update action" }, { status: 400 });
        }
        
        console.log(`Updating subscription ${subscriptionId} to product ${newProductId} with quantity ${quantity || 1}`);
        
        // Update the subscription plan
        result = await client.subscriptions.update(subscriptionId, {
          product_id: newProductId,
          quantity: quantity || 1,
          // Default proration behavior
          proration_behavior: 'create_prorations'
        });
        
        console.log(`Subscription updated:`, JSON.stringify(result, null, 2));
        
        return NextResponse.json({ 
          success: true, 
          message: "Subscription updated successfully",
          data: result
        }, { status: 200 });
        
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    
    // Provide detailed error information for debugging
    const errorDetails = {
      message: error.message || 'Unknown error',
      status: error.status || 500
    };
    
    return NextResponse.json({ error: 'Failed to update subscription', details: errorDetails }, { status: 500 });
  }
}
