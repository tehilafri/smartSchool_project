import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser as loginAPI } from '../../services/userService';

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ userName, password, schoolCode }, { rejectWithValue }) => {
    try {
      const response = await loginAPI(userName, password, schoolCode);
      const { token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);
      localStorage.setItem('schoolCode', user.schoolCode);
      
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בהתחברות');
    }
  }
);

// Logout thunk
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('schoolCode');
  window.location.href = '/';
});

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  schoolCode: localStorage.getItem('schoolCode') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        state.schoolCode = action.payload.user.schoolCode;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.schoolCode = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;