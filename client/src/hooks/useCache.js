import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchAllSchoolData, 
  fetchTeachers, 
  fetchStudents, 
  fetchEvents 
} from '../store/slices/schoolDataSlice';
import { fetchExternalSubstitutes } from '../store/slices/substituteSlice';
import { clearCache } from '../store/middleware/persistenceMiddleware';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useCache = () => {
  const dispatch = useAppDispatch();
  const { lastFetched } = useAppSelector((state) => state.schoolData);
  const { lastFetched: substituteLastFetched } = useAppSelector((state) => state.substitute);

  const isCacheValid = useCallback((timestamp) => {
    return timestamp && (Date.now() - timestamp < CACHE_TTL);
  }, []);

  const refreshIfNeeded = useCallback(async (dataType) => {
    const timestamps = {
      teachers: lastFetched.teachers,
      students: lastFetched.students,
      events: lastFetched.events,
      substitutes: substituteLastFetched.external,
    };

    if (!isCacheValid(timestamps[dataType])) {
      switch (dataType) {
        case 'teachers':
          await dispatch(fetchTeachers());
          break;
        case 'students':
          await dispatch(fetchStudents());
          break;
        case 'events':
          await dispatch(fetchEvents());
          break;
        case 'substitutes':
          await dispatch(fetchExternalSubstitutes());
          break;
        case 'all':
          await dispatch(fetchAllSchoolData());
          break;
      }
    }
  }, [dispatch, lastFetched, substituteLastFetched, isCacheValid]);

  const invalidateCache = useCallback((dataType) => {
    clearCache();
    refreshIfNeeded(dataType);
  }, [refreshIfNeeded]);

  const forceRefresh = useCallback(async (dataType = 'all') => {
    clearCache();
    await refreshIfNeeded(dataType);
  }, [refreshIfNeeded]);

  return {
    refreshIfNeeded,
    invalidateCache,
    forceRefresh,
    isCacheValid,
  };
};