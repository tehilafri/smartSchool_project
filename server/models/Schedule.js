import mongoose from 'mongoose'

const lessonSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  startTime: { type: String, required: true }, // "08:30"
  endTime: { type: String, required: true },   // "09:15"
  substitute: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['normal','cancelled','replaced'], default: 'normal' },
  note: { type: String, default: '' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }
}, { _id: false });


const scheduleSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },

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
