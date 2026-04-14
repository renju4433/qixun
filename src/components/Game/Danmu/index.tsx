import { useModel } from '@umijs/max';
import BulletScreen from 'rc-bullets-ts';
import { FC, useEffect, useRef } from 'react';
import styles from './style.less';

type DanmuProps = {
  model: 'Point.model';
};

const Danmu: FC<DanmuProps> = ({ model }) => {
  const { newDanmu } = useModel(model, (model) => ({
    newDanmu: model.newDanmu,
  }));
  const danmakuInsRef = useRef<BulletScreen | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const danmakuIns = new BulletScreen(screenRef.current, {
      duration: 10,
    });
    danmakuInsRef.current = danmakuIns;
    return () => {
      if (danmakuInsRef.current) {
        danmakuInsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (danmakuInsRef.current && newDanmu) {
      danmakuInsRef.current.push({
        msg: newDanmu,
        size: 'large',
        backgroundColor: 'transparent',
      });
    }
  }, [newDanmu]);

  return <div ref={screenRef} className={styles.danmuContainer} />;
};

export default Danmu;
