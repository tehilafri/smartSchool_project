import mongoose from 'mongoose'
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  userName: { type: String, unique: true }, 
  gender: { type: String, enum: ['male', 'female'], required: true },
  userId: { type: String,  required: true, unique: true,
    validate: {
      validator: function(v) {
        return /^\d{9}$/.test(v); // בדיוק 9 ספרות
      },
      message: props => `${props.value} is not a valid Israeli ID number`
    }
  },
  email: { type: String, required: true },
  birthDate: { type: Date },
  password: { type: String, required: true , unique: true},
  role: { type: String, enum: ['student','teacher','admin','secretary'], required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }], // למורים ולסטודנטים
  subjects: [{ type: String }], // סל ידע למורים
  ishomeroom: { type: Boolean, default: false },
  points: { type: Number, default: 0 },
  // הוספת שדות לשחזור סיסמה
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

// --- פונקציה ליצירת טוקן לשחזור סיסמה ---
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // שעה מהיצירה

  return resetToken;
};

export default mongoose.model('User', userSchema)