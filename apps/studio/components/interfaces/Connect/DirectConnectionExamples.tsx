const examples = {
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
}

export default examples
