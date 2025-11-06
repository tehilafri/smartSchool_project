import api from './api';

export const getAllExternalSubstitutes = async () => {
  const response = await api.get('/external-substitutes');
  return response.data;
};

export const getExternalSubstituteByIDOfMongo = async (id) => {
  const response = await api.get(`/external-substitutes/${id}`);
  return response.data;
};

export const getExternalSubstituteByIdNumber = async (identityNumber) => {
  const response = await api.get(`/external-substitutes/identity/${identityNumber}`);
  return response.data;
};

export const addExternalSubstitute = async (substituteData) => {
  const response = await api.post('/external-substitutes', substituteData);
  return response.data;
};

export const updateExternalSubstitute = async (identityNumber, substituteData) => {
  const response = await api.put(`/external-substitutes/${identityNumber}`, substituteData);
  return response.data;
};

export const deleteExternalSubstitute = async (identityNumber) => {
  const response = await api.delete(`/external-substitutes/${identityNumber}`);
  return response.data;
};