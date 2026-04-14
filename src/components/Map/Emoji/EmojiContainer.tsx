import styles from '@/components/Map/Emoji/style.less';
import { getEmojis, sendEmoji, sendPartyEmoji } from '@/services/api';
import { history } from '@@/core/history';
import { SmileOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { FC, useCallback, useEffect, useState } from 'react';
import { isDesktop } from 'react-device-detect';

type EmojiContainerProps = {
  emoji: any;
  gameType?: GameType | null;
  gameId?: string | null;
  partyId?: string | null;
};

const EmojiContainer: FC<EmojiContainerProps> = ({
  emoji,
  gameType,
  gameId,
  partyId,
}) => {
  const [showTimer, setShowTimer] = useState<NodeJS.Timeout | null>(null);
  const [showEmoji, setShowEmoji] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showIcon, setShowIcon] = useState<boolean>(true);
  const [emojis, setEmojis] = useState<API.Emoji[]>([]);

  const keybordHandler = useCallback(
    (event: KeyboardEvent) => {
      if (
        gameType === 'solo' ||
        gameType === 'solo_match' ||
        gameType === 'team' ||
        gameType === 'team_match' ||
        gameType === 'battle_royale' ||
        gameType === 'rank' ||
        partyId
      ) {
      } else return;

      if (
        // @ts-ignore
        event.target?.tagName.toLowerCase() === 'input' ||
        // @ts-ignore
        event.target?.tagName.toLowerCase() === 'textarea'
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'e') setShowModal((v) => !v);
    },
    [gameType, partyId],
  );

  function get() {
    getEmojis().then((res) => {
      if (res.success) setEmojis(res.data);
    });
  }

  useEffect(get, []);

  useEffect(() => {
    document.addEventListener('keydown', keybordHandler, {
      capture: true,
    });

    return () => {
      document.removeEventListener('keydown', keybordHandler, {
        capture: true,
      });
    };
  }, [gameType, partyId]);

  useEffect(() => {
    if (emoji) {
      setShowEmoji(true);
      if (showTimer) clearTimeout(showTimer);

      setShowTimer(
        setTimeout(() => {
          setShowEmoji(false);
        }, 3000),
      );
    }
  }, [emoji]);

  return (
    <div className={styles.emoji}>
      {showIcon &&
        (gameType === 'solo' ||
          gameType === 'solo_match' ||
          gameType === 'team' ||
          gameType === 'team_match' ||
          gameType === 'battle_royale' ||
          gameType === 'rank' ||
          partyId) && (
          <div
            style={{
              height: '40px',
              width: '40px',
              backgroundColor: 'black',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
              cursor: 'pointer',
            }}
          >
            <SmileOutlined
              style={{ fontSize: '20px' }}
              // style={{ color: 'white' }}
              onClick={() => setShowModal(true)}
            />
          </div>
        )}
      {emoji && showEmoji && (
        <div className={styles.message}>
          <div className={styles.userName}>{emoji.user.userName}:</div>
          <img
            className={styles.emojiItem}
            src={
              new Date().getTime() >= 1743436800000 &&
                new Date().getTime() <= 1743523200000
                ? `https://b68v.daai.fun/${emoji.image}?x-oss-process=image/rotate,180`
                : `https://b68v.daai.fun/${emoji.image}`
            }
          />
        </div>
      )}
      {showModal && (
        <Modal
          centered={true}
          open={showModal}
          okButtonProps={{ style: { display: 'none' } }}
          title={'选择表情' + (isDesktop ? '(呼出快捷键E)' : '')}
          cancelText={'取消' + (isDesktop ? '(快捷键E)' : '')}
          footer={
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Button type="primary" onClick={() => history.push('/mall')}>
                商店购买
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setShowIcon(true);
                }}
              >
                {'取消' + (isDesktop ? '(快捷键E)' : '')}
              </Button>
            </div>
          }
          onCancel={() => {
            setShowModal(false);
            setShowIcon(true);
          }}
        >
          {emojis.map((item) => (
            <img
              style={{
                height: '50px',
                width: '50px',
                objectFit: 'contain',
                padding: '5px',
                cursor: 'pointer',
              }}
              className={styles.emojiItem}
              src={`https://b68v.daai.fun/${item.image}`}
              key={item.id}
              alt={item.id}
              onClick={() => {
                if (gameId) {
                  sendEmoji({ emojiId: item.id, gameId: gameId! });
                } else if (partyId) {
                  sendPartyEmoji({ emojiId: item.id, partyId: partyId });
                }
                setShowModal(false);
                setShowIcon(true);
              }}
            />
          ))}
        </Modal>
      )}
    </div>
  );
};

export default EmojiContainer;
