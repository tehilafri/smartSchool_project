import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true }, // Unique identifier for the event
  type: { type: String, enum: ['exam','trip','activity'], required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String },
  endTime: { type: String },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true }],
  affectedScheduleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }]
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
