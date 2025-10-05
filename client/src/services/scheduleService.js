import api from './api';

// יצירת מערכת שעות חדשה
export const createSchedule = async (scheduleData) => {
  const response = await api.post('/schedule/createSchedule', scheduleData);
  return response.data;
};

// קבלת השיעור הבא לתלמיד
export const getNextLessonForStudent = async () => {
  const response = await api.get('/schedule/nextLesson');
  return response.data;
};

// קבלת השיעור הבא למורה
export const getNextLessonForTeacher = async () => {
  const response = await api.get('/schedule/nextLessonForTeacher');
  return response.data;
};

export const getHomeroomClassSchedule = async (classId = null) => {
  const url = classId ? `/schedule/homeroomClassSchedule/${classId}` : '/schedule/homeroomClassSchedule';
  const response = await api.get(url);
  return response.data;
};


// קבלת מערכת שעות לפי מורה
export const getScheduleByTeacher = async (teacherId = null) => {
  const url = teacherId ? `/schedule/ScheduleByTeacher/${teacherId}` : '/schedule/ScheduleByTeacher';
  const response = await api.get(url);
  return response.data;
};

// עדכון יום במערכת שעות
export const updateScheduleDay = async (updateData) => {
  const response = await api.put('/schedule/updateDay', updateData);
  return response.data;
};

// קבלת מערכת שעות לתלמיד
export const getScheduleForStudent = async () => {
  const response = await api.get('/schedule/getScheduleForStudent');
  return response.data;
};
