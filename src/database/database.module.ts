import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        const dbHost = configService.get<string>('DB_HOST', 'localhost');

        // Enable SSL for Aurora/RDS connections
        // Disable only for localhost or 127.0.0.1 (local dev)
        const disableSsl =
          configService.get<string>('DB_SSL_DISABLED') === 'true';
        const isLocalhost =
          dbHost === 'localhost' ||
          dbHost === '127.0.0.1' ||
          dbHost === '::1';
        const enableSsl = !isLocalhost && !disableSsl;

        return {
          type: 'postgres',
          host: dbHost,
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'test_db'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: !isProduction, // Auto-create tables in dev, NEVER in production!
          logging: !isProduction, // Log SQL queries in development
          ssl: enableSsl ? { rejectUnauthorized: false } : false, // SSL for Aurora/RDS
        };
      },
    }),
  ],
})
export class DatabaseModule {}
