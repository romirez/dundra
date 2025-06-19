import { connectDatabase } from '@/config/database';
import { env } from '@/config/env';
import analysisRoutes, { setSocketIO, setupAnalysisWebSocket } from '@/routes/analysisRoutes';
import { cleanupAllSessions, setupAudioRoutes, setupAudioWebSocketServer } from '@/routes/audioRoutes';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';

const server = createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Setup audio routes for Socket.io
setupAudioRoutes(io);

// Setup WebSocket server for audio transcription (alternative approach)
const audioWebSocketServer = setupAudioWebSocketServer(server);

// Setup analysis routes and WebSocket
setSocketIO(io);
app.use('/api/analysis', analysisRoutes);
setupAnalysisWebSocket(io);

// Socket.io connection handling
io.on('connection', socket => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join session room for transcription analysis
  socket.on('join_session', (sessionId: string) => {
    socket.join(`session_${sessionId}`);
    console.log(`User ${socket.id} joined session ${sessionId}`);
  });

  // Leave session room
  socket.on('leave_session', (sessionId: string) => {
    socket.leave(`session_${sessionId}`);
    console.log(`User ${socket.id} left session ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
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

      // Log OpenAI configuration status
      if (env.OPENAI_API_KEY) {
        console.log(`🧠 OpenAI transcription analysis engine configured`);
      } else {
        console.warn('⚠️  OpenAI API key not configured - transcription analysis will not work');
        console.warn('   Set OPENAI_API_KEY environment variable');
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
