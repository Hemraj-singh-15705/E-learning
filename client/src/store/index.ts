import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { injectStore } from '../utils/api';

export const store = configureStore({
  reducer: {
    auth: authReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false // Disable checking to allow Mongoose dates or complex formats if any
    })
});

// Bind store to axios interceptor
injectStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
