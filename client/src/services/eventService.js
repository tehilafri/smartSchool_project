import api from "./api";

// יצירת אירוע חדש
export const addEvent = async (eventData) => {
  const response = await api.post("/events/addEvent", eventData);
  return response.data;
};

// קבלת כל האירועים
export const getEvents = async () => {
  const response = await api.get("/events");
  return response.data;
};

// קבלת אירוע לפי ID
export const getEventById = async (eventId) => {
  const response = await api.get(`/events/${eventId}`);
  return response.data;
};

// עדכון אירוע
export const updateEvent = async (eventId, updatedData) => {
  const response = await api.put(`/events/${eventId}`, updatedData);
  return response.data;
};

// מחיקת אירוע
export const deleteEvent = async (eventId) => {
  const response = await api.delete(`/events/${eventId}`);
  return response.data;
};

// קבלת המבחן הבא של התלמיד
export const getNextExam = async () => {
  const response = await api.get("/events/nextExam");
  return response.data;
};

// קבלת כל המבחנים הקרובים של התלמיד
export const getUpcomingExams = async () => {
  const response = await api.get("/events/upcomingExams");
  return response.data;
};
