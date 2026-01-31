# AWS Deployment & Testing Guide

## 🚀 Tổng quan

Khi deploy lên AWS production, bạn PHẢI:
1. ✅ Sử dụng **Migrations** (KHÔNG dùng `synchronize: true`)
2. ✅ Lưu credentials trong **AWS Secrets Manager**
3. ✅ Bật **SSL** cho Aurora/RDS connections
4. ✅ Chạy migrations trước khi start application

## 📋 Các bước deploy lên AWS

### Bước 1: Setup AWS Aurora PostgreSQL

```bash
# Tạo Aurora PostgreSQL cluster từ AWS Console hoặc CLI
aws rds create-db-cluster \
  --db-cluster-identifier my-aurora-cluster \
  --engine aurora-postgresql \
  --master-username admin \
  --master-user-password YourSecurePassword \
  --db-subnet-group-name my-subnet-group \
  --vpc-security-group-ids sg-xxxxxxxx
```

**Lưu ý:**
- Writer endpoint: `my-cluster.cluster-xxxxxx.<AWS_REGION>.rds.amazonaws.com`
- Reader endpoint: `my-cluster.cluster-ro-xxxxxx.<AWS_REGION>.rds.amazonaws.com`

### Bước 2: Lưu Database Credentials vào Secrets Manager

```bash
# Tạo secret
aws secretsmanager create-secret \
  --name prod/db/credentials \
  --description "Database credentials for production" \
  --secret-string '{
    "username": "admin",
    "password": "YourSecurePassword",
    "host": "my-cluster.cluster-xxxxxx.<AWS_REGION>.rds.amazonaws.com",
    "port": "5432",
    "database": "myapp_production"
  }' \
  --region <AWS_REGION>
```

### Bước 3: Build và Push Docker Image lên ECR

```bash
# Authenticate
aws ecr get-login-password --region <AWS_REGION> | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com

# Build
docker build -t <ECR_REPOSITORY_NAME> .

# Tag
docker tag <ECR_REPOSITORY_NAME>:latest \
  <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<ECR_REPOSITORY_NAME>:latest

# Push
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<ECR_REPOSITORY_NAME>:latest
```

### Bước 4: Tạo ECS Task Definition

**task-definition.json:**
```json
{
  "family": "nestjs-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "nestjs-app",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<ECR_REPOSITORY_NAME>:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DB_HOST",
          "valueFrom": "arn:aws:secretsmanager:<AWS_REGION>:<AWS_ACCOUNT_ID>:secret:prod/db/credentials:host::"
        },
        {
          "name": "DB_PORT",
          "valueFrom": "arn:aws:secretsmanager:<AWS_REGION>:<AWS_ACCOUNT_ID>:secret:prod/db/credentials:port::"
        },
        {
          "name": "DB_USERNAME",
          "valueFrom": "arn:aws:secretsmanager:<AWS_REGION>:<AWS_ACCOUNT_ID>:secret:prod/db/credentials:username::"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:<AWS_REGION>:<AWS_ACCOUNT_ID>:secret:prod/db/credentials:password::"
        },
        {
          "name": "DB_NAME",
          "valueFrom": "arn:aws:secretsmanager:<AWS_REGION>:<AWS_ACCOUNT_ID>:secret:prod/db/credentials:database::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nestjs-app",
          "awslogs-region": "<AWS_REGION>",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));\""
        ],
        "interval": 30,
        "timeout": 3,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Bước 5: Tạo ECS Service

```bash
# Đăng ký task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Tạo service
aws ecs create-service \
  --cluster my-cluster \
  --service-name nestjs-service \
  --task-definition nestjs-app \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={
    subnets=[subnet-xxxxx,subnet-yyyyy],
    securityGroups=[sg-xxxxx],
    assignPublicIp=ENABLED
  }" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=nestjs-app,containerPort=3000"
```

## 🧪 Testing trên AWS

### 1. Test Database Connection

```bash
# Lấy public IP của task từ ECS Console hoặc:
TASK_IP=$(aws ecs describe-tasks \
  --cluster my-cluster \
  --tasks task-id \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text)

# Test connection endpoint
curl http://$TASK_IP:3000/users/test-connection

# Hoặc qua Load Balancer
curl https://your-alb-endpoint.amazonaws.com/users/test-connection
```

**Expected Response:**
```json
{
  "message": "Database connected successfully! Found 0 users.",
  "connected": true
}
```

### 2. Test Health Check

```bash
curl http://$TASK_IP:3000/

# Hoặc kiểm tra từ ECS Console
aws ecs describe-tasks \
  --cluster my-cluster \
  --tasks task-id \
  --query 'tasks[0].healthStatus'
