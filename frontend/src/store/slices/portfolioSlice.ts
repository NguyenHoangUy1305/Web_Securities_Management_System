import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Portfolio, PortfolioSummary, AssetAllocation } from '../../types';
import * as portfolioService from '../../services/portfolioService';

/* ---------- state ---------- */
interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  summary: PortfolioSummary | null;
  allocation: AssetAllocation[];
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  portfolios: [],
  selectedPortfolio: null,
  summary: null,
  allocation: [],
  loading: false,
  error: null,
};

/* ---------- thunks ---------- */
export const fetchPortfolios = createAsyncThunk(
  'portfolios/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await portfolioService.getPortfolios();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch portfolios',
      );
    }
  },
);

export const fetchPortfolioDetail = createAsyncThunk(
  'portfolios/fetchDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      return await portfolioService.getPortfolio(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch portfolio detail',
      );
    }
  },
);

export const createPortfolio = createAsyncThunk(
  'portfolios/create',
  async (payload: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      return await portfolioService.createPortfolio(payload);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to create portfolio',
      );
    }
  },
);

export const fetchSummary = createAsyncThunk(
  'portfolios/fetchSummary',
  async (id: number, { rejectWithValue }) => {
    try {
      return await portfolioService.getPortfolioSummary(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch summary',
      );
    }
  },
);

export const fetchAllocation = createAsyncThunk(
  'portfolios/fetchAllocation',
  async (id: number, { rejectWithValue }) => {
    try {
      return await portfolioService.getAssetAllocation(id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch allocation',
      );
    }
  },
);

/* ---------- slice ---------- */
const portfolioSlice = createSlice({
  name: 'portfolios',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    /* fetch all */
    builder.addCase(fetchPortfolios.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPortfolios.fulfilled, (state, action: PayloadAction<Portfolio[]>) => {
      state.loading = false;
      state.portfolios = action.payload;
    });
    builder.addCase(fetchPortfolios.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch portfolios';
    });

    /* fetch detail */
    builder.addCase(fetchPortfolioDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPortfolioDetail.fulfilled, (state, action: PayloadAction<Portfolio>) => {
      state.loading = false;
      state.selectedPortfolio = action.payload;
    });
    builder.addCase(fetchPortfolioDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch portfolio detail';
    });

    /* create */
    builder.addCase(createPortfolio.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createPortfolio.fulfilled, (state, action: PayloadAction<Portfolio>) => {
      state.loading = false;
      state.portfolios.push(action.payload);
    });
    builder.addCase(createPortfolio.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to create portfolio';
    });

    /* summary */
    builder.addCase(fetchSummary.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchSummary.fulfilled, (state, action: PayloadAction<PortfolioSummary>) => {
      state.loading = false;
      state.summary = action.payload;
    });
    builder.addCase(fetchSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch summary';
    });

    /* allocation */
    builder.addCase(fetchAllocation.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAllocation.fulfilled, (state, action: PayloadAction<AssetAllocation[]>) => {
      state.loading = false;
      state.allocation = action.payload;
    });
    builder.addCase(fetchAllocation.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch allocation';
    });
  },
});

export default portfolioSlice.reducer;
