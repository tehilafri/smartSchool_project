import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  userName: { type: String, unique: true }, 
  gender: { type: String, enum: ['male', 'female'], required: true },
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{9}$/.test(v); // בדיוק 9 ספרות
      },
      message: props => `${props.value} is not a valid Israeli ID number`
    }
  },
  email: { type: String, required: true },
  birthDate: { type: Date },
  password: { type: String, required: true },
  role: { type: String, enum: ['student','teacher','admin'], required: true },
  // classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }], // למורים ולסטודנטים
  classes: { type: String, required: true }, // למורים ולסטודנטים
  subjects: [{ type: String }], // סל ידע למורים
  ishomeroom: { type: Boolean, default: false },
  points: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema)