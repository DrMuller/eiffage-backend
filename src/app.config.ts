import dotenv from 'dotenv';
import { z } from 'zod';

export function parseEnvString<T extends string>(envName: string, defaultValue?: T): T {
  const parser = defaultValue === undefined ? z.string() : z.string().default(defaultValue);
  return parser.parse(process.env[envName], { path: [`process.env.${envName}`] }) as T;
}

export function parseEnvNumber<T extends number>(envName: string, defaultValue?: number): T {
  const parser = defaultValue === undefined ? z.coerce.number() : z.coerce.number().default(defaultValue);
  return parser.parse(process.env[envName], { path: [`process.env.${envName}`] }) as T;
}

export function parseEnvEnum<U extends string, T extends Readonly<[U, ...U[]]>>(
  enumValues: T,
  envName: string,
  defaultValue?: T[number]
): T[number] {
  const parser = defaultValue === undefined ? z.enum(enumValues) : z.enum(enumValues).default(defaultValue as any);
  return parser.parse(process.env[envName], { path: [`process.env.${envName}`] }) as (typeof enumValues)[number];
}

dotenv.config();

export const serverPort = parseEnvNumber('PORT', 5000);

export default {
  timezone: parseEnvEnum(['UTC'], 'TZ'),
  serverPort,
  webapp: {
    resetUrl: parseEnvString('WEBAPP_RESET_URL'),
  },
  jwt: {
    secret: parseEnvString('JWT_SECRET'),
    accessTokenExp: parseEnvString('JWT_ACCESS_TOKEN_EXP', '30m'),
    refreshTokenExp: parseEnvString('JWT_REFRESH_TOKEN_EXP', '1y'),
    resetSecret: parseEnvString('JWT_SECRET_RESET'),
    resetTokenExp: parseEnvString('JWT_RESET_TOKEN_EXP', '1h'),
  },
  mongo: {
    url: parseEnvString('MONGODB_ADDON_URI'),
    database: parseEnvString('MONGODB_ADDON_DB'),
  },
  brevo: {
    apiKey: parseEnvString('BREVO_API_KEY'),
    senderName: parseEnvString('BREVO_SENDER_NAME', 'MyApp'),
    senderEmail: parseEnvString('BREVO_SENDER_EMAIL', 'noreply@myapp.com'),
    templates: {
      passwordReset: parseEnvNumber('BREVO_TEMPLATE_PASSWORD_RESET', 1),
    }
  },
} as const;
