import mongoose from 'mongoose'

const substituteRequestSchema = new mongoose.Schema({
  originalTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
  substituteTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending','accepted','declined'], default: 'pending' },
  formLink: { type: String },
  responses: [
    {
      teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      canAttend: { type: Boolean },
      notes: { type: String }
    }
  ]
}, { timestamps: true });

export default mongoose.model('SubstituteRequest', substituteRequestSchema);
