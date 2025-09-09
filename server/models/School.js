import mongoose from 'mongoose';

const ScheduleHourSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true }
}, { _id: false });

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  schoolCode: { type: String, required: true, unique: true },
  principalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  website: { type: String },
  description: { type: String },
  scheduleHours: [ScheduleHourSchema],
  createdAt: { type: Date, default: Date.now }
});

schoolSchema.pre('save', function (next) {
  if (this.scheduleHours && this.scheduleHours.length > 0) {
    this.scheduleHours.forEach((hour, index) => {
      hour.number = index + 1; // תמיד נותן מספר רציף מהתחלה
    });
  }
  next();
});

// פונקציה ייעודית לסידור מחדש (אפשר לקרוא לה ידנית במידת הצורך)
schoolSchema.methods.reorderScheduleHours = function () {
  if (this.scheduleHours && this.scheduleHours.length > 0) {
    this.scheduleHours.forEach((hour, index) => {
      hour.number = index + 1;
    });
  }
};


export default mongoose.model('School', schoolSchema);
