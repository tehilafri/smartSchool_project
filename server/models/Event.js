import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true }, // Unique identifier for the event
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, default: null },
  type: { type: String, enum: ['exam','trip','activity'], required: true },
  subject: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  startTime: { type: String },
  endTime: { type: String },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // מורה שעבורה נוצר המבחן
  notes: { type: String },
  affectedScheduleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }]
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
