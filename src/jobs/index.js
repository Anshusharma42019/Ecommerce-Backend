'use strict';

const logger = require('../utils/logger');

let emailQueue = null;
let invoiceQueue = null;

const initializeJobs = () => {
  try {
    const Bull = require('bull');
    const redisConfig = {
      redis: {
        host: process.env.BULL_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.BULL_REDIS_PORT || process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    };

    // Email Queue
    emailQueue = new Bull('email-queue', redisConfig);
    emailQueue.process(async (job) => {
      const { sendEmail } = require('../utils/mailer');
      await sendEmail(job.data);
    });

    emailQueue.on('completed', (job) => logger.info(`Email job ${job.id} completed.`));
    emailQueue.on('failed', (job, err) => logger.error(`Email job ${job.id} failed:`, err.message));

    // Invoice Queue
    invoiceQueue = new Bull('invoice-queue', redisConfig);
    invoiceQueue.process(async (job) => {
      const orderService = require('../services/orderService');
      await orderService.generateInvoice(job.data.orderId);
    });

    invoiceQueue.on('completed', (job) => logger.info(`Invoice job ${job.id} completed.`));
    invoiceQueue.on('failed', (job, err) => logger.error(`Invoice job ${job.id} failed:`, err.message));

    logger.info('✅ Bull job queues initialized.');
  } catch (err) {
    logger.warn('Bull queue initialization failed (Redis unavailable?). Jobs will run synchronously:', err.message);
  }
};

const addEmailJob = async (emailData, opts = {}) => {
  if (emailQueue) {
    return emailQueue.add(emailData, { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, ...opts });
  }
  // Fallback: send synchronously
  const { sendEmail } = require('../utils/mailer');
  return sendEmail(emailData);
};

const addInvoiceJob = async (orderId, opts = {}) => {
  if (invoiceQueue) {
    return invoiceQueue.add({ orderId }, { attempts: 2, delay: 1000, ...opts });
  }
};

module.exports = { initializeJobs, addEmailJob, addInvoiceJob };
