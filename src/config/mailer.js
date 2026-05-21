'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  transporter.verify((err) => {
    if (err) {
      logger.warn('Email transporter verification failed:', err.message);
    } else {
      logger.info('✅ Email transporter ready.');
    }
  });

  return transporter;
};

module.exports = { createTransporter };
