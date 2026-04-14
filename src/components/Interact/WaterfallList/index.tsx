import { Pagination } from 'antd';
import { ReactNode, useEffect, useRef, useState } from 'react';
import styles from './style.less';

interface WaterfallListProps<T> {
  dataSource: T[];
  renderItem: (item: T, index: number) => ReactNode;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
    showLessItems?: boolean;
  };
  loading?: boolean;
  header?: ReactNode;
}

function WaterfallList<T>({
  dataSource,
  renderItem,
  pagination,
  loading,
  header,
}: WaterfallListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  // 响应式列数
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setColumns(4);
      } else if (width >= 900) {
        setColumns(3);
      } else {
        // 移动端和平板都使用2列
        setColumns(2);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // 将数据分配到各列（交替分配以保持视觉平衡）
  const columnData: T[][] = Array.from({ length: columns }, () => []);
  dataSource.forEach((item, index) => {
    columnData[index % columns].push(item);
  });

  const paginationNode = pagination && (
    <Pagination
      className={styles.pagination}
      current={pagination.current}
      pageSize={pagination.pageSize}
      total={pagination.total}
      onChange={pagination.onChange}
      showSizeChanger={false}
      showLessItems={pagination.showLessItems}
      responsive
    />
  );

  return (
    <div className={styles.waterfallContainer} ref={containerRef}>
      {header}
      {paginationNode}
      <div
        className={styles.waterfallGrid}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {columnData.map((column, colIndex) => (
          <div key={colIndex} className={styles.waterfallColumn}>
            {column.map((item, itemIndex) => {
              const originalIndex = itemIndex * columns + colIndex;
              return (
                <div key={originalIndex} className={styles.waterfallItem}>
                  {renderItem(item, originalIndex)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {paginationNode}
    </div>
  );
}

export default WaterfallList;
