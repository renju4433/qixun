const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_EXE = path.resolve(__dirname, '../../stockfish-windows-x86-64-avx2.exe');

function findExePath() {
  const envPath = process.env.STOCKFISH_EXE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  if (fs.existsSync(DEFAULT_EXE)) return DEFAULT_EXE;
  return null;
}

function analyzeFenLocal({ fen, depth = 18, timeoutMs = 999999, multipv = 99 }) {
  return new Promise((resolve, reject) => {
    const exePath = findExePath();
    if (!exePath) {
      reject(new Error('Stockfish exe not found. Set STOCKFISH_EXE_PATH or place exe in project root.'));
      return;
    }
    if (!fen || typeof fen !== 'string') {
      reject(new Error('fen is required'));
      return;
    }

    const cpByMove = new Map();
    let bestmove = '';
    let stderrText = '';
    let finished = false;
    let buf = '';

    const child = spawn(exePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });

    const cleanup = () => {
      if (!child.killed) {
        try {
          child.kill();
        } catch (_) {}
      }
    };

    let timer = null;

    const fail = (err) => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      cleanup();
      reject(err);
    };

    const done = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      cleanup();
      resolve({
        bestmove,
        depth,
        evals: Object.fromEntries(cpByMove.entries()),
        stderr: stderrText.slice(-2000),
      });
    };

    const send = (cmd) => {
      child.stdin.write(`${cmd}\n`);
    };

    const onLine = (line) => {
      const msg = line.trim();
      if (!msg) return;

      if (msg.startsWith('info ') && msg.includes(' cp ') && msg.includes(' pv ')) {
        const cpMatch = msg.match(/\bcp\s+(-?\d+)\b/);
        const pvMatch = msg.match(/\bpv\s+(\S+)/);
        if (cpMatch && pvMatch) {
          const move = pvMatch[1];
          const cp = Number(cpMatch[1]);
          cpByMove.set(move, cp);
        }
      }

      if (msg.startsWith('bestmove ')) {
        const m = msg.match(/^bestmove\s+(\S+)/);
        bestmove = m ? m[1] : '';
        done();
      }
    };

    child.stdout.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let idx = buf.indexOf('\n');
      while (idx >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        onLine(line);
        idx = buf.indexOf('\n');
      }
    });

    child.stderr.on('data', (chunk) => {
      stderrText += chunk.toString('utf8');
    });

    child.on('error', (err) => fail(err));
    child.on('exit', (code) => {
      if (!finished && code !== 0) {
        fail(new Error(`stockfish exited with code ${code}`));
      }
    });

    timer = setTimeout(() => {
      fail(new Error(`stockfish analyze timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    send('uci');
    send('isready');
    send(`setoption name Threads value ${Math.max(1, Number(process.env.SF_THREADS || 1))}`);
    send(`setoption name MultiPV value ${Math.max(1, Number(multipv || process.env.SF_MULTIPV || 2))}`);
    send('ucinewgame');
    send(`position fen ${fen}`);
    send(`go depth ${Math.max(1, Number(depth || 18))}`);
  });
}

module.exports = { analyzeFenLocal, findExePath };
