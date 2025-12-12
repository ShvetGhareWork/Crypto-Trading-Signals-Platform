const express = require('express');
const {
  createSignal,
  getSignals,
  getSignalById,
  updateSignal,
  deleteSignal,
  getAnalytics,
} = require('../controllers/signalController');
const { authenticate } = require('../middlewares/authenticate');
const { isAdmin } = require('../middlewares/authorize');
const { apiLimiter } = require('../middlewares/rateLimiter');
const {
  signalValidation,
  paginationValidation,
  signalFilterValidation,
  objectIdValidation,
} = require('../middlewares/validator');

const router = express.Router();

// Apply rate limiting to all signal routes
router.use(apiLimiter);

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/signals:
 *   get:
 *     summary: Get all signals with pagination and filters
 *     tags: [Signals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: signalType
 *         schema:
 *           type: string
 *           enum: [BUY, SELL, HOLD]
 *       - in: query
 *         name: cryptocurrency
 *         schema:
 *           type: string
 *       - in: query
 *         name: minConfidence
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired]
 *           default: active
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, confidence, targetPrice]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Signals retrieved successfully
 */
router.get('/', paginationValidation, signalFilterValidation, getSignals);

/**
 * @swagger
 * /api/v1/signals/analytics/summary:
 *   get:
 *     summary: Get analytics summary (Admin only)
 *     tags: [Signals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/analytics/summary', isAdmin, getAnalytics);

/**
 * @swagger
 * /api/v1/signals/{id}:
 *   get:
 *     summary: Get signal by ID
 *     tags: [Signals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signal retrieved successfully
 *       404:
 *         description: Signal not found
 */
router.get('/:id', objectIdValidation('id'), getSignalById);

/**
 * @swagger
 * /api/v1/signals:
 *   post:
 *     summary: Create new signal (Admin only)
 *     tags: [Signals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - signalType
 *               - cryptocurrency
 *               - targetPrice
 *               - confidence
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               signalType:
 *                 type: string
 *                 enum: [BUY, SELL, HOLD]
 *               cryptocurrency:
 *                 type: string
 *               targetPrice:
 *                 type: number
 *               confidence:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *     responses:
 *       201:
 *         description: Signal created successfully
 *       403:
 *         description: Access denied
 */
router.post('/', isAdmin, signalValidation, createSignal);

/**
 * @swagger
 * /api/v1/signals/{id}:
 *   put:
 *     summary: Update signal (Admin only)
 *     tags: [Signals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signal updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Signal not found
 */
router.put('/:id', isAdmin, objectIdValidation('id'), signalValidation, updateSignal);

/**
 * @swagger
 * /api/v1/signals/{id}:
 *   delete:
 *     summary: Delete signal (Admin only)
 *     tags: [Signals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Signal deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Signal not found
 */
router.delete('/:id', isAdmin, objectIdValidation('id'), deleteSignal);

module.exports = router;
