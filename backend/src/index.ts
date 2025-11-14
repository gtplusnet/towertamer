import express, { Application } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import mapRoutes from './routes/map.routes';
import { SocketService } from './services/socket.service';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4025;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://100.121.246.85:4024';

// Initialize Express app
const app: Application = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tower Tamer Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/maps', mapRoutes);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Initialize services
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize Socket service
    new SocketService(io);
    console.log('🔌 Socket.IO service initialized');

    // Start server
    server.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('🎮 Tower Tamer Backend Server');
      console.log('========================================');
      console.log(`🚀 Server running on port: ${PORT}`);
      console.log(`🌍 CORS enabled for: ${CORS_ORIGIN}`);
      console.log(`📡 Socket.IO ready for connections`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});
