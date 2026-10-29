import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://backtobaseevents.vercel.app',
  JWT_SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'backtobase-mega-event-super-secret-key-change-in-prod',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || '-admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '-admin@backtobase',
  VOLUNTEER_USERNAME: process.env.VOLUNTEER_USERNAME || 'volunteer',
  VOLUNTEER_PASSWORD: process.env.VOLUNTEER_PASSWORD || 'BackToBase2026!Scan',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'BacktoBase Tickets <tickets@backtobase.com>',
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || 'https://backtobaseevents.vercel.app',
};
