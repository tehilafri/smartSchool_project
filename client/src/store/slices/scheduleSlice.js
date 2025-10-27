import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getScheduleByTeacher, 
  getHomeroomClassSchedule, 
  getNextLessonForTeacher,
  getScheduleForStudent,
  getNextLessonForStudent
} from '../../services/scheduleService';

// Async thunks for schedule operations
export const fetchTeacherSchedule = createAsyncThunk(
  'schedule/fetchTeacherSchedule',
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await getScheduleByTeacher(teacherId);
      return { teacherId, schedule: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת מערכת שעות מורה');
    }
  }
);

export const fetchClassSchedule = createAsyncThunk(
  'schedule/fetchClassSchedule',
  async (classId, { rejectWithValue }) => {
    try {
      const response = await getHomeroomClassSchedule(classId);
      return { classId, schedule: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת מערכת שעות כיתה');
    }
  }
);

export const fetchNextLesson = createAsyncThunk(
  'schedule/fetchNextLesson',
  async ({ userType }, { rejectWithValue }) => {
    try {
      let response;
      if (userType === 'teacher') {
        response = await getNextLessonForTeacher();
      } else if (userType === 'student') {
        response = await getNextLessonForStudent();
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת השיעור הבא');
    }
  }
);

export const fetchStudentSchedule = createAsyncThunk(
  'schedule/fetchStudentSchedule',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getScheduleForStudent();
      return response?.weekPlan || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת מערכת שעות תלמיד');
    }
  }
);

const initialState = {
  teacherSchedules: {}, // { teacherId: { schedule, lastFetched } }
  classSchedules: {}, // { classId: { schedule, lastFetched } }
  studentSchedule: null,
  nextLesson: null,
  loading: {
    teacherSchedule: false,
    classSchedule: false,
    studentSchedule: false,
    nextLesson: false,
  },
  error: {
    teacherSchedule: null,
    classSchedule: null,
    studentSchedule: null,
    nextLesson: null,
  },
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearScheduleErrors: (state) => {
      state.error = {
        teacherSchedule: null,
        classSchedule: null,
        studentSchedule: null,
        nextLesson: null,
      };
    },
    clearTeacherSchedule: (state, action) => {
      delete state.teacherSchedules[action.payload];
    },
    clearClassSchedule: (state, action) => {
      delete state.classSchedules[action.payload];
    },
    clearAllSchedules: (state) => {
      state.teacherSchedules = {};
      state.classSchedules = {};
      state.studentSchedule = null;
      state.nextLesson = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Teacher Schedule
      .addCase(fetchTeacherSchedule.pending, (state) => {
        state.loading.teacherSchedule = true;
        state.error.teacherSchedule = null;
      })
      .addCase(fetchTeacherSchedule.fulfilled, (state, action) => {
        state.loading.teacherSchedule = false;
        const { teacherId, schedule } = action.payload;
        state.teacherSchedules[teacherId] = {
          schedule,
          lastFetched: Date.now(),
        };
      })
      .addCase(fetchTeacherSchedule.rejected, (state, action) => {
        state.loading.teacherSchedule = false;
        state.error.teacherSchedule = action.payload;
      })
      // Class Schedule
      .addCase(fetchClassSchedule.pending, (state) => {
        state.loading.classSchedule = true;
        state.error.classSchedule = null;
      })
      .addCase(fetchClassSchedule.fulfilled, (state, action) => {
        state.loading.classSchedule = false;
        const { classId, schedule } = action.payload;
        state.classSchedules[classId] = {
          schedule,
          lastFetched: Date.now(),
        };
      })
      .addCase(fetchClassSchedule.rejected, (state, action) => {
        state.loading.classSchedule = false;
        state.error.classSchedule = action.payload;
      })
      // Student Schedule
      .addCase(fetchStudentSchedule.pending, (state) => {
        state.loading.studentSchedule = true;
        state.error.studentSchedule = null;
      })
      .addCase(fetchStudentSchedule.fulfilled, (state, action) => {
        state.loading.studentSchedule = false;
        state.studentSchedule = action.payload;
      })
      .addCase(fetchStudentSchedule.rejected, (state, action) => {
        state.loading.studentSchedule = false;
        state.error.studentSchedule = action.payload;
      })
      // Next Lesson
      .addCase(fetchNextLesson.pending, (state) => {
        state.loading.nextLesson = true;
        state.error.nextLesson = null;
      })
      .addCase(fetchNextLesson.fulfilled, (state, action) => {
        state.loading.nextLesson = false;
        state.nextLesson = action.payload;
      })
      .addCase(fetchNextLesson.rejected, (state, action) => {
        state.loading.nextLesson = false;
        state.error.nextLesson = action.payload;
      });
  },
});

export const {
  clearScheduleErrors,
  clearTeacherSchedule,
  clearClassSchedule,
  clearAllSchedules,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;