import api from "./api";

// יצירת אירוע חדש
export const addEvent = async (eventData, token) => {
  const response = await api.post("/events/addEvent", eventData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת כל האירועים
export const getEvents = async (token) => {
  const response = await api.get("/events", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת אירוע לפי ID
export const getEventById = async (eventId, token) => {
  const response = await api.get(`/events/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// עדכון אירוע
export const updateEvent = async (eventId, updatedData, token) => {
  const response = await api.put(`/events/${eventId}`, updatedData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// מחיקת אירוע
export const deleteEvent = async (eventId, token) => {
  const response = await api.delete(`/events/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת המבחן הבא של התלמיד
export const getNextExam = async (token) => {
  const response = await api.get("/events/nextExam", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// קבלת כל המבחנים הקרובים של התלמיד
export const getUpcomingExams = async (token) => {
  const response = await api.get("/events/upcomingExams", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
