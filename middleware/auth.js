import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = rbac(req, res, decoded);
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Unauthorized - Token Expired' });
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

const rbac = (req, res, data) => {

    const { role } = data
    const { baseUrl } = req
    const path = baseUrl.split('/').pop()

    const rules = {
        1: {
            get: ['products', 'employees'],
            post: [],
            put: [],
            delete: []
        },
        2: {
            get: ['products', 'employees'],
            post: ['products'],
            put: ['products'],
            delete: ['products']
        },
        3: {
            get: ['users', 'products', 'employees'],
            post: ['users', 'products', 'employees'],
            put: ['users', 'products', 'employees'],
            delete: ['users', 'products', 'employees']
        }
    };

    const action = req.method.toLowerCase();
    if (rules[role] && rules[role][action] && rules[role][action].includes(path)) {
        return data;
    }

    return res.status(403).json({ error: 'Forbidden' })
}
