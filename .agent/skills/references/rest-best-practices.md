# REST API Best Practices (Node.js / Express)

## Project Setup



```javascript
// index.js
const express = require('express');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## URL Structure

### Resource Naming

```javascript
// Good - Plural nouns
app.get('/api/users', getUsers);
app.get('/api/orders', getOrders);
app.get('/api/products', getProducts);

// Bad - Verbs or mixed conventions
app.get('/api/getUser', ...);       // BAD
app.get('/api/user', ...);          // BAD (inconsistent singular)
app.post('/api/createOrder', ...);  // BAD
```

### Nested Resources

```javascript
// Shallow nesting (preferred)
app.get('/api/users/:id/orders', getUserOrders);
app.get('/api/orders/:id', getOrder);

// Deep nesting (avoid)
app.get('/api/users/:id/orders/:orderId/items/:itemId/reviews', ...); // BAD

// Better - flatten it
app.get('/api/order-items/:id/reviews', getOrderItemReviews);
```

---

## HTTP Methods and Status Codes

### GET — Retrieve Resources

```javascript
// List
app.get('/api/users', async (req, res) => {
  const users = await User.findAll();
  return res.status(200).json(users);
});

// Single resource
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.status(200).json(user);
});
```

### POST — Create Resources

```javascript
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;

  // Validation error
  if (!email || !isValidEmail(email)) {
    return res.status(422).json({
      errors: [{ field: 'email', message: 'Invalid email format' }]
    });
  }

  const user = await User.create({ name, email });
  return res
    .status(201)
    .location(`/api/users/${user.id}`)
    .json(user);
});
```

### PUT — Replace Resources

```javascript
// PUT replaces the entire resource — all fields required in body
app.put('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updated = await User.replace(req.params.id, req.body); // full object
  return res.status(200).json(updated);
});
```

### PATCH — Partial Update

```javascript
// PATCH updates only the provided fields
app.patch('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updated = await User.update(req.params.id, req.body); // partial object
  return res.status(200).json(updated);
});
```

### DELETE — Remove Resources

```javascript
app.delete('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    await User.delete(req.params.id);
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'REFERENCE_ERROR') {
      return res.status(409).json({ error: 'Cannot delete — resource is referenced elsewhere' });
    }
    throw err;
  }
});
```

---

## Filtering, Sorting, and Searching

### Query Parameters

```javascript
// GET /api/users?status=active&role=admin&sort=-created_at&fields=id,name,email&search=john

app.get('/api/users', async (req, res) => {
  const { status, role, sort, fields, search, q, page, page_size } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (role)   filters.role = role;

  // Sorting: prefix "-" means descending
  let sortField = 'created_at';
  let sortOrder = 'ASC';
  if (sort) {
    if (sort.startsWith('-')) {
      sortField = sort.slice(1);
      sortOrder = 'DESC';
    } else {
      sortField = sort;
    }
  }

  // Field selection
  const selectedFields = fields ? fields.split(',') : null;

  // Search
  const searchTerm = search || q || null;

  const users = await User.findAll({ filters, sortField, sortOrder, selectedFields, searchTerm });
  return res.status(200).json(users);
});
```

---

## Pagination Patterns

### Offset-Based Pagination

```javascript
// GET /api/users?page=2&page_size=20

app.get('/api/users', async (req, res) => {
  const page      = parseInt(req.query.page)      || 1;
  const page_size = parseInt(req.query.page_size) || 20;
  const offset    = (page - 1) * page_size;

  const { rows: items, count: total } = await User.findAndCountAll({
    limit: page_size,
    offset
  });

  return res.status(200).json({
    items,
    page,
    page_size,
    total,
    pages: Math.ceil(total / page_size)
  });
});
```

### Cursor-Based Pagination (for large datasets)

```javascript
// GET /api/users?limit=20&cursor=eyJpZCI6MTIzfQ

