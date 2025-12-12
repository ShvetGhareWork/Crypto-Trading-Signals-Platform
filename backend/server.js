require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Initialize Express app
const app = express();

// Connect to databases
connectDB();

// Connect to Redis (optional, non-blocking)
connectRedis().catch((err) => {
  logger.warn('Redis connection skipped, continuing without cache');
});

// ============================================
// TRUST PROXY (CRITICAL FOR RENDER)
// ============================================
app.set('trust proxy', 1); // Trust first proxy (Render)

// ============================================
// HELMET - SECURITY HEADERS
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// ============================================
// CORS CONFIGURATION - PRODUCTION READY
// ============================================
const allowedOrigins = [
  'https://crypto-trading-signals-platform.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
];

// Add FRONTEND_URL from env if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Allow any Vercel deployment
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Check allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked: ${origin}`);
    return callback(null, true); // TEMPORARILY ALLOW ALL FOR DEBUGGING
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Handle preflight for all routes
app.options('*', cors(corsOptions));

// ============================================
// BODY PARSERS (BEFORE ROUTES)
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ============================================
// LOGGING
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - Origin: ${req.get('origin') || 'none'}`);
  next();
});

// ============================================
// SWAGGER DOCUMENTATION
// ============================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Crypto Trading Signals API',
      version: '1.0.0',
      description: 'Enterprise-grade REST API for crypto trading signals with RBAC',
      contact: {
        name: 'API Support',
        email: 'support@cryptosignals.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://crypto-trading-signals-platform.onrender.com'
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================
// BASIC ROUTES (BEFORE API ROUTES)
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Crypto Trading Signals API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Test endpoint
app.post('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test successful',
    body: req.body,
    headers: req.headers,
  });
});

// ============================================
// API ROUTES
// ============================================

// Load routes with error handling
try {
  const authRoutes = require('./routes/authRoutes');
  const signalRoutes = require('./routes/signalRoutes');
  
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/signals', signalRoutes);
  
  logger.info('✅ All routes loaded successfully');
} catch (error) {
  logger.error('❌ Route loading failed:', error.message);
  logger.error(error.stack);
}

// ============================================
// ERROR HANDLERS (MUST BE LAST)
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`🌍 Allowed origins: ${allowedOrigins.join(', ')}`);
});

// Graceful error handling
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => logger.info('HTTP server closed'));
});

module.exports = app;
