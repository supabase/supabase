import { z } from 'zod';
import { PoolConfig, PoolClient } from 'pg';

declare const projectNameSchema: z.ZodString;
declare function toSchemaName(name: string): string;
declare const projectStatusSchema: z.ZodEnum<{
    error: "error";
    provisioning: "provisioning";
    active: "active";
    deleting: "deleting";
}>;
declare const projectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    schema_name: z.ZodString;
    anon_key: z.ZodNullable<z.ZodString>;
    service_key: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        error: "error";
        provisioning: "provisioning";
        active: "active";
        deleting: "deleting";
    }>;
    created_at: z.ZodString;
}, z.core.$strip>;
declare const createProjectOptionsSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
declare const dropSchemaOptionsSchema: z.ZodObject<{
    confirm: z.ZodString;
}, z.core.$strip>;
type Project = z.infer<typeof projectSchema>;
type ProjectStatus = z.infer<typeof projectStatusSchema>;
type CreateProjectOptions = z.infer<typeof createProjectOptionsSchema>;
type DropSchemaOptions = z.infer<typeof dropSchemaOptionsSchema>;

interface SchemaProvisioner {
    /** Verify _admin schema and projects table exist. Throws SetupError if not. */
    verifySetup(): Promise<void>;
    /** Provision a new company schema. Status-tracked: provisioning -> active (or error on failure). */
    createProject(options: CreateProjectOptions): Promise<Project>;
    /** Tear down a company schema. Requires confirm === project name (SCHEMA-04). */
    dropProject(name: string, options: DropSchemaOptions): Promise<void>;
    /** Re-provision a project currently in 'error' state. */
    retryProject(name: string): Promise<Project>;
    /** Delete a project in 'error' state without confirmation. */
    forceDeleteProject(name: string): Promise<void>;
    /** Release pool connections. Call on shutdown. */
    end(): Promise<void>;
}

declare class ProvisioningError extends Error {
    readonly project: Project;
    constructor(message: string, project: Project);
}
declare class ConfirmationError extends Error {
    readonly expected: string;
    readonly received: string;
    constructor(expected: string, received: string);
}
declare class SetupError extends Error {
    constructor(message: string);
}

declare function createSchemaProvisioner(config?: PoolConfig): SchemaProvisioner;

interface RoleManager {
    createRoles(schemaName: string, projectName: string, client: PoolClient): Promise<void>;
    dropRoles(projectName: string, client: PoolClient): Promise<void>;
}
declare function createRoleManager(): RoleManager;

interface KeyManager {
    signAnonKey(projectName: string): Promise<string>;
    signServiceKey(projectName: string): Promise<string>;
}
declare function createKeyManager(jwtSecret: string): KeyManager;

export { ConfirmationError, type CreateProjectOptions, type DropSchemaOptions, type KeyManager, type Project, type ProjectStatus, ProvisioningError, type RoleManager, type SchemaProvisioner, SetupError, createKeyManager, createProjectOptionsSchema, createRoleManager, createSchemaProvisioner, dropSchemaOptionsSchema, projectNameSchema, projectSchema, projectStatusSchema, toSchemaName };
