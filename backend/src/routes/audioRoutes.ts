import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import { TranscriptionWebSocketHandler } from '../services/transcriptionService';

// Store active transcription sessions
const activeSessions = new Map<string, TranscriptionWebSocketHandler>();

export function setupAudioRoutes(io: SocketIOServer): void {
  // Handle Socket.io connections for audio transcription
  io.of('/audio').on('connection', (socket) => {
    console.log('Audio transcription client connected:', socket.id);
    
    const sessionId = uuidv4();
    let transcriptionHandler: TranscriptionWebSocketHandler | null = null;

    // Start transcription session
    socket.on('start_transcription', async (data) => {
      try {
        if (transcriptionHandler) {
          socket.emit('error', { message: 'Transcription already active' });
          return;
        }

        // Create a mock WebSocket-like interface for Socket.io
        const mockWs = createSocketIOWebSocketAdapter(socket);
        transcriptionHandler = new TranscriptionWebSocketHandler(mockWs as any, sessionId);
        activeSessions.set(sessionId, transcriptionHandler);
        
        await transcriptionHandler.start();
        socket.emit('transcription_started', { sessionId });
      } catch (error) {
        console.error('Failed to start transcription:', error);
        socket.emit('error', { message: 'Failed to start transcription service' });
      }
    });

    // Stop transcription session
    socket.on('stop_transcription', () => {
      if (transcriptionHandler) {
        transcriptionHandler = null;
        activeSessions.delete(sessionId);
        socket.emit('transcription_stopped');
      }
    });

    // Handle audio chunks
    socket.on('audio_chunk', (data) => {
      if (transcriptionHandler && data) {
        // Forward to transcription handler
        const mockMessage = {
          type: 'audio_chunk',
          data: data.data || data,
          timestamp: data.timestamp || Date.now(),
        };
        
        // Simulate WebSocket message handling
        const mockWs = createSocketIOWebSocketAdapter(socket);
        (mockWs as any).emit('message', JSON.stringify(mockMessage));
      }
    });

    // Handle speaker mapping
    socket.on('speaker_mapping', (data) => {
      if (transcriptionHandler && data?.speaker_id && data?.player_name) {
        const mockMessage = {
          type: 'speaker_mapping',
          data: {
            speaker_id: data.speaker_id,
            player_name: data.player_name,
          },
        };
        
        const mockWs = createSocketIOWebSocketAdapter(socket);
        (mockWs as any).emit('message', JSON.stringify(mockMessage));
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Audio transcription client disconnected:', socket.id);
      if (transcriptionHandler) {
        activeSessions.delete(sessionId);
        transcriptionHandler = null;
      }
    });
  });
}

// Create WebSocket adapter for Socket.io
function createSocketIOWebSocketAdapter(socket: any) {
  return {
    readyState: socket.connected ? WebSocket.OPEN : WebSocket.CLOSED,
    send: (data: string) => {
      try {
        const message = JSON.parse(data);
        socket.emit(message.type, message.data);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    on: (event: string, handler: Function) => {
      socket.on(event, handler);
    },
    emit: (event: string, ...args: any[]) => {
      socket.emit(event, ...args);
    },
    close: () => {
      socket.disconnect();
    },
  };
}

// Setup raw WebSocket server for audio transcription (alternative approach)
export function setupAudioWebSocketServer(server: any): WebSocket.Server {
  const wss = new WebSocket.Server({ 
    server,
    path: '/audio',
  });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket audio connection established');
    
    const sessionId = uuidv4();
    const transcriptionHandler = new TranscriptionWebSocketHandler(ws, sessionId);
    activeSessions.set(sessionId, transcriptionHandler);

    // Auto-start transcription
    transcriptionHandler.start().catch((error) => {
      console.error('Failed to auto-start transcription:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket audio connection closed');
      activeSessions.delete(sessionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket audio error:', error);
      activeSessions.delete(sessionId);
    });
  });

  return wss;
}

// Get active session count
export function getActiveSessionCount(): number {
  return activeSessions.size;
}

// Get session info
export function getSessionInfo(sessionId: string) {
  const handler = activeSessions.get(sessionId);
  return handler ? handler : null;
}

// Cleanup all sessions
export function cleanupAllSessions(): void {
  activeSessions.forEach((handler, sessionId) => {
    console.log('Cleaning up session:', sessionId);
  });
  activeSessions.clear();
} 