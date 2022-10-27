import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

import {handler} from './handler.tsx'

// @ts-ignore
serve(handler);
