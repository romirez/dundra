import { connectDatabase } from '@/config/database';
import { env } from '@/config/env';
import { cleanupAllSessions, setupAudioRoutes, setupAudioWebSocketServer } from '@/routes/audioRoutes';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';

const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Setup audio transcription routes
setupAudioRoutes(io);

// Setup WebSocket server for audio transcription (alternative approach)
const audioWebSocketServer = setupAudioWebSocketServer(server);

// Socket.io connection handling
io.on('connection', socket => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join campaign room
  socket.on('join-campaign', (campaignId: string) => {
    socket.join(`campaign-${campaignId}`);
    console.log(`👥 User ${socket.id} joined campaign ${campaignId}`);
    socket.to(`campaign-${campaignId}`).emit('user-joined', socket.id);
  });

  // Leave campaign room
  socket.on('leave-campaign', (campaignId: string) => {
    socket.leave(`campaign-${campaignId}`);
    console.log(`👋 User ${socket.id} left campaign ${campaignId}`);
    socket.to(`campaign-${campaignId}`).emit('user-left', socket.id);
  });

  // Handle transcription events (legacy - kept for backward compatibility)
  socket.on('transcription-start', (data: { campaignId: string }) => {
    console.log(`🎤 Transcription started for campaign ${data.campaignId}`);
    socket.to(`campaign-${data.campaignId}`).emit('transcription-started', {
      userId: socket.id,
      timestamp: new Date(),
    });
  });

  socket.on(
    'transcription-data',
    (data: { campaignId: string; text: string; isPartial: boolean }) => {
      console.log(`📝 Transcription data for campaign ${data.campaignId}: ${data.text}`);
      socket.to(`campaign-${data.campaignId}`).emit('transcription-received', {
        userId: socket.id,
        text: data.text,
        isPartial: data.isPartial,
        timestamp: new Date(),
      });
    }
  );

  socket.on('transcription-end', (data: { campaignId: string }) => {
    console.log(`🛑 Transcription ended for campaign ${data.campaignId}`);
    socket.to(`campaign-${data.campaignId}`).emit('transcription-ended', {
      userId: socket.id,
      timestamp: new Date(),
    });
  });

  // Handle card generation events
  socket.on('generate-card', (data: { campaignId: string; type: string; prompt: string }) => {
    console.log(`🃏 Card generation requested for campaign ${data.campaignId}: ${data.type}`);

    // Simulate card generation (replace with actual AI service call)
    setTimeout(() => {
      const mockCard = {
        id: `card-${Date.now()}`,
        type: data.type,
        title: `Generated ${data.type}`,
        description: `This is a mock ${data.type} generated from: ${data.prompt}`,
        imageUrl: null,
        stats:
          data.type === 'monster'
            ? {
                hp: Math.floor(Math.random() * 100) + 20,
                ac: Math.floor(Math.random() * 10) + 10,
                speed: '30 ft',
              }
            : undefined,
        createdAt: new Date(),
      };

      io.to(`campaign-${data.campaignId}`).emit('card-generated', {
        userId: socket.id,
        card: mockCard,
        timestamp: new Date(),
      });
    }, 2000);
  });

  // Handle dice roll events
  socket.on('dice-roll', (data: { campaignId: string; dice: string; modifier?: number }) => {
    const result = Math.floor(Math.random() * 20) + 1 + (data.modifier || 0);
    console.log(
      `🎲 Dice roll in campaign ${data.campaignId}: ${data.dice} + ${data.modifier || 0} = ${result}`
    );

    io.to(`campaign-${data.campaignId}`).emit('dice-rolled', {
      userId: socket.id,
      dice: data.dice,
      modifier: data.modifier,
      result,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Server startup function
const startServer = async () => {
  try {
    // Try to connect to MongoDB, but don't fail if it's not available
    try {
      await connectDatabase();
      console.log('✅ MongoDB connected successfully');
    } catch (dbError) {
      console.warn('⚠️  MongoDB connection failed - running in development mode without database');
      console.warn('   Database-dependent features will not work');
      console.warn('   Error:', (dbError as Error).message);
    }

    const port = env.PORT;

    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📡 Socket.io server ready`);
      console.log(`🎤 Audio transcription WebSocket server ready on /audio`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 CORS origin: ${env.CORS_ORIGIN}`);
      console.log(`📋 Health check: http://localhost:${port}/health`);
      console.log(`📚 API base: http://localhost:${port}/api/v1`);
      
      // Log Google Cloud configuration status
      if (env.GOOGLE_CLOUD_PROJECT_ID) {
        if (env.GOOGLE_CLOUD_API_KEY) {
          console.log(`☁️  Google Cloud Speech-to-Text configured with API key`);
        } else if (env.GOOGLE_CLOUD_KEY_FILE) {
          console.log(`☁️  Google Cloud Speech-to-Text configured with service account key file`);
        } else {
          console.warn('⚠️  Google Cloud project ID set but no authentication method configured');
          console.warn('   Set GOOGLE_CLOUD_API_KEY or GOOGLE_CLOUD_KEY_FILE environment variable');
        }
      } else {
        console.warn('⚠️  Google Cloud Speech-to-Text not configured - audio transcription will not work');
        console.warn('   Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_API_KEY environment variables');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Cleanup audio transcription sessions
  cleanupAllSessions();

  // Close WebSocket server
  audioWebSocketServer.close(() => {
    console.log('✅ Audio WebSocket server closed');
  });

  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
