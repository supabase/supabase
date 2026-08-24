import { useEffect, useMemo, useState } from 'react'
import { cn } from 'ui'
import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  CONNECTION_SOURCE_LOAD_BALANCER,
  type ConnectionStringMethod,
  type DatabaseConnectionType,
} from '@/components/interfaces/ConnectSheet/Connect.constants'
import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'
import { ConnectionParameters } from '@/components/interfaces/ConnectSheet/ConnectionParameters'
import {
  buildConnectionParameters,
  buildDotnetConnectionString,
  buildSafeConnectionString,
  parseConnectionParams,
  PASSWORD_PLACEHOLDER,
  resolveConnectionString,
  withRequiredSslmode,
} from '@/components/interfaces/ConnectSheet/ConnectionString.utils'
import { PasswordEncodingNote } from '@/components/interfaces/ConnectSheet/PasswordEncodingNote'
import { useConnectionStringDatabases } from '@/components/interfaces/ConnectSheet/useConnectionStringDatabases'
import { useIsHighAvailability } from '@/hooks/misc/useSelectedProject'

type DirectFilesConfig = {
  files: {
    name: string
    language?: string
    code: string
  }[]
  connectionStringFile?: string
  /** The password ends up inside a connection URL, so special characters must be percent-encoded */
  passwordInUrl?: boolean
}

function DirectFilesContent({ state, deploymentMode }: StepContentProps) {
  const isHighAvailability = useIsHighAvailability()

  const connectionSource = state.connectionSource
  const isLoadBalancerSelected =
    isHighAvailability && connectionSource === CONNECTION_SOURCE_LOAD_BALANCER
  const connectionType = (state.connectionType as DatabaseConnectionType) ?? 'uri'
  const connectionMethod = (state.connectionMethod as ConnectionStringMethod) ?? 'direct'
  const useSharedPooler = Boolean(state.useSharedPooler)

  const connectionStrings = useConnectionStringDatabases(deploymentMode)
  const connectionStringPooler =
    connectionStrings[connectionSource as keyof typeof connectionStrings]

  const resolvedConnectionString = useMemo(
    () =>
      resolveConnectionString({
        connectionMethod,
        useSharedPooler,
        connectionStringPooler,
      }),
    [connectionMethod, useSharedPooler, connectionStringPooler]
  )

  const connectionParams = useMemo(
    () => parseConnectionParams(resolvedConnectionString),
    [resolvedConnectionString]
  )

  const safeConnectionString = useMemo(
    () => buildSafeConnectionString(resolvedConnectionString, connectionParams),
    [resolvedConnectionString, connectionParams]
  )

  const config: DirectFilesConfig | null = useMemo(() => {
    const envFile = {
      name: '.env',
      language: 'bash',
      code: `DATABASE_URL=${safeConnectionString}`,
    }

    switch (connectionType) {
      case 'nodejs':
        return {
          files: [
            {
              name: 'db.js',
              language: 'js',
              code: `import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)

export default sql`,
            },
            envFile,
          ],
          connectionStringFile: envFile.name,
          passwordInUrl: true,
        }

      case 'golang':
        return {
          files: [
            {
              name: 'main.go',
              language: 'go',
              code: `package main

import (
\t"context"
\t"log"
\t"os"
\t"github.com/jackc/pgx/v5"
)

func main() {
\tconn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
\tif err != nil {
\t\tlog.Fatalf("Failed to connect to the database: %v", err)
\t}
\tdefer conn.Close(context.Background())

\t// Example query to test connection
\tvar version string
\tif err := conn.QueryRow(context.Background(), "SELECT version()").Scan(&version); err != nil {
\t\tlog.Fatalf("Query failed: %v", err)
\t}

\tlog.Println("Connected to:", version)
}`,
            },
            envFile,
          ],
          connectionStringFile: envFile.name,
          passwordInUrl: true,
        }

      case 'dotnet':
        return {
          files: [
            {
              name: 'appsettings.json',
              language: 'json',
              code: `{
  "ConnectionStrings": {
    "DefaultConnection": "${buildDotnetConnectionString(connectionParams)}"
  }
}`,
            },
          ],
          connectionStringFile: 'appsettings.json',
        }

      case 'python':
        return {
          files: [
            {
              name: 'main.py',
              language: 'python',
              code: `import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Fetch variables
DATABASE_URL = os.getenv("DATABASE_URL")

# Connect to the database
connection = psycopg2.connect(DATABASE_URL)`,
            },
            envFile,
          ],
          connectionStringFile: envFile.name,
          passwordInUrl: true,
        }

      case 'sqlalchemy':
        return {
          files: [
            {
              name: 'main.py',
              language: 'python',
              code: `from sqlalchemy import create_engine
# from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Fetch variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

# Construct the SQLAlchemy connection string
DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}${withRequiredSslmode(connectionParams.search)}"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)
# If using Transaction Pooler or Session Pooler, we want to ensure we disable SQLAlchemy client side pooling -
# https://docs.sqlalchemy.org/en/20/core/pooling.html#switching-pool-implementations
# engine = create_engine(DATABASE_URL, poolclass=NullPool)

# Test the connection
try:
    with engine.connect() as connection:
        print("Connection successful!")
except Exception as e:
    print(f"Failed to connect: {e}")`,
            },
            {
              name: '.env',
              language: 'bash',
              code: [
                `user=${connectionParams.user}`,
                `password=${PASSWORD_PLACEHOLDER}`,
                `host=${connectionParams.host}`,
                `port=${connectionParams.port}`,
                `dbname=${connectionParams.database}`,
              ].join('\n'),
            },
          ],
          connectionStringFile: '.env',
          passwordInUrl: true,
        }

      default:
        return null
    }
  }, [connectionType, safeConnectionString, connectionParams])

  const defaultFile = config?.files[0]?.name ?? ''
  const [activeFile, setActiveFile] = useState(defaultFile)

  useEffect(() => {
    setActiveFile(defaultFile)
  }, [connectionType, defaultFile])

  if (!resolvedConnectionString) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!config?.files.length) {
    return null
  }

  const codeBlock = (
    <MultipleCodeBlock
      files={config.files}
      value={activeFile}
      onValueChange={setActiveFile}
      className={isLoadBalancerSelected ? 'rounded-none border-0' : undefined}
    />
  )

  return (
    <div className="flex flex-col gap-3">
      {isLoadBalancerSelected ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center border-b bg-surface-100 py-2 pl-4 pr-2">
            <span className="text-xs text-foreground-light">Read-only</span>
          </div>
          {codeBlock}
        </div>
      ) : (
        codeBlock
      )}
      {config.passwordInUrl && <PasswordEncodingNote />}
      {/* Persistent live region so screen readers announce the read-only state
          when the load balancer is selected */}
      <p
        role="status"
        className={cn('text-sm text-foreground-lighter', !isLoadBalancerSelected && 'sr-only')}
      >
        {isLoadBalancerSelected &&
          'The load balancer accepts read-only connections. Connect to the primary database for writes.'}
      </p>
      <ConnectionParameters parameters={buildConnectionParameters(connectionParams)} />
    </div>
  )
}

export default DirectFilesContent
