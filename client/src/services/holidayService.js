import api from './api';

export const getJewishHolidays = (year) => {
  return api.get(`/events/holidays${year ? `?year=${year}` : ''}`);
};