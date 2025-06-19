import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from '@/config/env';

// Import routes (will be created next)
// import authRoutes from '@/routes/auth';
// import campaignRoutes from '@/routes/campaigns';
// import characterRoutes from '@/routes/characters';
// import sessionRoutes from '@/routes/sessions';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for development
}));

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging middleware
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dundra API is running!',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes
app.use('/api/v1', (req, res, next) => {
  // API versioning middleware
  res.setHeader('API-Version', '1.0.0');
  next();
});

// Mount routes (commented out until we create them)
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/campaigns', campaignRoutes);
// app.use('/api/v1/characters', characterRoutes);
// app.use('/api/v1/sessions', sessionRoutes);

// Catch-all route for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Dundra D&D Companion API!',
    version: '1.0.0',
    documentation: '/api/docs', // Future API documentation endpoint
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 404 handler for non-API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

export default app; 