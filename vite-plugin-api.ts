import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * Load .env file into process.env (for non-VITE_ vars used by API handlers)
 */
function loadEnvToProcess() {
  try {
    const envPath = join(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env file not found, ignore
  }
}

/**
 * Vite plugin that serves Vercel-style serverless functions from /api directory
 * during local development. No need for `vercel dev`.
 */
export function apiPlugin(): Plugin {
  let envLoaded = false;
  return {
    name: 'vercel-api-dev',
    configureServer(server: ViteDevServer) {
      // Load env vars once
      if (!envLoaded) {
        loadEnvToProcess();
        envLoaded = true;
      }
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/api/')) return next();

        // Parse the URL path to find the handler file
        const urlPath = req.url.split('?')[0]; // Remove query string
        const handlerPath = join(process.cwd(), `${urlPath}.ts`);

        try {
          // Parse request body for POST/PUT/DELETE
          let body: any = {};
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = await parseBody(req);
          }

          // Parse query string
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const query: Record<string, string> = {};
          url.searchParams.forEach((value, key) => {
            query[key] = value;
          });

          // Create Vercel-compatible request object
          const vercelReq: any = req;
          vercelReq.body = body;
          vercelReq.query = query;

          // Create Vercel-compatible response object
          const vercelRes: any = res;
          vercelRes.status = (code: number) => {
            res.statusCode = code;
            return vercelRes;
          };
          vercelRes.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return vercelRes;
          };
          vercelRes.send = (data: any) => {
            res.end(typeof data === 'string' ? data : JSON.stringify(data));
            return vercelRes;
          };

          // Dynamically import the handler using Vite's SSR module loader
          const module = await server.ssrLoadModule(handlerPath);
          const handler = module.default;

          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Handler not found' }));
            return;
          }

          await handler(vercelReq, vercelRes);
        } catch (error: any) {
          // If file doesn't exist, pass to next middleware
          if (error?.code === 'ERR_MODULE_NOT_FOUND' || error?.message?.includes('does not exist')) {
            return next();
          }
          console.error(`API Error [${req.url}]:`, error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', details: error?.message }));
          }
        }
      });
    },
  };
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(data);
      }
    });
    req.on('error', reject);
  });
}
