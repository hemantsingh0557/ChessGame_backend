'use strict';

const path = require('path');
const development = require('./env/development');
const production = require('./env/production');
const staging = require('./env/staging');
require('dotenv').config()

const PLATFORM = process.env.PLATFORM || 'Backend';

const defaults = {
    MYSQL : {
        DATABASE : process.env.DB_NAME,
        USER : process.env.DB_USER,
        PASSWORD : process.env.DB_PASSWORD ,
        HOST : process.env.DB_HOST ,
        DAILECT : process.env.DB_DIALECT
    },
    PLATFORM,
    SERVER_TYPE_ENV: process.env.SERVER_TYPE || '' ,
    ROOT_PATH: path.normalize(`${__dirname}/../app`),
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    DEFAULT_TZ: process.env.TZ || 'UTC',
    API_AUTH_KEY: process.env.API_AUTH_KEY || 'apitestkey',
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:3000',
    SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL || 'http://localhost:3000',
    S3_FILE_URL: process.env.S3_FILE_URL || 'http://localhost:3000/',
    WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
    ADMIN_WEB_URL: process.env.ADMIN_WEB_URL || 'http://localhost:3000',
    WEB_ADMIN_URL: process.env.WEB_ADMIN_URL || 'http://localhost:4200',
    swagger: require('./swagger'),
    PATH_TO_UPLOAD_FILES_ON_LOCAL: process.env.PATH_TO_UPLOAD_FILES_ON_LOCAL || '/uploads/files',
    UPLOAD_TO_S3_BUCKET: !!(typeof process.env.UPLOAD_TO_S3_BUCKET === 'string'
        && process.env.UPLOAD_TO_S3_BUCKET.toLowerCase() === 'true'),
    SOCKET_LOADBALANCING_ENABLE: process.env.SOCKET_LOADBALANCING_ENABLE || false,
    LIVE_LOGGER_ENABLE: process.env.LIVE_LOGGER_ENABLE || false,
    SMTP: {
        TRANSPORT: {
            host: process.env.NODEMAILER_HOST || 'node-mailer-host-name',
            service: process.env.NODEMAILER_SERVICE || 'node-mailer-service',
            auth: {
                user: process.env.NODEMAILER_USER || 'node-mailer-user',
                pass: process.env.NODEMAILER_PASSWORD || 'node-mailer-password',
            },
            secure: false,
            tls: { rejectUnauthorized: false },
        },
        SENDER: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
    },
    SES: {
        accessKeyId: process.env.SES_AWS_ACCESS_KEY_ID || 'aws_access_key',
        secretAccessKey: process.env.SES_AWS_SECRET_ACESS_KEY || 'aws_secret_key',
        region: process.env.SES_AWS_REGION || 'us-east-1',
        SENDER: process.env.SES_SENDER || "",
    },

    MONGODB: {
        PROTOCOL: process.env.DB_PROTOCOL || 'mongodb',
        HOST: process.env.DB_HOST || '127.0.0.1',
        PORT: process.env.DB_PORT || 27017,
        NAME: process.env.DB_NAME || 'project',
        USER: process.env.DB_USER || 'username',
        PASSWORD: process.env.DB_PASS || 'password',
        get URL() { return process.env.DB_URL || `${this.PROTOCOL}://${this.HOST}:${this.PORT}/${this.NAME}`; },
    },
    REDIS: {
        PROTOCOL: process.env.REDIS_PROTOCOL || 'redis',
        PORT: process.env.REDIS_PORT || '6379',
        HOST: process.env.REDIS_HOST || '127.0.0.1',
        PASSWORD: process.env.REDIS_PASSWORD || '',
        USERNAME: process.env.REDIS_USERNAME || '',
        NAME: '1',
        get URL() { return process.env.REDIS_URL || `${this.PROTOCOL}://${this.USERNAME}${process.env.REDIS_PASSWORD ? ':' + this.PASSWORD : ''}${(process.env.REDIS_USERNAME || process.env.REDIS_PASSWORD) ? '@' : ''}${this.HOST}:${this.PORT}/${this.NAME}` }
    },
    FIREBASE: {
        SERVER_KEY: process.env.FIREBASE_SERVER_KEY || 'firebase server key',
        WEB_SERVER_KEY: process.env.FIREBASE_WEB_SERVER_KEY_PATH || 'firebase web-server key',
    },
    SERVER: {
        PROTOCOL: process.env.SERVER_PROTOCOL || 'http',
        HOST: process.env.SERVER_HOST || '0.0.0.0',
        PORT: process.env.SERVER_PORT || '8000',
        SOCKET_PORT: process.env.SERVER_SOCKET_PORT || '4000',
        get URL() { return `${this.PROTOCOL}://${this.HOST}:${this.PORT}`; },
    },
    SWAGGER_AUTH: {
        USERNAME: process.env.SWAGGER_AUTH_USERNAME || 'username',
        PASSWORD: process.env.SWAGGER_AUTH_PASSWORD || 'password',
    },
    S3_BUCKET: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'access-key-id',
        secretAccessKey: process.env.AWS_SECRET_ACESS_KEY || 'secret-access-key',
        bucketName: process.env.S3_BUCKET_NAME || 'bucket-name',
    },
    AWS: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'aws_access_key',
        secretAccessKey: process.env.AWS_SECRET_ACESS_KEY || 'aws_secret_key',
        awsRegion: process.env.AWS_REGION || 'us-east-1',
    },
    AWS_CFS_SERVER: {
        URL: process.env.AWS_CLOUDFRONT_URL || '',
        KEY_PAIR_ID: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID || '',
        PRIVATE_KEY_PATH: process.env.AWS_CLOUDFRONT_PRIVATE_KEY_PATH || '',
    },
    AWS_CFS_EXERCISE: {
        URL: process.env.AWS_EXERCISE_CLOUDFRONT_URL || '',
        KEY_PAIR_ID: process.env.AWS_EXERCISE_CLOUDFRONT_KEY_PAIR_ID || '',
        PRIVATE_KEY_PATH: process.env.AWS_EXERCISE_CLOUDFRONT_PRIVATE_KEY_PATH || '',
    },
    ADMIN: {
        EMAIL: process.env.ADMIN_EMAIL || 'admin@yopmail.com',
        PASSWORD: process.env.ADMIN_PASS || 'pass123',
        USERNAME: process.env.ADMIN_USERNAME || 'Admin',
    },
    PINO: {
        API_KEY: process.env.PINO_API_KEY || 'pino api key',
        API_SECRET: process.env.PINO_API_SECRET || 'pino secret key',
    },
    API_KEY: process.env.API_KEY || '',
};

const currentEnvironment = process.env.NODE_ENV || 'production';

function myConfig(envConfig) {
    return { ...defaults, ...envConfig };
}

module.exports = {
    development: myConfig(development),
    production: myConfig(production),
    staging: myConfig(staging),
}[currentEnvironment];
