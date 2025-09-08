import mongoose from 'mongoose'

const substituteRequestSchema = new mongoose.Schema({
  originalTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  absenceCode: { type: String, required: true, unique: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
  substituteTeacher: { type: mongoose.Schema.Types.ObjectId, refPath: 'substituteModel', default: null },
  substituteModel: { type: String, enum: ['User', 'ExternalSubstitute'], default: null },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  checked: { type: Boolean, default: false },
  formLink: { type: String },
  reason: { type: String },
  response: {
    firstName: { type: String },
    lastName: { type: String },
    identityNumber : { type: String},
    email: { type: String },
    notes: { type: String }
  }
}, { timestamps: true });

export default mongoose.model('SubstituteRequest', substituteRequestSchema);
