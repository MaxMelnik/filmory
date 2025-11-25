import { createLogger, format, transports } from 'winston';

const {
    combine,
    colorize,
    timestamp,
    errors,
    splat,
    printf,
    json,
} = format;

const consoleFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat(),
    printf(({ timestamp, level, message, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        if (stack) {
            return `${timestamp} ${level}: ${message}\n${stack}${metaStr}`;
        }
        return `${timestamp} ${level}: ${message}${metaStr}`;
    }),
);

const fileFormat = combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    json(), // файл у JSON-форматі — зручно грепати/аналізувати
);

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    transports: [
        new transports.Console({
            format: consoleFormat,
        }),
        // new transports.File({
        //     filename: 'logs/app.log',
        //     level: process.env.FILE_LOG_LEVEL || 'info',
        // }),
    ],
    exitOnError: false,
});

logger.stream = {
    write: (message) => {
        logger.http ? logger.http(message.trim()) : logger.info(message.trim());
    },
};

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
});

export default logger;
