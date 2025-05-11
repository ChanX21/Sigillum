import "dotenv/config";
import express, { Request, Response, NextFunction, Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/index.js';
import http from 'http';
import { initSocketIO } from './services/websocketService.js';

// Initialize Express app
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '5002', 10);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocketIO(server);

// Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'https://www.sigillum.digital', 'https://verifier.sigillum.digital'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/', apiRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sigillum')
  .then(() => {
    // Listen on the HTTP server instead of Express app
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle unhandled routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;