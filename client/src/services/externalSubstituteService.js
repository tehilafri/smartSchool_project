import api from "./api";

// הוספת ממלא מקום חיצוני
export const addExternalSubstitute = async (substituteData) => {
  const response = await api.post("/external-substitutes", substituteData);
  return response.data;
};

// עדכון ממלא מקום לפי תעודת זהות
export const updateExternalSubstitute = async (identityNumber, substituteData) => {
  const response = await api.put(`/external-substitutes/${identityNumber}`, substituteData);
  return response.data;
};

// מחיקת ממלא מקום לפי תעודת זהות
export const deleteExternalSubstitute = async (identityNumber) => {
  const response = await api.delete(`/external-substitutes/${identityNumber}`);
  return response.data;
};

// קבלת כל הממלאים החיצוניים
export const getAllExternalSubstitutes = async () => {
  const response = await api.get("/external-substitutes");
  return response.data;
};

// קבלת ממלא מקום לפי תעודת זהות
export const getExternalSubstituteByIdNumber = async (identityNumber) => {
  const response = await api.get(`/external-substitutes/identity/${identityNumber}`);
  return response.data;
};
