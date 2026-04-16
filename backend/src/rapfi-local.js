const path = require('path');

const Rapfi = require('../engine/rapfi-multi-simd128.js');

const BOARD_SIZE = 15;
const DEFAULT_RULE = 4;
const DEFAULT_THREADS = 32;
const DEFAULT_DEPTH = 20;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAnalyzeTimeoutMs(options = {}) {
  if (options.timeoutMs) return Number(options.timeoutMs);
  const depth = Number(options.maxDepth || DEFAULT_DEPTH);
  return Math.max(15000, depth * 1500);
}

function getAnalyzeIdleMs(options = {}) {
  if (options.idleMs) return Number(options.idleMs);
  return 250;
}

function toErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function parseCoordText(text) {
  if (!text) return null;
  const match = String(text).trim().match(/^(\d+),(\d+)$/);
  if (!match) return null;
  return { x: Number(match[1]), y: Number(match[2]) };
}

function isCoordInBoard(coord) {
  if (!coord) return false;
  return (
    coord.x >= 0 &&
    coord.x < BOARD_SIZE &&
    coord.y >= 0 &&
    coord.y < BOARD_SIZE
  );
}

function coordToLabel(coord) {
  if (!coord) return null;
  return `${String.fromCharCode(65 + coord.x)}${coord.y + 1}`;
}

function labelToCoord(label) {
  const match = String(label || '')
    .trim()
    .match(/^([A-O])(\d{1,2})$/i);
  if (!match) return null;

  const x = match[1].toUpperCase().charCodeAt(0) - 65;
  const y = Number(match[2]) - 1;

  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return null;
  }

  return { x, y };
}

function parseBestlineLabelText(text) {
  const match = String(text || '')
    .trim()
    .match(/([A-O]\d+(?:\s+[A-O]\d+)*)$/);
  if (!match) return [];
  return match[1].split(/\s+/).filter(Boolean);
}

function parseEvalText(line) {
  const messageMatch = String(line || '').match(/Eval\s+([^|]+?)\s*(?:\||$)/i);
  if (messageMatch) return messageMatch[1].trim();
  const infoMatch = String(line || '').match(/\bEVAL\s+(.+)$/i);
  if (infoMatch) return infoMatch[1].trim();
  return null;
}

function parseEvalScore(evalText) {
  if (!evalText) return null;
  if (isMateEval(evalText)) return null;

  const match = String(evalText)
    .trim()
    .match(/^[+-]?\d+(?:\.\d+)?/);
  if (!match) return null;

  return Number(match[0]);
}

function isMateEval(evalText) {
  if (!evalText) return false;
  return /(^|[\s|])(?:[+-]?M(?:\d+)?)(?=$|[\s|])/i.test(evalText.trim());
}

function normalizeMoveList(moves) {
  return moves.map((move, index) => ({
    x: Number(move.x),
    y: Number(move.y),
    color: Number(move.color || (index % 2 === 0 ? 1 : 2)),
  }));
}

class RapfiLocalEngine {
  constructor(options = {}) {
    this.instance = null;
    this.stdoutLines = [];
    this.stderrLines = [];
    this.liveOutput = options.liveOutput !== false;
  }

  async init() {
    if (this.instance) return this.instance;

    this.instance = await Rapfi({
      locateFile: (url) => path.resolve(__dirname, '../engine', url),
      onReceiveStdout: (line) => {
        const text = String(line);
        this.stdoutLines.push(text);
        if (this.liveOutput) {
          console.log(`[rapfi] ${text}`);
        }
      },
      onReceiveStderr: (line) => {
        const text = String(line);
        this.stderrLines.push(text);
        if (this.liveOutput) {
          console.error(`[rapfi:stderr] ${text}`);
        }
      },
      onExit: () => {},
    });

    return this.instance;
  }

  resetLogs() {
    this.stdoutLines = [];
    this.stderrLines = [];
  }

  send(command) {
    if (!this.instance) {
      throw new Error('Rapfi engine is not initialized.');
    }
    this.instance.sendCommand(command);
  }

