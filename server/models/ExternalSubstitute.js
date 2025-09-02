import mongoose from 'mongoose';

const externalSubstituteSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subjects: [{ type: String }], // המקצועות שהם יכולים ללמד
  availability: [{ date: Date, time: String }] // אופציונלי: שעות שהם זמינים
});

export default mongoose.model('ExternalSubstitute', externalSubstituteSchema);
