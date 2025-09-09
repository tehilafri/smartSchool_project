import mongoose from 'mongoose'; 

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, default: null },
  homeroomTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  schedule: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }]
  
}, { timestamps: true });

export default mongoose.model('Class', classSchema);