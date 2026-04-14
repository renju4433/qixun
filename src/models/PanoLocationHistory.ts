import { useCallback, useRef, useState } from 'react';

// 全景路由记录模型
export default () => {
  const history = useRef<
    {
      panoId: string;
      heading: number;
      pitch: number;
    }[]
  >([]); // 用于存储历史记录
  const [hasPrevLocation, setHasPrevLocation] = useState<boolean>(false); // 是否有上一个历史记录

  // 更新是否有上一个历史记录
  const updateHasLocation = useCallback(() => {
    setHasPrevLocation(() => history.current.length > 1);
  }, []);

  // 全景路由变化记录
  const onPanoLocationChange = useCallback(
    (pano: { panoId: string; heading: number; pitch: number }) => {
      // TODO: 不太好的写法，之后根据移动位移量确认是否需要记录
      if (pano) {
        history.current.push(pano);
        updateHasLocation();
      }
    },
    [updateHasLocation],
  );

  // 获取上一个全景路由
  const getPrevLocation = useCallback(() => {
    if (hasPrevLocation && history.current.length >= 2) {
      return history.current[history.current.length - 2];
    }
  }, [hasPrevLocation]);

  // 返回上一个全景路由
  const onReturnToPrevLocation = useCallback(() => {
    if (history.current.length >= 2) {
      history.current.splice(history.current.length - 2, 2);
      updateHasLocation();
    }
  }, [hasPrevLocation]);

  const clearHistory = useCallback(() => {
    history.current = [];
  }, []);

  return {
    onPanoLocationChange,
    hasPrevLocation,
    getPrevLocation,
    onReturnToPrevLocation,
    clearHistory,
  };
};
