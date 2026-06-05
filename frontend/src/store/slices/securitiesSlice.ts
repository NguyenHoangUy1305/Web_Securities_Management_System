import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Security } from '../../types';
import type { PortfolioSummary, AssetAllocation } from '../../types';
import * as securitiesService from '../../services/securitiesService';

/* ---------- state ---------- */
interface SecuritiesState {
  securities: Security[];
  selectedSecurity: Security | null;
  topGainers: Security[];
  topLosers: Security[];
  loading: boolean;
  error: string | null;
}

const initialState: SecuritiesState = {
  securities: [],
  selectedSecurity: null,
  topGainers: [],
  topLosers: [],
  loading: false,
  error: null,
};

/* ---------- thunks ---------- */
export const fetchSecurities = createAsyncThunk(
  'securities/fetchAll',
  async (
    params: Record<string, string | number | undefined> | undefined,
    { rejectWithValue },
  ) => {
    try {
      const res = await securitiesService.getSecurities(params);
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch securities',
      );
    }
  },
);

export const fetchSecurityDetail = createAsyncThunk(
  'securities/fetchDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      return await securitiesService.getSecurity(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch security detail',
      );
    }
  },
);

export const fetchTopGainers = createAsyncThunk(
  'securities/fetchTopGainers',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      return await securitiesService.getTopGainers(limit);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch top gainers',
      );
    }
  },
);

export const fetchTopLosers = createAsyncThunk(
  'securities/fetchTopLosers',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      return await securitiesService.getTopLosers(limit);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch top losers',
      );
    }
  },
);

/* ---------- slice ---------- */
const securitiesSlice = createSlice({
  name: 'securities',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    /* fetch all */
    builder.addCase(fetchSecurities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSecurities.fulfilled, (state, action: PayloadAction<Security[]>) => {
      state.loading = false;
      state.securities = action.payload;
    });
    builder.addCase(fetchSecurities.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch securities';
    });

    /* fetch detail */
    builder.addCase(fetchSecurityDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSecurityDetail.fulfilled, (state, action: PayloadAction<Security>) => {
      state.loading = false;
      state.selectedSecurity = action.payload;
    });
    builder.addCase(fetchSecurityDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch security detail';
    });

    /* top gainers */
    builder.addCase(fetchTopGainers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchTopGainers.fulfilled, (state, action: PayloadAction<Security[]>) => {
      state.loading = false;
      state.topGainers = action.payload;
    });
    builder.addCase(fetchTopGainers.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch top gainers';
    });

    /* top losers */
    builder.addCase(fetchTopLosers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchTopLosers.fulfilled, (state, action: PayloadAction<Security[]>) => {
      state.loading = false;
      state.topLosers = action.payload;
    });
    builder.addCase(fetchTopLosers.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch top losers';
    });
  },
});

export default securitiesSlice.reducer;
