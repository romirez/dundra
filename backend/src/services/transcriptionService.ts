import { env } from '@/config/env';
import { SpeechClient } from '@google-cloud/speech';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface TranscriptionConfig {
  sampleRateHertz: number;
  languageCode: string;
  enableSpeakerDiarization: boolean;
  diarizationSpeakerCount?: number;
  enableAutomaticPunctuation: boolean;
  enableWordTimeOffsets: boolean;
  model?: string;
  useEnhanced?: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  speakerId?: string;
  timestamp: number;
  isFinal: boolean;
  words?: Array<{
    word: string;
    startTime: number;
    endTime: number;
    speakerId?: string;
  }>;
}

export interface SpeakerMapping {
  speakerId: string;
  playerName: string;
}

export class TranscriptionService extends EventEmitter {
  private speechClient: SpeechClient;
  private recognizeStream: any = null;
  private isActive = false;
  private config: TranscriptionConfig;
  private speakerMappings: Map<string, string> = new Map();
  private sessionId: string;

  constructor(sessionId: string, config?: Partial<TranscriptionConfig>) {
    super();
    
    this.sessionId = sessionId;
    this.config = {
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      enableSpeakerDiarization: true,
      diarizationSpeakerCount: 6, // Typical D&D group size
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
      model: 'latest_long',
      useEnhanced: true,
      ...config,
    };

    // Initialize Google Cloud Speech client with API key or service account
    const clientConfig: any = {
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
    };

    // Prefer API key authentication if available
    if (env.GOOGLE_CLOUD_API_KEY) {
      clientConfig.apiKey = env.GOOGLE_CLOUD_API_KEY;
      console.log('✅ Using Google Cloud API key for authentication');
    } else if (env.GOOGLE_CLOUD_KEY_FILE) {
      clientConfig.keyFilename = env.GOOGLE_CLOUD_KEY_FILE;
      console.log('✅ Using Google Cloud service account key file for authentication');
    } else {
      console.log('⚠️  No Google Cloud credentials found - transcription will not work');
      console.log('   Set GOOGLE_CLOUD_API_KEY or GOOGLE_CLOUD_KEY_FILE environment variable');
    }

    this.speechClient = new SpeechClient(clientConfig);
    this.setupCustomVocabulary();
  }

  // Set up custom vocabulary for D&D terms
  private async setupCustomVocabulary(): Promise<void> {
    // Common D&D terms that might be misrecognized
    const dndTerms = [
      'dungeon master', 'DM', 'GM', 'game master',
      'initiative', 'armor class', 'AC', 'hit points', 'HP',
      'saving throw', 'spell slot', 'cantrip', 'ritual',
      'barbarian', 'bard', 'cleric', 'druid', 'fighter',
      'monk', 'paladin', 'ranger', 'rogue', 'sorcerer',
      'warlock', 'wizard', 'artificer',
      'strength', 'dexterity', 'constitution', 'intelligence',
      'wisdom', 'charisma', 'proficiency',
      'advantage', 'disadvantage', 'critical hit', 'nat twenty',
      'perception check', 'investigation', 'insight',
      'persuasion', 'deception', 'intimidation',
      'stealth', 'sleight of hand', 'acrobatics', 'athletics',
    ];

    // Note: Custom vocabulary setup would be implemented here
    // For now, we'll rely on the model's general vocabulary
    console.log('D&D vocabulary terms prepared:', dndTerms.length);
  }

  // Start transcription stream
  async startTranscription(): Promise<void> {
    if (this.isActive) {
      throw new Error('Transcription is already active');
    }

    try {
      const request = {
        config: {
          encoding: 'WEBM_OPUS' as const,
          sampleRateHertz: this.config.sampleRateHertz,
          languageCode: this.config.languageCode,
          enableSpeakerDiarization: this.config.enableSpeakerDiarization,
          diarizationConfig: this.config.enableSpeakerDiarization ? {
            enableSpeakerDiarization: true,
            minSpeakerCount: 2,
            maxSpeakerCount: this.config.diarizationSpeakerCount || 6,
          } : undefined,
          enableAutomaticPunctuation: this.config.enableAutomaticPunctuation,
          enableWordTimeOffsets: this.config.enableWordTimeOffsets,
          model: this.config.model,
          useEnhanced: this.config.useEnhanced,
          // Add noise robustness for gaming environments
          audioChannelCount: 1,
          enableSeparateRecognitionPerChannel: false,
        },
        interimResults: true,
      };

      this.recognizeStream = this.speechClient
        .streamingRecognize(request)
        .on('data', (data: any) => {
          this.handleTranscriptionData(data);
        })
        .on('error', (error: Error) => {
          console.error('Speech recognition error:', error);
          this.emit('error', error);
          this.restartTranscription();
        })
        .on('end', () => {
          console.log('Speech recognition stream ended');
          if (this.isActive) {
            this.restartTranscription();
          }
        });

      this.isActive = true;
      this.emit('started');
      console.log('Transcription service started for session:', this.sessionId);
    } catch (error) {
      console.error('Failed to start transcription:', error);
      throw error;
    }
  }