app.get('/api/users', async (req, res) => {
  const limit  = parseInt(req.query.limit) || 20;
  const cursor = req.query.cursor
    ? JSON.parse(Buffer.from(req.query.cursor, 'base64').toString())
    : null;

  const where = cursor ? { id: { $gt: cursor.id } } : {};
  const items = await User.findAll({ where, limit: limit + 1 });

  const has_more   = items.length > limit;
  const pageItems  = has_more ? items.slice(0, limit) : items;
  const lastItem   = pageItems[pageItems.length - 1];
  const next_cursor = has_more
    ? Buffer.from(JSON.stringify({ id: lastItem.id })).toString('base64')
    : null;

  return res.status(200).json({ items: pageItems, next_cursor, has_more });
});
```

### Link Header Pagination (RESTful)

```javascript
app.get('/api/users', async (req, res) => {
  const page      = parseInt(req.query.page) || 1;
  const page_size = parseInt(req.query.page_size) || 20;
  const total     = await User.count();
  const pages     = Math.ceil(total / page_size);

  const base = `${req.protocol}://${req.get('host')}/api/users`;
  const links = [
    `<${base}?page=${page + 1}&page_size=${page_size}>; rel="next"`,
    `<${base}?page=${page - 1}&page_size=${page_size}>; rel="prev"`,
    `<${base}?page=1&page_size=${page_size}>; rel="first"`,
    `<${base}?page=${pages}&page_size=${page_size}>; rel="last"`
  ].filter((_, i) => {
    if (i === 0 && page >= pages) return false; // no next on last page
    if (i === 1 && page <= 1) return false;     // no prev on first page
    return true;
  });

  res.setHeader('Link', links.join(', '));
  const items = await User.findAll({ limit: page_size, offset: (page - 1) * page_size });
  return res.status(200).json(items);
});
```

---

## Versioning Strategies

### URL Versioning (Recommended)

```javascript
// routes/v1/users.js and routes/v2/users.js
const v1Users = require('./routes/v1/users');
const v2Users = require('./routes/v2/users');

app.use('/api/v1/users', v1Users);
app.use('/api/v2/users', v2Users);

// Pros: Clear, easy to route
// Cons: Multiple URLs for same resource
```

### Header Versioning

```javascript
// GET /api/users
// Accept: application/vnd.api+json; version=2

const versionMiddleware = (req, res, next) => {
  const accept  = req.headers['accept'] || '';
  const match   = accept.match(/version=(\d+)/);
  req.apiVersion = match ? parseInt(match[1]) : 1;
  next();
};

app.use(versionMiddleware);

app.get('/api/users', (req, res) => {
  if (req.apiVersion === 2) {
    return v2GetUsers(req, res);
  }
  return v1GetUsers(req, res);
});
```

### Query Parameter Versioning

```javascript
// GET /api/users?version=2

app.get('/api/users', (req, res) => {
  const version = parseInt(req.query.version) || 1;
  if (version === 2) return v2GetUsers(req, res);
  return v1GetUsers(req, res);
});
```

---

## Rate Limiting

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 742
X-RateLimit-Reset: 1640000000

Response when limited:
429 Too Many Requests
Retry-After: 3600
```

### Implementation with express-rate-limit

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 100,                   // max 100 requests per window
  standardHeaders: true,      // sends X-RateLimit-* headers
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.'
      }
    });
  }
});

// Apply globally
app.use('/api/', limiter);

// Or per-route
app.get('/api/users', limiter, getUsers);
```

### Manual Implementation (no library)

```javascript
const requestLog = new Map();

const rateLimiter = (calls, periodMs) => (req, res, next) => {
  const key = req.ip;
  const now = Date.now();

  if (!requestLog.has(key)) requestLog.set(key, []);

  // Remove timestamps outside the window
  const timestamps = requestLog.get(key).filter(ts => now - ts < periodMs);

  if (timestamps.length >= calls) {
    res.setHeader('Retry-After', Math.ceil(periodMs / 1000));
    return res.status(429).json({ error: 'Too many requests' });
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  next();
};

app.use('/api/', rateLimiter(100, 60 * 1000));
```

---

## Authentication and Authorization

### Bearer Token (JWT)

```bash
npm install jsonwebtoken
```

```javascript
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Usage
app.get('/api/admin/users', authenticate, authorize('admin'), getUsers);
```

### API Keys

```javascript
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};

