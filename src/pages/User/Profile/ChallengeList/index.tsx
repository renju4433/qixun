import InteractCell from '@/components/Interact/Cell';
import { checkAdmin, listMyPostChallenges } from '@/services/api';
import { useModel } from '@umijs/max';
import { List, Segmented } from 'antd';
import { FC, useEffect, useState } from 'react';

const ChallengeList: FC<{ userId: number }> = ({ userId }) => {
  const [list, setList] = useState<API.PostListResult | null>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [subSort, setSubSort] = useState<string>('post');
  const [solveStatus, setSolveStatus] = useState<string>('all'); // 新增：已解/未解状态
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const pageSize = 20;

  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const fetchList = () => {
    listMyPostChallenges({
      userId,
      pageSize,
      pageNum,
      sort: subSort,
      period: 'all',
      solveStatus: subSort === 'post' ? solveStatus : undefined, // 只在"发布"选项时传递solveStatus
    }).then((res) => {
      if (res.success) setList(res.data);
    });
  };

  useEffect(() => {
    fetchList();
    checkAdmin().then((res) => setIsAdmin(res.data));
  }, [pageNum, subSort, solveStatus, userId]);

  return (
    <div>
      <Segmented
        size="small"
        defaultValue={subSort}
        onChange={(value) => {
          setPageNum(1);
          setSubSort(value);
          // 切换到"解决"时，重置solveStatus
          if (value === 'success') {
            setSolveStatus('all');
          }
        }}
        options={[
          { label: '发布', value: 'post' },
          { label: '解决', value: 'success' },
        ]}
      ></Segmented>
      {subSort === 'post' && (
        <Segmented
          size="small"
          style={{ marginLeft: '10px' }}
          value={solveStatus}
          onChange={(value) => {
            setPageNum(1);
            setSolveStatus(value);
          }}
          options={[
            { label: '全部', value: 'all' },
            { label: '已解', value: 'solved' },
            { label: '未解', value: 'unsolved' },
          ]}
        ></Segmented>
      )}
      <List
        split={false}
        pagination={{
          position: 'both',
          align: 'start',
          showSizeChanger: false,
          current: pageNum,
          pageSize,
          total: list ? list.total : 0,
          onChange: (value) => setPageNum(value),
          showLessItems: true,
        }}
        dataSource={list?.posts}
        renderItem={(item) => (
          <List.Item>
            <InteractCell
              key={item.id}
              post={item}
              userId={user?.userId}
              isAdmin={isAdmin}
              fetch={fetchList}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default ChallengeList;
