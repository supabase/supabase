"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ConfirmationError: () => ConfirmationError,
  ProvisioningError: () => ProvisioningError,
  SetupError: () => SetupError,
  createKeyManager: () => createKeyManager,
  createProjectOptionsSchema: () => createProjectOptionsSchema,
  createRoleManager: () => createRoleManager,
  createSchemaProvisioner: () => createSchemaProvisioner,
  dropSchemaOptionsSchema: () => dropSchemaOptionsSchema,
  projectNameSchema: () => projectNameSchema,
  projectSchema: () => projectSchema,
  projectStatusSchema: () => projectStatusSchema,
  toSchemaName: () => toSchemaName
});
module.exports = __toCommonJS(index_exports);

// src/types.ts
var import_zod = require("zod");
var projectNameSchema = import_zod.z.string().min(1).max(59).regex(/^[a-z][a-z0-9_]*$/, "Must start with lowercase letter, only a-z0-9_ allowed");
function toSchemaName(name) {
  return `co_${name}`;
}
var projectStatusSchema = import_zod.z.enum(["provisioning", "active", "deleting", "error"]);
var projectSchema = import_zod.z.object({
  id: import_zod.z.string().uuid(),
  name: import_zod.z.string(),
  schema_name: import_zod.z.string(),
  anon_key: import_zod.z.string().nullable(),
  service_key: import_zod.z.string().nullable(),
  status: projectStatusSchema,
  created_at: import_zod.z.string().datetime()
});
var createProjectOptionsSchema = import_zod.z.object({
  name: projectNameSchema
});
var dropSchemaOptionsSchema = import_zod.z.object({
  confirm: import_zod.z.string()
});

// src/errors.ts
var ProvisioningError = class extends Error {
  project;
  constructor(message, project) {
    super(message);
    this.name = "ProvisioningError";
    this.project = project;
  }
};
var ConfirmationError = class extends Error {
  expected;
  received;
  constructor(expected, received) {
    super(`Confirmation mismatch: expected "${expected}", got "${received}"`);
    this.name = "ConfirmationError";
    this.expected = expected;
    this.received = received;
  }
};
var SetupError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "SetupError";
  }
};

// src/pg-schema-provisioner.ts
var import_pg2 = require("pg");

// src/registry.ts
async function insertRegistryRow(client, options, status) {
  const schemaName = toSchemaName(options.name);
  const result = await client.query(
    `INSERT INTO _admin.projects (name, schema_name, status)
     VALUES ($1, $2, $3)
     RETURNING id, name, schema_name, anon_key, service_key, status, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at`,
    [options.name, schemaName, status]
  );
  return projectSchema.parse(result.rows[0]);
}
async function updateRegistryStatus(client, id, status) {
  await client.query("UPDATE _admin.projects SET status = $1 WHERE id = $2", [
    status,
    id
  ]);
}
async function deleteRegistryRow(client, id) {
  await client.query("DELETE FROM _admin.projects WHERE id = $1", [id]);
}
async function findProjectByName(client, name) {
  const result = await client.query(
    `SELECT id, name, schema_name, anon_key, service_key, status, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
     FROM _admin.projects WHERE name = $1`,
    [name]
  );
  if (result.rows.length === 0) return null;
  return projectSchema.parse(result.rows[0]);
}
async function updateRegistryKeys(client, id, anonKey, serviceKey) {
  await client.query(
    "UPDATE _admin.projects SET anon_key = $1, service_key = $2 WHERE id = $3",
    [anonKey, serviceKey, id]
  );
}

// src/key-manager.ts
var import_jose = require("jose");
function createKeyManager(jwtSecret) {
  if (!jwtSecret) {
    throw new SetupError("JWT_SECRET is required but was not provided");
  }
  const secretBytes = new TextEncoder().encode(jwtSecret);
  async function signToken(role) {
    const iat = Math.floor(Date.now() / 1e3);
    const exp = iat + 5 * 365 * 24 * 3600;
    return new import_jose.SignJWT({ role, iss: "supabase", iat, exp }).setProtectedHeader({ alg: "HS256" }).sign(secretBytes);
  }
  return {
    signAnonKey(projectName) {
      return signToken(`co_${projectName}_anon`);
    },
    signServiceKey(projectName) {
      return signToken(`co_${projectName}_service`);
    }
  };
}

