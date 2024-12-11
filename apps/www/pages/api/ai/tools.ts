import { tool } from 'ai'
import { z } from 'zod'

// Define the service schema
const ServiceSchema = z.object({
  name: z.enum(['Auth', 'Storage', 'Database', 'Edge Function', 'Cron', 'Queues', 'Vector']),
  reason: z.string().describe("The reason why this service is needed for the user's use case"),
})

export const getTools = () => {
  return {
    executeSql: tool({
      description: 'Save the generated database schema definition',
      parameters: z.object({
        sql: z.string().describe('The SQL schema definition'),
      }),
    }),

    setServices: tool({
      description:
        'Set the entire list of Supabase services needed for the project. Always include the full list',
      parameters: z.object({
        services: z
          .array(ServiceSchema)
          .describe('Array of services with reasons why they are needed'),
      }),
    }),

    setTitle: tool({
      description: "Set the project title based on the user's description",
      parameters: z.object({
        title: z.string().describe('The project title'),
      }),
    }),

    saveUserInfo: tool({
      description: 'Save information about the user and their requirements',
      parameters: z.object({
        platform: z
          .enum(['NextJS', 'Vue', 'Vite', 'Swift', 'React Native'])
          .optional()
          .describe('The platform the user is building for'),
        userCount: z.number().optional().describe('Expected number of users'),
        industry: z.string().optional().describe('Industry or domain of the application'),
        region: z.string().optional().describe('Geographic region for deployment'),
        scale: z.string().optional().describe('Expected scale of the application'),
      }),
    }),

    setDatabaseConfig: tool({
      description: 'Save database configuration details',
      parameters: z.object({
        region: z.string().describe('The region where the database will be deployed'),
        postgresVersion: z.string().describe('The version of Postgres to use'),
        computeSize: z.string().optional().describe('The compute instance size'),
        storageSize: z.number().optional().describe('The storage size in GB'),
        highAvailability: z.boolean().optional().describe('Whether to enable high availability'),
      }),
    }),
  }
}
