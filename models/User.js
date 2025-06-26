import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
    },
    image: String,
    emailVerified: Date,
    // You can add additional fields to extend the user model
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { 
    timestamps: true 
  }
);

// Prevent model compilation error in development due to hot reloading
export default mongoose.models.User || mongoose.model('User', UserSchema);
