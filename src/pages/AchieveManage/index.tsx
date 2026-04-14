import { listAchievementsManage } from '@/services/api';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Button, FloatButton, Table, Tag } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import AchieveEdit from '../../components/Admin/AchieveEdit';
import './style.less';

const AchieveManage = () => {
  const [achievementList, setAchievementList] = useState<
    API.AchievementManageItem[] | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [chosen, setChosen] = useState<API.AchievementManageItem | null>(null);
  const [editTyp, setEditTyp] = useState<string>('create');

  const loadAchievements = () => {
    setIsLoading(true);
    listAchievementsManage().then((res) => {
      if (res.data) {
        setAchievementList(res.data);
        setIsLoading(false);
      }
    });
  };

  useEffect(loadAchievements, []);

  const columns = [
    { title: '成就 ID', dataIndex: 'id', key: 'id' },
    { title: '成就名称', dataIndex: 'name', key: 'name' },
    { title: '成就描述', dataIndex: 'hint', key: 'hint' },
    { title: '达成方式', dataIndex: 'task', key: 'task' },
    { title: '宝石奖励', dataIndex: 'gems', key: 'gems' },
    { title: '系列标识', dataIndex: 'seriesId', key: 'seriesId' },
    { title: '系列位次', dataIndex: 'seriesSeq', key: 'seriesSeq' },
    {
      title: '隐藏&禁用',
      key: 'hiddendisabled',
      render: (_: string, record: API.AchievementManageItem) => (
        <>
          {record.hidden ? <Tag color="gold">隐藏</Tag> : <Tag>普通</Tag>}{' '}
          {record.disabled ? (
            <Tag icon={<CloseCircleOutlined />} color="error">
              禁用
            </Tag>
          ) : (
            <Tag icon={<CheckCircleOutlined />} color="success">
              启用
            </Tag>
          )}
        </>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      render: (gmtCreate: number) =>
        moment(gmtCreate).format('YYYY-MM-DD HH:mm:ss'),
    },
    { title: '获得人数', dataIndex: 'count', key: 'count' },
    { title: '授予条件', dataIndex: 'action', key: 'action' },
    { title: '阈值', dataIndex: 'actionCount', key: 'actionCount' },
    {
      title: '操作',
      render: (record: API.AchievementManageItem) => (
        <Button
          onClick={() => {
            setChosen(record);
            setEditTyp('edit');
            setShowModal(true);
          }}
        >
          修改
        </Button>
      ),
    },
  ];

  return (
    <>
      {achievementList && (
        <>
          <Table
            className="table"
            dataSource={achievementList}
            columns={columns}
            rowKey={(record) => record.id.toString()}
            loading={isLoading}
            pagination={false}
          />
          <FloatButton.Group shape="square">
            <FloatButton
              description={achievementList?.length}
              tooltip="成就总量"
            />
            <FloatButton
              icon={<PlusCircleOutlined />}
              tooltip="新增"
              onClick={() => {
                setChosen(null);
                setEditTyp('create');
                setShowModal(true);
              }}
            />
            <FloatButton.BackTop />
          </FloatButton.Group>
          <AchieveEdit
            achievement={chosen}
            typ={editTyp}
            show={showModal}
            setShow={setShowModal}
            reload={loadAchievements}
          />
        </>
      )}
    </>
  );
};

export default AchieveManage;