```

### 3. Test CRUD Operations

```bash
# Tạo user
curl -X POST https://your-alb-endpoint.amazonaws.com/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'

# Lấy tất cả users
curl https://your-alb-endpoint.amazonaws.com/users

# API Documentation (Swagger)
curl https://your-alb-endpoint.amazonaws.com/api
```

### 4. Kiểm tra Logs

```bash
# CloudWatch Logs
aws logs tail /ecs/nestjs-app --follow

# Xem migrations logs
aws logs filter-log-events \
  --log-group-name /ecs/nestjs-app \
  --filter-pattern "migration"
```

### 5. Kiểm tra Migrations đã chạy

```bash
# Connect vào database
psql -h my-cluster.cluster-xxxxxx.<AWS_REGION>.rds.amazonaws.com \
     -U admin \
     -d myapp_production \
     -c "SELECT * FROM migrations;"

# Hoặc exec vào container
aws ecs execute-command \
  --cluster my-cluster \
  --task task-id \
  --container nestjs-app \
  --interactive \
  --command "/bin/sh"

# Trong container
node dist/database/data-source.js migration:show
```

## 🔄 Chạy Migrations Manually (Nếu cần)

### Option 1: Từ Local (Recommended)

```bash
# Set environment variables
export DB_HOST=my-cluster.cluster-xxxxxx.<AWS_REGION>.rds.amazonaws.com
export DB_PORT=5432
export DB_USERNAME=admin
export DB_PASSWORD=YourSecurePassword
export DB_NAME=myapp_production
export NODE_ENV=production
# Note: SSL is automatically enabled for production and Aurora endpoints

# Chạy migrations
npm run migration:run

# Xem migrations status
npm run migration:show
```

### Option 2: Từ ECS Task (One-off)

```bash
# Chạy task một lần để migrate
aws ecs run-task \
  --cluster my-cluster \
  --task-definition nestjs-app \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={...}" \
  --overrides '{
    "containerOverrides": [{
      "name": "nestjs-app",
      "command": ["node", "dist/database/data-source.js", "migration:run"]
    }]
  }'
```

### Option 3: Từ Bastion Host

```bash
# SSH vào bastion host
ssh -i key.pem ec2-user@bastion-ip

# Clone repo và setup
git clone your-repo
cd your-repo
npm install

# Set env vars và chạy migrations
export DB_HOST=...
npm run migration:run
```

## 📊 Monitoring & Troubleshooting

### Kiểm tra Task Status

```bash
# Task health
aws ecs describe-tasks --cluster my-cluster --tasks task-id

# Service events
aws ecs describe-services --cluster my-cluster --services nestjs-service

# Container insights
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=nestjs-service \
  --start-time 2026-01-31T00:00:00Z \
  --end-time 2026-01-31T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### Common Issues

1. **Migration fails:**
   - Check CloudWatch logs: `/ecs/nestjs-app`
   - Verify database connectivity from ECS subnet
   - Check security group allows port 5432

2. **Connection timeout:**
   - Check VPC security groups
   - Verify Aurora is in same VPC as ECS
   - Enable SSL: `DB_SSL_ENABLED=true`

3. **Secrets not loading:**
   - Check ECS Task Role has `secretsmanager:GetSecretValue` permission
   - Verify secret ARN in task definition

## 🔐 IAM Permissions Required

### ECS Task Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

### ECS Task Role (cho migrations)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": "*"
    }
  ]
}
```

## 📝 Best Practices

1. **Always use migrations** - Never `synchronize: true` in production
2. **Test migrations locally first** - Before running on production
3. **Backup database** - Before running migrations on production
4. **Use read replicas** - For read-heavy operations
5. **Monitor CloudWatch** - Set up alarms for errors
6. **Use Parameter Store** - For non-sensitive configs
7. **Enable slow query logs** - For performance monitoring
8. **Use connection pooling** - TypeORM has built-in support

## 🎯 Quick Test Checklist

- [ ] Database connection successful
- [ ] Health check returning 200
- [ ] Migrations ran successfully
- [ ] Can create user via API
- [ ] Can read users via API
- [ ] Swagger UI accessible
- [ ] CloudWatch logs visible
- [ ] No errors in application logs
- [ ] SSL connection to Aurora working
- [ ] Secrets Manager credentials loading

## 🔗 Useful Links

- [ECS Console](https://console.aws.amazon.com/ecs)
- [RDS Console](https://console.aws.amazon.com/rds)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home#logsV2:)
- [Secrets Manager](https://console.aws.amazon.com/secretsmanager)
