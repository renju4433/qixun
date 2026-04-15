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

const Chessboard: FC<ChessboardProps> = ({ fen }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const validFen = useMemo(() => (fen && isFen(fen) ? fen : 'start'), [fen]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        ensureCss(
          'chessboardjs-css',
          'https://cdn.jsdelivr.net/npm/chessboardjs@1.0.0/www/css/chessboard-1.0.0.min.css',
        );
        await ensureScript(
          'jquery-js',
          'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        );
        await ensureScript(
          'chessboardjs-js',
          'https://cdn.jsdelivr.net/npm/chessboardjs@1.0.0/www/js/chessboard-1.0.0.min.js',
        );

        if (cancelled || !containerRef.current || !window.Chessboard) return;
        boardRef.current = window.Chessboard(containerRef.current, {
          position: validFen,
          draggable: false,
          showNotation: true,
        });
        setReady(true);
      } catch (_) {
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
      <div className={styles.info}>{fen || '等待题目加载...'}</div>
    </div>
  );
};

export default Chessboard;
