import qixunAvatar from '@/components/User/qixunAvatar';
import useNotify from '@/hooks/use-notify';
import { history, useModel } from '@umijs/max';
import { message } from 'antd';
import { FC, useEffect, useRef, useState } from 'react';
import styles from './style.less';

type SoloMatchUserProps = {
  user: API.UserProfile;
  china: boolean | null | undefined;
};
const SoloMatchUser: FC<SoloMatchUserProps> = ({ user, china }) => (
  <div className={styles.soloMatchUser}>
    <div className={styles.avatar}>
      <qixunAvatar user={user} />
    </div>
    <div>{user.userName}</div>
    {china && <div>中国积分：{user.chinaRating}</div>}
    {!china && <div>全球积分：{user.rating}</div>}
  </div>
);

type SoloMatchCountDownProps = {
  model: 'Challenge.model';
};
const SoloMatchCountDown: FC<SoloMatchCountDownProps> = ({ model }) => {
  const { gameData } = useModel(model, (model) => ({
    gameData: model.gameData,
  }));

  const notified = useRef(false);
  const notify = useNotify();

  useEffect(() => {
    if (
      gameData?.status === 'wait_join' &&
      gameData?.type === 'solo_match' &&
      !notified.current
    ) {
      notify('棋寻已匹配到对手，点击开始对战');
      notified.current = true;
    }
  }, [gameData]);

  useEffect(() => {
    if (gameData?.status === 'match_fail') {
      message.error('匹配失败，继续匹配');
      if (gameData?.china) {
        if (gameData.move) {
          message.error('匹配失败，继续匹配');
          history.push('/match?tab=china&from=move');
        } else if (!gameData.move) {
          history.push('/match?tab=china&from=noMove');
        }
      } else {
        if (gameData.move) {
          history.push('/match?tab=world&from=move');
        } else if (!gameData.move) {
          history.push('/match?tab=world&from=noMove');
        }
      }
    }
  }, [gameData]);

  const [gameTimeLeft, setGameTimeLeft] = useState<number | undefined>();
  const timer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);

    timer.current = setInterval(() => {
      if (gameData && gameData.timerStartTime && gameData.startTimerPeriod) {
        const tGameTimeLeft = Math.round(
          (gameData.startTimerPeriod -
            (new Date().getTime() - gameData.timerStartTime)) /
          1000,
        );
        if (tGameTimeLeft < 0) {
          setGameTimeLeft(0);
          clearInterval(timer.current);
        } else {
          setGameTimeLeft(tGameTimeLeft);
        }
      } else if (gameData?.startTimerPeriod) {
        setGameTimeLeft(Math.round(gameData.startTimerPeriod / 1000));
        clearInterval(timer.current);
      }
    }, 500);
    return () => {
      clearInterval(timer.current);
    };
  }, [gameData, timer]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.countdownContainer}>
        <div className={styles.title}>匹配成功</div>
        <div className={styles.countdownTitle}>开始倒计时</div>
        <div className={styles.countdown}>
          {gameTimeLeft === undefined ? '-' : gameTimeLeft} 秒
        </div>
      </div>
      {gameData && gameData.type === 'solo_match' && (
        <div className={styles.vs}>
          <div className={styles.team}>
            {gameData?.teams?.[0]?.teamUsers?.[0] && (
              <SoloMatchUser
                user={gameData?.teams?.[0]?.teamUsers?.[0].user}
                china={gameData?.china}
              />
            )}
          </div>
          <div className={styles.vsText}>VS</div>
          <div className={styles.team}>
            {gameData?.teams?.[1]?.teamUsers?.[0] && (
              <SoloMatchUser
                user={gameData?.teams?.[1]?.teamUsers?.[0].user}
                china={gameData?.china}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SoloMatchCountDown;
