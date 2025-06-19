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
      
      // Enhanced debug logging
      console.log('🎤 Adding transcription:', {
        text: transcription.text,
        isFinal: transcription.isFinal,
        speakerId: transcription.speakerId,
        confidence: transcription.confidence,
        timestamp: transcription.timestamp,
        hasId: !!transcription.id,
        currentTranscriptionCount: state.transcriptions.length
      });
      
      // For interim transcriptions, ALWAYS try to update existing interim first
      if (!transcription.isFinal) {
        console.log('🔍 Looking for existing interim transcription to update...');
        
        // Find the most recent interim transcription (search backwards)
        let existingIndex = -1;
        for (let i = state.transcriptions.length - 1; i >= 0; i--) {
          const t = state.transcriptions[i];
          console.log(`  Checking transcription ${i}:`, {
            text: t.text,
            isFinal: t.isFinal,
            speakerId: t.speakerId,
            age: Date.now() - t.timestamp
          });
          
          if (!t.isFinal) {
            // Check if it's from the same speaker (if speakerId available) OR if it's very recent (within 3 seconds)
            const sameSpeaker = transcription.speakerId && t.speakerId === transcription.speakerId;
            const veryRecent = (Date.now() - t.timestamp) < 3000; // 3 seconds
            
            if (sameSpeaker || veryRecent) {
              console.log(`  ✅ Found existing interim to update at index ${i}:`, {
                reason: sameSpeaker ? 'same speaker' : 'very recent',
                age: Date.now() - t.timestamp
              });
              existingIndex = i;
              break;
            }
          }
        }
        
        if (existingIndex >= 0) {
          console.log('🔄 Updating existing interim transcription:', {
            index: existingIndex,
            old: state.transcriptions[existingIndex].text,
            new: transcription.text,
            oldConfidence: state.transcriptions[existingIndex].confidence,
            newConfidence: transcription.confidence
          });
          
          // Update the existing interim transcription
          state.transcriptions[existingIndex] = {
            ...state.transcriptions[existingIndex],
            text: transcription.text,
            confidence: transcription.confidence,
            timestamp: transcription.timestamp,
            speakerId: transcription.speakerId || state.transcriptions[existingIndex].speakerId,
          };
          return;
        } else {
          console.log('❌ No existing interim transcription found to update');
        }
      }
      
      // Helper function to check if two texts are similar
      const areSimilarTexts = (text1: string, text2: string): boolean => {
        const normalize = (text: string) => text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
        const normalized1 = normalize(text1);
        const normalized2 = normalize(text2);
        
        if (normalized1 === normalized2) {
          return true;
        }
        
        // Check if one text is a substring of the other
        if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
          return true;
        }
        
        // Check for high similarity (word overlap)
        const words1 = normalized1.split(/\s+/).filter(word => word.length > 0);
        const words2 = normalized2.split(/\s+/).filter(word => word.length > 0);
        
        if (words1.length === 0 || words2.length === 0) {
          return false;
        }
        
        const commonWords = words1.filter(word => words2.includes(word));
        const similarity = commonWords.length / Math.max(words1.length, words2.length);
        
        return similarity > 0.8; // 80% similarity threshold
      };
      
      // For final transcriptions, handle replacement logic
      if (transcription.isFinal) {
        console.log('🔍 Processing final transcription...');
        
        // First, look for interim transcriptions to replace
        let interimToReplace = -1;
        for (let i = state.transcriptions.length - 1; i >= 0; i--) {
          const t = state.transcriptions[i];
          if (!t.isFinal) {
            // Check if it's from the same speaker and similar text
            const sameSpeaker = transcription.speakerId && t.speakerId === transcription.speakerId;
            const recentEnough = (Date.now() - t.timestamp) < 10000; // Within 10 seconds
            const similarText = areSimilarTexts(t.text, transcription.text);
            
            if (sameSpeaker && recentEnough && similarText) {
              console.log(`  ✅ Found interim transcription to replace at index ${i}:`, {
                interimText: t.text,
                finalText: transcription.text,
                age: Date.now() - t.timestamp
              });
              interimToReplace = i;
              break;
            }
          }
        }
        
        // If we found an interim to replace, replace it
        if (interimToReplace >= 0) {
          console.log('🔄 Replacing interim transcription with final:', {
            index: interimToReplace,
            interim: state.transcriptions[interimToReplace].text,
            final: transcription.text
          });
          
          const newTranscription = {
            ...transcription,
            id: transcription.id || state.transcriptions[interimToReplace].id || `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
          
          state.transcriptions[interimToReplace] = newTranscription;
          return;
        }
        
        // If no interim to replace, check for duplicate final transcriptions
        const recentSimilar = state.transcriptions.find(t => 
          t.isFinal && // Only check against other final transcriptions
          (Date.now() - t.timestamp) < 15000 && // Within 15 seconds
          areSimilarTexts(t.text, transcription.text)
        );
        
        if (recentSimilar) {
          console.log('🔄 Found similar final transcription, updating instead of adding new:', {
            existing: recentSimilar.text,
            new: transcription.text
          });
          
          // Update the existing final transcription if the new one has higher confidence
          if (transcription.confidence > recentSimilar.confidence) {
            const existingIndex = state.transcriptions.findIndex(t => t.id === recentSimilar.id);
            if (existingIndex >= 0) {
              state.transcriptions[existingIndex] = {
                ...state.transcriptions[existingIndex],
                text: transcription.text,
                confidence: transcription.confidence,
                timestamp: transcription.timestamp,
                speakerId: transcription.speakerId || state.transcriptions[existingIndex].speakerId,
              };
            }
          }
          return;
        }
      }
      
      // Add as new transcription (interim or final)
      const newTranscription = {
        ...transcription,
        id: transcription.id || `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      console.log('✅ Adding NEW transcription:', {
        text: newTranscription.text,
        isFinal: newTranscription.isFinal,
        speakerId: newTranscription.speakerId,
        totalCount: state.transcriptions.length + 1,
        id: newTranscription.id
      });
      
      state.transcriptions.push(newTranscription);
      
      // Clean up any remaining interim transcriptions from the same speaker (safety cleanup)
      if (transcription.isFinal && transcription.speakerId) {
        const beforeCount = state.transcriptions.length;
        state.transcriptions = state.transcriptions.filter(
          (t: TranscriptionEntry) => !(t.speakerId === transcription.speakerId && !t.isFinal && t.id !== newTranscription.id)
        );
        const afterCount = state.transcriptions.length;
        if (beforeCount !== afterCount) {
          console.log(`🧹 Cleaned up ${beforeCount - afterCount} remaining interim transcriptions for speaker ${transcription.speakerId}`);
        }
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
