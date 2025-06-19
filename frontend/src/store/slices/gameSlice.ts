import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface TranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  confidence: number;
}

interface GeneratedCard {
  id: string;
  type: 'location' | 'npc' | 'item' | 'moment';
  title: string;
  description: string;
  imageUrl?: string;
  timestamp: string;
}

interface GameState {
  isRecording: boolean;
  transcriptions: TranscriptionEntry[];
  generatedCards: GeneratedCard[];
  isProcessing: boolean;
  error: string | null;
}

const initialState: GameState = {
  isRecording: false,
  transcriptions: [],
  generatedCards: [],
  isProcessing: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
      state.error = null;
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    addTranscription: (state, action: PayloadAction<TranscriptionEntry>) => {
      state.transcriptions.push(action.payload);
    },
    addGeneratedCard: (state, action: PayloadAction<GeneratedCard>) => {
      state.generatedCards.push(action.payload);
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSession: (state) => {
      state.transcriptions = [];
      state.generatedCards = [];
      state.isRecording = false;
      state.isProcessing = false;
      state.error = null;
    },
  },
});

export const {
  startRecording,
  stopRecording,
  addTranscription,
  addGeneratedCard,
  setProcessing,
  setError,
  clearSession,
} = gameSlice.actions;

export default gameSlice.reducer; 