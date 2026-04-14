import {
  getNewMaps,
  getRecentData,
  getRecommendMaps,
  listMapCollection,
  searchMaps,
} from '@/services/api';
import { DragOutlined } from '@ant-design/icons';
import { ProFormInstance, ProTable } from '@ant-design/pro-components';
import { MdPlace } from '@react-icons/all-files/md/MdPlace';
import { MdWhatshot } from '@react-icons/all-files/md/MdWhatshot';
import { Input, Modal, Tabs, Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useRef, useState } from 'react';
import styles from './style.less';

type MapsExploreProps = {
  title: string;
  open: boolean;
  onlySearch?: boolean;
  move?: boolean;
  onChange: (value: number, move: boolean) => void;
  setCanMove?: (value: boolean) => void;
  onClose: () => void;
};

const MapsExplore: FC<MapsExploreProps> = ({
  onChange,
  move,
  open,
  title,
  onClose,
  onlySearch,
}) => {
  const [keyword, setKeyword] = useState<string>('');
  const [pickType, setPickType] = useState<string>('search');
  const ref = useRef<ProFormInstance>();

  useEffect(() => {
    if (pickType !== 'search') setKeyword('');
  }, [pickType]);

  return (
    <Modal
      open={open}
      centered
      maskClosable={false}
      styles={{
        mask: {
          background: 'rgba(9, 7, 35, 0.8)',
          backdropFilter: 'blur(0.5rem)',
        },
        body: { background: 'transparent' },
      }}
      wrapClassName={styles.mapPickerModal}
      title={title}
      width="100%"
      footer={false}
      onCancel={onClose}
    >
      <div className={styles.container}>
        {pickType === 'search' && (
          <Input
            autoFocus
            value={keyword}
            width="100%"
            onChange={(v) => setKeyword(v.target.value)}
          />
        )}
        {!onlySearch && (
          <Tabs
            centered
            activeKey={pickType}
            onChange={setPickType}
            items={[
              { label: '搜索', key: 'search' },
              { label: '精选', key: 'recommend' },
              { label: '历史', key: 'recent' },
              { label: '最新', key: 'new' },
              { label: '收藏', key: 'collection' },
            ]}
          />
        )}

        <ProTable<API.MapItem>
          className={styles.mapTable}
          search={false}
          options={false}
          showHeader={false}
          params={{ type: pickType, keyword }}
          columns={[
            {
              title: '封面',
              dataIndex: 'cover',
              width: 80,
              render: (_, record) => (
                <div className={styles.mapTableCover}>
                  <img
                    src={`https://b68v.daai.fun/${record.cover ??
                      'biz/1659323781589_7d19c33667a54a4dabb0405ee5aec20f.jpeg'
                      }?x-oss-process=image/resize,h_100`}
                  />
                </div>
              ),
            },
            {
              title: '题库名称',
              dataIndex: 'name',
              render: (_, record) => (
                <>
                  <div className={styles.mapTableName}>
                    <span>{record.name}</span>{' '}
                    {record.canMove && (
                      <Tooltip title="支持移动模式（VIP）">
                        <DragOutlined />
                      </Tooltip>
                    )}
                  </div>
                  <div className={styles.mapTableUser}>
                    <span>{record.user.userName}</span>
                  </div>
                  <div className={styles.mapTableDescription}>
                    {record.desc}
                  </div>
                </>
              ),
            },
            {
              title: '地点数',
              dataIndex: 'pcount',
              align: 'right',
              width: 90,
              responsive: ['md'],
              render: (_, record) => (
                <div className={styles.mapTableValueColumn}>
                  <MdPlace />
                  <span>{new BigNumber(record.pcount ?? 0).toFormat(0)}</span>
                </div>
              ),
            },
            {
              title: '人次',
              dataIndex: 'players',
              align: 'right',
              width: 90,
              responsive: ['md'],
              render: (_, record) => (
                <div className={styles.mapTableValueColumn}>
                  <MdWhatshot />
                  <span>{new BigNumber(record.players ?? 0).toFormat(0)}</span>
                </div>
              ),
            },
          ]}
          formRef={ref}
          pagination={false}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => onChange(record.id, record.canMove ? !!move : false),
          })}
          request={async (params) => {
            if (params.type === 'search' || params.type === 'hot') {
              const { data, success } = await searchMaps({
                keyword: params.keyword ?? '',
              });
              return { data, success, total: data.length };
            } else if (params.type === 'recommend') {
              const { data, success } = await getRecommendMaps({ count: 20 });
              return { data, success, total: data.length };
            } else if (params.type === 'recent') {
              const { data, success } = await getRecentData({ count: 20 });
              return { data, success, total: data.length };
            } else if (params.type === 'new') {
              const { data, success } = await getNewMaps({ count: 20 });
              return { data, success, total: data.length };
            } else if (params.type === 'collection') {
              const { data, success } = await listMapCollection();
              return { data, success, total: data.length };
            }
            return { data: [], success: true, total: 0 };
          }}
        />
      </div>
    </Modal>
  );
};

export default MapsExplore;
