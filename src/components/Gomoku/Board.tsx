import type { MouseEvent } from 'react';
import { useMemo } from 'react';
import styles from './style.less';

type GomokuMove = {
  moveIndex: number;
  x: number;
  y: number;
  color: number;
};

type Point = {
  x: number;
  y: number;
};

type GomokuBoardProps = {
  moves: GomokuMove[];
  canPlay?: boolean;
  onPlay?: (x: number, y: number) => void;
  winLine?: Point[] | null;
};

const CELL = 40;
const PADDING = 24;
const SIZE = PADDING * 2 + CELL * 14;
const STAR_POINTS = [
  [3, 3],
  [3, 11],
  [7, 7],
  [11, 3],
  [11, 11],
];

const GomokuBoard = ({ moves, canPlay, onPlay, winLine }: GomokuBoardProps) => {
  const board = useMemo(() => {
    const map = new Map<string, GomokuMove>();
    for (const move of moves) {
      map.set(`${move.x},${move.y}`, move);
    }
    return map;
  }, [moves]);

  const winSet = useMemo(
    () => new Set((winLine || []).map((point) => `${point.x},${point.y}`)),
    [winLine],
  );

  const lastMove = moves[moves.length - 1];

  const handleBoardClick = (event: MouseEvent<SVGSVGElement>) => {
    if (!canPlay || !onPlay) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const x = Math.round((px * scaleX - PADDING) / CELL);
    const y = Math.round((py * scaleY - PADDING) / CELL);

    if (x < 0 || x > 14 || y < 0 || y > 14) return;
    if (board.has(`${x},${y}`)) return;
    onPlay(x, y);
  };

  return (
    <div className={styles.wrap}>
      <svg
        className={`${styles.board} ${canPlay ? styles.boardActive : ''}`}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onClick={handleBoardClick}
      >
        <rect x={0} y={0} width={SIZE} height={SIZE} rx={24} className={styles.bg} />
        {Array.from({ length: 15 }).map((_, index) => {
          const pos = PADDING + index * CELL;
          return (
            <g key={index}>
              <line
                x1={PADDING}
                y1={pos}
                x2={SIZE - PADDING}
                y2={pos}
                className={styles.grid}
              />
              <line
                x1={pos}
                y1={PADDING}
                x2={pos}
                y2={SIZE - PADDING}
                className={styles.grid}
              />
            </g>
          );
        })}

        {STAR_POINTS.map(([x, y]) => (
          <circle
            key={`${x}-${y}`}
            cx={PADDING + x * CELL}
            cy={PADDING + y * CELL}
            r={4}
            className={styles.star}
          />
        ))}

        {moves.map((move) => {
          const cx = PADDING + move.x * CELL;
          const cy = PADDING + move.y * CELL;
          const key = `${move.x},${move.y}`;
          const isLast = lastMove?.moveIndex === move.moveIndex;
          const isWin = winSet.has(key);

          return (
            <g key={move.moveIndex}>
              <circle
                cx={cx}
                cy={cy}
                r={16}
                className={
                  move.color === 1
                    ? isWin
                      ? styles.blackWin
                      : styles.blackStone
                    : isWin
                      ? styles.whiteWin
                      : styles.whiteStone
                }
              />
              {isLast && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  className={move.color === 1 ? styles.lastOnBlack : styles.lastOnWhite}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GomokuBoard;
