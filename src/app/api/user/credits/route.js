"use server";

import { auth } from "../../../../auth";
import UserCredits from "../../../../../models/UserCredits";
import { connectToDatabase } from "../../../../../lib/mongodb";

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log('Connecting to database for user credits...');
    const db = await connectToDatabase();
    console.log('Database connection established, fetching user credits...');
    
    const userId = session.user.id;
    
    // Use a timeout to prevent hanging operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 8000);
    });
    
    const findPromise = UserCredits.findOne({ userId }).exec();
    let userCredits;
    
    try {
      userCredits = await Promise.race([findPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error finding user credits:', error);
      return Response.json({ error: "Database operation timed out" }, { status: 500 });
    }
    
    // If no credits record exists yet, create a default one
    if (!userCredits) {
      console.log('Creating new user credits record for:', userId);
      userCredits = new UserCredits({
        userId,
        credits: 0,
        isPremium: false,
      });
      await userCredits.save();
      console.log('New user credits record created successfully');
    } else {
      console.log('Found existing user credits record');
    }
    
    return Response.json({
      credits: userCredits.credits,
      isPremium: userCredits.isPremium,
      subscriptionStatus: userCredits.subscriptionStatus,
      planStartDate: userCredits.planStartDate,
      planEndDate: userCredits.planEndDate
    });
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const data = await request.json();
    const { action, amount } = data;
    
    if (!action || !["add", "subtract", "cancel_subscription"].includes(action)) {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const userId = session.user.id;
    let userCredits = await UserCredits.findOne({ userId });
    
    if (!userCredits) {
      return Response.json({ error: "User credits not found" }, { status: 404 });
    }
    
    if (action === "add" && amount) {
      userCredits.credits += parseInt(amount);
    } else if (action === "subtract" && amount) {
      userCredits.credits = Math.max(0, userCredits.credits - parseInt(amount));
    } else if (action === "cancel_subscription") {
      userCredits.subscriptionStatus = "canceled";
    }
    
    await userCredits.save();
    
    return Response.json({
      credits: userCredits.credits,
      isPremium: userCredits.isPremium,
      subscriptionStatus: userCredits.subscriptionStatus
    });
  } catch (error) {
    console.error("Error updating user credits:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
