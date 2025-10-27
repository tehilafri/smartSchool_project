import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSubstituteRequests, reportAbsence, approveReplacement } from '../../services/substituteRequestsSercive';
import { getAllExternalSubstitutes, addExternalSubstitute, deleteExternalSubstitute, updateExternalSubstitute } from '../../services/externalSubstituteService';

// Async thunks
export const fetchSubstituteRequests = createAsyncThunk(
  'substitute/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getSubstituteRequests();
      return response?.requests || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת בקשות היעדרות');
    }
  }
);

export const addSubstituteRequest = createAsyncThunk(
  'substitute/addRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await reportAbsence(requestData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בהוספת בקשה');
    }
  }
);

export const updateSubstituteRequest = createAsyncThunk(
  'substitute/updateRequest',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await approveReplacement({ requestId: id, ...data });
      return { id, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בעדכון בקשה');
    }
  }
);

export const addExternalSubstituteThunk = createAsyncThunk(
  'substitute/addExternal',
  async (substituteData, { rejectWithValue }) => {
    try {
      const response = await addExternalSubstitute(substituteData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בהוספת ממלא מקום');
    }
  }
);

export const updateExternalSubstituteThunk = createAsyncThunk(
  'substitute/updateExternal',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateExternalSubstitute(id, data);
      return { identityNumber: id, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בעדכון ממלא מקום');
    }
  }
);

export const removeExternalSubstituteThunk = createAsyncThunk(
  'substitute/removeExternal',
  async (identityNumber, { rejectWithValue }) => {
    try {
      await deleteExternalSubstitute(identityNumber);
      return identityNumber;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה במחיקת ממלא מקום');
    }
  }
);

export const fetchExternalSubstitutes = createAsyncThunk(
  'substitute/fetchExternal',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllExternalSubstitutes();
      return response || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בטעינת ממלאי מקום');
    }
  }
);

export const submitAbsenceRequest = createAsyncThunk(
  'substitute/submitRequest',
  async (absenceData, { rejectWithValue }) => {
    try {
      const response = await reportAbsence(absenceData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה בשליחת בקשת היעדרות');
    }
  }
);

export const approveSubstituteReplacement = createAsyncThunk(
  'substitute/approveReplacement',
  async (replacementData, { rejectWithValue }) => {
    try {
      const response = await approveReplacement(replacementData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'שגיאה באישור מחליף');
    }
  }
);

const initialState = {
  requests: [],
  externalSubstitutes: [],
  loading: {
    requests: false,
    external: false,
    submitting: false,
    approving: false,
  },
  error: {
    requests: null,
    external: null,
    submitting: null,
    approving: null,
  },
  lastFetched: {
    requests: null,
    external: null,
  },
};

const substituteSlice = createSlice({
  name: 'substitute',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = {
        requests: null,
        external: null,
        submitting: null,
        approving: null,
      };
    },
    // Optimistic updates
    addExternalSubstituteOptimistic: (state, action) => {
      state.externalSubstitutes.push({ ...action.payload, _optimistic: true });
    },
    updateExternalSubstituteOptimistic: (state, action) => {
      const index = state.externalSubstitutes.findIndex(s => s.identityNumber === action.payload.identityNumber);
      if (index !== -1) {
        state.externalSubstitutes[index] = { ...state.externalSubstitutes[index], ...action.payload, _optimistic: true };
      }
    },
    removeExternalSubstituteOptimistic: (state, action) => {
      state.externalSubstitutes = state.externalSubstitutes.filter(s => s.identityNumber !== action.payload);
    },
    addRequestOptimistic: (state, action) => {
      state.requests.push({ ...action.payload, _optimistic: true });
    },
    updateRequestOptimistic: (state, action) => {
      const index = state.requests.findIndex(r => r._id === action.payload.id);
      if (index !== -1) {
        state.requests[index] = { ...state.requests[index], ...action.payload, _optimistic: true };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Substitute Requests
      .addCase(fetchSubstituteRequests.pending, (state) => {
        state.loading.requests = true;
        state.error.requests = null;
      })
      .addCase(fetchSubstituteRequests.fulfilled, (state, action) => {
        state.loading.requests = false;
        state.requests = action.payload;
        state.lastFetched.requests = Date.now();
      })
      .addCase(fetchSubstituteRequests.rejected, (state, action) => {
        state.loading.requests = false;
        state.error.requests = action.payload;
      })
      // External Substitutes
      .addCase(fetchExternalSubstitutes.pending, (state) => {
        state.loading.external = true;
        state.error.external = null;
      })
      .addCase(fetchExternalSubstitutes.fulfilled, (state, action) => {
        state.loading.external = false;
        state.externalSubstitutes = action.payload;
        state.lastFetched.external = Date.now();
      })
      .addCase(fetchExternalSubstitutes.rejected, (state, action) => {
        state.loading.external = false;
        state.error.external = action.payload;
      })
      // Submit Request
      .addCase(submitAbsenceRequest.pending, (state) => {
        state.loading.submitting = true;
        state.error.submitting = null;
      })
      .addCase(submitAbsenceRequest.fulfilled, (state) => {
        state.loading.submitting = false;
      })
      .addCase(submitAbsenceRequest.rejected, (state, action) => {
        state.loading.submitting = false;
        state.error.submitting = action.payload;
      })
      // Approve Replacement
      .addCase(approveSubstituteReplacement.pending, (state) => {
        state.loading.approving = true;
        state.error.approving = null;
      })
      .addCase(approveSubstituteReplacement.fulfilled, (state) => {
        state.loading.approving = false;
      })
      .addCase(approveSubstituteReplacement.rejected, (state, action) => {
        state.loading.approving = false;
        state.error.approving = action.payload;
      })
      // Add Request
      .addCase(addSubstituteRequest.fulfilled, (state, action) => {
        state.requests.push(action.payload);
      })
      // Update Request
      .addCase(updateSubstituteRequest.fulfilled, (state, action) => {
        const index = state.requests.findIndex(r => r._id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = { ...state.requests[index], ...action.payload };
        }
      })
      // External Substitute CRUD
      .addCase(addExternalSubstituteThunk.fulfilled, (state, action) => {
        // Remove optimistic version and add real data
        state.externalSubstitutes = state.externalSubstitutes.filter(s => !s._optimistic);
        state.externalSubstitutes.push(action.payload);
      })
      .addCase(updateExternalSubstituteThunk.fulfilled, (state, action) => {
        const index = state.externalSubstitutes.findIndex(s => s.identityNumber === action.payload.identityNumber);
        if (index !== -1) {
          state.externalSubstitutes[index] = action.payload;
        }
      })
      .addCase(removeExternalSubstituteThunk.fulfilled, (state, action) => {
        state.externalSubstitutes = state.externalSubstitutes.filter(s => s.identityNumber !== action.payload);
      });
  },
});

export const {
  clearErrors,
  addExternalSubstituteOptimistic,
  updateExternalSubstituteOptimistic,
  removeExternalSubstituteOptimistic,
  addRequestOptimistic,
  updateRequestOptimistic,
} = substituteSlice.actions;

export default substituteSlice.reducer;