import api from './api';

// דיווח חיסור
export const reportAbsence = async (absenceData) => {
  const response = await api.post('/substitute-requests/report', absenceData);
  return response.data;
};

// אישור מחליף
export const approveReplacement = async (replacementData) => {
  const response = await api.post('/substitute-requests/approve', replacementData);
  return response.data;
};

// קבלת כל בקשות ההחלפה
export const getSubstituteRequests = async () => {
  const response = await api.get('/substitute-requests');
  return response.data;
};
