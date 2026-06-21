/**
 * Frees port 8081 so `expo start` doesn't silently skip when Metro is already running.
 * Run via: npm run start:clean
 */
const { execSync } = require('child_process');

function killPort8081() {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano | findstr :8081 | findstr LISTENING', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const lines = out.trim().split('\n').filter(Boolean);
      const pids = new Set(
        lines.map((line) => line.trim().split(/\s+/).pop()).filter(Boolean),
      );
      for (const pid of pids) {
        console.log(`Stopping process on port 8081 (PID ${pid})…`);
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
      }
      if (!pids.size) console.log('Port 8081 is already free.');
    } else {
      execSync('lsof -ti:8081 | xargs kill -9 2>/dev/null || true', { shell: true, stdio: 'inherit' });
    }
  } catch {
    console.log('Port 8081 is already free.');
  }
}

killPort8081();
