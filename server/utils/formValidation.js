import SubstituteRequest from '../models/SubstituteRequest.js';

// פונקציה לבדיקה אם בקשה כבר אושרה
export const checkRequestStatus = async (absenceCode) => {
  try {
    const request = await SubstituteRequest.findOne({ absenceCode });
    return request ? request.status : null;
  } catch (error) {
    console.error('Error checking request status:', error);
    return null;
  }
};

// פונקציה ליצירת הודעה לטופס
export const getFormMessage = (status) => {
  if (status === 'accepted') {
    return 'לא רלוונטי, תודה...';
  }
  return null;
};