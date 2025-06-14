import { PrismaClient } from '@prisma/client';
import express from 'express';
import path from 'path';
import moment from 'moment';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth.js';
import employeeRoutes from './routes/employee.js';
import activitesRoutes from './routes/activity.js';
import authRoutes from './routes/auth.js';
import logger from './logger.js';
import cookieParser from 'cookie-parser';
import productRoutes from './routes/product.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(import.meta.url, '..', 'public')));
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
    logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: HIT => URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)}\n`);
    next();
});

// Routes
app.use('/api/auth/', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/activities', activitesRoutes);
app.use('/api/products', productRoutes);

// Not Found
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Graceful shutdown (Prisma disconnect)
process.on('SIGINT', async () => {
    console.log('SIGINT received. Closing Prisma...');
    await prisma.$disconnect();
    process.exit(0);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

