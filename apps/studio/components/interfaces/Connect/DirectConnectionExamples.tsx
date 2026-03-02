export type Example = {
  installCommands?: string[]
  postInstallCommands?: string[]
  files?: {
    name: string
    content: string
  }[]
}

export const examples = {
  nodejs: {
    installCommands: ['npm install postgres'],
    files: [
      {
        name: 'db.js',
        content: `import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString)

export default sql`,
      },
    ],
  },
  golang: {
    installCommands: ['go get github.com/jackc/pgx/v5'],
    files: [
      {
        name: 'main.go',
        content: `package main

import (
	"context"
	"log"
	"os"
	"github.com/jackc/pgx/v5"
)

func main() {
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}
	defer conn.Close(context.Background())

	// Example query to test connection
	var version string
	if err := conn.QueryRow(context.Background(), "SELECT version()").Scan(&version); err != nil {
		log.Fatalf("Query failed: %v", err)
	}

	log.Println("Connected to:", version)
}`,
      },
    ],
  },
  dotnet: {
    installCommands: [
      'dotnet add package Microsoft.Extensions.Configuration.Json --version YOUR_DOTNET_VERSION',
    ],
    postInstallCommands: [
      'dotnet add package Microsoft.Extensions.Configuration.Json --version YOUR_DOTNET_VERSION',
    ],
  },
  python: {
    installCommands: ['pip install python-dotenv psycopg2'],
    files: [
      {
        name: 'main.py',
        content: `import psycopg2
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

# Connect to the database
try:
    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME
    )
    print("Connection successful!")
    
    # Create a cursor to execute SQL queries
    cursor = connection.cursor()
    
    # Example query
    cursor.execute("SELECT NOW();")
    result = cursor.fetchone()
    print("Current Time:", result)

    # Close the cursor and connection
    cursor.close()
    connection.close()
    print("Connection closed.")

except Exception as e:
    print(f"Failed to connect: {e}")`,
      },
    ],
  },
  sqlalchemy: {
    installCommands: ['pip install python-dotenv sqlalchemy psycopg2'],
    files: [
      {
        name: 'main.py',
        content: `from sqlalchemy import create_engine
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
DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

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
    ],
  },
}
