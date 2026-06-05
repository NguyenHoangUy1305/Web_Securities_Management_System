import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { MarketData, TechnicalIndicator } from '../../types';
import * as marketDataService from '../../services/marketDataService';

/* ---------- state ---------- */
interface MarketDataState {
  ohlc: MarketData[];
  indicators: TechnicalIndicator[];
  latestPrices: Record<number, MarketData>;
  loading: boolean;
  error: string | null;
}

const initialState: MarketDataState = {
  ohlc: [],
  indicators: [],
  latestPrices: {},
  loading: false,
  error: null,
};

/* ---------- thunks ---------- */
export const fetchOHLC = createAsyncThunk(
  'marketData/fetchOHLC',
  async (
    { securityId, from, to }: { securityId: number; from?: string; to?: string },
    { rejectWithValue },
  ) => {
    try {
      return await marketDataService.getOHLC(securityId, from, to);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch OHLC data',
      );
    }
  },
);

export const fetchIndicators = createAsyncThunk(
  'marketData/fetchIndicators',
  async (securityId: number, { rejectWithValue }) => {
    try {
      return await marketDataService.getIndicators(securityId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch indicators',
      );
    }
  },
);

export const fetchLatest = createAsyncThunk(
  'marketData/fetchLatest',
  async (securityId: number, { rejectWithValue }) => {
    try {
      return await marketDataService.getLatest(securityId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.message ?? error.message ?? 'Failed to fetch latest price',
      );
    }
  },
);

/* ---------- slice ---------- */
const marketDataSlice = createSlice({
  name: 'marketData',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    /* OHLC */
    builder.addCase(fetchOHLC.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOHLC.fulfilled, (state, action: PayloadAction<MarketData[]>) => {
      state.loading = false;
      state.ohlc = action.payload;
    });
    builder.addCase(fetchOHLC.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch OHLC data';
    });

    /* indicators */
    builder.addCase(fetchIndicators.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchIndicators.fulfilled, (state, action: PayloadAction<TechnicalIndicator[]>) => {
      state.loading = false;
      state.indicators = action.payload;
    });
    builder.addCase(fetchIndicators.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch indicators';
    });

    /* latest */
    builder.addCase(fetchLatest.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLatest.fulfilled, (state, action: PayloadAction<MarketData>) => {
      state.loading = false;
      state.latestPrices[action.payload.security_id] = action.payload;
    });
    builder.addCase(fetchLatest.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch latest price';
    });
  },
});

export default marketDataSlice.reducer;
