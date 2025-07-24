import { NextResponse } from 'next/server';
import { Webhook } from "standardwebhooks";
import { connectToDatabase } from "../../../../../lib/mongodb";
import UserCredits from "../../../../../models/UserCredits";

const webhook = new Webhook(process.env.DODO_WEBHOOK_KEY);

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
    
    // Verify the webhook signature
    let signatureVerified = false;
    try {
      await webhook.verify(rawBody, webhookHeaders);
      console.log("Webhook signature verified successfully");
      signatureVerified = true;
    } catch (verifyError) {
      console.error('Webhook signature verification failed:', verifyError);
      
      // Check if we're in production or development
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (!isDevelopment) {
        // In production, return error for invalid signatures
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 401 });
      }
      
      // In development, log but continue processing
      console.log('Development mode: Proceeding with webhook processing despite verification failure');
    }
    
    // Parse the payload
    try {
      const payload = JSON.parse(rawBody);
      
      // Log the full webhook payload for debugging
      console.log('Full webhook payload:', JSON.stringify(payload, null, 2));
      
      // Determine the event type from the payload structure
      // Dodo might be sending event type in a different format/location
      const eventType = payload.type || 
                        (payload.data?.subscription_id ? 'subscription.event' : 
                         payload.data?.payment_id ? 'payment.event' : 'unknown');
      
      console.log(`Webhook received with detected event type: ${eventType}`, {
        hasMetadata: !!payload.data?.metadata,
        userId: payload.data?.metadata?.userId || 'none',
        type: payload.data?.metadata?.type || 'none',
        subscriptionId: payload.data?.subscription_id || 'none',
        paymentId: payload.data?.payment_id || 'none'
      });
      
      // Process based on detected information in the payload
      if (payload.data?.metadata?.type === 'premium_subscription' || 
          eventType.includes('subscription') || 
          payload.data?.subscription_id) {
        console.log('Processing subscription-related webhook');
        await processSuccessfulPayment(payload);
        console.log(`Successfully processed subscription webhook for user ${payload.data?.metadata?.userId || 'unknown'}`);
      } else if (eventType.includes('payment') || payload.data?.payment_id) {
        console.log('Processing payment-related webhook');
        await processSuccessfulPayment(payload);
        console.log(`Successfully processed payment webhook`);
      } else if (eventType.includes('cancel')) {
        console.log('Processing cancellation webhook');
        await processSubscriptionCancellation(payload);
        console.log(`Successfully processed cancellation webhook`);
      } else {
        console.log(`Received webhook with unhandled event type: ${eventType}`);
        console.log('Payload data:', payload.data);
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
    console.log('Starting payment processing...');
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
      
      const updateResult = await UserCredits.findOneAndUpdate(
        { userId },
        {
          $set: {
            isPremium: true,
            subscriptionId,
            subscriptionStatus: "active",
            planStartDate: new Date(),
            planEndDate,
          },
          $inc: { credits: 2000 } // Add 2,000 credits for premium signup
        },
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
    
    // Find and update the subscription status
    const updateResult = await UserCredits.findOneAndUpdate(
      { subscriptionId },
      {
        $set: {
          subscriptionStatus: "canceled",
          canceledAt: new Date()
        }
      },
      { new: true }
    );
    
    if (updateResult) {
      console.log(`Successfully canceled subscription for user: ${updateResult.userId}`);
    } else {
      console.log(`No subscription found with ID: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error processing subscription cancellation:', error);
  }
}
