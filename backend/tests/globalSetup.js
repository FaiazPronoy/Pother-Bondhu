import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let mongo;
let server;

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not listening yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not start within ${timeoutMs}ms`);
}

export async function setup({ provide }) {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri('savepaws_test');
  provide('mongoUri', uri);
  provide('baseUrl', 'http://localhost:4100');

  server = spawn(process.execPath, ['server.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      MONGODB_URI: uri,
      JWT_SECRET: 'test-secret-for-vitest-only',
      NODE_ENV: 'test',
      PORT: '4100',
    },
    stdio: 'ignore',
  });

  await waitForServer('http://localhost:4100/');
}

export async function teardown() {
  if (server) server.kill();
  if (mongo) await mongo.stop();
}
