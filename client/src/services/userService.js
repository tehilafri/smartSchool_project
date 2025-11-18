import api from './api';

// Authentication
export const loginUser = (userName, password, schoolCode) => {
  const x= import.meta.env.VITE_API_URL;
  console.log('Login Base URL string:', x);
  return api.post('/users/login', { userName, password, schoolCode });
};

export const registerUser = (userData) => {
  return api.post('/users/register', userData);
};

// User CRUD
export const getAllTeachers = () => {
  return api.get('/users/teachers');
};

export const getAllStudents = () => {
  return api.get('/users/students');
};

export const getUserById = (id) => {
  return api.get(`/users/${id}`);
};

export const updateUser = (id, updatedData) => {
  return api.put(`/users/${id}`, updatedData);
};

export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
}

// Password management
export const forgotPassword = (email, userId) => {
  return api.post('/users/forgot-password', { email, userId });
};

export const resetPassword = (token, newPassword) => {
  return api.put(`/users/reset-password/${token}`, { password: newPassword });
};

export const getMe = () => {
  return api.get('/users/me');
};

// getAllSecretaries
export const getAllSecretaries = () => {
  return api.get('/users/secretaries');
};
