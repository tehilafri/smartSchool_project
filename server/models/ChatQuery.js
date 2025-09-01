import mongoose from 'mongoose'

const chatQuerySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  response: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('ChatQuery', chatQuerySchema);