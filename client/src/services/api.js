import axios from 'axios';
import { showError } from '../components/ErrorNotification';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// כאן אנחנו מוסיפים את הטוקן אוטומטית לכל בקשה
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // קריאה ל-localStorage בכל בקשה מחדש
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// טיפול בשגיאות
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const config = error.config;
    
    // הצגת שגיאות רק עבור פעולות מפורשות (לא GET)
    const shouldShowError = config?.method !== 'get' || config?.showErrorOnGet;
    
    if (shouldShowError) {
      switch (status) {
        case 401:
          showError('אין הרשאה - נא להתחבר מחדש');
          break;
        case 403:
          showError('אין הרשאה לביצוע פעולה זו');
          break;
        case 404:
          showError('המידע המבוקש לא נמצא');
          break;
        case 500:
          showError('שגיאת שרת - נסה שוב מאוחר יותר');
          break;
        default:
          if (message) {
            showError(message);
          } else {
            showError('אירעה שגיאה - נסה שוב');
          }
      }
    }
    
    // טיפול ב-401 תמיד (גם ב-GET)
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// פונקציה לקריאות GET עם הצגת שגיאות
export const apiWithErrors = {
  get: (url, config = {}) => api.get(url, { ...config, showErrorOnGet: true }),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config)
};

export default api;
