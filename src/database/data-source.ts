import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

const dbHost = process.env.DB_HOST || 'localhost';
const isProduction = process.env.NODE_ENV === 'production';

// Enable SSL for production or when connecting to non-localhost (Aurora/RDS)
// Aurora requires SSL, so enable by default for remote connections
const disableSsl = process.env.DB_SSL_DISABLED === 'true';
const enableSsl = isProduction || (dbHost !== 'localhost' && !disableSsl);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'test_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  synchronize: false, // Always false - use migrations!
  logging: process.env.NODE_ENV === 'development',
  ssl: enableSsl ? { rejectUnauthorized: false } : false,
});
