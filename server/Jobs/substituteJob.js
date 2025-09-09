import SubstituteRequest from '../models/SubstituteRequest.js';
import { findCandidates } from '../services/SubstituteService.js';
import { sendEmail } from '../utils/email.js'; 
import Class from '../models/Class.js';

const sendSubstituteEmail = async (teacher, request, formattedDate) => {
  // מוצאים את הכיתה לפי ID
  const classInfo = await Class.findOne({ _id: request.classId , schoolId: request.schoolId });

  const className = classInfo ? classInfo.name : 'Unknown Class';

  await sendEmail(
    teacher.email,
    `Substitute Request: ${request.subject}`,
    `Hello ${teacher.firstName},

We are looking for someone to cover ${request.subject} lesson for class ${className} on ${formattedDate} from ${request.startTime} to ${request.endTime}.
If you can cover it, please confirm by filling out the form here: ${request.formLink}

Thank you!`
  );
};


export const checkPendingSubstituteRequests = async () => {
  const now = new Date();

  const pendingRequests = await SubstituteRequest.find({ status: 'pending', checked: false , schoolId: request.schoolId });

  for (const request of pendingRequests) {
    const weekBefore = new Date(request.date);
    weekBefore.setDate(weekBefore.getDate() - 7);

    if (now >= weekBefore) {
      const { availableInternal, availableExternal } = await findCandidates(request);

      console.log('בקשה:', request._id);
      console.log('מורים פנויים פנימיים:', availableInternal.map(t => t.firstName + ' ' + t.lastName));
      console.log('מורים פנויים חיצוניים:', availableExternal.map(t => t.firstName + ' ' + t.lastName));
      
      // --- כאן שולחים מיילים בפועל ---
      const formattedDate = new Date(request.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      for (const teacher of [...availableInternal, ...availableExternal]) {
        await sendSubstituteEmail(teacher, request, formattedDate);
      }

      request.checked = true;
      await request.save();
    }
  }
};
