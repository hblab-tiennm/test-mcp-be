# Database Setup Guide

## Quick Start (No Config Required!)

Cấu hình mặc định sẽ hoạt động ngay với PostgreSQL local:
- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: `postgres`
- Database: `test_db`

**Chỉ cần tạo database:**
```bash
createdb test_db
# hoặc
psql -U postgres -c "CREATE DATABASE test_db;"
```

## Environment Variables (Optional)

Tạo file `.env` nếu muốn tùy chỉnh:

### Development (Local PostgreSQL)
```env
NODE_ENV=development
PORT=3000

# Database - Optional, có default values
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=test_db
```

### Production (AWS Aurora)
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-aurora-endpoint.cluster-xxxxxx.<AWS_REGION>.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name

# Note: SSL is automatically enabled for production and non-localhost hosts
# To disable SSL (not recommended), set: DB_SSL_DISABLED=true
```

## For Production (AWS Aurora)

1. **Get Database Endpoint**: From AWS RDS Console
   - Writer endpoint: For read/write operations
   - Reader endpoint: For read-only operations

2. **Get Credentials from AWS Secrets Manager**:
   ```bash
   aws secretsmanager get-secret-value --secret-id your-secret-name --region <AWS_REGION>
   ```

3. **Set Environment Variables** in ECS Task Definition or use AWS Systems Manager Parameter Store

## Aurora PostgreSQL Connection String Format

```
postgresql://username:password@your-cluster.cluster-xxxxxx.ap-southeast-1.rds.amazonaws.com:5432/database_name
```

## Test Database Connection

Once the app is running, test the database connection:

```bash
curl http://localhost:3000/users/test-connection
```

Expected response:
```json
{
  "message": "Database connected successfully! Found 0 users.",
  "connected": true
}
```
