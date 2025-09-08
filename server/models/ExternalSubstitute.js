import mongoose from 'mongoose';

const externalSubstituteSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  identityNumber: { type: String, required: true, unique: true,
    validate: {
      validator: function(v) {
        return /^\d{9}$/.test(v); // בדיוק 9 ספרות
      },
      message: props => `${props.value} is not a valid Israeli ID number`
    }
  },
  email: { type: String, required: true },
  phone: { type: String },
  subjects: {
  type: [{ type: String }],
  default: []
  }, // המקצועות שהוא יכול ללמד
  availability: {
  type: [{//שעות זמינות
    date: { type: Date, default: null },
    startTime: { type: String, default: '00:00' },
    endTime: { type: String, default: '23:59' }
  }],
  default: [
    { date: null, startTime: '00:00', endTime: '23:59' }
  ]
}
}, { timestamps: true });

export default mongoose.model('ExternalSubstitute', externalSubstituteSchema);
