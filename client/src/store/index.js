import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import schoolDataSlice from './slices/schoolDataSlice';
import scheduleSlice from './slices/scheduleSlice';
import substituteSlice from './slices/substituteSlice';
import persistenceMiddleware, { loadFromCache } from './middleware/persistenceMiddleware';


// Load cached data
const cachedSchoolData = loadFromCache('schoolData');
const cachedSubstituteData = loadFromCache('substituteData');

const preloadedState = {
  ...(cachedSchoolData && { schoolData: cachedSchoolData }),
  ...(cachedSubstituteData && { substitute: cachedSubstituteData }),
};

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    schoolData: schoolDataSlice,
    schedule: scheduleSlice,
    substitute: substituteSlice,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistenceMiddleware),
});