// src/role-manager.ts
var import_pg = require("pg");
function createRoleManager() {
  return {
    async createRoles(schemaName, projectName, client) {
      const anonRole = `co_${projectName}_anon`;
      const serviceRole = `co_${projectName}_service`;
      const anonRoleLiteral = anonRole.replace(/'/g, "''");
      const serviceRoleLiteral = serviceRole.replace(/'/g, "''");
      const anonRoleId = (0, import_pg.escapeIdentifier)(anonRole);
      const serviceRoleId = (0, import_pg.escapeIdentifier)(serviceRole);
      const schemaId = (0, import_pg.escapeIdentifier)(schemaName);
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = '${anonRoleLiteral}') THEN
            CREATE ROLE ${anonRoleId} NOLOGIN NOINHERIT;
          END IF;
        END $$
      `);
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = '${serviceRoleLiteral}') THEN
            CREATE ROLE ${serviceRoleId} NOLOGIN NOINHERIT;
          END IF;
        END $$
      `);
      await client.query(`GRANT USAGE ON SCHEMA ${schemaId} TO ${anonRoleId}`);
      await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${schemaId} TO ${anonRoleId}`);
      await client.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaId} GRANT SELECT ON TABLES TO ${anonRoleId}`
      );
      await client.query(`GRANT USAGE ON SCHEMA ${schemaId} TO ${serviceRoleId}`);
      await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schemaId} TO ${serviceRoleId}`);
      await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schemaId} TO ${serviceRoleId}`);
      await client.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaId} GRANT ALL ON TABLES TO ${serviceRoleId}`
      );
      await client.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaId} GRANT ALL ON SEQUENCES TO ${serviceRoleId}`
      );
    },
    async dropRoles(projectName, client) {
      const anonRoleId = (0, import_pg.escapeIdentifier)(`co_${projectName}_anon`);
      const serviceRoleId = (0, import_pg.escapeIdentifier)(`co_${projectName}_service`);
      await client.query(`DROP ROLE IF EXISTS ${anonRoleId}`);
      await client.query(`DROP ROLE IF EXISTS ${serviceRoleId}`);
    }
  };
}

