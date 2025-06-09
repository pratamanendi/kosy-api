import { PrismaClient } from '@prisma/client';
import logger from '../logger.js';
import moment from 'moment';

const prisma = new PrismaClient();

// Get all activities
export const getAll = async (req, res) => {
    try {
        const activities = await prisma.dailyActivity.findMany({
            where: { deleted_at: null },
        });
        res.json(activities);
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
};

// Get activity by ID
export const getById = async (req, res) => {
    try {
        const activity = await prisma.dailyActivity.findUnique({
            where: {
                id: req.params.id,
                deleted_at: null
            },
        });
        if (!activity) return res.status(404).json({ error: 'Not found' });
        res.json(activity);
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
};

// Create new activity
export const create = async (req, res) => {
    const { employee_id, title, description } = req.body;
    try {
        const newActivity = await prisma.dailyActivity.create({
            data: { employee_id, title, description },
        });
        res.status(201).json(newActivity);
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Failed to create activity' });
    }
};

// Update activity
export const update = async (req, res) => {
    const { employee_id, title, description } = req.body;
    try {
        const existingActivity = await prisma.dailyActivity.findUnique({
            where: { id: req.params.id }
        });

        if (!existingActivity || existingActivity.deleted_at) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const updated = await prisma.dailyActivity.update({
            where: { id: req.params.id },
            data: {
                employee_id, title, description,
                updated_at: new Date(),
            },
        });
        res.json(updated);
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Failed to update activity' });
    }
};

// Delete activity
export const deleteActivity = async (req, res) => {
    try {
        await prisma.dailyActivity.update({
            where: { id: req.params.id },
            data: { deleted_at: new Date() },
        });
        res.json({ message: 'Activity deleted' });
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Failed to delete activity' });
    }
};

