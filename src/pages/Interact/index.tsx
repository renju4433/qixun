import InteractCell from '@/components/Interact/Cell';
import WaterfallCell from '@/components/Interact/WaterfallCell';
import WaterfallList from '@/components/Interact/WaterfallList';
import NormalPage from '@/pages/NormalPage';
import { checkAdmin, getPost, listMyPost, listPosts } from '@/services/api';
import { history, useModel, useSearchParams } from '@umijs/max';
import { Button, List, Segmented } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const Interact = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [postResult, setPostResult] = useState<API.PostListResult | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const pageSize = 20;

  // 从URL参数读取初始值
  const pageNum = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'new';
  const period = searchParams.get('period') || 'week';

  const [directPost, setDirectPost] = useState<API.PostParams | null>(null);
  const autoOpenId = useMemo(
    () => (searchParams.get('id') ? Number(searchParams.get('id')) : null),
    [searchParams],
  );
  const initialIdRef = useRef<string | null>(searchParams.get('id'));
  const [enableDirectOpen, setEnableDirectOpen] = useState<boolean>(
    !!initialIdRef.current,
  );

  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const clearIdParam = () => {
    if (searchParams.get('id')) {
      const next = new URLSearchParams(searchParams);
      next.delete('id');
      // 保留其他参数
      if (searchParams.get('page')) next.set('page', searchParams.get('page')!);
      if (searchParams.get('sort')) next.set('sort', searchParams.get('sort')!);
      if (searchParams.get('period'))
        next.set('period', searchParams.get('period')!);
      setSearchParams(next, { replace: true });
    }
  };
  const setIdParam = (pid: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('id', String(pid));
    // 保留其他参数
    if (searchParams.get('page')) next.set('page', searchParams.get('page')!);
    if (searchParams.get('sort')) next.set('sort', searchParams.get('sort')!);
    if (searchParams.get('period'))
      next.set('period', searchParams.get('period')!);
    setSearchParams(next, { replace: true });
  };

  // 更新URL参数的函数
  const updateURLParams = useCallback(
    (
      newParams: { page?: number; sort?: string; period?: string },
      replace = true,
    ) => {
      const params = new URLSearchParams();
      params.set('page', (newParams.page ?? pageNum).toString());
      params.set('sort', newParams.sort ?? sort);
      params.set('period', newParams.period ?? period);

      // 保留id参数
      if (searchParams.get('id')) {
        params.set('id', searchParams.get('id')!);
      }

      setSearchParams(params, { replace });
    },
    [pageNum, sort, period, setSearchParams],
  );

  // 打开某条帖子（直链策略已注释：原为优先用列表数据、失败时 message + fetchPosts）
  useEffect(() => {
    if (!autoOpenId || !enableDirectOpen) return;
    // const fromList = postResult?.posts?.find((p) => p.id === autoOpenId);
    // if (fromList) { setDirectPost(fromList); return; }
    const load = async () => {
      try {
        const res = await getPost({ postId: autoOpenId });
        if (res.success && res.data) setDirectPost(res.data);
        else clearIdParam();
      } catch (e) {
        clearIdParam();
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenId, enableDirectOpen]);

  const fetchPosts = useCallback(async () => {
    if (sort === 'my') {
      const res = await listMyPost({ pageSize, pageNum, period: 'all', sort });
      if (res.success) setPostResult(res.data);
    } else {
      const res = await listPosts({ pageSize, pageNum, period, sort });
      if (res.success) setPostResult(res.data);
    }
  }, [pageSize, pageNum, sort, period]);

  // 组件挂载或URL参数变化时获取数据
  useEffect(() => {
    // if (searchParams.get('id')) return;
    fetchPosts();
  }, [fetchPosts]);

  // 页码变化时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageNum]);

  useEffect(() => {
    checkAdmin().then((res) => setIsAdmin(res.data));
  }, [user]);

  return (
    <NormalPage
      title="互动"
      desc="探索世界的边界，每次确定需要1宝石（会员免费），该模式不允许使用互联网搜索"
    >
      <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
        <Button onClick={() => history.push('/interact/create')}>出题</Button>
      </div>
      <Segmented
        size="large"
        value={sort}
        options={[
          { label: '最新', value: 'new' },
          { label: '最热', value: 'hot' },
          { label: '新评', value: 'new_comment' },
          { label: '我的', value: 'my' },
        ]}
        onChange={(v) => updateURLParams({ sort: v, page: 1 }, false)}
      />
      {sort === 'hot' && (
        <>
          <div style={{ height: '5px' }}></div>
          <Segmented
            value={period}
            options={[
              { label: '一天', value: 'day' },
              { label: '一周', value: 'week' },
              { label: '一月', value: 'month' },
              { label: '一年', value: 'year' },
              // { label: '全部', value: 'all' }
            ]}
            onChange={(v) => updateURLParams({ period: v, page: 1 }, false)}
          />
        </>
      )}
      {enableDirectOpen && directPost && (
        <List
          split={false}
          pagination={false}
          dataSource={[directPost]}
          renderItem={(post) => (
            <List.Item style={{ padding: '0.5rem 0' }}>
              <InteractCell
                key={post.id}
                post={post}
                userId={user?.userId}
                fetch={fetchPosts}
                isAdmin={isAdmin}
                autoOpen
                onClose={() => {
                  clearIdParam();
                  setDirectPost(null);
                  setEnableDirectOpen(false);
                  // 关闭 modal 后再请求 list
                  // fetchPosts();
                }}
                onOpen={setIdParam}
              />
            </List.Item>
          )}
        />
      )}
      <WaterfallList
        dataSource={postResult ? postResult.posts : []}
        pagination={{
          current: pageNum,
          pageSize,
          total: postResult ? postResult.total : 0,
          onChange: (value) => updateURLParams({ page: value }, true),
          showLessItems: true,
        }}
        renderItem={(post) => (
          <WaterfallCell
            key={post.id}
            post={post}
            userId={user?.userId}
            fetch={fetchPosts}
            isAdmin={isAdmin}
            onOpen={setIdParam}
            onClose={clearIdParam}
          />
        )}
      />
      {/*
      <Modal
        title="排行榜（施工中）"
        visible={!!rankPost}
        onCancel={() => {
          setRankPost(null);
        }}
        footer={null}
      />
      */}
    </NormalPage>
  );
};

export default Interact;
