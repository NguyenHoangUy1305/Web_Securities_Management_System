import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginRequest, RegisterRequest } from '../../types';
import * as authService from '../../services/authService';
import { setAuthToken, removeAuthToken } from '../../services/api';

/* ---------- state ---------- */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const storedToken = localStorage.getItem('auth_token');
const storedUser = localStorage.getItem('auth_user');

const initialState: AuthState = {
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

/* ---------- thunks ---------- */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      setAuthToken(result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      return result;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message ?? error.message ?? 'Login failed';
      return rejectWithValue(msg);
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: RegisterRequest, { rejectWithValue }) => {
    try {
      const result = await authService.register(payload);
      setAuthToken(result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      return result;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message ?? error.message ?? 'Registration failed';
      return rejectWithValue(msg);
    }
  },
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getProfile();
      localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message ?? error.message ?? 'Failed to fetch profile';
      return rejectWithValue(msg);
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authService.logout();
    } catch {
      // Even if the API call fails we still clear local state
    } finally {
      removeAuthToken();
      localStorage.removeItem('auth_user');
    }
  },
);

/* ---------- slice ---------- */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem('auth_user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('auth_user');
      }
    },
  },
  extraReducers: (builder) => {
    /* login */
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Login failed';
    });

    /* register */
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Registration failed';
    });

    /* fetch profile */
    builder.addCase(fetchProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) ?? 'Failed to fetch profile';
    });

    /* logout */
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