  // Stop transcription stream
  stopTranscription(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    
    if (this.recognizeStream) {
      this.recognizeStream.end();
      this.recognizeStream = null;
    }

    this.emit('stopped');
    console.log('Transcription service stopped for session:', this.sessionId);
  }

  // Process audio chunk
  processAudioChunk(audioData: Buffer): void {
    if (!this.isActive || !this.recognizeStream) {
      console.warn('Transcription not active, ignoring audio chunk');
      return;
    }

    try {
      this.recognizeStream.write(audioData);
    } catch (error) {
      console.error('Error writing audio chunk:', error);
      this.emit('error', error);
    }
  }

  // Handle transcription data from Google Cloud Speech
  private handleTranscriptionData(data: any): void {
    if (!data.results || data.results.length === 0) {
      return;
    }

    const result = data.results[0];
    if (!result.alternatives || result.alternatives.length === 0) {
      return;
    }

    const alternative = result.alternatives[0];
    const transcript = alternative.transcript || '';
    const confidence = alternative.confidence || 0;

    // Extract speaker information if available
    let speakerId: string | undefined;
    const words = alternative.words || [];
    
    if (words.length > 0 && words[0].speakerTag !== undefined) {
      speakerId = words[0].speakerTag.toString();
    }

    // Process word-level information for better speaker tracking
    const wordDetails = words.map((word: any) => ({
      word: word.word || '',
      startTime: this.parseTime(word.startTime),
      endTime: this.parseTime(word.endTime),
      speakerId: word.speakerTag?.toString(),
    }));

    const transcriptionResult: TranscriptionResult = {
      text: transcript,
      confidence,
      speakerId,
      timestamp: Date.now(),
      isFinal: result.isFinal || false,
      words: wordDetails.length > 0 ? wordDetails : undefined,
    };

    // Emit speaker detection if new speaker found
    if (speakerId && !this.speakerMappings.has(speakerId)) {
      this.emit('speakerDetected', speakerId);
    }

    this.emit('transcription', transcriptionResult);
  }

  // Parse time from Google Cloud Speech format
  private parseTime(timeObj: any): number {
    if (!timeObj) return 0;
    
    const seconds = parseInt(timeObj.seconds || '0', 10);
    const nanos = parseInt(timeObj.nanos || '0', 10);
    
    return seconds * 1000 + Math.floor(nanos / 1000000);
  }

  // Restart transcription after error or stream end
  private async restartTranscription(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    console.log('Restarting transcription stream...');
    
    // Wait a bit before restarting
    setTimeout(async () => {
      try {
        if (this.recognizeStream) {
          this.recognizeStream.end();
          this.recognizeStream = null;
        }
        
        if (this.isActive) {
          await this.startTranscription();
        }
      } catch (error) {
        console.error('Failed to restart transcription:', error);
        this.emit('error', error);
      }
    }, 1000);
  }

  // Update speaker mapping
  updateSpeakerMapping(speakerId: string, playerName: string): void {
    this.speakerMappings.set(speakerId, playerName);
    this.emit('speakerMapped', { speakerId, playerName });
    console.log(`Speaker ${speakerId} mapped to ${playerName}`);
  }

  // Get speaker name from mapping
  getSpeakerName(speakerId: string): string | undefined {
    return this.speakerMappings.get(speakerId);
  }

  // Get all speaker mappings
  getSpeakerMappings(): SpeakerMapping[] {
    return Array.from(this.speakerMappings.entries()).map(([speakerId, playerName]) => ({
      speakerId,
      playerName,
    }));
  }

  // Clean up resources
  cleanup(): void {
    this.stopTranscription();
    this.speakerMappings.clear();
    this.removeAllListeners();
  }

  // Get current status
  getStatus(): { isActive: boolean; sessionId: string; speakerCount: number } {
    return {
      isActive: this.isActive,
      sessionId: this.sessionId,
      speakerCount: this.speakerMappings.size,
    };
  }
}

// WebSocket handler for real-time transcription
export class TranscriptionWebSocketHandler {
  private transcriptionService?: TranscriptionService;
  private ws: WebSocket;
  private sessionId: string;

