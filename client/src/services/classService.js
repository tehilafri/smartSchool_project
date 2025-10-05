import api from "./api";

// יצירת כיתה חדשה
export const createClass = async (classData) => {
  const response = await api.post("/classes/createClass", classData);
  return response.data;
};

// קבלת כל הכיתות
export const getAllClasses = async () => {
  const response = await api.get("/classes/");
  return response.data;
};

// עדכון מחנכת של כיתה
export const updateHomeroomTeacher = async (className, teacherId) => {
  const response = await api.put(`/classes/updateHomeroomTeacher/${className}`, { teacherId });
  return response.data;
};

// הוספת תלמיד לכיתה
export const addStudentToClass = async (studentData) => {
  const response = await api.post("/classes/addStudent", studentData);
  return response.data;
};

// הסרת תלמיד מכיתה
export const removeStudentFromClass = async (studentData) => {
  const response = await api.post("/classes/removeStudent", studentData);
  return response.data;
};

export const deleteClass = async (className) => {
  const response = await api.delete(`/classes/${className}`);
  return response.data;
};

export const getStudentsByName = async (className) => {
  const response = await api.get(`/classes/studentsByName/${className}`);
  return response.data;
};

export const deleteUser = async (id) => {
  const response= await api.delete(`/users/${id}`);
  return response.data;
};