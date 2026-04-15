import { FC, useEffect, useMemo, useRef, useState } from 'react';
import styles from './style.less';

type ChessboardProps = {
  fen?: string | null;
};

declare global {
  interface Window {
    Chessboard?: (element: string | HTMLElement, config?: Record<string, any>) => any;
    jQuery?: any;
    $?: any;
  }
}

const isFen = (text: string) => /^([pnbrqkPNBRQK1-8]+\/){7}[pnbrqkPNBRQK1-8]+ [wb] /.test(text);

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

const Chessboard: FC<ChessboardProps> = ({ fen }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>('');
  const validFen = useMemo(() => (fen && isFen(fen) ? fen : 'start'), [fen]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        CHESSBOARD_CSS_URLS.forEach((url, index) =>
          ensureCss(`chessboardjs-css-${index}`, url),
        );
        await loadFirstAvailableScript('jquery-js', JQUERY_URLS);
        await loadFirstAvailableScript('chessboardjs-js', CHESSBOARD_JS_URLS);

        if (cancelled || !containerRef.current || !window.Chessboard) return;
        boardRef.current = window.Chessboard(containerRef.current, {
          position: validFen,
          draggable: false,
          showNotation: true,
        });
        setError('');
        setReady(true);
      } catch (err: any) {
        setError(err?.message || '棋盘脚本加载失败');
        setReady(false);
      }
    };
    init();
    return () => {
      cancelled = true;
      if (boardRef.current && typeof boardRef.current.destroy === 'function') {
        boardRef.current.destroy();
      }
      boardRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (boardRef.current && typeof boardRef.current.position === 'function') {
      boardRef.current.position(validFen, false);
    }
  }, [validFen]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.board} />
      {!ready && <div className={styles.loading}>棋盘加载中...</div>}
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.info}>{fen || '等待题目加载...'}</div>
    </div>
  );
};

export default Chessboard;
