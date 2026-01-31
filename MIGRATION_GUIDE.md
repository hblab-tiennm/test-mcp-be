# Migration Quick Guide

## 📚 Tại sao cần Migrations?

**Development (Local):**
- ✅ Dùng `synchronize: true` - TypeORM tự động tạo/update tables
- ⚠️ Dễ dàng nhưng NGUY HIỂM cho production

**Production (AWS):**
- ✅ Dùng **Migrations** - Kiểm soát chính xác database schema
- ✅ Version control cho database
- ✅ Rollback được khi có lỗi
- ❌ KHÔNG BAO GIỜ dùng `synchronize: true`

## 🛠️ Migration Commands

### Tạo Migration (Tự động từ entities)
```bash
npm run migration:generate src/database/migrations/CreateUserTable
```

### Tạo Migration (Rỗng, tự viết)
```bash
npm run migration:create src/database/migrations/AddIndexToUsers
```

### Chạy Migrations
```bash
npm run migration:run
```

### Xem Migration Status
```bash
npm run migration:show
```

### Revert Migration (Rollback)
```bash
npm run migration:revert
```

## 📋 Workflow

### Development Flow
```bash
# 1. Tạo/Sửa entity
vim src/users/entities/user.entity.ts

# 2. Generate migration từ entity changes
npm run migration:generate src/database/migrations/UpdateUserEntity

# 3. Review migration file
vim src/database/migrations/*-UpdateUserEntity.ts

# 4. Chạy migration
npm run migration:run

# 5. Test
npm run start:dev
```

### Production Flow
```bash
# 1. Merge code lên main branch (đã có migration files)

# 2. Build Docker image
docker build -t app .

# 3. Push lên ECR
docker push ...

# 4. Deploy lên ECS
# Docker container sẽ TỰ ĐỘNG chạy migrations khi start (qua entrypoint script)

# 5. Verify migrations
aws logs tail /ecs/nestjs-app --follow
```

## 🚀 Local Testing

```bash
# Set database connection
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_NAME=test_db

# Chạy migrations
npm run migration:run

# Xem kết quả
npm run migration:show

# Output:
# ✓ CreateUserTable1738425600000 - Executed
```

## 🔄 Rollback Strategy

### Rollback 1 migration
```bash
npm run migration:revert
```

### Rollback nhiều migrations
```bash
npm run migration:revert  # Lặp lại nhiều lần
```

### Production Rollback
```bash
# Option 1: Manual
export DB_HOST=your-aurora-endpoint
npm run migration:revert

# Option 2: Via ECS Task
aws ecs run-task \
  --cluster my-cluster \
  --task-definition nestjs-app \
  --overrides '{
    "containerOverrides": [{
      "name": "nestjs-app",
      "command": ["node", "dist/database/data-source.js", "migration:revert"]
    }]
  }'
```

## ⚡ Docker Auto-Migration

Container sẽ tự động chạy migrations khi start (xem `docker-entrypoint.sh`):

```bash
# When container starts:
🚀 Starting application...
📦 Running database migrations...
✅ Starting NestJS application...
```

## 📝 Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1738425600000 implements MigrationInterface {
  name = 'CreateUserTable1738425600000';

  // Chạy khi migrate UP
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  // Chạy khi migrate DOWN (rollback)
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

## 🎯 Best Practices

1. **Always test locally first** - Chạy migrations trên local trước
2. **Review generated SQL** - Kiểm tra SQL trong migration files
3. **Backup before migrate** - Backup database trước khi migrate production
4. **Write reversible migrations** - Luôn implement `down()` method
5. **One change per migration** - Mỗi migration nên có 1 thay đổi rõ ràng
6. **Descriptive names** - Đặt tên migration rõ ràng
7. **Don't modify existing migrations** - Không sửa migrations đã chạy
8. **Test rollback** - Test cả up và down migrations

## ❌ Common Mistakes

1. ❌ Dùng `synchronize: true` trên production
2. ❌ Không test migrations trước khi deploy
3. ❌ Sửa migrations đã chạy
4. ❌ Không implement `down()` method
5. ❌ Không backup database trước khi migrate
6. ❌ Chạy migrations trực tiếp trên production DB mà không test

## ✅ Checklist

### Before Deployment
- [ ] Migrations tested locally
- [ ] `up()` and `down()` methods work correctly
- [ ] No data loss in migrations
- [ ] Database backup created
- [ ] Migration files committed to git

### After Deployment
- [ ] Migrations ran successfully (check logs)
- [ ] Application started without errors
- [ ] API endpoints working
- [ ] Database schema matches entities
- [ ] No migration errors in CloudWatch

## 🆘 Troubleshooting

### Migration failed on production
```bash
# 1. Check logs
aws logs tail /ecs/nestjs-app --follow | grep migration

# 2. Check migrations table
psql -h aurora-endpoint -U admin -d dbname -c "SELECT * FROM migrations;"

# 3. Rollback if needed
npm run migration:revert

# 4. Fix migration file
vim src/database/migrations/xxx.ts

# 5. Deploy again
```

### Migration already ran but table not created
```bash
# Check if migration record exists
SELECT * FROM migrations WHERE name = 'YourMigration';

# If exists but table not created, manually delete record
DELETE FROM migrations WHERE name = 'YourMigration';

# Run migration again
npm run migration:run
```

## 📖 Additional Resources

- [TypeORM Migrations Docs](https://typeorm.io/migrations)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- Full deployment guide: `AWS_DEPLOYMENT_GUIDE.md`
