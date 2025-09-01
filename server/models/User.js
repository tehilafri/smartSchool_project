import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  idNumber: { type: String, required: true, unique: true },
  birthDate: { type: Date },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student','teacher','admin'], required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }], // למורים ולסטודנטים
  subjects: [{ type: String }], // סל ידע למורים
  homeroom: { type: Boolean, default: false },
  points: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema)