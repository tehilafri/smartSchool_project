import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getAllTeachers, getAllStudents, getAllSecretaries } from '../../services/userService';
import { getAllClasses } from '../../services/classService';
import { getEvents } from '../../services/eventService';

// Async thunks for fetching school data
export const fetchTeachers = createAsyncThunk(
  'schoolData/fetchTeachers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllTeachers();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת מורות');
    }
  }
);

export const fetchStudents = createAsyncThunk(
  'schoolData/fetchStudents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllStudents();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת תלמידים');
    }
  }
);

export const fetchSecretaries = createAsyncThunk(
  'schoolData/fetchSecretaries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllSecretaries();
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת מזכירות');
    }
  }
);

export const fetchClasses = createAsyncThunk(
  'schoolData/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllClasses();
      return response || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת כיתות');
    }
  }
);

export const fetchEvents = createAsyncThunk(
  'schoolData/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getEvents();
      return Array.isArray(response) ? response : response?.data ?? [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת אירועים');
    }
  }
);

// Combined fetch for all school data
export const fetchAllSchoolData = createAsyncThunk(
  'schoolData/fetchAllSchoolData',
  async (_, { dispatch }) => {
    const results = await Promise.allSettled([
      dispatch(fetchTeachers()),
      dispatch(fetchStudents()),
      dispatch(fetchSecretaries()),
      dispatch(fetchClasses()),
      dispatch(fetchEvents()),
    ]);
    return results;
  }
);

const initialState = {
  teachers: [],
  students: [],
  secretaries: [],
  classes: [],
  events: [],
  loading: {
    teachers: false,
    students: false,
    secretaries: false,
    classes: false,
    events: false,
    all: false,
  },
  error: {
    teachers: null,
    students: null,
    secretaries: null,
    classes: null,
    events: null,
  },
  lastFetched: {
    teachers: null,
    students: null,
    secretaries: null,
    classes: null,
    events: null,
  },
};

const schoolDataSlice = createSlice({
  name: 'schoolData',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = {
        teachers: null,
        students: null,
        secretaries: null,
        classes: null,
        events: null,
      };
    },
    addTeacher: (state, action) => {
      state.teachers.push(action.payload);
    },
    updateTeacher: (state, action) => {
      const index = state.teachers.findIndex(t => t._id === action.payload._id);
      if (index !== -1) {
        state.teachers[index] = { ...state.teachers[index], ...action.payload };
      }
    },
    removeTeacher: (state, action) => {
      state.teachers = state.teachers.filter(t => t._id !== action.payload);
    },
    addStudent: (state, action) => {
      state.students.push(action.payload);
    },
    updateStudent: (state, action) => {
      const index = state.students.findIndex(s => s._id === action.payload._id);
      if (index !== -1) {
        state.students[index] = { ...state.students[index], ...action.payload };
      }
    },
    removeStudent: (state, action) => {
      state.students = state.students.filter(s => s._id !== action.payload);
    },
    addEvent: (state, action) => {
      state.events.push(action.payload);
    },
    updateEvent: (state, action) => {
      const index = state.events.findIndex(e => e._id === action.payload._id);
      if (index !== -1) {
        state.events[index] = { ...state.events[index], ...action.payload };
      }
    },
    removeEvent: (state, action) => {
      state.events = state.events.filter(e => e._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Teachers
    builder
      .addCase(fetchTeachers.pending, (state) => {
        state.loading.teachers = true;
        state.error.teachers = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading.teachers = false;
        state.teachers = action.payload;
        state.lastFetched.teachers = Date.now();
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading.teachers = false;
        state.error.teachers = action.payload;
      })
      // Students
      .addCase(fetchStudents.pending, (state) => {
        state.loading.students = true;
        state.error.students = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading.students = false;
        state.students = action.payload;
        state.lastFetched.students = Date.now();
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading.students = false;
        state.error.students = action.payload;
      })
      // Secretaries
      .addCase(fetchSecretaries.pending, (state) => {
        state.loading.secretaries = true;
        state.error.secretaries = null;
      })
      .addCase(fetchSecretaries.fulfilled, (state, action) => {
        state.loading.secretaries = false;
        state.secretaries = action.payload;
        state.lastFetched.secretaries = Date.now();
      })
      .addCase(fetchSecretaries.rejected, (state, action) => {
        state.loading.secretaries = false;
        state.error.secretaries = action.payload;
      })
      // Classes
      .addCase(fetchClasses.pending, (state) => {
        state.loading.classes = true;
        state.error.classes = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading.classes = false;
        state.classes = action.payload;
        state.lastFetched.classes = Date.now();
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading.classes = false;
        state.error.classes = action.payload;
      })
      // Events
      .addCase(fetchEvents.pending, (state) => {
        state.loading.events = true;
        state.error.events = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading.events = false;
        state.events = action.payload;
        state.lastFetched.events = Date.now();
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading.events = false;
        state.error.events = action.payload;
      })
      // All data
      .addCase(fetchAllSchoolData.pending, (state) => {
        state.loading.all = true;
      })
      .addCase(fetchAllSchoolData.fulfilled, (state) => {
        state.loading.all = false;
      })
      .addCase(fetchAllSchoolData.rejected, (state) => {
        state.loading.all = false;
      });
  },
});

export const {
  clearErrors,
  addTeacher,
  updateTeacher,
  removeTeacher,
  addStudent,
  updateStudent,
  removeStudent,
  addEvent,
  updateEvent,
  removeEvent,
} = schoolDataSlice.actions;

export default schoolDataSlice.reducer;