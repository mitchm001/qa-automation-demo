import { spawn, type ChildProcess } from 'node:child_process';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
    Starts an extra copy of the app (already built by the webServer step) on its own port and database.
    Used when a test needs the app configured differently from the main test server,
    e.g. with the test-only routes turned OFF, the way it would run in production.
*/
export async function startExtraServer(port: number, env: Record<string, string> = {}): Promise<{ baseURL: string; stop: () => void }> {
  const dbFile = join(tmpdir(), `qa-demo-extra-${port}-${Date.now()}.db`);
  const child: ChildProcess = spawn(process.execPath, ['platform-ui/build/server.js'], {
    env: { PATH: process.env.PATH ?? '', PORT: String(port), DB_FILE: dbFile, ...env },
    stdio: 'ignore',
  });
  const baseURL = `http://localhost:${port}`;

  const stop = () => {
    child.kill();
    rmSync(dbFile, { force: true });
  };

  // Wait until /api/health answers (up to ~10 seconds)
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${baseURL}/api/health`)).ok) return { baseURL, stop };
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  stop();
  throw new Error(`Extra server on port ${port} did not start`);
}
