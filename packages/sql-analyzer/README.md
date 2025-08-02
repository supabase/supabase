# @supabase/sql-analyzer

Advanced SQL analysis engine for security, classification, and AI assistance. This package provides comprehensive analysis of PostgreSQL queries including risk assessment, permission requirements, performance impact, and AI executability.

## ✨ Features

- **🔍 SQL Parsing**: Advanced parsing of PostgreSQL queries with AST-like analysis
- **🛡️ Security Analysis**: Risk assessment, dangerous function detection, and security warnings
- **📊 Query Classification**: Categorize queries by type, complexity, and purpose
- **🤖 AI Integration**: Determine if queries are safe for AI execution
- **⚡ Performance Analysis**: Complexity scoring and optimization suggestions
- **🔐 Permission Analysis**: Required database permissions and privilege escalation detection
- **⭐ Highly Configurable**: Customizable security rules and analysis depth

## 🚀 Installation

```bash
npm install @supabase/sql-analyzer
```

## 📖 Quick Start

```typescript
import { analyzeSqlQuery, isQuerySafeForAi } from '@supabase/sql-analyzer'

// Analyze a query
const result = await analyzeSqlQuery('SELECT * FROM users WHERE active = true')

console.log(`Risk Level: ${result.riskLevel}`)           // LOW
console.log(`AI Executable: ${result.aiExecutable}`)     // true
console.log(`Category: ${result.category}`)              // DML
console.log(`Complexity: ${result.complexity}`)          // SIMPLE

// Quick safety check for AI
const isSafe = await isQuerySafeForAi('DROP TABLE users')
console.log(isSafe) // false
```

## 🔧 API Reference

### `analyzeSqlQuery(sql, options?)`

Performs comprehensive analysis of a SQL query.

```typescript
const result = await analyzeSqlQuery(
  'SELECT u.name, COUNT(o.id) FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.name',
  {
    readOnlyMode: true,
    schema: 'public',
    securityConfig: {
      allowedSchemas: ['public', 'auth'],
      blockedFunctions: ['pg_read_file'],
      maxComplexity: 75
    }
  }
)
```

**Options:**
- `dialect`: PostgreSQL dialect version (default: latest)
- `schema`: Current schema context
- `permissions`: User permissions context
- `readOnlyMode`: Whether connection is read-only
- `securityConfig`: Custom security configuration

**Returns:** `SqlAnalysisResult` with:
- `query`: Parsed query structure
- `category`: Query category (DDL, DML, DCL, etc.)
- `riskLevel`: Security risk level (LOW, MEDIUM, HIGH, CRITICAL)
- `aiExecutable`: Whether safe for AI execution
- `warnings`: Security warnings and recommendations
- `performance`: Performance impact analysis
- `requiredPermissions`: Database permissions needed

### `isQuerySafeForAi(sql, options?)`

Quick check if a query is safe for AI execution.

```typescript
const safe = await isQuerySafeForAi('SELECT name FROM users LIMIT 10')
```

### `getAiPromptType(sql)`

Get the appropriate AI prompt type for a query.

```typescript
const promptType = await getAiPromptType('CREATE TABLE posts (id serial)')
console.log(promptType) // 'create_table'
```

### `formatSecurityReport(result)`

Format analysis results into a readable security report.

```typescript
const result = await analyzeSqlQuery('SELECT * FROM sensitive_table')
const report = formatSecurityReport(result)
console.log(report)
```

## 🛡️ Security Features

### Risk Levels

- **LOW**: Read-only operations, safe functions
- **MEDIUM**: Data modifications, schema changes  
- **HIGH**: Dangerous operations, admin functions
- **CRITICAL**: System-level operations, security violations

### Built-in Security Rules

- **Data Loss Prevention**: Detects DELETE/UPDATE without WHERE clauses
- **Dangerous Functions**: Blocks system-level PostgreSQL functions
- **System Access**: Warns about system catalog access
- **File Operations**: Detects COPY TO/FROM file operations
- **Dynamic SQL**: Identifies EXECUTE statements
- **Privilege Escalation**: Detects superuser grants

### Custom Security Rules

```typescript
const customRules = [{
  id: 'no-production-deletes',
  name: 'Production Delete Prevention',
  description: 'Prevent DELETE operations in production',
  pattern: '\\bDELETE\\s+FROM\\b',
  action: 'block',
  riskLevel: QueryRiskLevel.HIGH,
  message: 'DELETE operations not allowed in production'
}]

const result = await analyzeSqlQuery(sql, {
  securityConfig: { customRules }
})
```

## 📊 Query Classification

### Categories

- **DDL**: Data Definition Language (CREATE, ALTER, DROP)
- **DML**: Data Manipulation Language (SELECT, INSERT, UPDATE, DELETE)
- **DCL**: Data Control Language (GRANT, REVOKE)
- **TCL**: Transaction Control Language (COMMIT, ROLLBACK)
- **UTILITY**: Administrative commands (VACUUM, ANALYZE)
- **FUNCTION**: Function calls and procedures

### Complexity Levels

- **SIMPLE**: Single table, basic operations
- **MODERATE**: Joins, subqueries
- **COMPLEX**: CTEs, window functions, complex joins
- **VERY_COMPLEX**: Recursive CTEs, multiple nesting levels

## 🤖 AI Integration

The analyzer provides specific features for AI assistant integration:

### AI Executability

```typescript
const result = await analyzeSqlQuery('SELECT * FROM users')
if (result.aiExecutable) {
  // Safe to execute via AI assistant
  console.log('✅ Safe for AI execution')
} else {
  console.log('❌ Requires human review')
}
```

