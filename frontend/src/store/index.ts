import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import securitiesReducer from './slices/securitiesSlice';
import portfolioReducer from './slices/portfolioSlice';
import marketDataReducer from './slices/marketDataSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    securities: securitiesReducer,
    portfolios: portfolioReducer,
    marketData: marketDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
