import { NextResponse } from 'next/server';
import { Webhook } from "standardwebhooks";
import { connectToDatabase } from "../../../../../lib/mongodb";
import UserCredits from "../../../../../models/UserCredits";

// Initialize webhook with better error handling
const webhookKey = process.env.DODO_WEBHOOK_KEY;
if (!webhookKey) {
  console.error('⚠️ DODO_WEBHOOK_KEY is missing from environment variables');
}

// Log partial key for debugging (safely)
const keyPrefix = webhookKey ? `${webhookKey.substring(0, 6)}...` : 'missing';
console.log(`🔑 Initializing Dodo webhook handler with key prefix: ${keyPrefix}`);

const webhook = new Webhook(webhookKey || 'placeholder-for-missing-key');

// Next.js 15 compatible webhook handler
export async function POST(request) {
  try {
    // Get the raw request body for parsing
    const rawBody = await request.text();
    
    // Get the headers from the request object directly instead of using the headers() function
    // This avoids the Next.js 15 warning about using headers().get()
    const webhookId = request.headers.get("webhook-id") || "";
    const webhookSignature = request.headers.get("webhook-signature") || "";
    const webhookTimestamp = request.headers.get("webhook-timestamp") || "";
    
    const webhookHeaders = {
      "webhook-id": webhookId,
      "webhook-signature": webhookSignature,
      "webhook-timestamp": webhookTimestamp,
    };
    
    console.log("Webhook received with headers:", {
      id: webhookId.substring(0, 10) + "...",
      timestamp: webhookTimestamp,
      hasSignature: !!webhookSignature,
    });
    
    // Enhanced environment detection
    const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    const isProduction = environment === 'production';
    const isPreview = environment === 'preview';
    const isDevelopment = environment === 'development';
    
    // Determine if this is the staging environment (vercel preview deployment)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const isStaging = isPreview || baseUrl.includes('vercel.app') || baseUrl.includes('ngrok');
    
    console.log(`🌎 Webhook received in environment: ${environment} (isStaging: ${isStaging}, baseUrl: ${baseUrl})`);
    
    // Verify the webhook signature with enhanced logging
    let signatureVerified = false;
    try {
      // Add more detailed logs for debugging
      console.log('📝 Verification attempt details:', {
        headerIdPrefix: webhookId.substring(0, 6),
        headerSignaturePrefix: webhookSignature.substring(0, 6),
        timestampPresent: !!webhookTimestamp,
        bodyLengthBytes: rawBody.length,
        webhookKeyPresent: !!webhookKey
      });
      
      await webhook.verify(rawBody, webhookHeaders);
      console.log("✅ Webhook signature verified successfully");
      signatureVerified = true;
    } catch (verifyError) {
      console.error('❌ Webhook signature verification failed:', verifyError);
      
      // Enhanced logic: Only enforce verification in true production environment
      // Allow requests to pass in development or staging environments
      if (isProduction && !isStaging) {
        // Only enforce signature verification in actual production
        console.log('🛑 Production environment - rejecting invalid signature');
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 401 });
      }
      
      // In development or staging, log but continue processing
      console.log(`⚠️ ${isStaging ? 'Staging' : 'Development'} mode: Proceeding with webhook processing despite verification failure`);
    }
    
    try {
      // Parse the payload as JSON to get the webhook data
      const payload = JSON.parse(rawBody);
      
      // Only log partial payload for security/brevity in logs
      const payloadSummary = {
        type: payload.type,
        eventId: payload.id,
        status: payload.data?.status,
        intentType: payload.data?.intent_type,
        hasMetadata: !!payload.data?.metadata,
        paymentId: payload.data?.payment_id,
        subscriptionId: payload.data?.subscription_id,
      };
      
      console.log('📦 Webhook payload summary:', payloadSummary);
      
      // Determine the event type
      const eventType = payload.type || 'unknown';
      const status = payload.data?.status || 'unknown';
      const intentType = payload.data?.intent_type || 'unknown';
      
      // Detect more specific event types for better handling
      const specificEventType = eventType === 'subscription' && status
        ? `subscription.${status}`
        : eventType === 'payment' && intentType
          ? `payment.${intentType}`
          : eventType;
          
      console.log(`Webhook received with detected event type: ${eventType}`, {
        hasMetadata: !!payload.data?.metadata,
        userId: payload.data?.metadata?.userId || 'none',
        type: payload.data?.metadata?.type || 'none',
        subscriptionId: payload.data?.subscription_id || 'none',
        paymentId: payload.data?.payment_id || 'none'
      });
      
      // We already have specificEventType defined above, so use it directly
      console.log(`Processing webhook with specific event type: ${specificEventType}`);
      
      // Handle specific subscription events
      if (specificEventType === 'subscription.active' || 
          (payload.data?.metadata?.type === 'premium_subscription' && 
           payload.data?.status === 'active')) {
        // New subscription activated
        console.log('Processing new subscription activation');
        await processSuccessfulPayment(payload);
        console.log(`Successfully processed subscription activation for user ${payload.data?.metadata?.userId || 'unknown'}`);
      } 
      else if (specificEventType === 'subscription.renewed' || 
               (eventType.includes('subscription') && payload.data?.status === 'renewed')) {
        // Subscription renewal
        console.log('Processing subscription renewal');
        await processSubscriptionRenewal(payload);
        console.log(`Successfully processed subscription renewal`);
      } 
      else if (specificEventType === 'subscription.on_hold' || 
              (eventType.includes('subscription') && payload.data?.status === 'on_hold')) {
        // Subscription put on hold due to payment failure
        console.log('Processing subscription hold');
        await processSubscriptionOnHold(payload);
        console.log(`Successfully processed subscription hold`);
      } 
      else if (specificEventType === 'subscription.failed' || 
              (eventType.includes('subscription') && payload.data?.status === 'failed')) {
        // Subscription failed
        console.log('Processing subscription failure');
        await processSubscriptionFailure(payload);
        console.log(`Successfully processed subscription failure`);
      } 
      else if (specificEventType === 'payment.succeeded' || 
              eventType.includes('payment') || 
              payload.data?.payment_id) {
        // General payment webhook
        console.log('Processing payment-related webhook');
        await processSuccessfulPayment(payload);
        console.log(`Successfully processed payment webhook`);
      } 
      else if (specificEventType.includes('cancel') || 
              (payload.data?.status === 'canceled' && payload.data?.subscription_id)) {
        // Cancellation webhook
        console.log('Processing cancellation webhook');
        await processSubscriptionCancellation(payload);
        console.log(`Successfully processed cancellation webhook`);
      } 
      else {
        // Fallback for unhandled events
        console.log(`Received webhook with unhandled event type: ${eventType}`);
        console.log('Payload data:', payload.data);
        
        // If it contains subscription_id but we didn't catch it above, process as generic subscription update
        if (payload.data?.subscription_id) {
          await processGenericSubscriptionUpdate(payload);
        }
      }
      
      // Return a 200 response to acknowledge receipt of the webhook
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (payloadError) {
      console.error('Error processing webhook payload:', payloadError);
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processSuccessfulPayment(payload) {
  try {
    console.log('🔄 Starting payment processing...');
    
    // Log environment context for debugging
    const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    console.log(`💳 Processing payment in environment: ${environment}`);
    console.log(`🌐 Base URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'not set'}`);
    
    await connectToDatabase();
    
    // Extract data more robustly - Dodo might structure their webhook data differently
    const data = payload.data || payload;
    const metadata = data.metadata || {};
    
    // Log what we found
    console.log('Processing payment with data:', {
      hasMetadata: !!metadata,
      metadataUserId: metadata.userId || 'not found',
      metadataType: metadata.type || 'not found',
      subscriptionId: data.subscription_id || 'none',
      paymentId: data.payment_id || 'none',
    });
    
    // If we don't have a userId in metadata, try to find one from other fields
    let userId = metadata.userId;
    if (!userId && data.customer?.customer_id) {
      console.log('No userId in metadata, attempting to find user by customer ID:', data.customer.customer_id);
      // Here you could look up a user by their customer ID in your database
    }
    
    if (!userId) {
      console.log('No userId found in webhook data, cannot process payment');
      return;
    }
    
    console.log(`Processing payment for userId: ${userId}`);
    
    // Determine if this is a subscription or one-time payment
    const isSubscription = !!data.subscription_id || metadata.type === "premium_subscription";
    
    if (isSubscription) {
      // Handle premium subscription
      const subscriptionId = data.subscription_id;
      console.log(`Processing subscription ${subscriptionId} for user ${userId}`);
      
      const planEndDate = new Date();
      planEndDate.setMonth(planEndDate.getMonth() + 1); // Assuming 1-month subscription
      
      // Check if user already has credits to avoid duplicates
      const existingUser = await UserCredits.findOne({ userId });
      
      // Calculate the new credit value to ensure it's exactly 2000 for new premium users
      const updateOperation = existingUser ? {
        $set: {
          isPremium: true,
          subscriptionId,
          subscriptionStatus: "active",
          planStartDate: new Date(),
          planEndDate,
          // Set credits to exactly 2000 for premium users to avoid stacking or old values
          credits: 2000
        }
      } : {
        $set: {
          isPremium: true,
          subscriptionId,
          subscriptionStatus: "active",
          planStartDate: new Date(),
          planEndDate,
        },
        $inc: { credits: 2000 } // Add 2,000 credits for premium signup
      };
      
      const updateResult = await UserCredits.findOneAndUpdate(
        { userId },
        updateOperation,
        { upsert: true, new: true }
      );
      
      console.log(`Subscription processed successfully: ${!!updateResult}`);
    } else if (metadata.type === "credits_purchase" || metadata.type === "additional_credits" || data.payment_id) {
      // Handle credits purchase - check for both properties since we've seen two different formats
      // First check for quantity in metadata (the format we're now using)
      let creditsAmount = 0;
      
      if (metadata.creditsAmount) {
        // Use the explicit creditsAmount field if present
        creditsAmount = parseInt(metadata.creditsAmount);
        console.log(`Found creditsAmount in metadata: ${creditsAmount}`);
      } else if (metadata.quantity) {
        // Calculate credits based on quantity of units (each unit = 100 credits)
        // We're now using product_cart array with flexible credit units
        const creditUnits = parseInt(metadata.quantity);
        creditsAmount = creditUnits * 100; // Each credit unit is 100 credits worth $5
        console.log(`Found credits quantity in metadata: ${metadata.quantity}, converting to ${creditsAmount} credits`);
      } else {
        // Default amount if not specified
        creditsAmount = 100;
        console.log(`No credits amount found, using default: ${creditsAmount}`);
      }
      
      console.log(`Processing credits purchase: ${creditsAmount} credits for user ${userId}`);
      
      const updateResult = await UserCredits.findOneAndUpdate(
        { userId },
        { $inc: { credits: creditsAmount } },
        { upsert: true, new: true }
      );
      
      console.log(`Credits purchase processed successfully: ${!!updateResult}`);
    } else {
      console.log('Unknown payment type, no credits added');
    }
  } catch (error) {
    console.error('Error processing payment webhook:', error);
  }
}

async function processSubscriptionCancellation(payload) {
  try {
    console.log('Processing subscription cancellation...');
    await connectToDatabase();
    
    // Extract data more safely
    const data = payload.data || payload;
    const subscriptionId = data.subscription_id;
    
    if (!subscriptionId) {
      console.log('No subscription ID found in cancellation webhook');
      return;
    }
    
    console.log(`Processing cancellation for subscription ID: ${subscriptionId}`);
    
    // Check if cancel at period end or immediate
    const immediateCancel = data.cancel_at_period_end === false;
    const status = immediateCancel ? "canceled" : "active";
    
    const updateObj = {
      subscriptionStatus: status,
      canceledAt: new Date(),
      cancelAtPeriodEnd: !immediateCancel
    };
    
    // If canceled immediately, we don't want to wait for period end
    if (immediateCancel) {
      updateObj.isPremium = false;
    }
    
    // Find and update the subscription status
    const updateResult = await UserCredits.findOneAndUpdate(
      { subscriptionId },
      { $set: updateObj },
      { new: true }
    );
    
    if (updateResult) {
      console.log(`Successfully processed subscription cancellation for user: ${updateResult.userId}`);
      console.log(`Cancel type: ${immediateCancel ? 'Immediate' : 'At period end'}, status: ${status}`);
    } else {
      console.log(`No subscription found with ID: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error processing subscription cancellation:', error);
  }
}

// Process subscription renewal events
async function processSubscriptionRenewal(payload) {
  try {
    console.log('Processing subscription renewal...');
    await connectToDatabase();
    
    // Extract data more safely
    const data = payload.data || payload;
    const subscriptionId = data.subscription_id;
    
    if (!subscriptionId) {
      console.log('No subscription ID found in renewal webhook');
      return;
    }
    
    console.log(`Processing renewal for subscription ID: ${subscriptionId}`);
    
    // Calculate the new period end date (usually 30 days from now for monthly subscriptions)
    const newPeriodEnd = new Date();
    newPeriodEnd.setDate(newPeriodEnd.getDate() + 30); // Assuming monthly renewal
    
    // Find and update the subscription status
    const updateResult = await UserCredits.findOneAndUpdate(
      { subscriptionId },
      {
        $set: {
          subscriptionStatus: "active",
          isPremium: true, // Ensure premium status is active
          planEndDate: newPeriodEnd,
          cancelAtPeriodEnd: false, // Reset cancel at period end flag if it was set
          canceledAt: null // Clear any cancellation date
        }
      },
      { new: true }
    );
    
    if (updateResult) {
      console.log(`Successfully processed subscription renewal for user: ${updateResult.userId}`);
      console.log(`New period end date: ${newPeriodEnd}`);
    } else {
      console.log(`No subscription found with ID: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error processing subscription renewal:', error);
  }
}

// Process subscription on hold events (payment failed but subscription not terminated yet)
async function processSubscriptionOnHold(payload) {
  try {
    console.log('Processing subscription on hold...');
    await connectToDatabase();
    
    // Extract data more safely
    const data = payload.data || payload;
    const subscriptionId = data.subscription_id;
    
    if (!subscriptionId) {
      console.log('No subscription ID found in on-hold webhook');
      return;
    }
    
    console.log(`Processing hold for subscription ID: ${subscriptionId}`);
    
    // Find and update the subscription status
    const updateResult = await UserCredits.findOneAndUpdate(
      { subscriptionId },
      {
        $set: {
          subscriptionStatus: "on_hold",
          // Don't change isPremium yet, as the user has time to fix payment
          paymentFailedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (updateResult) {
      console.log(`Successfully processed subscription hold for user: ${updateResult.userId}`);
    } else {
      console.log(`No subscription found with ID: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error processing subscription on hold:', error);
  }
}

// Process subscription failure events (couldn't establish subscription)
async function processSubscriptionFailure(payload) {
  try {
    console.log('Processing subscription failure...');
    await connectToDatabase();
    
    // Extract data more safely
    const data = payload.data || payload;
    const subscriptionId = data.subscription_id;
    const userId = data.metadata?.userId;
    
    if (!subscriptionId && !userId) {
      console.log('Neither subscription ID nor user ID found in failure webhook');
      return;
    }
    
    let query = {};
    if (subscriptionId) {
      query.subscriptionId = subscriptionId;
    } else if (userId) {
      query.userId = userId;
    }
    
    console.log(`Processing failure for query:`, query);
    
    // Find and update the subscription status
    const updateResult = await UserCredits.findOneAndUpdate(
      query,
      {
        $set: {
          subscriptionStatus: "failed",
          isPremium: false,
          subscriptionFailedAt: new Date()
        }
      },
      { new: true }
    );
    
    if (updateResult) {
      console.log(`Successfully processed subscription failure for user: ${updateResult.userId}`);
    } else {
      console.log(`No user found with query:`, query);
    }
  } catch (error) {
    console.error('Error processing subscription failure:', error);
  }
}

// Generic handler for subscription updates that don't fit other categories
async function processGenericSubscriptionUpdate(payload) {
  try {
    console.log('Processing generic subscription update...');
    await connectToDatabase();
    
    // Extract data more safely
    const data = payload.data || payload;
    const subscriptionId = data.subscription_id;
    
    if (!subscriptionId) {
      console.log('No subscription ID found in generic update webhook');
      return;
    }
    
    const status = data.status || 'unknown';
    console.log(`Processing generic update for subscription ID: ${subscriptionId}, status: ${status}`);
    
    // Basic fields to update
    const updateObj = {
      subscriptionLastUpdated: new Date()
    };
    
    // Update status if provided
    if (status && status !== 'unknown') {
      updateObj.subscriptionStatus = status;
      
      // Special handling for certain statuses
      if (status === 'active') {
        updateObj.isPremium = true;
      } else if (status === 'canceled' || status === 'failed') {
        updateObj.isPremium = false;
      }
    }
    
    // Find and update the subscription
    const updateResult = await UserCredits.findOneAndUpdate(
      { subscriptionId },
      { $set: updateObj },
      { new: true }
    );
    
    if (updateResult) {
      console.log(`Successfully processed generic subscription update for user: ${updateResult.userId}`);
    } else {
      console.log(`No subscription found with ID: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error processing generic subscription update:', error);
  }
}
