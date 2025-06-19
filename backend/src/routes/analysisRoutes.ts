import { GameContext, TranscriptionAnalysisService, TranscriptionSegment } from '@/services/transcriptionAnalysisService';
import { ApiResponse } from '@/types';
import { Router } from 'express';
import { Server } from 'socket.io';

const router = Router();
const analysisService = new TranscriptionAnalysisService();

// In-memory storage for demo purposes - in production, use Redis or database
const gameContexts = new Map<string, GameContext>();
const pendingTranscriptions = new Map<string, TranscriptionSegment[]>();

// Set up Socket.io reference (will be injected by server)
let io: Server;
export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

// Create or update game context for a session
router.post('/context/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { campaignId, activeCharacters, currentLocation, ongoingQuests, gameState } = req.body;

    let context = analysisService.getGameContext(sessionId);
    
    if (!context) {
      context = analysisService.createGameContext(campaignId, sessionId);
    }

    // Update with provided data
    analysisService.updateGameContext(sessionId, {
      activeCharacters: activeCharacters || context.activeCharacters,
      currentLocation: currentLocation || context.currentLocation,
      ongoingQuests: ongoingQuests || context.ongoingQuests,
      gameState: gameState || context.gameState,
    });

    const response: ApiResponse<GameContext> = {
      success: true,
      data: analysisService.getGameContext(sessionId)!,
      message: 'Game context updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating game context:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Get game context for a session
router.get('/context/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const context = analysisService.getGameContext(sessionId);

    if (!context) {
      const response: ApiResponse = {
        success: false,
        error: 'Game context not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<GameContext> = {
      success: true,
      data: context
    };

    res.json(response);
  } catch (error) {
    console.error('Error retrieving game context:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Analyze a batch of transcription segments
router.post('/analyze/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { segments } = req.body;

    const context = analysisService.getGameContext(sessionId);
    if (!context) {
      const response: ApiResponse = {
        success: false,
        error: 'Game context not found. Create context first.'
      };
      return res.status(404).json(response);
    }

    // Convert segments to proper format
    const transcriptionSegments: TranscriptionSegment[] = segments.map((seg: any) => ({
      id: seg.id || `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: seg.text,
      speaker: seg.speaker || seg.speakerId || 'Unknown',
      timestamp: new Date(seg.timestamp),
      confidence: seg.confidence || 1.0,
    }));

    // Perform analysis
    const analysisResult = await analysisService.analyzeTranscription(transcriptionSegments, context);

    // Update context with analysis results
    if (analysisResult.gameStateUpdate) {
      analysisService.updateGameContext(sessionId, analysisResult.gameStateUpdate);
    }

    // Emit real-time updates via Socket.io
    if (io) {
      io.to(`session_${sessionId}`).emit('analysis:complete', {
        sessionId,
        analysisResult,
        context: analysisService.getGameContext(sessionId)
      });

      // Emit card generation triggers
      if (analysisResult.cardGenerationTriggers.length > 0) {
        io.to(`session_${sessionId}`).emit('cards:generate_triggers', {
          sessionId,
          triggers: analysisResult.cardGenerationTriggers
        });
      }

      // Emit character updates
      if (analysisResult.characterUpdates.length > 0) {
        io.to(`session_${sessionId}`).emit('characters:updates', {
          sessionId,
          updates: analysisResult.characterUpdates
        });
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        analysisResult,
        updatedContext: analysisService.getGameContext(sessionId)
      },
      message: 'Analysis completed successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error analyzing transcription:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
    res.status(500).json(response);
  }
});

// Real-time analysis endpoint for immediate processing
router.post('/analyze/:sessionId/realtime', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { segment } = req.body;

    const context = analysisService.getGameContext(sessionId);
    if (!context) {
      const response: ApiResponse = {
        success: false,
        error: 'Game context not found'
      };
      return res.status(404).json(response);
    }

    const transcriptionSegment: TranscriptionSegment = {
      id: segment.id || `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: segment.text,
      speaker: segment.speaker || segment.speakerId || 'Unknown',
      timestamp: new Date(segment.timestamp || Date.now()),
      confidence: segment.confidence || 1.0,
    };

    // Perform real-time analysis
    const realtimeResult = await analysisService.analyzeRealTime(transcriptionSegment, context);

    // Emit immediate updates via Socket.io
    if (io && realtimeResult.triggerCard) {
      io.to(`session_${sessionId}`).emit('cards:immediate_trigger', {
        sessionId,
        segment: transcriptionSegment,
        actions: realtimeResult.immediateActions
      });
    }

    if (io && realtimeResult.urgentUpdates.length > 0) {
      io.to(`session_${sessionId}`).emit('characters:urgent_updates', {
        sessionId,
        updates: realtimeResult.urgentUpdates
      });
    }

    const response: ApiResponse = {
      success: true,
      data: realtimeResult,
      message: 'Real-time analysis completed'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in real-time analysis:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Real-time analysis failed'
    };
    res.status(500).json(response);
  }
});

// WebSocket event handlers for transcription analysis
export const setupAnalysisWebSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected for analysis:', socket.id);

    // Join session room for transcription analysis
    socket.on('analysis:join_session', (data: { sessionId: string; campaignId: string }) => {
      const { sessionId, campaignId } = data;
      socket.join(`session_${sessionId}`);
      
      // Create context if it doesn't exist
      let context = analysisService.getGameContext(sessionId);
      if (!context) {
        context = analysisService.createGameContext(campaignId, sessionId);
      }
      
      socket.emit('analysis:session_joined', { sessionId, context });
      console.log(`Client ${socket.id} joined analysis session ${sessionId}`);
    });

    // Leave session room
    socket.on('analysis:leave_session', (data: { sessionId: string }) => {
      const { sessionId } = data;
      socket.leave(`session_${sessionId}`);
      console.log(`Client ${socket.id} left analysis session ${sessionId}`);
    });

    // Handle incoming transcription for analysis
    socket.on('analysis:transcription', async (data: { 
      sessionId: string; 
      segment: any; 
      realtime?: boolean 
    }) => {
      try {
        const { sessionId, segment, realtime = false } = data;
        
        const context = analysisService.getGameContext(sessionId);
        if (!context) {
          socket.emit('analysis:error', { 
            error: 'Game context not found',
            sessionId 
          });
          return;
        }

        const transcriptionSegment: TranscriptionSegment = {
          id: segment.id || `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: segment.text,
          speaker: segment.speaker || segment.speakerId || 'Unknown',
          timestamp: new Date(segment.timestamp || Date.now()),
          confidence: segment.confidence || 1.0,
        };

        if (realtime) {
          // Real-time analysis
          const realtimeResult = await analysisService.analyzeRealTime(transcriptionSegment, context);
          
          if (realtimeResult.triggerCard) {
            io.to(`session_${sessionId}`).emit('cards:immediate_trigger', {
              sessionId,
              segment: transcriptionSegment,
              actions: realtimeResult.immediateActions
            });
          }

          if (realtimeResult.urgentUpdates.length > 0) {
            io.to(`session_${sessionId}`).emit('characters:urgent_updates', {
              sessionId,
              updates: realtimeResult.urgentUpdates
            });
          }
        } else {
          // Store for batch analysis
          const existing = pendingTranscriptions.get(sessionId) || [];
          existing.push(transcriptionSegment);
          pendingTranscriptions.set(sessionId, existing);

          // Trigger batch analysis if we have enough segments (or after a delay)
          if (existing.length >= 5) {
            const segments = pendingTranscriptions.get(sessionId) || [];
            pendingTranscriptions.delete(sessionId);

            const analysisResult = await analysisService.analyzeTranscription(segments, context);
            
            // Update context
            if (analysisResult.gameStateUpdate) {
              analysisService.updateGameContext(sessionId, analysisResult.gameStateUpdate);
            }

            // Emit results
            io.to(`session_${sessionId}`).emit('analysis:complete', {
              sessionId,
              analysisResult,
              context: analysisService.getGameContext(sessionId)
            });
          }
        }
      } catch (error) {
        console.error('Error processing transcription analysis:', error);
        socket.emit('analysis:error', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId: data.sessionId 
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected from analysis:', socket.id);
    });
  });

  // Clean up old contexts periodically
  setInterval(() => {
    analysisService.cleanupOldContexts(24); // Clean up contexts older than 24 hours
  }, 60 * 60 * 1000); // Run every hour
};

export default router;