app.use('/api/', validateApiKey);
```

---

## Error Response Format

### Consistent Error Structure

```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(statusCode, code, message, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

module.exports = AppError;
```

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    error: {
      code:      err.code    || 'INTERNAL_SERVER_ERROR',
      message:   err.message || 'An unexpected error occurred',
      details:   err.details || [],
      timestamp: new Date().toISOString(),
      path:      req.originalUrl
    }
  });
};

app.use(errorHandler);
```

```javascript
// Usage in route
const AppError = require('../utils/AppError');

app.post('/api/users', async (req, res, next) => {
  try {
    if (!req.body.email) {
      throw new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', [
        { field: 'email', message: 'Email is required', value: req.body.email }
      ]);
    }
    // ...
  } catch (err) {
    next(err);
  }
});
```

### Status Code Guidelines

| Code | Meaning | When to use |
|------|---------|-------------|
| `200 OK` | Success | GET, PATCH, PUT |
| `201 Created` | Resource created | POST |
| `204 No Content` | Success, no body | DELETE |
| `400 Bad Request` | Malformed request | Missing/wrong format |
| `401 Unauthorized` | Not authenticated | Missing/invalid token |
| `403 Forbidden` | Not authorized | Valid token, wrong role |
| `404 Not Found` | Resource missing | Wrong ID |
| `409 Conflict` | State conflict | Duplicate email, etc. |
| `422 Unprocessable Entity` | Validation failed | Invalid field values |
| `429 Too Many Requests` | Rate limited | Over quota |
| `500 Internal Server Error` | Server fault | Unexpected crash |
| `503 Service Unavailable` | Temporarily down | Maintenance mode |

---

## Caching

### Cache Headers

```javascript
// Client caching (1 hour)
app.get('/api/products', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).json(products);
});

// No caching (sensitive data)
app.get('/api/users/:id', authenticate, (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).json(user);
});

// ETag conditional requests
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });

  const etag = `"${require('crypto').createHash('md5').update(JSON.stringify(user)).digest('hex')}"`;
  res.setHeader('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).send();
  }

  return res.status(200).json(user);
});
```

---

## Bulk Operations

### Batch Endpoints

```javascript
// POST /api/users/batch
app.post('/api/users/batch', async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }

  const results = await Promise.allSettled(
    items.map(item => User.create(item))
  );

  const response = results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return { id: result.value.id, status: 'created' };
    } else {
      return { id: null, status: 'failed', error: result.reason.message };
    }
  });

  return res.status(207).json({ results: response }); // 207 Multi-Status
});
```

---

## Idempotency

### Idempotency Keys

```javascript
const idempotencyStore = new Map(); // Use Redis in production

const idempotencyMiddleware = (req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (!key) return next();

  if (idempotencyStore.has(key)) {
    const cached = idempotencyStore.get(key);
    return res.status(200).json(cached);
  }

  // Patch res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    idempotencyStore.set(key, body);
    return originalJson(body);
  };

  next();
};

app.post('/api/orders', idempotencyMiddleware, createOrder);
```

---

## CORS Configuration

```bash
npm install cors
```

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
```

---

## Documentation with Swagger / OpenAPI

```bash
npm install swagger-jsdoc swagger-ui-express
```

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi   = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'My API', version: '1.0.0', description: 'API for managing users' }
  },
  apis: ['./routes/**/*.js']
});

app.use('/docs',  swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/redoc', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // alternative

/**
 * @openapi
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
app.get('/api/users/:userId', async (req, res) => {
  // ...
});
```

---

## Health and Monitoring Endpoints

```javascript
const { Pool } = require('pg'); // or your DB client
const redis = require('redis');  // if using Redis

const checkDatabase = async () => {
  try {
    await pool.query('SELECT 1');
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
};

const checkRedis = async () => {
  try {
    await redisClient.ping();
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
};

// Basic health check
app.get('/health', (req, res) => {
  return res.status(200).json({
    status:    'healthy',
    version:   process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check
app.get('/health/detailed', async (req, res) => {
  const [database, cache] = await Promise.all([
    checkDatabase(),
    checkRedis()
  ]);

  const allHealthy = [database, cache].every(s => s === 'healthy');

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks: { database, cache }
  });
});
```

---

## Router Structure (Recommended File Layout)

```
project/
├── index.js
├── routes/
│   ├── v1/
│   │   └── users.js
│   └── v2/
│       └── users.js
├── middleware/
│   ├── authenticate.js
│   ├── errorHandler.js
│   └── rateLimiter.js
└── utils/
    └── AppError.js
```

```javascript
// routes/v1/users.js
const express = require('express');
const router  = express.Router();

router.get('/',    getUsers);
router.get('/:id', getUser);
router.post('/',   createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;

// index.js
const usersRouter = require('./routes/v1/users');
app.use('/api/v1/users', usersRouter);
```