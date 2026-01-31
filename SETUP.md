# Setup Instructions

## Prerequisites

- Node.js 20+
- PostgreSQL (for local development)
- Docker (optional, for containerization)
- AWS CLI (for production deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Local Database

```bash
# Install PostgreSQL if not installed
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql

# Create database
createdb test_db
```

### 3. Environment Variables (Optional)

The app will use default values if `.env` file is not provided:
- DB_HOST: localhost
- DB_PORT: 5432
- DB_USERNAME: postgres
- DB_PASSWORD: postgres
- DB_NAME: test_db

To customize, create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run Migrations (Optional in Development)

The app uses `synchronize: true` in development mode, which auto-creates tables.

If you want to use migrations:

```bash
npm run migration:run
```

### 5. Start Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 6. Access Application

- API: http://localhost:3000
- Health Check: http://localhost:3000/
- Swagger UI: http://localhost:3000/api
- Test DB Connection: http://localhost:3000/users/test-connection

## Production Deployment (AWS)

### Environment Variables Required

For production deployment, set these environment variables:

```bash
NODE_ENV=production
PORT=3000

# Database (from AWS Secrets Manager)
DB_HOST=<your-aurora-endpoint>
DB_PORT=5432
DB_USERNAME=<your-username>
DB_PASSWORD=<your-password>
DB_NAME=<your-database>
DB_SSL_ENABLED=true
```

### AWS Resources Needed

1. **ECR Repository** - For Docker images
2. **Aurora PostgreSQL** - Database cluster
3. **Secrets Manager** - For database credentials
4. **ECS Cluster** - To run containers
5. **Application Load Balancer** - For routing traffic

### Deployment Steps

See detailed guide in:
- `AWS_DEPLOYMENT_GUIDE.md` - Complete AWS deployment guide
- `MIGRATION_GUIDE.md` - Database migration guide
- `DATABASE_SETUP.md` - Database configuration guide

### Quick Deploy

```bash
# 1. Replace placeholders with your actual values
export AWS_ACCOUNT_ID=your-account-id
export AWS_REGION=your-region
export ECR_REPOSITORY_NAME=your-repo-name

# 2. Build and push to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t $ECR_REPOSITORY_NAME .
docker tag $ECR_REPOSITORY_NAME:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:latest

# 3. Run migrations (before first deployment)
export DB_HOST=your-aurora-endpoint
export DB_USERNAME=your-username
export DB_PASSWORD=your-password
export DB_NAME=your-database
export DB_SSL_ENABLED=true
npm run migration:run

# 4. Deploy to ECS (see AWS_DEPLOYMENT_GUIDE.md for details)
```

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### API Testing

```bash
# Health check
curl http://localhost:3000/

# Test database connection
curl http://localhost:3000/users/test-connection

# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Get all users
curl http://localhost:3000/users
```

## Project Structure

```
.
├── src/
│   ├── database/           # Database configuration and migrations
│   │   ├── database.module.ts
│   │   ├── data-source.ts
│   │   └── migrations/     # Database migrations
│   ├── users/              # Users module (example)
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── items/              # Items module (example)
│   ├── app.module.ts
│   └── main.ts
├── Dockerfile              # Docker configuration
├── docker-entrypoint.sh    # Docker entrypoint (auto-run migrations)
├── AWS_DEPLOYMENT_GUIDE.md # AWS deployment guide
├── MIGRATION_GUIDE.md      # Database migration guide
└── DATABASE_SETUP.md       # Database configuration guide
```

## Available Scripts

```bash
npm run start:dev          # Start in development mode
npm run start:prod         # Start in production mode
npm run build              # Build the application
npm run migration:generate # Generate migration from entities
npm run migration:create   # Create empty migration
npm run migration:run      # Run migrations
npm run migration:revert   # Rollback last migration
npm run migration:show     # Show migration status
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run lint               # Lint and fix code
```

## Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -l`
- Check credentials in `.env` file

### Migration Failed
- Check database connection
- Verify migration syntax
- See logs: `npm run migration:show`

### Docker Build Failed
- Ensure `package-lock.json` exists
- Check `node_modules` is in `.dockerignore`
- Verify `tsconfig.json` is not ignored

## Support

For issues and questions:
1. Check the documentation files in this repository
2. Review AWS CloudWatch logs (for production)
3. Open an issue in the repository

## License

This project is licensed under UNLICENSED.
