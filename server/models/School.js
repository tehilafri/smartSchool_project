import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  schoolCode: { type: String, required: true, unique: true },
  principalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  website: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('School', schoolSchema);
