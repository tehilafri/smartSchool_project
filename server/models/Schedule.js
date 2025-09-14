import mongoose from 'mongoose'

const lessonSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  subject: { type: String, default: '' },
  lessonNumber: { type: Number, required: true }, // מספר שיעור לפי ה-school
  startTime: { type: String }, // "08:30"
  endTime: { type: String },   // "09:15"
  substitute: { type: mongoose.Schema.Types.ObjectId, refPath: 'substituteModel', default: null },
  substituteModel: { type: String, enum: ['User', 'ExternalSubstitute'], default: null },
  replacementDate: { type: Date, default: null },
  status: { type: String, enum: ['normal','cancelled','replaced'], default: 'normal' },
  note: { type: String, default: '' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }
}, { _id: false });


const scheduleSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  // מערכת שבועית שלמה
  weekPlan: {
    sunday: [lessonSchema],
    monday: [lessonSchema],
    tuesday: [lessonSchema],
    wednesday: [lessonSchema],
    thursday: [lessonSchema],
    friday: [lessonSchema]
  }
}, { timestamps: true });

export default mongoose.model('Schedule', scheduleSchema);
