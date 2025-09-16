import api from './api';

// דיווח חיסור
export const reportAbsence = async (absenceData, token) => {
  const response = await api.post('/substitute-requests/report', absenceData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// אישור מחליף
export const approveReplacement = async (replacementData, token) => {
  const response = await api.post('/substitute-requests/approve', replacementData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת כל בקשות ההחלפה
export const getSubstituteRequests = async (token) => {
  const response = await api.get('/substitute-requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