  async setupPosition(moves, options = {}) {
    const boardSize = Number(options.boardSize || BOARD_SIZE);
    const rule = Number(options.rule || DEFAULT_RULE);
    const depth = Number(options.maxDepth || DEFAULT_DEPTH);
    const threads = Number(options.threads || DEFAULT_THREADS);
    this.resetLogs();
    this.send('YXHASHCLEAR');
    this.send('RESTART');
    await delay(10);
    this.send(`START ${boardSize}`);
    await delay(10);
    this.send(`INFO RULE ${rule}`);
    this.send(`INFO THREAD_NUM ${threads}`);
    this.send(`INFO MAX_DEPTH ${depth}`);
    this.send('YXSHOWINFO 1');
    await delay(20);
    this.send('BOARD');

    for (const move of normalizeMoveList(moves)) {
      this.send(`${move.x},${move.y},${move.color}`);
    }

    this.send('DONE');
  }

  async waitForBestMove(timeoutMs = 10000, idleMs = 250) {
    const startedAt = Date.now();
    let seenIndex = 0;
    let bestMove = null;
    let evalText = null;
    let bestline = [];
    const logs = [];
    let stoppedOnMate = false;
    let lastLineAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      let sawNewLine = false;

      while (seenIndex < this.stdoutLines.length) {
        const line = this.stdoutLines[seenIndex++];
        logs.push(line);
        lastLineAt = Date.now();
        sawNewLine = true;

        const coord = parseCoordText(line);
        if (isCoordInBoard(coord)) bestMove = coord;

        const parsedEval = parseEvalText(line);
        if (parsedEval) {
          evalText = parsedEval;
          if (isMateEval(parsedEval)) {
            stoppedOnMate = true;
            try {
              this.send('YXSTOP');
            } catch (_error) {}
            return {
              bestMove: null,
              evalText,
              bestline,
              logs,
              stoppedOnMate,
            };
          }
        }

        if (/Bestline/i.test(line)) {
          bestline = parseBestlineLabelText(line);
        } else if (/Depth .* \| .* [A-O]\d+(?:\s+[A-O]\d+)*$/i.test(line)) {
          const labels = parseBestlineLabelText(line);
          if (labels.length > 0) bestline = labels;
        }

        if (bestline.length > 0) {
          const coordFromBestline = labelToCoord(bestline[0]);
          if (isCoordInBoard(coordFromBestline)) {
            bestMove = coordFromBestline;
          }
        }
      }

      if (!sawNewLine && bestMove && evalText && Date.now() - lastLineAt >= idleMs) {
        return {
          bestMove,
          evalText,
          bestline,
          logs,
          stoppedOnMate,
        };
      }

      await delay(25);
    }

    throw new Error(
      `Timed out waiting for Rapfi best move. Last logs: ${logs.slice(-8).join(' || ')}. Last stderr: ${this.stderrLines.slice(-4).join(' || ')}`,
    );
  }

  async analyzePosition(moves, options = {}) {
    const attemptOptions = {
      ...options,
      threads: Number(options.threads || DEFAULT_THREADS),
    };
    const maxRetries = Number(options.maxRetries || 3);
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        await this.close();
        await this.init();
        await delay(100);
        await this.setupPosition(moves, attemptOptions);
        const best = await this.waitForBestMove(
          getAnalyzeTimeoutMs(attemptOptions),
          getAnalyzeIdleMs(attemptOptions),
        );

        if (best.stoppedOnMate) {
          await this.close();
        }

        return {
          evalText: best.evalText,
          evalScore: parseEvalScore(best.evalText),
          isMateEval: best.stoppedOnMate || isMateEval(best.evalText),
          bestMove: best.bestMove,
          bestMoveLabel: best.bestline[0] || coordToLabel(best.bestMove),
          bestline: best.bestline,
          logs: [...best.logs],
          stderr: [...this.stderrLines],
          usedThreads: attemptOptions.threads,
          attempt,
        };
      } catch (error) {
        lastError = error;
        if (this.liveOutput) {
          console.error(
            `[rapfi] analyze retry ${attempt}/${maxRetries} failed at threads=${attemptOptions.threads}: ${toErrorMessage(error)}`,
          );
        }
        await delay(150);
      }
    }

    throw new Error(`Rapfi analyzePosition failed after retries: ${toErrorMessage(lastError)}`);
  }

  async close() {
    if (!this.instance) return;
    try {
      this.instance.terminate();
    } catch (_error) {}
    this.instance = null;
  }
}

module.exports = {
  RapfiLocalEngine,
  BOARD_SIZE,
  DEFAULT_RULE,
  DEFAULT_THREADS,
  DEFAULT_DEPTH,
  parseEvalScore,
  isMateEval,
  coordToLabel,
};
