import api from './api';

// יצירת מערכת שעות חדשה
export const createSchedule = async (scheduleData, token) => {
  const response = await api.post('/schedule/createSchedule', scheduleData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת השיעור הבא לתלמיד
export const getNextLessonForStudent = async (token) => {
  const response = await api.get('/schedule/nextLesson', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת השיעור הבא למורה
export const getNextLessonForTeacher = async (token) => {
  const response = await api.get('/schedule/nextLessonForTeacher', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת מערכת שעות לפי מורה
export const getScheduleByTeacher = async (token) => {
  const response = await api.get('/schedule/ScheduleByTeacher', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// עדכון יום במערכת שעות
export const updateScheduleDay = async (updateData, token) => {
  const response = await api.put('/schedule/updateDay', updateData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת מערכת שעות לתלמיד
export const getScheduleForStudent = async (token) => {
  const response = await api.get('/schedule/getScheduleForStudent', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
