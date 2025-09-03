import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },

  homeroomTeacher: { 
    type: String, 
    required: true, 
    ref: 'User' 
  },

  students: [{ 
    type: String, 
    ref: 'User' 
  }],

  teachers: [{ 
    type: String, 
    ref: 'User' 
  }],

  schedule: [{ 
    type: String, 
    ref: 'Schedule' 
  }]
}, { timestamps: true });

export default mongoose.model('Class', classSchema);
