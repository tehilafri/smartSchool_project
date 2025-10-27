const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const persistenceMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Save to localStorage after state updates
  if (action.type.includes('/fulfilled')) {
    const state = store.getState();
    
    if (action.type.includes('schoolData/')) {
      localStorage.setItem('schoolData', JSON.stringify({
        data: state.schoolData,
        timestamp: Date.now()
      }));
    }
    
    if (action.type.includes('substitute/')) {
      localStorage.setItem('substituteData', JSON.stringify({
        data: state.substitute,
        timestamp: Date.now()
      }));
    }
  }
  
  return result;
};

export const loadFromCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error loading from cache:', error);
    return null;
  }
};

export const clearCache = () => {
  localStorage.removeItem('schoolData');
  localStorage.removeItem('substituteData');
};

export const clearPersistedState = clearCache;

export default persistenceMiddleware;