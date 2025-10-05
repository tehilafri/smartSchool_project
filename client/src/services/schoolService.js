import api from './api';

// יצירת בית ספר חדש
export const createSchool = async (schoolData) => {
  let config = {};
  if (schoolData instanceof FormData) {
    config = { headers: { 'Content-Type': 'multipart/form-data' } };
  }
  const response = await api.post('/schools', schoolData, config);
  return response.data;
};

// קבלת בית ספר לפי ID
export const getSchoolById = async (id) => {
  const response = await api.get(`/schools/${id}`);
  return response.data;
};

// עדכון בית ספר לפי ID (נגיש רק ל־admin)
export const updateSchool = async (id, updateData) => {
  const response = await api.put(`/schools/${id}`, updateData);
  return response.data;
};

// מחיקת בית ספר לפי ID (נגיש רק ל־admin)
export const deleteSchool = async (id) => {
  const response = await api.delete(`/schools/${id}`);
  return response.data;
};
