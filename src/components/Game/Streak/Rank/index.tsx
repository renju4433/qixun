import qixunAvatar from '@/components/User/qixunAvatar';
import { getStreakRank } from '@/services/api';
import { ProCard, ProTable } from '@ant-design/pro-components';
import BigNumber from 'bignumber.js';
import { FC, useState } from 'react';
import styles from './style.less';
import { useNavigate } from '@umijs/max';

type StreakRankProps = {
  type: StreakType;
};

const StreakRank: FC<StreakRankProps> = ({ type }) => {
  const navigate = useNavigate();
  const [rankType, setRankType] = useState<StreakRankType>('friends');

  return (
    <ProCard
      title="好友排行榜"
      subTitle="记录单人最好成绩"
      ghost
      className={styles.rankWrap}
    >
      <ProTable
        params={{ type, rankType }}
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
                onClick={() => navigate(`/user/${record.user.userId}`)}
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
            title: '连胜局数',
            dataIndex: 'score',
            align: 'right',
            className: styles.scoreColumn,
            render: (_, record) => new BigNumber(record.bestStreaks).toFormat(),
          },
        ]}
        request={async () => {
          const data = await getStreakRank({ type, player: rankType });
          return {
            success: data.success,
            data: data.data,
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
  );
};

export default StreakRank;