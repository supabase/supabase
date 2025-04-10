import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'

// Initialize PostgreSQL client
const getDbClient = () => {
  console.log('Initializing DB client')
  const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  console.log('Using connection string:', connectionString)
  return new Pool({ connectionString })
}

// Helper to generate random content
const generateRandomMessage = () => {
  const messages = [
    'Just checking in on the project status',
    'Has anyone seen the latest design mockups?',
    'I need help with the API integration',
    'Can someone review my PR please?',
    'The deployment is failing, need assistance',
    'Meeting in 10 minutes',
    'Great job on the presentation today!',
    "Who's handling the client meeting tomorrow?",
    'Do we have the updated requirements document?',
    'The new feature is now live in testing',
    "I'll be out of office tomorrow",
    'Can we discuss the roadmap for Q3?',
    'Has anyone tested this on mobile yet?',
    'The database migration failed in staging',
    'Should we reschedule the standup?',
    "Reminder: Don't forget to log your hours",
    "I'm stuck on this authentication issue",
    'Hey everyone, welcome our new team member!',
    'Who has access to the analytics dashboard?',
    'The performance metrics look great this month',
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

// Get random channel ID (1 or 2)
const getRandomChannelId = () => {
  return Math.random() < 0.5 ? 1 : 2
}

// List all tables in database
const listTables = async (client: Pool) => {
  try {
    console.log('Listing tables in database...')

    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    return {
      success: true,
      tables: result.rows,
    }
  } catch (error) {
    console.error('Error listing tables:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Read messages with pagination
const readMessages = async (client: Pool, limit = 10, offset = 0, channelId?: number) => {
  try {
    console.log(
      `Reading messages (limit=${limit}, offset=${offset}, channelId=${channelId || 'all'})`
    )

    let query = `
      SELECT m.id, m.message, m.inserted_at, m.user_id, m.channel_id
      FROM messages m
    `

    const params = []
    if (channelId) {
      query += ` WHERE m.channel_id = $1`
      params.push(channelId)
    }

    query += `
      ORDER BY m.inserted_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    params.push(limit, offset)

    const result = await client.query(query, params)

    return {
      success: true,
      count: result.rowCount,
      messages: result.rows,
      pagination: {
        limit,
        offset,
        hasMore: result.rowCount === limit,
      },
    }
  } catch (error) {
    console.error('Error reading messages:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Count total messages
const countMessages = async (client: Pool, channelId?: number) => {
  try {
    let query = 'SELECT COUNT(*) FROM messages'
    const params = []

    if (channelId) {
      query += ' WHERE channel_id = $1'
      params.push(channelId)
    }

    const result = await client.query(query, params)

    return {
      success: true,
      count: parseInt(result.rows[0].count),
    }
  } catch (error) {
    console.error('Error counting messages:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Insert a single message
const insertMessage = async (client: Pool, message: string, channelId?: number) => {
  try {
    // Using specific values provided by user
    const userId = '8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e'
    const channel = channelId || getRandomChannelId()

    const result = await client.query(
      'INSERT INTO messages (message, user_id, channel_id) VALUES ($1, $2, $3) RETURNING id',
      [message, userId, channel]
    )

    return {
      success: true,
      id: result.rows[0]?.id,
      message,
      channelId: channel,
    }
  } catch (error) {
    console.error('Error inserting message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Insert multiple messages - modified to use individual INSERT statements
const insertMultipleMessages = async (client: Pool, count: number) => {
  console.log(`Inserting ${count} messages as individual statements`)
  const userId = '8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e'
  const successfulInserts = []

  try {
    // Execute individual INSERT statements instead of batch operation
    for (let i = 0; i < count; i++) {
      const message = generateRandomMessage()
      const channelId = getRandomChannelId()

      // Execute a separate SQL statement for each message
      const result = await client.query(
        'INSERT INTO messages (message, user_id, channel_id) VALUES ($1, $2, $3) RETURNING id',
        [message, userId, channelId]
      )

      if (result.rows && result.rows.length > 0) {
        successfulInserts.push(result.rows[0].id)
      }
    }

    return {
      success: true,
      count: successfulInserts.length,
      ids: successfulInserts,
    }
  } catch (error) {
    console.error('Error inserting multiple messages:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Run a load test with multiple batches in parallel
const runLoadTest = async (client: Pool, totalMessages: number, batchSize: number) => {
  console.log(`Starting load test: ${totalMessages} total messages in batches of ${batchSize}`)

  const startTime = Date.now()
  const batches = Math.ceil(totalMessages / batchSize)
  const batchPromises = []
  const results = {
    totalRequested: totalMessages,
    batchSize,
    batches,
    successfulInserts: 0,
    errors: 0,
    startTime: new Date().toISOString(),
    endTime: '',
    durationMs: 0,
    messagesPerSecond: 0,
  }

  // Run batches in parallel
  for (let i = 0; i < batches; i++) {
    const remainingMessages = totalMessages - i * batchSize
    const currentBatchSize = Math.min(batchSize, remainingMessages)

    console.log(`Starting batch ${i + 1}/${batches} with ${currentBatchSize} messages`)

    // Add each batch promise to our array
    batchPromises.push(
      insertMultipleMessages(client, currentBatchSize).then((result) => {
        if (result.success) {
          console.log(`Batch ${i + 1} completed: inserted ${result.count || 0} messages`)
          results.successfulInserts += result.count || 0
        } else {
          console.error(`Batch ${i + 1} failed: ${result.error}`)
          results.errors++
        }
        return result
      })
    )
  }

  // Wait for all batches to complete
  await Promise.all(batchPromises)

  // Calculate performance metrics
  const endTime = Date.now()
  results.durationMs = endTime - startTime
  results.endTime = new Date(endTime).toISOString()
  results.messagesPerSecond = Math.round((results.successfulInserts / results.durationMs) * 1000)

  console.log(`Load test completed in ${results.durationMs}ms`)
  console.log(`Successfully inserted ${results.successfulInserts} messages`)
  console.log(`Performance: ${results.messagesPerSecond} messages per second`)

  return results
}

// Run a comprehensive test (writes + reads)
const runComprehensiveTest = async (client: Pool) => {
  console.log('Starting comprehensive test (writes + reads)')
  const startTime = Date.now()

  // Define proper type for operations array
  type OperationResult = {
    type: string
    result: any
    durationMs: number
    count?: number
  }

  const results = {
    operations: [] as OperationResult[],
    summary: {
      totalOperations: 0,
      reads: 0,
      writes: 0,
      startTime: new Date().toISOString(),
      endTime: '',
      durationMs: 0,
    },
  }

  try {
    // 1. Count existing messages
    const initialCount = await countMessages(client)
    results.operations.push({
      type: 'count',
      result: initialCount,
      durationMs: Date.now() - startTime,
    })
    results.summary.reads++
    results.summary.totalOperations++

    // 2. Insert a batch of 500 messages
    const insertResult = await insertMultipleMessages(client, 500)
    results.operations.push({
      type: 'bulk_insert',
      count: 500,
      result: insertResult,
      durationMs: Date.now() - startTime,
    })
    results.summary.writes++
    results.summary.totalOperations++

    // 3. Read latest 20 messages
    const latestMessages = await readMessages(client, 20, 0)
    results.operations.push({
      type: 'read_latest',
      result: latestMessages,
      durationMs: Date.now() - startTime,
    })
    results.summary.reads++
    results.summary.totalOperations++

    // 4. Read messages from channel 1
    const channel1Messages = await readMessages(client, 15, 0, 1)
    results.operations.push({
      type: 'read_channel_1',
      result: channel1Messages,
      durationMs: Date.now() - startTime,
    })
    results.summary.reads++
    results.summary.totalOperations++

    // 5. Read messages from channel 2
    const channel2Messages = await readMessages(client, 15, 0, 2)
    results.operations.push({
      type: 'read_channel_2',
      result: channel2Messages,
      durationMs: Date.now() - startTime,
    })
    results.summary.reads++
    results.summary.totalOperations++

    // 6. Insert another 500 messages
    const insertResult2 = await insertMultipleMessages(client, 500)
    results.operations.push({
      type: 'bulk_insert',
      count: 500,
      result: insertResult2,
      durationMs: Date.now() - startTime,
    })
    results.summary.writes++
    results.summary.totalOperations++

    // 7. Count final messages
    const finalCount = await countMessages(client)
    results.operations.push({
      type: 'count',
      result: finalCount,
      durationMs: Date.now() - startTime,
    })
    results.summary.reads++
    results.summary.totalOperations++

    // Calculate final metrics
    const endTime = Date.now()
    results.summary.durationMs = endTime - startTime
    results.summary.endTime = new Date(endTime).toISOString()

    console.log(`Comprehensive test completed in ${results.summary.durationMs}ms`)
    console.log(`Total operations: ${results.summary.totalOperations}`)

    return results
  } catch (error) {
    console.error('Error in comprehensive test:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Run an extreme load test with massive writes and reads
const runExtremeLoadTest = async (client: Pool) => {
  console.log('Starting EXTREME load test with massive writes and reads - 500 ITERATIONS')
  const startTime = Date.now()

  const results = {
    operations: [],
    inserts: {
      totalInserted: 0,
      batches: 0,
    },
    reads: {
      totalRead: 0,
      queries: 0,
    },
    maps: {
      processingRuns: 0,
      itemsProcessed: 0,
    },
    iterations: {
      total: 1000,
      completed: 0,
      failed: 0,
    },
    timing: {
      startTime: new Date().toISOString(),
      endTime: '',
      totalDurationMs: 0,
      insertDurationMs: 0,
      readDurationMs: 0,
      mapDurationMs: 0,
    },
  }

  try {
    // Initial count
    const initialCount = await countMessages(client)
    console.log(
      `Starting with ${initialCount.success ? initialCount.count || 0 : 0} messages in the database`
    )

    // Run the massive test with 2000 iterations instead of 1000
    const totalIterations = 2000
    console.log(`Running ${totalIterations} iterations of load test`)

    for (let iteration = 0; iteration < totalIterations; iteration++) {
      // Log progress every 10 iterations
      if (iteration % 10 === 0) {
        console.log(`Starting iteration ${iteration + 1}/${totalIterations}`)
        console.log(`  - Current progress: inserted ${results.inserts.totalInserted} messages`)
        console.log(`  - Current progress: read ${results.reads.totalRead} messages`)
        console.log(`  - Current progress: processed ${results.maps.itemsProcessed} items`)
      }

      try {
        // PHASE 1: INSERTS - Even smaller number of inserts per iteration (5 instead of 20)
        const batchSize = 5
        const result = await insertMultipleMessages(client, batchSize)
        if (result.success) {
          results.inserts.totalInserted += result.count || 0
          results.inserts.batches++
        }

        // PHASE 2: READS - Do multiple read operations per iteration
        // Choose several random read operations
        const readCount = Math.floor(Math.random() * 6) + 10 // 10-15 read operations per iteration

        for (let r = 0; r < readCount; r++) {
          const readTypes = [
            // Massively increase the limits to read thousands of rows
            { limit: 2000, offset: Math.floor(Math.random() * 1000) },
            { limit: 3000, offset: Math.floor(Math.random() * 500) },
            { limit: 5000, offset: Math.floor(Math.random() * 200) },
            // Channel-specific queries with larger limits
            { limit: 1500, offset: Math.floor(Math.random() * 100), channel: 1 },
            { limit: 1500, offset: Math.floor(Math.random() * 100), channel: 2 },
            // Complex queries with larger limits
            { limit: 2500, offset: 0, orderBy: 'inserted_at DESC' },
            { limit: 3000, offset: 10, orderBy: 'id ASC' },
            { limit: 4000, offset: 5, orderBy: 'channel_id, inserted_at DESC' },
          ]

          const randomReadType = readTypes[Math.floor(Math.random() * readTypes.length)]

          let readResult
          if (randomReadType.orderBy) {
            // Custom query with ordering
            const query = `
              SELECT id, message, inserted_at, user_id, channel_id
              FROM messages
              ORDER BY ${randomReadType.orderBy}
              LIMIT $1 OFFSET $2
            `
            readResult = await client
              .query(query, [randomReadType.limit, randomReadType.offset])
              .then((result) => ({
                success: true,
                count: result.rowCount,
                messages: result.rows,
              }))
              .catch((error) => ({
                success: false,
                error: error.message,
              }))
          } else {
            // Standard read
            readResult = await readMessages(
              client,
              randomReadType.limit,
              randomReadType.offset,
              randomReadType.channel
            )
          }

          if (readResult.success) {
            // Only access count if it exists (for typechecking)
            const readCount = 'count' in readResult ? readResult.count || 0 : 0
            results.reads.totalRead += readCount
            results.reads.queries++
          }
        }

        // Add additional complex queries more frequently
        if (iteration % 5 === 0) {
          // Run every 5 iterations instead of 20
          // Count per channel
          const channelCountQuery = `
            SELECT channel_id, COUNT(*) 
            FROM messages 
            GROUP BY channel_id
          `
          await client.query(channelCountQuery)
          results.reads.queries++

          // Get message stats
          const statsQuery = `
            SELECT 
              COUNT(*) as total_count,
              MIN(inserted_at) as oldest,
              MAX(inserted_at) as newest,
              COUNT(DISTINCT user_id) as unique_users,
              COUNT(DISTINCT channel_id) as unique_channels
            FROM messages
          `
          await client.query(statsQuery)
          results.reads.queries++

          // Add more complex aggregate queries
          const additionalQueries = [
            `SELECT user_id, COUNT(*) FROM messages GROUP BY user_id ORDER BY COUNT(*) DESC LIMIT 1000`,
            `SELECT DATE_TRUNC('day', inserted_at) as day, COUNT(*) FROM messages GROUP BY day ORDER BY day DESC LIMIT 1500`,
            `SELECT channel_id, AVG(LENGTH(message)) as avg_length FROM messages GROUP BY channel_id`,
            `SELECT id, message, inserted_at FROM messages WHERE inserted_at > (NOW() - INTERVAL '1 hour') ORDER BY inserted_at DESC LIMIT 5000`,
            `SELECT id, channel_id, message FROM messages ORDER BY id DESC LIMIT 7500 OFFSET ${Math.floor(Math.random() * 200)}`,
          ]

          // Execute additional queries
          for (const query of additionalQueries) {
            await client.query(query)
            results.reads.queries++
          }
        }

        // PHASE 3: MAPPING - Process a much larger batch of messages
        // Get a random offset to start reading from
        const randomOffset = Math.floor(
          Math.random() *
            (initialCount.success ? initialCount.count || 0 : 0 + iteration * batchSize)
        )
        const mapBatchSize = 1000 // Massively increased from 5

        // Read a small batch of messages
        const messages = await readMessages(client, mapBatchSize, randomOffset)

        if (messages.success && messages.messages) {
          // Process each message - just count words as a simple operation
          const wordCounts = messages.messages.map((msg) => {
            const text = msg.message || ''
            return {
              id: msg.id,
              channel: msg.channel_id,
              wordCount: text.split(/\s+/).length,
              charCount: text.length,
            }
          })

          results.maps.itemsProcessed += wordCounts.length
          results.maps.processingRuns++
        }

        // Occasionally perform a full table scan to really stress the read operations
        if (iteration % 50 === 0) {
          console.log(`Iteration ${iteration}: Performing full table scan in chunks`)

          // Get total count
          const countResult = await countMessages(client)
          const totalMessages = countResult.success ? countResult.count || 0 : 0

          if (totalMessages > 0) {
            // Read the entire table in chunks of 5000
            const chunkSize = 5000
            const chunks = Math.ceil(totalMessages / chunkSize)

            for (let chunk = 0; chunk < chunks; chunk++) {
              const query = `
                SELECT * FROM messages 
                ORDER BY id ASC
                LIMIT ${chunkSize} OFFSET ${chunk * chunkSize}
              `
              const result = await client.query(query)

              // Update metrics
              results.reads.totalRead += result.rowCount || 0
              results.reads.queries++

              console.log(`  - Read chunk ${chunk + 1}/${chunks}: ${result.rowCount || 0} messages`)
            }

            console.log(
              `  - Completed full table scan: read ${totalMessages} messages in ${chunks} chunks`
            )
          }
        }
      } catch (error) {
        console.error('Error in iteration:', error)
        results.iterations.failed++
      }
    }

    // Calculate final metrics
    const endTime = Date.now()
    results.timing.totalDurationMs = endTime - startTime
    results.timing.endTime = new Date(endTime).toISOString()

    console.log(`EXTREME load test completed in ${results.timing.totalDurationMs}ms`)
    console.log(`Total operations: ${results.operations.length}`)

    return results
  } catch (error) {
    console.error('Error in EXTREME load test:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const client = getDbClient()
  try {
    // SCHEMA INFO
    if (req.query.list === 'true') {
      const tables = await listTables(client)
      return res.status(200).json(tables)
    }

    // EXTREME LOAD TEST
    else if (req.query.extreme === 'true') {
      // Set some headers to ensure the connection stays open during long operation
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Content-Type', 'application/json')

      const result = await runExtremeLoadTest(client)

      // Prepare a more concise summary for large result sets
      const summary = {
        status: 'success',
      }

      // Handle both success and error cases
      if ('error' in result) {
        // Error case
        summary.status = 'error'
        return res.status(500).json({
          ...summary,
          error: result.error,
          // Use empty fallback values since partial_results might not exist
          partial_results: {
            iterations: { completed: 0, failed: 0 },
            inserts: { totalInserted: 0, batches: 0 },
            reads: { totalRead: 0, queries: 0 },
            maps: { processingRuns: 0, itemsProcessed: 0 },
            timing: { totalDurationMs: 0 },
          },
        })
      } else {
        // Success case
        return res.status(200).json({
          ...summary,
          iterations: result.iterations,
          inserts: {
            totalMessages: result.inserts.totalInserted,
            batches: result.inserts.batches,
          },
          reads: {
            totalMessages: result.reads.totalRead,
            queries: result.reads.queries,
          },
          maps: {
            runs: result.maps.processingRuns,
            itemsProcessed: result.maps.itemsProcessed,
          },
          timing: {
            totalDurationMs: result.timing.totalDurationMs,
            startTime: result.timing.startTime,
            endTime: result.timing.endTime,
          },
        })
      }
    }

    // READ OPERATIONS
    else if (req.query.read === 'true') {
      const limit = parseInt(req.query.limit as string) || 10
      const offset = parseInt(req.query.offset as string) || 0
      const channelId = req.query.channel ? parseInt(req.query.channel as string) : undefined

      const result = await readMessages(client, limit, offset, channelId)
      return res.status(200).json(result)
    } else if (req.query.count === 'true') {
      const channelId = req.query.channel ? parseInt(req.query.channel as string) : undefined
      const result = await countMessages(client, channelId)
      return res.status(200).json(result)
    }

    // WRITE OPERATIONS
    else if (req.query.bulk === 'true') {
      const count = parseInt(req.query.count as string) || 10
      const result = await insertMultipleMessages(client, Math.min(count, 1000))
      return res.status(200).json(result)
    } else if (req.query.loadtest === 'true') {
      const totalMessages = parseInt(req.query.total as string) || 1000
      const batchSize = parseInt(req.query.batchSize as string) || 100

      // Cap at reasonable values to prevent server overload
      const cappedTotal = Math.min(totalMessages, 10000)
      const cappedBatchSize = Math.min(batchSize, 500)

      const result = await runLoadTest(client, cappedTotal, cappedBatchSize)
      return res.status(200).json(result)
    }

    // COMPREHENSIVE TEST
    else if (req.query.comprehensive === 'true') {
      const result = await runComprehensiveTest(client)
      return res.status(200).json(result)
    }

    // DEFAULT - INSERT SINGLE MESSAGE
    else {
      const message = req.body?.message || 'Test message ' + new Date().toISOString()
      const channelId =
        req.body?.channelId || req.query.channel ? parseInt(req.query.channel as string) : undefined

      const result = await insertMessage(client, message, channelId)
      return res.status(200).json(result)
    }
  } catch (error: any) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  } finally {
    await client.end()
  }
}
