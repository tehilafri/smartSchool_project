import mongoose from 'mongoose'

const substituteRequestSchema = new mongoose.Schema({
  originalTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
  substituteTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending','accepted'], default: 'pending' },
  formLink: { type: String },
  response:
    {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      notes: { type: String }
    }
  
}, { timestamps: true });

export default mongoose.model('SubstituteRequest', substituteRequestSchema);
