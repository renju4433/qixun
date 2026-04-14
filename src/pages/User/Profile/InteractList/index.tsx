import InteractCell from '@/components/Interact/Cell';
import { checkAdmin, listMyPost } from '@/services/api';
import { useModel } from '@@/exports';
import { List } from 'antd';
import { FC, useEffect, useState } from 'react';

const InteractList: FC<{ userId: number }> = ({ userId }) => {
  const [list, setList] = useState<API.PostListResult | null>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const pageSize = 20;

  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const fetchList = () => {
    listMyPost({
      userId,
      pageSize,
      pageNum,
    }).then((res) => {
      if (res.success) setList(res.data);
    });
  };

  useEffect(() => {
    fetchList();
    checkAdmin().then((res) => setIsAdmin(res.data));
  }, [pageNum, userId]);

  return (
    <div>
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

export default InteractList;
