/**
 * Serves the OG Image generation logic.
 * Uses native Deno.serve to ensure the function boots correctly in offline local environments.
 */

import { handler } from './handler.tsx';

Deno.serve(handler);
