import api from "./api";

// הוספת ממלא מקום חיצוני
export const addExternalSubstitute = async (substituteData, token) => {
  const response = await api.post("/external-substitutes", substituteData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// עדכון ממלא מקום לפי תעודת זהות
export const updateExternalSubstitute = async (identityNumber, substituteData, token) => {
  const response = await api.put(`/external-substitutes/${identityNumber}`, substituteData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// מחיקת ממלא מקום לפי תעודת זהות
export const deleteExternalSubstitute = async (identityNumber, token) => {
  const response = await api.delete(`/external-substitutes/${identityNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת כל הממלאים החיצוניים
export const getAllExternalSubstitutes = async (token) => {
  const response = await api.get("/external-substitutes", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת ממלא מקום לפי תעודת זהות
export const getExternalSubstituteByIdNumber = async (identityNumber, token) => {
  const response = await api.get(`/external-substitutes/identity/${identityNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
