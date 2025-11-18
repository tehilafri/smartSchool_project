import api from './api';

// Authentication
export const loginUser = (userName, password, schoolCode) => {
  const x= "https://smartschool-project-node.onrender.com";
  console.log("❤️",x[0],"❤️");
  return api.post('https://smartschool-project-node.onrender.com/api/users/login', { userName, password, schoolCode });
};

export const registerUser = (userData) => {
  return api.post('https://smartschool-project-node.onrender.com/api/users/register', userData);
};

// User CRUD
export const getAllTeachers = () => {
  return api.get('https://smartschool-project-node.onrender.com/api/users/teachers');
};

export const getAllStudents = () => {
  return api.get('https://smartschool-project-node.onrender.com/api/users/students');
};

export const getUserById = (id) => {
  return api.get(`https://smartschool-project-node.onrender.com/api/users/${id}`);
};

export const updateUser = (id, updatedData) => {
  return api.put(`https://smartschool-project-node.onrender.com/api/users/${id}`, updatedData);
};

export const deleteUser = (id) => {
  return api.delete(`https://smartschool-project-node.onrender.com/api/users/${id}`);
}

// Password management
export const forgotPassword = (email, userId) => {
  return api.post('https://smartschool-project-node.onrender.com/api/users/forgot-password', { email, userId });
};

export const resetPassword = (token, newPassword) => {
  return api.put(`https://smartschool-project-node.onrender.com/api/users/reset-password/${token}`, { password: newPassword });
};

export const getMe = () => {
  return api.get('https://smartschool-project-node.onrender.com/api/users/me');
};

// getAllSecretaries
export const getAllSecretaries = () => {
  return api.get('https://smartschool-project-node.onrender.com/api/users/secretaries');
};