### AI Prompt Types

Helps AI assistants choose appropriate response strategies:

```typescript
const promptType = await getAiPromptType('CREATE INDEX idx_users_email ON users(email)')
// Returns: 'create_index'

switch (promptType) {
  case 'data_query':
    // Handle SELECT queries
  case 'create_table':
    // Handle table creation
  case 'rls_policy':
    // Handle RLS policy creation
}
```

## ⚡ Performance Analysis

### Complexity Scoring

```typescript
const result = await analyzeSqlQuery(`
  WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM category_tree
`)

console.log(result.performance.complexityScore) // 85
console.log(result.performance.timeCategory)    // 'slow'
console.log(result.performance.factors)         // ['Contains CTEs', 'Uses recursion']
```

### Optimization Suggestions

```typescript
const result = await analyzeSqlQuery('SELECT * FROM large_table')
console.log(result.performance.optimizations)
// ['Select only needed columns', 'Consider adding LIMIT clause']
```

## 🔐 Permission Analysis

```typescript
const result = await analyzeSqlQuery(`
  UPDATE users SET last_login = NOW() WHERE id = 1;
  INSERT INTO user_logs (user_id, action) VALUES (1, 'login');
`)

console.log(result.requiredPermissions)
// [
//   { type: 'UPDATE', target: 'users', schema: 'public', required: true },
//   { type: 'INSERT', target: 'user_logs', schema: 'public', required: true },
//   { type: 'EXECUTE', target: 'NOW', required: false }
// ]
```

## ⚙️ Configuration

### Security Configurations

Pre-built configurations for common scenarios:

```typescript
import { SECURITY_CONFIGS } from '@supabase/sql-analyzer'

// Strict AI assistant mode
const result = await analyzeSqlQuery(sql, {
  securityConfig: SECURITY_CONFIGS.AI_ASSISTANT_STRICT
})

// Development mode
const result = await analyzeSqlQuery(sql, {
  securityConfig: SECURITY_CONFIGS.DEVELOPMENT
})

// Admin mode
const result = await analyzeSqlQuery(sql, {
  securityConfig: SECURITY_CONFIGS.ADMIN
})
```

### Custom Configuration

```typescript
const customConfig = {
  allowedSchemas: ['public', 'app', 'reporting'],
  blockedFunctions: ['pg_read_file', 'pg_write_file'],
  maxComplexity: 50,
  requireExplicitPermissions: true,
  readOnlyMode: false,
  customRules: [/* custom security rules */],
  dataClassificationRules: [/* data classification rules */]
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run benchmarks
npm run benchmark
```

## 📝 Examples

### Basic Query Analysis

```typescript
import { analyzeSqlQuery } from '@supabase/sql-analyzer'

const result = await analyzeSqlQuery(`
  SELECT 
    u.name,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.active = true
  GROUP BY u.id, u.name, u.email
  ORDER BY total_spent DESC
  LIMIT 10
`)

console.log('Analysis Results:')
console.log(`- Category: ${result.category}`)
console.log(`- Risk Level: ${result.riskLevel}`)
console.log(`- AI Executable: ${result.aiExecutable}`)
console.log(`- Complexity: ${result.complexity}`)
console.log(`- Tables: ${result.query.tables.join(', ')}`)
console.log(`- Functions: ${result.query.functions.join(', ')}`)
```

### AI Safety Integration

```typescript
import { isQuerySafeForAi, getAiPromptType } from '@supabase/sql-analyzer'

async function handleAiQuery(userQuery: string) {
  const isSafe = await isQuerySafeForAi(userQuery, { readOnlyMode: true })
  
  if (!isSafe) {
    return { 
      error: 'Query not safe for AI execution',
      suggestion: 'Please review and modify your query'
    }
  }
  
  const promptType = await getAiPromptType(userQuery)
  
  // Route to appropriate AI handler based on prompt type
  switch (promptType) {
    case 'data_query':
      return handleDataQuery(userQuery)
    case 'create_table':
      return handleTableCreation(userQuery)
    default:
      return handleGenericQuery(userQuery)
  }
}
```

### Custom Security Rules

```typescript
import { analyzeSqlQuery, QueryRiskLevel } from '@supabase/sql-analyzer'

const productionRules = [
  {
    id: 'no-truncate',
    name: 'Prevent TRUNCATE',
    description: 'TRUNCATE operations not allowed in production',
    pattern: '\\bTRUNCATE\\b',
    action: 'block' as const,
    riskLevel: QueryRiskLevel.CRITICAL,
    message: 'TRUNCATE operations are not permitted in production environment'
  },
  {
    id: 'require-limit',
    name: 'Require LIMIT for large SELECTs',
    description: 'Large SELECT operations should include LIMIT',
    pattern: '\\bSELECT\\s+\\*.*FROM\\s+(?:users|orders|products)(?!.*\\bLIMIT\\b)',
    action: 'warn' as const,
    riskLevel: QueryRiskLevel.MEDIUM,
    message: 'Consider adding LIMIT clause for better performance'
  }
]

const result = await analyzeSqlQuery(userQuery, {
  securityConfig: {
    customRules: productionRules,
    readOnlyMode: process.env.NODE_ENV === 'production'
  }
})
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Supabase](https://github.com/supabase/supabase) - The open source Firebase alternative
- [PostgREST](https://github.com/PostgREST/postgrest) - REST API for PostgreSQL
- [pg-query-parser](https://github.com/pyramation/pg-query-parser) - PostgreSQL query parser

---

Built with ❤️ by the Supabase team