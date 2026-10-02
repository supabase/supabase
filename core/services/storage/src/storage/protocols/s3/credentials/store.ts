export interface S3Credentials {
  accessKey: string
  secretKey: string
  claims: { role: string; sub?: string; [key: string]: unknown }
}

export interface S3CredentialWithDescription extends S3Credentials {
  description: string
}

export interface S3CredentialsRaw {
  id: string
  description: string
  access_key: string
  created_at: string
}

export interface S3CredentialsManagerStore {
  /**
   * Inserts a new credential and returns the id
   *
   * @param tenantId
   */
  insert(tenantId: string, credential: S3CredentialWithDescription): Promise<string>

  /**
   * List all credentials for the specified tenant
   * Returns data in the database style (snake case) format because the endpoint is expected to return data in this format
   *
   * @param tenantId
   */
  list(tenantId: string): Promise<S3CredentialsRaw[]>

  /**
   * Get one credential for the specified tenant / access key
   *
   * @param tenantId
   * @param accessKey
   */
  getOneByAccessKey(tenantId: string, accessKey: string): Promise<S3Credentials>

  /**
   * Gets the count of credentials for the specified tenant
   *
   * @param tenantId
   */
  count(tenantId: string): Promise<number>

  /**
   * Deletes a credential and returns the count of items deleted
   *
   * @param tenantId
   * @param credentialId
   */
  delete(tenantId: string, credentialId: string): Promise<number>
}
