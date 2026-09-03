import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MENTOR' | 'STUDENT';
  avatar?: string;
  bio?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  isEmailVerified: boolean;
  permissions?: string[];
  lastLoginAt?: string;
  createdAt: string;
}

interface AuthState {
  user: UserState | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserState; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<UserState>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  }
});

export const { setCredentials, clearCredentials, setLoading, updateUser } = authSlice.actions;
export default authSlice.reducer;
