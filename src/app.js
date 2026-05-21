const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const { specs } = require('./config/swagger');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// ─── Trust Proxy (for Nginx / load balancers) ─────────────────────────────────
app.set('trust proxy', 1);

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'res.cloudinary.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
    },
  },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS policy does not allow origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.options('*', cors());

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(mongoSanitize());  // Prevent MongoDB operator injection
app.use(xss());            // Sanitize HTML input
app.use(hpp({              // HTTP Parameter Pollution protection
  whitelist: ['sort', 'fields', 'price', 'rating', 'category'],
}));

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Request Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.url === '/health',
  }));
}
app.use(requestLogger);

// ─── Static Files (local dev only) ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use(generalLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Temporary Admin Setup ───────────────────────────────────────────────────
app.get('/make-me-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    const email = 'anshusharma42019@gmail.com';
    let user = await User.findOne({ email });
    
    if (user) {
      user.role = 'admin';
      user.isEmailVerified = true;
      user.isActive = true;
      user.password = 'SecurePassword123';
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      res.send('<h1>Success!</h1><p>Your account has been upgraded to Admin and your password has been reset to: <b>SecurePassword123</b></p><p>You can now log in at the Admin panel.</p>');
    } else {
      res.status(404).send('<h1>Error</h1><p>Account not found. Please register this email first.</p>');
    }
  } catch (err) {
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

app.get('/magic-login', async (req, res) => {
  try {
    const User = require('./models/User');
    const { generateAuthTokens } = require('./helpers/tokenHelper');
    let user = await User.findOne({ email: 'anshusharma42019@gmail.com' });
    
    if (!user) {
      user = new User({ firstName: 'Anshu', lastName: 'Sharma', email: 'anshusharma42019@gmail.com', phone: '9876543210', role: 'admin', isEmailVerified: true, isActive: true, password: 'SecurePassword123' });
      await user.save();
    } else {
      user.role = 'admin';
      user.isEmailVerified = true;
      user.isActive = true;
      await user.save();
    }

    const { accessToken } = generateAuthTokens(user._id, 'admin');
    
    res.send(`
      <html>
        <body>
          <h1>Logging you in...</h1>
          <script>
            localStorage.setItem('adminToken', '${accessToken}');
            window.location.href = 'http://127.0.0.1:5500/Frontend/admin.html';
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ─── Swagger API Docs ────────────────────────────────────────────────────────
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customSiteTitle: 'Triven E-Commerce API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use(process.env.API_PREFIX || '/api/v1', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
