import { PrismaClient } from '@prisma/client';
import logger from '../logger.js';
import moment from 'moment';
import errorHandler from './errorHandler.js';

const prisma = new PrismaClient();

// Get all employees
export const getAll = async (req, res) => {
    try {
        const employees = await prisma.employee.findMany({
            where: { deleted_at: null },
        });
        res.json(employees);
    } catch (err) {
        errorHandler(err, req, res, 'Failed to fetch employees');
    }
};

// Get employee by ID
export const getById = async (req, res) => {
    try {
        const employee = await prisma.employee.findUnique({
            where: {
                id: req.params.id,
                deleted_at: null
            },
            include: { daily_activities: true },
        });
        if (!employee) return res.status(404).json({ error: 'Not found' });
        res.json(employee);
    } catch (err) {
        errorHandler(err, req, res, 'Failed to fetch employee');
    }
};

// Create new employee
export const create = async (req, res) => {
    const { name, npwp, alamat } = req.body;
    try {
        const newEmployee = await prisma.employee.create({
            data: { name, npwp, alamat },
        });
        res.status(201).json(newEmployee);
    } catch (err) {
        errorHandler(err, req, res, 'Failed to create employee');
    }
};

// Update employee
export const update = async (req, res) => {
    const { name, npwp, alamat } = req.body;
    try {
        const existingEmployee = await prisma.employee.findUnique({
            where: { id: req.params.id }
        });

        if (!existingEmployee || existingEmployee.deleted_at) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const updated = await prisma.employee.update({
            where: { id: req.params.id },
            data: {
                name,
                npwp,
                alamat,
                updated_at: new Date(),
            },
        });
        res.json(updated);
    } catch (err) {
        errorHandler(err, req, res, 'Failed to update employee');
    }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
    try {
        await prisma.employee.update({
            where: { id: req.params.id },
            data: { deleted_at: new Date() },
        });
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        errorHandler(err, req, res, 'Failed to delete employee');
    }
};

