import qixunAvatar from '@/components/User/qixunAvatar';
import { history } from '@umijs/max';
import { Flex, Modal, Segmented } from 'antd';
import { FC } from 'react';

type MapRankingProps = {
  showRank: boolean;
  setShowRank: (show: boolean) => void;
  rank: string;
  options: { label: string; value: string }[];
  setRank: (rank: 'move' | 'noMove' | 'npmz') => void;
  sort: string;
  setSort: (sort: string) => void;
  ranks: API.DailyChallengeRank[];
};

const MapRanking: FC<MapRankingProps> = ({
  showRank,
  setShowRank,
  rank,
  options,
  setRank,
  sort,
  setSort,
  ranks,
}) => (
  <Modal
    title="题库排行榜"
    open={showRank}
    footer={null}
    onCancel={() => setShowRank(false)}
  >
    <div>暂只记录经典5轮的成绩</div>
    <Flex gap="small" style={{ margin: '5px 0' }}>
      <Segmented
        defaultValue={rank}
        options={options}
        onChange={(v) => setRank(v as 'move' | 'noMove' | 'npmz')}
      />
      <Segmented
        defaultValue={sort}
        options={[
          { label: '好友', value: 'friend' },
          { label: '全部', value: 'all' },
        ]}
        onChange={(v) => setSort(v)}
      />
    </Flex>
    {ranks.map((item, index) => (
      <Flex key={index} align="center" justify="space-between">
        <Flex
          align="center"
          style={{ cursor: 'pointer' }}
          onClick={() => history.push(`/user/${item.user.userId}`)}
        >
          <td style={{ width: 32, textAlign: 'right' }}>{index + 1}.</td>
          <qixunAvatar size={32} user={item.user} />
          <div style={{ flex: 1, color: 'inherit' }}>{item.user.userName}</div>
        </Flex>
        <div>{item.score}</div>
      </Flex>
    ))}
  </Modal>
);

export default MapRanking;