  constructor(ws: WebSocket, sessionId: string) {
    this.ws = ws;
    this.sessionId = sessionId;
    
    try {
      console.log(`🎤 Creating transcription service for session: ${sessionId}`);
      this.transcriptionService = new TranscriptionService(sessionId);
      console.log(`✅ Transcription service created successfully for session: ${sessionId}`);
      
      this.setupEventHandlers();
      this.setupWebSocketHandlers();
      
      // Send initial connection confirmation
      this.sendMessage('connected', { sessionId: this.sessionId });
    } catch (error) {
      console.error(`❌ Failed to create transcription service for session ${sessionId}:`, error);
      this.sendMessage('error', { error: 'Failed to initialize transcription service' });
    }
  }

  private setupEventHandlers(): void {
    if (!this.transcriptionService) return;
    
    this.transcriptionService.on('transcription', (result: TranscriptionResult) => {
      this.sendMessage('transcription', result);
    });

    this.transcriptionService.on('speakerDetected', (speakerId: string) => {
      this.sendMessage('speaker_detected', { speaker_id: speakerId });
    });

    this.transcriptionService.on('error', (error: Error) => {
      console.error(`🎤 Transcription service error for session ${this.sessionId}:`, error);
      this.sendMessage('error', { error: error.message });
    });

    this.transcriptionService.on('started', () => {
      console.log(`🎤 Transcription started for session: ${this.sessionId}`);
      this.sendMessage('status', { status: 'started' });
    });

    this.transcriptionService.on('stopped', () => {
      console.log(`🎤 Transcription stopped for session: ${this.sessionId}`);
      this.sendMessage('status', { status: 'stopped' });
    });
  }

  private setupWebSocketHandlers(): void {
    this.ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received WebSocket message for session ${this.sessionId}:`, message.type);
        await this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendMessage('error', { error: 'Invalid message format' });
      }
    });

    this.ws.on('close', () => {
      console.log(`🔌 WebSocket closed for session: ${this.sessionId}`);
      this.transcriptionService?.cleanup();
    });

    this.ws.on('error', (error: Error) => {
      console.error(`❌ WebSocket error for session ${this.sessionId}:`, error);
      this.transcriptionService?.cleanup();
    });
  }

  private async handleMessage(message: any): Promise<void> {
    if (!this.transcriptionService) {
      this.sendMessage('error', { error: 'Transcription service not initialized' });
      return;
    }
    
    try {
      switch (message.type) {
        case 'start_transcription':
          console.log(`🎤 Starting transcription for session: ${this.sessionId}`);
          await this.transcriptionService.startTranscription();
          break;

        case 'stop_transcription':
          console.log(`🛑 Stopping transcription for session: ${this.sessionId}`);
          this.transcriptionService.stopTranscription();
          break;

        case 'audio_chunk':
          if (message.data) {
            const audioBuffer = Buffer.from(message.data);
            this.transcriptionService.processAudioChunk(audioBuffer);
          }
          break;

        case 'audio_final':
          if (message.data) {
            const audioBuffer = Buffer.from(message.data);
            this.transcriptionService.processAudioChunk(audioBuffer);
          }
          break;

        case 'speaker_mapping':
          if (message.data?.speaker_id && message.data?.player_name) {
            this.transcriptionService.updateSpeakerMapping(
              message.data.speaker_id,
              message.data.player_name
            );
          }
          break;

        case 'get_status':
          const status = this.transcriptionService.getStatus();
          this.sendMessage('status', status);
          break;

        default:
          console.warn(`❓ Unknown message type for session ${this.sessionId}:`, message.type);
          this.sendMessage('error', { error: 'Unknown message type' });
      }
    } catch (error) {
      console.error(`❌ Error handling message for session ${this.sessionId}:`, error);
      this.sendMessage('error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private sendMessage(type: string, data?: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn(`⚠️  Cannot send message, WebSocket not open for session: ${this.sessionId}`);
    }
  }

  // Start transcription automatically
  async start(): Promise<void> {
    if (!this.transcriptionService) {
      const error = new Error('Transcription service not initialized');
      console.error(`❌ Failed to auto-start transcription for session ${this.sessionId}:`, error);
      this.sendMessage('error', { error: error.message });
      throw error;
    }
    
    try {
      console.log(`🚀 Auto-starting transcription for session: ${this.sessionId}`);
      await this.transcriptionService.startTranscription();
    } catch (error) {
      console.error(`❌ Failed to auto-start transcription for session ${this.sessionId}:`, error);
      this.sendMessage('error', { error: error instanceof Error ? error.message : 'Failed to start transcription service' });
      throw error;
    }
  }
} 