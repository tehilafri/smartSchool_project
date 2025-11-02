import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  userName: { type: String }, // לא ייחודי
  gender: { type: String, enum: ['male', 'female'], required: true },
  userId: { 
    type: String,  
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{9}$/.test(v); // בדיוק 9 ספרות
      },
      message: props => `${props.value} is not a valid Israeli ID number`
    }
  },
  email: { type: String, required: true },
  phone: { type: String },
  birthDate: { type: Date },
  password: { type: String, required: true }, // לא ייחודי
  role: { type: String, enum: ['student','teacher','admin','secretary'], required: true },
  status: {type: String, enum: ['active', 'graduate'], default: 'active' },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  subjects: [{ type: String }],
  ishomeroom: { type: Boolean, default: false },
  points: { type: Number, default: 0 },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

// --- אינדקסים ---
// מורים ומזכירות – ייחודיות יחסית לבית ספר
userSchema.index(
  { userId: 1, schoolId: 1 },
  { unique: true, partialFilterExpression: { role: { $in: ['teacher','secretary'] } } }
);
userSchema.index(
  { email: 1, schoolId: 1 },
  { unique: true, partialFilterExpression: { role: { $in: ['teacher','secretary'] } } }
);

// תלמידים ומנהלים – ייחודיות מוחלטת בלי קשר לבית ספר
userSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { role: { $in: ['student','admin'] } } }
);
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { role: { $in: ['admin'] } } }
);

// --- פונקציה לשחזור סיסמה ---
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // שעה מהיצירה

  return resetToken;
};

export default mongoose.model('User', userSchema);