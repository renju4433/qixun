import qixunAvatar from '@/components/User/qixunAvatar';
import { getDailyChallengeRank } from '@/services/api';
import { ProCard, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Segmented } from 'antd';
import BigNumber from 'bignumber.js';
import { FC, useState } from 'react';
import styles from './style.less';

type DailyChallengeRankProps = {
  challengeId?: string;
  /** 题库挑战页：全部在前、默认全部；每日挑战不传，保持好友在前、默认好友 */
  globalRankFirst?: boolean;
};

const DailyChallengeRank: FC<DailyChallengeRankProps> = ({
  challengeId,
  globalRankFirst,
}) => {
  const [rankType, setRankType] = useState<DailyChallengeRankType>(
    globalRankFirst ? 'rankNew' : 'rankFriend',
  );

  const segmentedOptions = globalRankFirst
    ? [
        { label: '全部', value: 'rankNew' as const },
        { label: '好友', value: 'rankFriend' as const },
      ]
    : [
        { label: '好友', value: 'rankFriend' as const },
        { label: '全部', value: 'rankNew' as const },
      ];

  return (
    challengeId && (
      <ProCard
        title={globalRankFirst ? '排行榜' : '今日排行榜'}
        ghost
        className={styles.rankWrap}
      >
        <div className={styles.rankTypeSelector}>
          <Segmented
            options={segmentedOptions}
            onChange={(value) => setRankType(value as DailyChallengeRankType)}
            size="large"
          />
        </div>

        <ProTable
          params={{ rankType, challengeId }}
          size="small"
          search={false}
          options={false}
          showHeader={false}
          className={styles.rankTable}
          columns={[
            {
              title: '排名',
              dataIndex: 'rank',
              width: 43,
              align: 'center',
              className: styles.rankColumn,
              render: (_, record, index) => `${index + 1}.`,
            },
            {
              title: '用户',
              dataIndex: 'user',
              render: (_, record) => (
                <div
                  className={styles.userColumn}
                  onClick={() => history.push(`/user/${record.user.userId}`)}
                >
                  <qixunAvatar user={record.user} size={40} />
                  <span className="ml-2">{record.user.userName}</span>
                </div>
              ),
            },
            {
              title: '地域',
              dataIndex: 'province',
              align: 'right',
              className: styles.provinceColumn,
              render: (_, record) => <div>{record.user.province ?? ''}</div>,
            },
            {
              title: '得分',
              dataIndex: 'score',
              align: 'right',
              className: styles.scoreColumn,
              render: (_, record) => new BigNumber(record.score).toFormat(),
            },
          ]}
          request={async () => {
            const data = await getDailyChallengeRank({
              rankType,
              challengeId,
            });
            return {
              success: data.success,
              data: data.data.rank,
              total: 100, // 目前只取100条
            };
          }}
          pagination={{
            pageSize: 100,
            showTotal: () => false,
            itemRender: () => null,
            showSizeChanger: false,
          }}
          rowKey={(record) => record.user.userId}
        />
      </ProCard>
    )
  );
};

export default DailyChallengeRank;
