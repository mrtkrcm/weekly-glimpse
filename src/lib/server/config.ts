import { z } from 'zod';

// Define a schema for the server configuration
const serverConfigSchema = z.object({
  socket: z.object({
    path: z.string().default('/socket.io/'),
    port: z.number().default(4174),
    host: z.string().default('localhost')
  }),
  auth: z.object({
    google: z.object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional()
    })
  }),
  database: z.object({
    url: z.string().url(),
    ssl: z.union([z.literal(false), z.object({ rejectUnauthorized: z.boolean() })]).default(false),
    logger: z.boolean().default(false)
  }),
  monitoring: z.object({
    sentry: z.object({
      dsn: z.string().optional()
    })
  }),
  env: z.object({
    mode: z.enum(['development', 'production', 'test']).default('development'),
    isDevelopment: z.boolean().default(false),
    isProduction: z.boolean().default(false),
    isTest: z.boolean().default(false)
  }),
  test: z.object({
    email: z.string().optional(),
    password: z.string().optional(),
    userId: z.string().optional()
  })
});

// Validate the server configuration against the schema
const rawServerConfig = {
  socket: {
    path: process.env['SOCKET_PATH'],
    port: Number(process.env['PORT']),
    host: process.env['HOST']
  },
  auth: {
    google: {
      clientId: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']
    }
  },
  database: {
    url: process.env['DATABASE_URL'],
    ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: true } : false,
    logger: process.env['NODE_ENV'] === 'development'
  },
  monitoring: {
    sentry: {
      dsn: process.env['SENTRY_DSN']
    }
  },
  env: {
    mode: process.env['NODE_ENV'],
    isDevelopment: process.env['NODE_ENV'] === 'development',
    isProduction: process.env['NODE_ENV'] === 'production',
    isTest: process.env['NODE_ENV'] === 'test'
  },
  test: {
    email: process.env['TEST_USER_EMAIL'],
    password: process.env['TEST_USER_PASSWORD'],
    userId: process.env['TEST_USER_ID']
  }
};

export const serverConfig = serverConfigSchema.parse(rawServerConfig);

export default serverConfig;
