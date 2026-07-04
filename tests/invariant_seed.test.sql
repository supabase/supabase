import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe("SQL seed files must not contain bcrypt hashes in production", () => {
  const payloads = [
    { name: 'bcrypt hash pattern', content: '$2b$10$' },
    { name: 'bcrypt hash with salt', content: '$2a$12$' },
    { name: 'valid SQL comment', content: '-- no hash here' },
    { name: 'empty string', content: '' },
    { name: 'boundary - dollar signs without pattern', content: '$$$ test $$$' }
  ];

  test.each(payloads)("seed.sql does not contain bcrypt hash: %s", async ({ content }) => {
    // Read the actual seed.sql file
    const { stdout } = await execAsync('cat apps/ui-library/supabase/seed.sql');
    const seedContent = stdout;
    
    // Security property: seed.sql must not contain bcrypt hash patterns
    // This prevents accidental inclusion of password hashes in version control
    const bcryptPattern = /\$2[aby]\$\d+\$/;
    
    if (content.includes('$2')) {
      // If testing a bcrypt pattern payload, verify it's NOT in the actual file
      expect(seedContent).not.toMatch(bcryptPattern);
    } else {
      // For non-bcrypt payloads, just verify the file doesn't contain bcrypt
      // This maintains the security invariant regardless of test input
      expect(seedContent).not.toMatch(bcryptPattern);
    }
  });
});