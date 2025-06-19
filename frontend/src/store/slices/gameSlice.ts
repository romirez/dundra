import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface TranscriptionEntry {
  id?: string;
  text: string;
  confidence: number;
  speakerId?: string;
  timestamp: number;
  isFinal: boolean;
  campaignId?: string;
  sessionId?: string;
}

interface SpeakerMapping {
  speakerId: string;
  playerName: string;
  isActive: boolean;
}

interface AudioStatus {
  status: string;
  message?: string;
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
  speakerMappings: SpeakerMapping[];
  audioStatus: AudioStatus;
  generatedCards: GeneratedCard[];
  isProcessing: boolean;
  error: string | null;
}

const initialState: GameState = {
  isRecording: false,
  transcriptions: [],
  speakerMappings: [],
  audioStatus: { status: 'Not initialized' },
  generatedCards: [],
  isProcessing: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startRecording: state => {
      state.isRecording = true;
      state.error = null;
    },
    stopRecording: state => {
      state.isRecording = false;
    },
    addTranscription: (state, action: PayloadAction<TranscriptionEntry>) => {
      const transcription = action.payload;
      
      // For interim transcriptions, try to find and update existing interim transcription from same speaker
      if (!transcription.isFinal && transcription.speakerId) {
        // Find the most recent interim transcription from the same speaker
        const existingIndex = state.transcriptions.findLastIndex(
          t => !t.isFinal && 
               t.speakerId === transcription.speakerId &&
               // Only update if it's very recent (within 5 seconds)
               (Date.now() - t.timestamp) < 5000
        );
        
        if (existingIndex >= 0) {
          // Update the existing interim transcription
          state.transcriptions[existingIndex] = {
            ...state.transcriptions[existingIndex],
            text: transcription.text,
            confidence: transcription.confidence,
            timestamp: transcription.timestamp,
          };
          return;
        }
      }
      
      // For final transcriptions or new interim transcriptions, add as new entry
      const newTranscription = {
        ...transcription,
        id: transcription.id || `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      state.transcriptions.push(newTranscription);
      
      // If this is a final transcription, remove any lingering interim transcriptions from the same speaker
      if (transcription.isFinal && transcription.speakerId) {
        state.transcriptions = state.transcriptions.filter(
          t => !(t.speakerId === transcription.speakerId && !t.isFinal && t.id !== newTranscription.id)
        );
      }
    },
    addSpeakerMapping: (state, action: PayloadAction<SpeakerMapping>) => {
      // Update existing mapping or add new one
      const existingIndex = state.speakerMappings.findIndex(
        mapping => mapping.speakerId === action.payload.speakerId
      );
      
      if (existingIndex >= 0) {
        state.speakerMappings[existingIndex] = action.payload;
      } else {
        state.speakerMappings.push(action.payload);
      }
    },
    updateSpeakerMapping: (state, action: PayloadAction<{ speakerId: string; playerName: string }>) => {
      const mapping = state.speakerMappings.find(m => m.speakerId === action.payload.speakerId);
      if (mapping) {
        mapping.playerName = action.payload.playerName;
      }
    },
    setAudioStatus: (state, action: PayloadAction<AudioStatus>) => {
      state.audioStatus = action.payload;
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
    clearSession: state => {
      state.transcriptions = [];
      state.generatedCards = [];
      state.speakerMappings = [];
      state.audioStatus = { status: 'Not initialized' };
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
  addSpeakerMapping,
  updateSpeakerMapping,
  setAudioStatus,
  addGeneratedCard,
  setProcessing,
  setError,
  clearSession,
} = gameSlice.actions;

export default gameSlice.reducer;
