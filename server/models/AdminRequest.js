import mongoose from 'mongoose';

const adminRequestSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  birthDate: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  userId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvalToken: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AdminRequest', adminRequestSchema);