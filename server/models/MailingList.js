import mongoose from 'mongoose';

const mailingListSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  source: {
    type: String,
    enum: ['user', 'footer_signup'],
    default: 'user'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('MailingList', mailingListSchema);