import api from './api';

// יצירת בית ספר חדש
export const createSchool = async (schoolData, token) => {
  const response = await api.post('/schools', schoolData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת בית ספר לפי ID
export const getSchoolById = async (id, token) => {
  const response = await api.get(`/schools/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// עדכון בית ספר לפי ID (נגיש רק ל־admin)
export const updateSchool = async (id, updateData, token) => {
  const response = await api.put(`/schools/${id}`, updateData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// מחיקת בית ספר לפי ID (נגיש רק ל־admin)
export const deleteSchool = async (id, token) => {
  const response = await api.delete(`/schools/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
