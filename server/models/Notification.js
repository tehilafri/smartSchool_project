import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['substitute_request','event_update','reminder'], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent','pending','read'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
