'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Triven E-Commerce REST API',
      version: '1.0.0',
      description: 'Production-grade e-commerce backend API documentation',
      contact: {
        name: 'Triven API Support',
        email: 'api@triven.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.triven.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Products', description: 'Product catalog' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Cart', description: 'Shopping cart' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Reviews', description: 'Product reviews & ratings' },
      { name: 'Coupons', description: 'Discount coupons' },
      { name: 'Admin', description: 'Admin panel endpoints' },
      { name: 'Notifications', description: 'User notifications' },
    ],
  },
  apis: [
    path.join(__dirname, '..', 'routes', '*.js'),
    path.join(__dirname, '..', 'models', '*.js'),
    path.join(__dirname, '..', 'docs', '*.yaml'),
  ],
};

const specs = swaggerJsdoc(options);

module.exports = { specs };
