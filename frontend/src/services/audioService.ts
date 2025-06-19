export interface AudioConstraints {
  sampleRate: number;
  sampleSize: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  speakerId?: string;
  timestamp: number;
  isFinal: boolean;
}

export interface SpeakerMapping {
  speakerId: string;
  playerName: string;
  isActive: boolean;
}

export class AudioService {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private websocket: WebSocket | null = null;
  private isRecording = false;
  private isConnected = false;
  private audioChunks: Blob[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  // Event handlers
  private onTranscriptionCallback?: (result: TranscriptionResult) => void;
  private onErrorCallback?: (error: Error) => void;
  private onStatusChangeCallback?: (status: string) => void;
  private onSpeakerDetectedCallback?: (speakerId: string) => void;

  private readonly defaultConstraints: AudioConstraints = {
    sampleRate: 16000,
    sampleSize: 16,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  constructor(
    private websocketUrl: string,
    private audioConstraints: AudioConstraints = this.defaultConstraints
  ) {}

  // Event handler setters
  onTranscription(callback: (result: TranscriptionResult) => void): void {
    this.onTranscriptionCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  onStatusChange(callback: (status: string) => void): void {
    this.onStatusChangeCallback = callback;
  }

  onSpeakerDetected(callback: (speakerId: string) => void): void {
    this.onSpeakerDetectedCallback = callback;
  }

  // Initialize audio capture
  async initialize(): Promise<void> {
    try {
      this.updateStatus('Requesting microphone access...');
      
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: this.audioConstraints.sampleRate,
          sampleSize: this.audioConstraints.sampleSize,
          channelCount: this.audioConstraints.channelCount,
          echoCancellation: this.audioConstraints.echoCancellation,
          noiseSuppression: this.audioConstraints.noiseSuppression,
          autoGainControl: this.audioConstraints.autoGainControl,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupMediaRecorder();
      this.updateStatus('Microphone initialized');
    } catch (error) {
      const audioError = this.handleAudioError(error);
      this.handleError(audioError);
      throw audioError;
    }
  }

  // Set up MediaRecorder with optimal settings
  private setupMediaRecorder(): void {
    if (!this.mediaStream) {
      throw new Error('Media stream not initialized');
    }

    // Check for supported MIME types
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];

    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      throw new Error('No supported audio MIME type found');
    }

    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: selectedMimeType,
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.handleAudioData(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      this.handleError(new Error(`MediaRecorder error: ${event.error}`));
    };

    this.mediaRecorder.onstart = () => {
      this.updateStatus('Recording started');
    };

    this.mediaRecorder.onstop = () => {
      this.updateStatus('Recording stopped');
    };
  }

  // Connect to WebSocket for transcription
  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.updateStatus('Connecting to transcription service...');
        this.websocket = new WebSocket(this.websocketUrl);

        this.websocket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.updateStatus('Connected to transcription service');
          
          // Send start transcription message immediately after connection
          if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({
              type: 'start_transcription',
              data: {}
            }));
          }
          
          resolve();
        };

        this.websocket.onmessage = (event) => {
          this.handleTranscriptionMessage(event.data);
        };

        this.websocket.onclose = (event) => {
          this.isConnected = false;
          this.updateStatus('Disconnected from transcription service');
          
          if (!event.wasClean && this.isRecording) {
            this.attemptReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          this.handleError(new Error('WebSocket connection error'));
          reject(error);
        };

        // Timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            this.websocket?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Start audio capture and transcription
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    if (!this.mediaRecorder) {
      await this.initialize();
    }

    if (!this.isConnected) {
      await this.connectWebSocket();
    }

    this.isRecording = true;
    this.audioChunks = [];
    
    // Start recording with 100ms chunks for real-time streaming
    this.mediaRecorder!.start(100);
    this.updateStatus('Recording and transcribing...');
  }

  // Stop audio capture and transcription
  stopRecording(): void {
    if (!this.isRecording) {
      return;
    }

    console.log('🛑 Stopping recording...');
    this.isRecording = false;
    
    // Remove MediaRecorder event handlers to prevent any delayed events
    if (this.mediaRecorder) {
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onerror = null;
      this.mediaRecorder.onstart = null;
      this.mediaRecorder.onstop = null;
      
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
        console.log('🎙️ MediaRecorder stopped');
      }
    }

    // Send stop transcription message to backend IMMEDIATELY
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'stop_transcription',
        data: {}
      }));
      console.log('📤 Sent stop_transcription message to backend');
    }

    // Stop all media stream tracks (this stops the microphone)
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log('🎤 Stopped audio track:', track.label);
      });
    }

    // Clear any pending audio chunks to prevent them from being sent
    this.audioChunks = [];
    console.log('🗑️ Cleared audio chunks array');

    this.updateStatus('Recording stopped');
  }

  // Pause recording
  pauseRecording(): void {
    if (!this.isRecording) {
      return;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.updateStatus('Recording paused');
    }
  }

  // Resume recording
  resumeRecording(): void {
    if (!this.isRecording) {
      return;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.updateStatus('Recording resumed');
    }
  }

  // Handle audio data from MediaRecorder
  private handleAudioData(audioBlob: Blob): void {
    // Check if we're still recording - if not, ignore this chunk
    if (!this.isRecording) {
      console.log('🚫 Ignoring audio chunk - recording stopped');
      return;
    }

    if (!this.isConnected || !this.websocket) {
      // Store chunks for later if not connected
      this.audioChunks.push(audioBlob);
      return;
    }

    // Send audio chunk immediately for real-time transcription
    this.sendAudioChunk(audioBlob);
  }

  // Send audio chunk to WebSocket
  private sendAudioChunk(audioBlob: Blob): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.audioChunks.push(audioBlob);
      return;
    }

    // Convert blob to ArrayBuffer for binary transmission
    audioBlob.arrayBuffer().then((buffer) => {
      const message = {
        type: 'audio_chunk',
        data: Array.from(new Uint8Array(buffer)),
        timestamp: Date.now(),
      };
      
      this.websocket!.send(JSON.stringify(message));
    }).catch((error) => {
      this.handleError(new Error(`Failed to send audio chunk: ${error.message}`));
    });
  }

  // Send final audio chunk when stopping
  private sendFinalAudioChunk(): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const finalBlob = new Blob(this.audioChunks);
    finalBlob.arrayBuffer().then((buffer) => {
      const message = {
        type: 'audio_final',
        data: Array.from(new Uint8Array(buffer)),
        timestamp: Date.now(),
      };
      
      this.websocket!.send(JSON.stringify(message));
      this.audioChunks = [];
    }).catch((error) => {
      this.handleError(new Error(`Failed to send final audio chunk: ${error.message}`));
    });
  }

  // Handle transcription messages from WebSocket
  private handleTranscriptionMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'connected':
          console.log('✅ WebSocket connection confirmed by backend:', message.data);
          break;
        case 'transcription':
          this.handleTranscriptionResult(message.data);
          break;
        case 'speaker_detected':
          this.handleSpeakerDetection(message.data);
          break;
        case 'status':
          if (message.data?.status) {
            this.updateStatus(`Backend: ${message.data.status}`);
          }
          break;
        case 'error':
          this.handleError(new Error(message.data?.error || 'Unknown backend error'));
          break;
        default:
          console.warn('Unknown message type:', message.type, message);
      }
    } catch (error) {
      console.error('Failed to parse transcription message:', error, 'Raw data:', data);
      this.handleError(new Error(`Failed to parse transcription message: ${error}`));
    }
  }

  // Handle transcription results
  private handleTranscriptionResult(data: any): void {
    const result: TranscriptionResult = {
      text: data.text || '',
      confidence: data.confidence || 0,
      speakerId: data.speakerId || data.speaker_id,
      timestamp: data.timestamp || Date.now(),
      isFinal: data.isFinal || data.is_final || false,
    };

    this.onTranscriptionCallback?.(result);
  }

  // Handle speaker detection
  private handleSpeakerDetection(data: any): void {
    const speakerId = data.speakerId || data.speaker_id;
    if (speakerId) {
      this.onSpeakerDetectedCallback?.(speakerId);
    }
  }

  // Attempt to reconnect WebSocket
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.handleError(new Error('Maximum reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    this.updateStatus(`Reconnecting in ${delay / 1000} seconds... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket().catch((error) => {
        console.error('Reconnection failed:', error);
        this.attemptReconnect();
      });
    }, delay);
  }

  // Handle audio-specific errors
  private handleAudioError(error: any): Error {
    if (error.name === 'NotAllowedError') {
      return new Error('Microphone access denied. Please allow microphone access and try again.');
    } else if (error.name === 'NotFoundError') {
      return new Error('No microphone detected. Please connect a microphone and try again.');
    } else if (error.name === 'NotReadableError') {
      return new Error('Microphone is already in use by another application.');
    } else if (error.name === 'OverconstrainedError') {
      return new Error('Microphone does not support the requested audio constraints.');
    } else {
      return new Error(`Audio capture error: ${error.message || 'Unknown error'}`);
    }
  }

  // Generic error handler
  private handleError(error: Error): void {
    console.error('AudioService error:', error);
    this.onErrorCallback?.(error);
  }

  // Update status
  private updateStatus(status: string): void {
    console.log('AudioService status:', status);
    this.onStatusChangeCallback?.(status);
  }

  // Send speaker mapping to backend
  async updateSpeakerMapping(speakerId: string, playerName: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      type: 'speaker_mapping',
      data: {
        speaker_id: speakerId,
        player_name: playerName,
      },
    };

    this.websocket.send(JSON.stringify(message));
  }

  // Get audio level for visualization
  getAudioLevel(): number {
    if (!this.mediaStream) {
      return 0;
    }

    // This is a simplified version - for real audio level detection,
    // you'd need to use Web Audio API with AnalyserNode
    const audioTracks = this.mediaStream.getAudioTracks();
    if (audioTracks.length === 0) {
      return 0;
    }

    // Return a mock value for now - implement proper audio analysis if needed
    return Math.random() * 100;
  }

  // Cleanup resources
  dispose(): void {
    this.stopRecording();
    
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.mediaRecorder = null;
    this.isRecording = false;
    this.isConnected = false;
    this.audioChunks = [];
  }

  // Getters
  get isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  get isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  get connectionStatus(): string {
    if (!this.mediaStream) return 'Not initialized';
    if (!this.isConnected) return 'Disconnected';
    if (this.isRecording) return 'Recording';
    return 'Ready';
  }
} 