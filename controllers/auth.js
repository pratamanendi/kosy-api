import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from '../logger.js';
import moment from 'moment';

const prisma = new PrismaClient();

export const login = async (req, res) => {
    const { email, username, password } = req.body;

    if (!email && !username) {
        return res.status(400).json({ error: 'Email or username are required' });
    }

    try {
        const user = await prisma.users.findFirst({
            where: { OR: [{ email }, { username }] },
            include: { employee: true },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production' ? true : false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ accessToken, user: { id: user.id, email: user.email, employee: { ...user.employee } } });
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const register = async (req, res) => {
    const { email, username, password, name, npwp, alamat } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, name and password are required' });
    }

    const isExistingUser = await prisma.users.findFirst({ where: { email } });
    if (isExistingUser) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                email,
                username,
                password: hashedPassword,
                employee: {
                    create: {
                        name,
                        npwp,
                        alamat
                    }
                }
            }
        });

        const accessToken = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production' ? true : false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ accessToken, user: { id: user.id, email: user.email } });
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
};

export const refreshToken = async (req, res) => {

    const { refreshToken: token } = req.cookies;
    console.log("🚀 ~ refreshToken ~ token:", token)
    console.log("🚀 ~ refreshToken ~ req.cookies:", req.cookies)

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await prisma.users.findFirst({ where: { id: decoded.sub } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const newAccessToken = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updatePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const { id } = req.params;

    if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Old password, new password, and confirm new password are required' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirm new password do not match' });
    }

    try {
        const user = await prisma.users.findFirst({ where: { id } });

        if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(401).json({ error: 'Invalid old password' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.users.update({
            where: { id },
            data: {
                password: hashedNewPassword,
                updated_at: new Date(),
            },
        });

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await prisma.users.findFirst({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.MAIL_FROM,
            to: email,
            subject: 'Reset Password',
            text: `Please click this link to reset your password: ${process.env.CLIENT_URL}/reset-password?token=${token}`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Password reset link has been sent to your email' });
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Token, new password, and confirm new password are required' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirm new password do not match' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.users.findFirst({ where: { id: decoded.sub } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.users.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
                updated_at: new Date(),
            },
        });

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

