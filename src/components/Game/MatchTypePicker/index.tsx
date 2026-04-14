import { publicPath } from '@/constants';
import { getPartyGameTypeName } from '@/utils/GameUtils';
import { RiTeamFill } from '@react-icons/all-files/ri/RiTeamFill';
import { message, Modal } from 'antd';
import { FC, useState } from 'react';
import styles from './style.less';

type MatchTypeProps = {
  value?: PartyMatchType;
  onChange: (value: PartyMatchType) => void;

  // 是否只读
  readonly?: boolean;
};

type MatchTypeContentProps = {
  active?: boolean;
  type?: PartyMatchType;
  onClose: () => void;
  onChange: (value: PartyMatchType) => void;
};

const MatchTypeContent: FC<MatchTypeContentProps> = ({
  active,
  type = 'solo',
  onChange,
  onClose,
}) => (
  <div
    className={styles.matchTypeValueContainer}
    onClick={() => {
      onChange(type);
      onClose();
    }}
  >
    <div
      className={`${styles.matchTypeValueMask} ${
        active ? styles.matchTypeValueActive : ''
      }`}
    >
      <div className={styles.matchTypeValue}>
        <div className={styles.matchTypeDescription}>
          <picture>
            <img
              src={
                type === 'br' || type === 'rank'
                  ? publicPath + '/images/match-mode/streak.svg'
                  : publicPath + '/images/match-mode/duel.svg'
              }
            />
          </picture>

          <h3>
            {type === 'solo'
              ? '1v1'
              : type === 'team'
              ? '组队赛'
              : type === 'br'
              ? '淘汰赛'
              : '排位赛'}
          </h3>
        </div>

        <p>
          {type === 'solo'
            ? '1v1对战'
            : type === 'team'
            ? '组队合作战胜对手'
            : type === 'br'
            ? '谁能站到最后'
            : '争取更高排名'}
        </p>
      </div>
    </div>
    <p>
      <RiTeamFill />
      <span>
        {type === 'solo'
          ? '2'
          : type === 'team' || type === 'rank'
          ? '2-200'
          : '3-200'}
      </span>
    </p>
  </div>
);

const MatchType: FC<MatchTypeProps> = ({ value, onChange, readonly }) => {
  // 弹窗Open状态
  const [matchModal, setMatchModal] = useState<boolean>(false);

  return (
    <div className={styles.matchTypeContainer}>
      <div className={styles.matchTypeSelected}>
        <span>派对类型</span>
        <p>{getPartyGameTypeName(value)}</p>
        <div
          className={styles.matchTypeDescription}
          onClick={() => {
            if (readonly) message.warning('只有房主才能修改');
            else setMatchModal(true);
          }}
        >
          <picture>
            <img
              src={
                value === 'br' || value === 'rank'
                  ? publicPath + '/images/match-mode/streak.svg'
                  : publicPath + '/images/match-mode/duel.svg'
              }
            />
          </picture>

          <h3>{getPartyGameTypeName(value)}</h3>
        </div>
      </div>

      <Modal
        open={matchModal}
        centered
        maskClosable={false}
        maskStyle={{
          background: 'rgba(9, 7, 35, 0.8)',
          backdropFilter: 'blur(0.5rem)',
        }}
        bodyStyle={{
          background: 'transparent',
        }}
        wrapClassName={styles.matchModal}
        title="选择派对类型"
        width="100%"
        footer={false}
        onCancel={() => setMatchModal(false)}
      >
        <MatchTypeContent
          type="rank"
          active={value === 'rank'}
          onClose={() => setMatchModal(false)}
          onChange={onChange}
        />
        <MatchTypeContent
          type="solo"
          active={value === 'solo'}
          onClose={() => setMatchModal(false)}
          onChange={onChange}
        />
        <MatchTypeContent
          type="team"
          active={value === 'team'}
          onClose={() => setMatchModal(false)}
          onChange={onChange}
        />
        <MatchTypeContent
          type="br"
          active={value === 'br'}
          onClose={() => setMatchModal(false)}
          onChange={onChange}
        />
      </Modal>
    </div>
  );
};

export default MatchType;
