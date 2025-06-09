import fs from 'fs';
import path from 'path';
import moment from 'moment';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `${moment().format('YYYY-MM-DD')}.log`);

const logger = (message) => {
    fs.appendFile(logFile, message, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
};

export default logger;
