import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMe } from '../../services/userService';

// Async thunk for getting current user data
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMe();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת נתוני משתמש');
    }
  }
);

const initialState = {
  currentUser: null,
  loading: false,
  error: null,
  lastFetched: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    updateCurrentUser: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserError, updateCurrentUser, clearCurrentUser } = userSlice.actions;
export default userSlice.reducer;