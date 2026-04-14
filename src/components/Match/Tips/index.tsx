import { getTips } from '@/services/api';
import { useEffect, useState } from 'react';

const Tips = () => {
  const [tip, setTip] = useState<string>('');

  const getTip = async () => {
    try {
      const response = await getTips();
      if (response.success && response.data && response.data.tip) {
        setTip(response.data.tip);
      }
    } catch (error) {}
  };

  useEffect(() => {
    getTip();

    const intervalId = setInterval(() => {
      getTip();
    }, 5000);

    // 组件卸载时清除定时器
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      style={{
        textAlign: 'center',
        color: 'gray',
        fontSize: '12px',
        padding: '0 10px',
        cursor: 'pointer',
      }}
      onClick={getTip}
    >
      <div>提示: {tip}</div>
    </div>
  );
};

export default Tips;
