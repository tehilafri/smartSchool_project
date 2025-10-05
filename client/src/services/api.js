import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:1000/api', // כתובת השרת שלך
  headers: {
    'Content-Type': 'application/json',
  },
});

// 👇 כאן אנחנו מוסיפים את הטוקן אוטומטית לכל בקשה
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // קריאה ל-localStorage בכל בקשה מחדש
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
