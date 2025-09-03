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
  subjects: [{ type: String }], // המקצועות שהוא יכול ללמד
  availability: [{ date: Date, time: String }] // שעות זמינות
}, { timestamps: true });

export default mongoose.model('ExternalSubstitute', externalSubstituteSchema);
