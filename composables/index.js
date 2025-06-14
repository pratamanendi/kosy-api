import logger from '../logger.js';
import moment from 'moment';

export const errorHandler = (err, req, res, errMessage) => {
    const message = `${moment().format('YYYY-MM-DD HH:mm:ss')}: Error : ${req.method} ${req.originalUrl} ${JSON.stringify(req.query)} ${JSON.stringify(req.body)}, Message : ${err.message ?? 'internal server error'}, Error response : ${errMessage}\n`
    logger(message);
    return res.status(500).json({
        error: errMessage ?? 'Internal server error',
        ...(err.message && { description: err.message })
    });
}

export const checkField = (body, required) => {
    const missing = required.filter(field => {
        const keys = field.split('.');
        return keys.reduce((acc, key) => acc && acc[key], body) === undefined;
    }).map(field => {
        const keys = field.split('.');
        return keys[keys.length - 1].charAt(0).toUpperCase() + keys[keys.length - 1].slice(1);
    });

    return missing
}