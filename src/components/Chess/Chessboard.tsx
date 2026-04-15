import { FC, useEffect, useMemo, useRef, useState } from 'react';
import styles from './style.less';

type ChessboardProps = {
  fen?: string | null;
  onMove?: (move: { from: string; to: string; piece: string; uci: string; fen: string }) => void;
  highlightedSquares?: string[];
  resetKey?: string | number;
  showFenInfo?: boolean;
};

declare global {
  interface Window {
    Chessboard?: (element: string | HTMLElement, config?: Record<string, any>) => any;
    jQuery?: any;
    $?: any;
  }
}

const isFen = (text: string) => /^([pnbrqkPNBRQK1-8]+\/){7}[pnbrqkPNBRQK1-8]+ [wb] /.test(text);

const normalizeFen = (text?: string | null) => {
  const raw = String(text || '').trim();
  if (!isFen(raw)) return 'start';
  const parts = raw.split(/\s+/);
  if (parts.length < 6) return raw;
  const halfmove = Number(parts[4]);
  const fullmove = Number(parts[5]);
  parts[4] = Number.isFinite(halfmove) && halfmove >= 0 ? String(Math.floor(halfmove)) : '0';
  parts[5] = Number.isFinite(fullmove) && fullmove >= 1 ? String(Math.floor(fullmove)) : '1';
  return parts.join(' ');
};

const CHESSBOARD_CSS_URLS = [
  'https://cdn.jsdelivr.net/npm/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css',
  'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css',
];

const JQUERY_URLS = [
  'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
  'https://unpkg.com/jquery@3.7.1/dist/jquery.min.js',
];

const CHESSBOARD_JS_URLS = [
  'https://cdn.jsdelivr.net/npm/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js',
  'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js',
];

type ChessInstance = {
  load: (fen: string) => boolean;
  move: (move: {
    from: string;
    to: string;
    promotion?: 'q' | 'r' | 'b' | 'n';
  }) =>
    | {
        color: string;
        from: string;
        to: string;
        piece: string;
        san: string;
        flags: string;
        promotion?: string;
      }
    | null;
  fen: () => string;
};

type ChessCtor = new (fen?: string) => ChessInstance;

const CHESS_JS_MODULE_URLS = [
  'https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm',
  'https://unpkg.com/chess.js@1.4.0/dist/esm/chess.js',
];

const getPieceThemeUrl = (piece: string) =>
  `/images/chesspieces/wikipedia/${piece}.png`;

const ensureCss = (id: string, href: string) => {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const ensureScript = (id: string, src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if ((existing as any).dataset.loaded === '1') return resolve();
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`load failed: ${src}`)), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      (script as any).dataset.loaded = '1';
      resolve();
    };
    script.onerror = () => reject(new Error(`load failed: ${src}`));
    document.body.appendChild(script);
  });

const loadFirstAvailableScript = async (idPrefix: string, urls: string[]) => {
  let lastError: Error | null = null;
  for (let i = 0; i < urls.length; i += 1) {
    try {
      await ensureScript(`${idPrefix}-${i}`, urls[i]);
      return;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError || new Error(`load failed: ${idPrefix}`);
};

const loadFirstAvailableModule = async (urls: string[]): Promise<ChessCtor> => {
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const mod = await import(/* webpackIgnore: true */ url);
      const Chess = mod?.Chess;
      if (typeof Chess === 'function') return Chess as ChessCtor;
      lastError = new Error(`module missing Chess export: ${url}`);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError || new Error('load failed: chess.js');
};

const Chessboard: FC<ChessboardProps> = ({
  fen,
  onMove,
  highlightedSquares = [],
  resetKey = 0,
  showFenInfo = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<any>(null);
  const gameRef = useRef<ChessInstance | null>(null);
  const chessCtorRef = useRef<ChessCtor | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>('');
  const validFen = useMemo(() => normalizeFen(fen), [fen]);

  const clearHighlights = () => {
    if (!containerRef.current) return;
    containerRef.current
      .querySelectorAll('[data-highlighted="1"]')
      .forEach((el) => {
        el.removeAttribute('data-highlighted');
      });
  };

  const applyHighlights = () => {
    if (!containerRef.current) return;
    clearHighlights();
    highlightedSquares.forEach((square) => {
      const cell = containerRef.current?.querySelector(`.square-${square}`) as HTMLElement | null;
      if (cell) {
        cell.setAttribute('data-highlighted', '1');
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        CHESSBOARD_CSS_URLS.forEach((url, index) =>
          ensureCss(`chessboardjs-css-${index}`, url),
        );
        await loadFirstAvailableScript('jquery-js', JQUERY_URLS);
        chessCtorRef.current = await loadFirstAvailableModule(CHESS_JS_MODULE_URLS);
        await loadFirstAvailableScript('chessboardjs-js', CHESSBOARD_JS_URLS);

        if (cancelled || !containerRef.current || !window.Chessboard || !chessCtorRef.current) return;
        gameRef.current = new chessCtorRef.current(validFen === 'start' ? undefined : validFen);
        boardRef.current = window.Chessboard(containerRef.current, {
          position: validFen,
          draggable: true,
          showNotation: true,
          pieceTheme: getPieceThemeUrl,
          onDrop: (source: string, target: string, piece: string) => {
            if (!source || !target || source === target) return 'snapback';
            if (!gameRef.current) return 'snapback';
            let moved: ReturnType<ChessInstance['move']> = null;
            try {
              moved = gameRef.current.move({
                from: source,
                to: target,
                promotion: 'q',
              });
            } catch (_err) {
              return 'snapback';
            }
            if (!moved) return 'snapback';
            const uci = `${moved.from}${moved.to}${moved.promotion || ''}`;
            onMove?.({
              from: moved.from,
              to: moved.to,
              piece,
              uci,
              fen: gameRef.current.fen(),
            });
            return undefined;
          },
        });
        if (boardRef.current && typeof boardRef.current.resize === 'function') {
          boardRef.current.resize();
        }
        applyHighlights();
        setError('');
        setReady(true);
      } catch (err: any) {
        setError(err?.message || '棋盘脚本加载失败');
        setReady(false);
      }
    };
    init();

    const handleResize = () => {
      if (boardRef.current && typeof boardRef.current.resize === 'function') {
        boardRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      if (boardRef.current && typeof boardRef.current.destroy === 'function') {
        boardRef.current.destroy();
      }
      boardRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chessCtorRef.current) {
      gameRef.current = new chessCtorRef.current(validFen === 'start' ? undefined : validFen);
    }
    if (boardRef.current && typeof boardRef.current.position === 'function') {
      boardRef.current.position(validFen, false);
    }
    setTimeout(() => {
      applyHighlights();
    }, 0);
  }, [validFen, resetKey]);

  useEffect(() => {
    applyHighlights();
  }, [highlightedSquares.join(',')]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.board} />
      {!ready && <div className={styles.loading}>棋盘加载中...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {showFenInfo && <div className={styles.info}>{fen || '等待题目加载...'}</div>}
    </div>
  );
};

export default Chessboard;
