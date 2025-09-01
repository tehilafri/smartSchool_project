import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  type: { type: String, enum: ['exam','trip','activity'], required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String },
  endTime: { type: String },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  affectedScheduleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }]
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
