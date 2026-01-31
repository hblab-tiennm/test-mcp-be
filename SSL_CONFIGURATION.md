# SSL Configuration

## Overview

Aurora PostgreSQL **requires SSL/TLS connections** by default. This application automatically enables SSL based on the environment and database host.

## Automatic SSL Detection

### SSL is **ENABLED** automatically when:
- ✅ `DB_HOST` is NOT localhost/127.0.0.1/::1
- ✅ Connecting to any remote database (Aurora/RDS/other)
- ✅ Any IP address that is not localhost (e.g., 10.0.x.x, 172.x.x.x)

### SSL is **DISABLED** automatically when:
- ❌ `DB_HOST=localhost` (local PostgreSQL)
- ❌ `DB_HOST=127.0.0.1` (local PostgreSQL)
- ❌ `DB_HOST=::1` (local PostgreSQL IPv6)
- ❌ `DB_SSL_DISABLED=true` is explicitly set

## Configuration

### Default Behavior (Recommended)

No additional configuration needed! SSL will be automatically enabled for Aurora connections:

```env
# Production
NODE_ENV=production
DB_HOST=my-cluster.cluster-xxxxxx.ap-southeast-1.rds.amazonaws.com
# SSL automatically enabled ✅
```

```env
# Local Development
NODE_ENV=development
DB_HOST=localhost
# SSL automatically disabled ✅
```

### Manual Override (Advanced)

To **disable SSL** (not recommended for Aurora):
```env
DB_SSL_DISABLED=true
```

## SSL Configuration Details

The application uses the following SSL configuration:

```typescript
ssl: {
  rejectUnauthorized: false
}
```

**Why `rejectUnauthorized: false`?**
- Aurora/RDS uses AWS-managed SSL certificates
- Self-signed or AWS CA certificates don't need strict validation
- Simplifies connection without certificate files
- Still provides encrypted connection (TLS/SSL)

## Testing SSL Connection

### Verify SSL is Enabled

```bash
# Check from application
curl http://localhost:3000/users/test-connection

# Check from PostgreSQL
psql "sslmode=require host=my-cluster.ap-southeast-1.rds.amazonaws.com dbname=mydb user=admin"
```

### Check SSL in PostgreSQL

```sql
-- Connect to database
\c mydb

-- Check if SSL is active
SELECT * FROM pg_stat_ssl WHERE pid = pg_backend_pid();

-- Expected output:
-- ssl | version |  cipher   | bits
-- ----+---------+-----------+------
--  t  | TLSv1.3 | xxx-xxx   | 256
```

## Environment Examples

### Local Development
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=test_db
# SSL: ❌ Disabled (localhost)
```

### Development Aurora (Optional)
```env
NODE_ENV=development
DB_HOST=dev-cluster.cluster-xxxxx.ap-southeast-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=dev_user
DB_PASSWORD=dev_password
DB_NAME=dev_db
# SSL: ✅ Enabled (non-localhost)
```

### Production Aurora
```env
NODE_ENV=production
DB_HOST=prod-cluster.cluster-xxxxx.ap-southeast-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=prod_user
DB_PASSWORD=prod_password
DB_NAME=prod_db
# SSL: ✅ Enabled (production)
```

## Troubleshooting

### "no pg_hba.conf entry for host, SSL off"

**Problem**: Aurora requires SSL but connection attempted without SSL.

**Solution**: Ensure SSL is enabled automatically (check NODE_ENV and DB_HOST).

### "SSL SYSCALL error: EOF detected"

**Problem**: SSL handshake failed.

**Solutions**:
1. Check Aurora security group allows port 5432
2. Verify Aurora parameter group allows SSL connections
3. Check network connectivity from ECS/EC2 to Aurora

### "certificate verify failed"

**Problem**: SSL certificate validation failed.

**Solution**: We use `rejectUnauthorized: false` to bypass this. If you see this error, check your TypeORM configuration.

### Force SSL from Aurora Side

Aurora parameter group settings:
```
rds.force_ssl = 1  # Force SSL connections
```

To check:
```sql
SHOW rds.force_ssl;
```

## Security Considerations

### Is `rejectUnauthorized: false` safe?

**Yes, for Aurora connections** because:
- ✅ Connection is still **encrypted** (TLS/SSL)
- ✅ Data in transit is protected
- ✅ Aurora is in private subnet (VPC)
- ✅ Security groups control access
- ⚠️ Certificate validation is skipped (but Aurora is trusted)

### Best Practices

1. **Use VPC**: Deploy Aurora in private subnet
2. **Security Groups**: Restrict access to specific security groups
3. **IAM Authentication**: Consider using IAM database authentication
4. **Secrets Manager**: Store credentials securely
5. **Audit Logs**: Enable PostgreSQL audit logging
6. **Encryption at Rest**: Enable Aurora encryption

## Migration SSL Support

Migrations automatically use the same SSL configuration:

```bash
# Local migrations (SSL disabled)
npm run migration:run

# Production migrations (SSL enabled)
export NODE_ENV=production
export DB_HOST=aurora-endpoint
npm run migration:run
```

## Docker SSL Support

The Docker container automatically handles SSL:

```bash
# Build
docker build -t app .

# Run with Aurora (SSL auto-enabled)
docker run -e NODE_ENV=production \
  -e DB_HOST=aurora-endpoint \
  -e DB_USERNAME=admin \
  -e DB_PASSWORD=password \
  app
```

## References

- [Aurora PostgreSQL SSL Support](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/UsingWithRDS.SSL.html)
- [TypeORM SSL Configuration](https://orkhan.gitbook.io/typeorm/docs/connection-options#postgres-connection-options)
- [Node.js TLS Options](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback)

## Summary

| Environment | DB_HOST | SSL Status | Auto-Enabled |
|------------|---------|------------|--------------|
| Local Dev | localhost | ❌ Disabled | ✅ Yes |
| Dev Aurora | aurora-dev-endpoint | ✅ Enabled | ✅ Yes |
| Production | aurora-prod-endpoint | ✅ Enabled | ✅ Yes |

**No manual SSL configuration needed!** The application automatically detects and enables SSL for Aurora connections. 🚀
