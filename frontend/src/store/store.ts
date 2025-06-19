import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import campaignSlice from './slices/campaignSlice';
import gameSlice from './slices/gameSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    campaign: campaignSlice,
    game: gameSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 