# Backend Implementation Guide

This guide provides a roadmap for implementing the backend for the Kairos Academic Repository system using Node.js.

---

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or compatible SQL database)
- Supabase account (for authentication)
- Cloud storage service (AWS S3, Google Cloud Storage, or Supabase Storage)

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database connection
│   │   ├── storage.js           # File storage config
│   │   └── supabase.js          # Supabase client
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── faculty.controller.js
│   │   ├── admin.controller.js
│   │   ├── assignment.controller.js
│   │   ├── note.controller.js
│   │   └── textbook.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── role.middleware.js    # Role-based access control
│   │   ├── validation.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── Student.js
│   │   ├── Faculty.js
│   │   ├── Subject.js
│   │   ├── Assignment.js
│   │   ├── Submission.js
│   │   ├── Note.js
│   │   └── Textbook.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── faculty.routes.js
│   │   ├── admin.routes.js
│   │   └── index.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── file.service.js       # File upload/download
│   │   ├── email.service.js      # Email notifications
│   │   └── pagination.service.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── errors.js
│   │   └── helpers.js
│   └── server.js                 # Express app entry point
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_students.sql
│   └── ...
├── seeds/
│   └── initial_data.sql
├── .env.example
├── package.json
└── README.md
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "@supabase/supabase-js": "^2.38.4",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "nodemailer": "^6.9.7"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.55.0"
  }
}
```

---

## 🔧 Environment Variables

Create a `.env` file:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kairos_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kairos_db
DB_USER=your_user
DB_PASSWORD=your_password

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# File Storage (AWS S3 example)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=kairos-files

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚀 Implementation Steps

### Step 1: Database Setup
1. Create PostgreSQL database
2. Run migrations from `DATABASE_SCHEMA.md`
3. Seed initial data

### Step 2: Basic Express Setup
```javascript
// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/faculty', require('./routes/faculty.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Error handling
app.use(require('./middleware/error.middleware'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Authentication Middleware
```javascript
// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: { message: 'No token provided' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Insufficient permissions' } });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
```

### Step 4: Database Connection
```javascript
// src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
```

### Step 5: File Upload Service
```javascript
// src/services/file.service.js
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const uploadFile = async (file, folder) => {
  const key = `${folder}/${Date.now()}-${file.originalname}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  });

  await s3Client.send(command);
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = { uploadFile };
```

---

## 📝 Example Controller

```javascript
// src/controllers/assignment.controller.js
const pool = require('../config/database');
const { uploadFile } = require('../services/file.service');

const createAssignment = async (req, res, next) => {
  try {
    const { title, subjectId, instructions, totalMarks, dueDate, allowLateSubmission } = req.body;
    const facultyId = req.user.id;

    const result = await pool.query(
      `INSERT INTO assignments (title, subject_id, faculty_id, instructions, total_marks, due_date, allow_late_submission)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, subjectId, facultyId, instructions, totalMarks, dueDate, allowLateSubmission]
    );

    res.status(201).json({
      message: 'Assignment created successfully.',
      assignment: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAssignment };
```

---

## 🧪 Testing Strategy

1. **Unit Tests**: Test individual functions and services
2. **Integration Tests**: Test API endpoints with test database
3. **E2E Tests**: Test complete user flows

Example test:
```javascript
// tests/assignment.test.js
const request = require('supertest');
const app = require('../src/server');

describe('POST /api/assignments', () => {
  it('should create assignment with valid data', async () => {
    const token = 'valid_jwt_token';
    const response = await request(app)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Assignment',
        subjectId: 'uuid',
        instructions: 'Test instructions',
        totalMarks: 100,
        dueDate: '2024-12-31T23:59:59Z'
      });

    expect(response.status).toBe(201);
    expect(response.body.assignment).toBeDefined();
  });
});
```

---

## 🔒 Security Best Practices

1. **Input Validation**: Validate all inputs using express-validator
2. **SQL Injection**: Use parameterized queries (pg library does this)
3. **XSS Protection**: Use helmet middleware
4. **Rate Limiting**: Implement rate limiting on all endpoints
5. **File Upload**: Validate file types and sizes
6. **Error Handling**: Don't expose sensitive error details
7. **Logging**: Log all errors and important events
8. **HTTPS**: Use HTTPS in production
9. **CORS**: Configure CORS properly
10. **Secrets**: Never commit secrets to git

---

## 📊 Performance Optimization

1. **Database Indexes**: Ensure all foreign keys and frequently queried fields are indexed
2. **Connection Pooling**: Use connection pooling for database
3. **Caching**: Implement Redis for frequently accessed data
4. **Pagination**: Always paginate list endpoints
5. **Lazy Loading**: Load related data only when needed
6. **File Compression**: Compress large files before storage
7. **CDN**: Use CDN for static file serving

---

## 📈 Monitoring & Logging

1. **Winston Logger**: Implement structured logging
2. **Error Tracking**: Use Sentry or similar for error tracking
3. **Performance Monitoring**: Monitor API response times
4. **Database Monitoring**: Monitor query performance
5. **Uptime Monitoring**: Set up uptime monitoring

---

## 🚢 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] CORS configured for production domain
- [ ] Rate limiting configured
- [ ] Error logging set up
- [ ] File storage configured
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Documentation updated

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

---

## 🎯 Priority Implementation Order

1. **Phase 1**: Authentication & User Management
   - Auth endpoints
   - Student/Faculty/Admin CRUD
   - Basic middleware

2. **Phase 2**: Subject & Enrollment Management
   - Subject CRUD
   - Faculty-Subject assignment
   - Student-Subject enrollment

3. **Phase 3**: Assignment System
   - Assignment CRUD
   - Submission handling
   - Grading system

4. **Phase 4**: Content Management
   - Notes upload/verification
   - Textbook management
   - File handling

5. **Phase 5**: Dashboard & Reporting
   - Dashboard data aggregation
   - Activity logging
   - Export functionality

---

## 💡 Tips

1. Start with authentication - it's the foundation
2. Implement one feature completely before moving to the next
3. Write tests as you go
4. Use database transactions for multi-step operations
5. Implement proper error handling from the start
6. Document your code
7. Use TypeScript for better type safety (optional)
8. Consider using an ORM like Sequelize or TypeORM (optional)

---

Good luck with your backend implementation! 🚀
