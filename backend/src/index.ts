import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import customerRoutes from './routes/customers';
import projectRoutes from './routes/projects';
import maintenanceRoutes from './routes/maintenance';
import contractRoutes from './routes/contracts';

// Load environment variables
// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
// Fallback: try loading from current directory if above failed or for production
dotenv.config();

if (!process.env.JWT_SECRET) {
    console.warn('⚠️ TRANSITION WARNING: JWT_SECRET is not defined. Using a default dev secret. This is unsafe for production.');
    process.env.JWT_SECRET = 'dev_secret_key_123';
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'https://ageful-customer-management-system.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/contracts', contractRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
