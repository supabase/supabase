import { spawn, ChildProcess } from 'child_process';
import path from 'path';

// Resolve the path to the Next.js binary within the project.
const nextBinary = path.resolve(__dirname, '../../node_modules/.bin/next');

// Spawn the Next.js server without detaching so the parent can reap it.
const nextProcess: ChildProcess = spawn(nextBinary, ['start'], {
  stdio: 'inherit',
  detached: false,
  cwd: path.resolve(__dirname, '..'),
});

// Log any spawn errors.
nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js server:', err);
});

// When the Next.js process exits, propagate its exit code to the parent process.
nextProcess.on('exit', (code, signal) => {
  if (signal) {
    console.log(`Next.js process terminated by signal ${signal}`);
  }
  // Exit the parent with the same code (or 0 if undefined).
  process.exit(code ?? 0);
});

// Ensure the child process is terminated when the parent receives termination signals.
const terminateChild = () => {
  if (!nextProcess.killed) {
    nextProcess.kill('SIGTERM');
  }
};

process.on('SIGINT', terminateChild);
process.on('SIGTERM', terminateChild);
process.on('exit', terminateChild);