// src/pg-schema-provisioner.ts
function createSchemaProvisioner(config) {
  const jwtSecret = process.env["JWT_SECRET"] ?? "";
  const keyManager = createKeyManager(jwtSecret);
  const roleManager = createRoleManager();
  const pool = new import_pg2.Pool(
    config ?? {
      host: process.env["POSTGRES_HOST"],
      port: Number(process.env["POSTGRES_PORT"] ?? 5432),
      database: process.env["POSTGRES_DB"],
      password: process.env["POSTGRES_PASSWORD"],
      user: "postgres",
      ssl: false,
      max: 5,
      idleTimeoutMillis: 3e4
    }
  );
  async function verifySetup() {
    const result = await pool.query(
      `SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = '_admin'`
    );
    if (result.rows.length === 0) {
      throw new SetupError(
        "_admin schema not found. Apply sql/migrations/20260309000000_admin_registry.sql first."
      );
    }
  }
  async function createProject(options) {
    const validated = createProjectOptionsSchema.parse(options);
    const schemaName = toSchemaName(validated.name);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const project = await insertRegistryRow(
        client,
        validated,
        "provisioning"
      );
      await client.query("COMMIT");
      let anonKey;
      let serviceKey;
      try {
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        await roleManager.createRoles(schemaName, validated.name, client);
        anonKey = await keyManager.signAnonKey(validated.name);
        serviceKey = await keyManager.signServiceKey(validated.name);
        await updateRegistryKeys(client, project.id, anonKey, serviceKey);
        await updateRegistryStatus(client, project.id, "active");
        return {
          ...project,
          status: "active",
          anon_key: anonKey,
          service_key: serviceKey
        };
      } catch (ddlError) {
        await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {
        });
        await roleManager.dropRoles(validated.name, client).catch(() => {
        });
        await updateRegistryStatus(client, project.id, "error").catch(() => {
        });
        throw new ProvisioningError(
          `Schema creation failed: ${ddlError.message}`,
          { ...project, status: "error" }
        );
      }
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {
      });
      throw err;
    } finally {
      client.release();
    }
  }
  async function dropProject(name, options) {
    const validated = dropSchemaOptionsSchema.parse(options);
    if (validated.confirm !== name) {
      throw new ConfirmationError(name, validated.confirm);
    }
    const client = await pool.connect();
    try {
      const project = await findProjectByName(client, name);
      if (!project) {
        throw new Error(`Project "${name}" not found in registry`);
      }
      if (!project.schema_name.startsWith("co_")) {
        throw new Error(
          `Invalid schema name "${project.schema_name}" \u2014 must start with 'co_'`
        );
      }
      await client.query(
        `DROP SCHEMA IF EXISTS "${project.schema_name}" CASCADE`
      );
      await roleManager.dropRoles(project.name, client);
      await deleteRegistryRow(client, project.id);
    } finally {
      client.release();
    }
  }
  async function retryProject(name) {
    const client = await pool.connect();
    try {
      const project = await findProjectByName(client, name);
      if (!project) {
        throw new Error(`Project "${name}" not found`);
      }
      if (project.status !== "error") {
        throw new Error(
          `Cannot retry project "${name}": status is "${project.status}", expected "error"`
        );
      }
      const schemaName = project.schema_name;
      await updateRegistryStatus(client, project.id, "provisioning");
      let anonKey;
      let serviceKey;
      try {
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        await roleManager.createRoles(schemaName, project.name, client);
        anonKey = await keyManager.signAnonKey(project.name);
        serviceKey = await keyManager.signServiceKey(project.name);
        await updateRegistryKeys(client, project.id, anonKey, serviceKey);
        await updateRegistryStatus(client, project.id, "active");
        return {
          ...project,
          status: "active",
          anon_key: anonKey,
          service_key: serviceKey
        };
      } catch (ddlError) {
        await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {
        });
        await roleManager.dropRoles(project.name, client).catch(() => {
        });
        await updateRegistryStatus(client, project.id, "error").catch(() => {
        });
        throw new ProvisioningError(
          `Retry failed: ${ddlError.message}`,
          { ...project, status: "error" }
        );
      }
    } finally {
      client.release();
    }
  }
  async function forceDeleteProject(name) {
    const client = await pool.connect();
    try {
      const project = await findProjectByName(client, name);
      if (!project) {
        throw new Error(`Project "${name}" not found in registry`);
      }
      if (project.status !== "error") {
        throw new Error(
          `forceDeleteProject can only be used on projects in error state (current status: ${project.status})`
        );
      }
      if (!project.schema_name.startsWith("co_")) {
        throw new Error(
          `Invalid schema name "${project.schema_name}" \u2014 must start with 'co_'`
        );
      }
      await client.query(
        `DROP SCHEMA IF EXISTS "${project.schema_name}" CASCADE`
      );
      await roleManager.dropRoles(project.name, client);
      await deleteRegistryRow(client, project.id);
    } finally {
      client.release();
    }
  }
  async function listProjects() {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, name, schema_name, anon_key, service_key, status, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
         FROM _admin.projects ORDER BY created_at ASC`
      );
      return result.rows.map((row) => projectSchema.parse(row));
    } finally {
      client.release();
    }
  }
  async function rotateKeys(name) {
    const client = await pool.connect();
    try {
      const project = await findProjectByName(client, name);
      if (!project) {
        throw new Error(`Project "${name}" not found`);
      }
      const anonKey = await keyManager.signAnonKey(name);
      const serviceKey = await keyManager.signServiceKey(name);
      await updateRegistryKeys(client, project.id, anonKey, serviceKey);
      return { ...project, anon_key: anonKey, service_key: serviceKey };
    } finally {
      client.release();
    }
  }
  async function end() {
    await pool.end();
  }
  return {
    verifySetup,
    createProject,
    dropProject,
    retryProject,
    forceDeleteProject,
    listProjects,
    rotateKeys,
    end
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfirmationError,
  ProvisioningError,
  SetupError,
  createKeyManager,
  createProjectOptionsSchema,
  createRoleManager,
  createSchemaProvisioner,
  dropSchemaOptionsSchema,
  projectNameSchema,
  projectSchema,
  projectStatusSchema,
  toSchemaName
});
//# sourceMappingURL=index.cjs.map