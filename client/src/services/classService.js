import api from "./api";

// יצירת כיתה חדשה
export const createClass = async (classData, token) => {
  const response = await api.post("/classes/createClass", classData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת כל הכיתות
export const getAllClasses = async (token) => {
  const response = await api.get("/classes", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// עדכון מחנכת של כיתה
export const updateHomeroomTeacher = async (className, teacherId, token) => {
  const response = await api.put(`/classes/updateHomeroomTeacher/${className}`, { teacherId }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// הוספת תלמיד לכיתה
export const addStudentToClass = async (studentData, token) => {
  const response = await api.post("/classes/addStudent", studentData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// הסרת תלמיד מכיתה
export const removeStudentFromClass = async (studentData, token) => {
  const response = await api.post("/classes/removeStudent", studentData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
