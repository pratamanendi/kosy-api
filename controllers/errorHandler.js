import logger from '../logger.js';
import moment from 'moment';

export default (err, req, res, errMessage) => {
    logger(`${moment().format('YYYY-MM-DD HH:mm:ss')}: URL: ${req.url} Method: ${req.method} Query: ${JSON.stringify(req.query)} Body: ${JSON.stringify(req.body)} Error: ${err.message}\n`);
    return res.status(500).json({ error: errMessage ?? 'Internal server error' });
}
