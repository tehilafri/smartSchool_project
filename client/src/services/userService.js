import api from './api';

// Authentication
export const loginUser = (userName, password, schoolCode) => {
  return api.post('/users/login', { userName, password, schoolCode });
};

export const registerUser = (userData, token) => {
  return api.post('/users/register', userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// User CRUD
export const getAllTeachers = (token) => {
  return api.get('/users/teachers', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getAllStudents = (token) => {
  return api.get('/users/students', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getUserById = (id, token) => {
  return api.get(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUser = (id, updatedData, token) => {
  return api.put(`/users/${id}`, updatedData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Password management
export const forgotPassword = (email) => {
  return api.post('/users/forgot-password', { email });
};

export const resetPassword = (token, newPassword) => {
  return api.put(`/users/reset-password/${token}`, { newPassword });
};

export const getMe = (token) => {
  return api.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

//getAllSecretaries
export const getAllSecretaries = (token) => {
  return api.get('/users/secretaries', {
    headers: { Authorization: `Bearer ${token}` },
  });
}