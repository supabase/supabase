import { t, nt, ot } from "../shared/test.js"; // eslint-disable-line
import { PrismaClient } from "@prisma/client";

const databaseUrl = `postgres://${encodeURIComponent(process.env.PGUSER)}:${encodeURIComponent(process.env.PGPASS)}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=disable`;

// Set the DATABASE_URL environment variable for Prisma
process.env.DATABASE_URL = databaseUrl;

const prisma = new PrismaClient();

t("Connect, run simple query, disconnect", async () => {
  const result = await prisma.$queryRaw`SELECT 1 as one`;
  await prisma.$disconnect();
  return [1, result[0].one];
});

t("Connect, run prepared statement query, disconnect", async () => {
  const userId = 123;
  const userName = "test_user";
  const result = await prisma.$queryRaw`
    SELECT ${userId} as user_id, ${userName} as user_name,
           ${userId} + 1 as next_id
  `;
  await prisma.$disconnect();
  return [123n, result[0].user_id];
});

t("Concurrent prepared statements stress test", async () => {
  const connectionCount = 10;
  const processCount = process.env.MODE === "transaction" ? 200 : 10;

  // Create multiple Prisma clients to simulate multiple connections
  const clients = [];
  for (let i = 0; i < connectionCount; i++) {
    clients.push(new PrismaClient());
  }

  try {
    // Create concurrent operations that use prepared statements
    const operations = [];

    for (let i = 0; i < processCount; i++) {
      const client = clients[i % connectionCount];
      const operation = async () => {
        const param1 = Math.floor(Math.random() * 100);
        const param2 = `test_${i}`;

        // First execution with one set of parameters
        await client.$queryRaw`
          SELECT ${param1} as id, ${param2} as name,
                 ${param1} * 2 as double_id,
                 CASE WHEN ${param1} > 50 THEN 'high' ELSE 'low' END as category
        `;

        // Second execution with different parameters
        const newParam1 = param1 + 10;
        const newParam2 = `${param2}_updated`;

        await client.$queryRaw`
          SELECT ${newParam1} as id, ${newParam2} as name,
                 ${newParam1} * 2 as double_id,
                 CASE WHEN ${newParam1} > 50 THEN 'high' ELSE 'low' END as category
        `;

        return { success: true, operation: i };
      };

      operations.push(operation());
    }

    // Execute all operations concurrently
    const results = await Promise.all(operations);

    // Verify all operations succeeded
    const successCount = results.filter((r) => r.success).length;

    return [processCount, successCount];
  } finally {
    // Clean up all clients
    await Promise.all(clients.map((client) => client.$disconnect()));
  }
});
