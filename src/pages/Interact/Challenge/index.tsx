import InteractCell from '@/components/Interact/Cell';
import WaterfallCell from '@/components/Interact/WaterfallCell';
import WaterfallList from '@/components/Interact/WaterfallList';
import PointHint from '@/components/Point/PointHint';
import qixunAvatar from '@/components/User/qixunAvatar';
import NormalPage from '@/pages/NormalPage';
import {
  challengeRank,
  checkAdmin,
  getChallengePost,
  listMyPostChallenges,
  listPostCollections,
  listPostChallenges,
} from '@/services/api';
import { useModel } from '@@/exports';
import { Link } from '@umijs/max';
import { Button, Flex, List, Modal, Segmented, Spin } from 'antd';
import { message } from 'antd/lib';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const InteractChallenge = () => {
  const navigator = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));
  const pageSize = 20;

  const [postResult, setPostResult] = useState<API.PostListResult | null>(null);

  // 从URL参数读取值
  const pageNum = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'unsuccess';
  const subSort = (() => {
    const urlSubSort = searchParams.get('subSort');
    if (urlSubSort) return urlSubSort;
    // 根据sort的默认值设置subSort的默认值
    const sortValue = searchParams.get('sort') || 'unsuccess';
    return sortValue === 'my' ? 'post' : 'new';
  })();
  // const [rankPost, setRankPost] = useState<number | null>(null);
  const [rankSort, setRankSort] = useState<string>('week');
  const [rankType, setRankType] = useState<string>('time');
  const [rankLoading, setRankLoading] = useState<boolean>(false);

  const [showRank, setShowRank] = useState<boolean>(false);
  const [ranks, setRanks] = useState<API.PostChallengeRank[]>([]);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [directPost, setDirectPost] = useState<API.PostParams | null>(null);
  const autoOpenId = useMemo(
    () => (searchParams.get('id') ? Number(searchParams.get('id')) : null),
    [searchParams],
  );
  const initialIdRef = useRef<string | null>(searchParams.get('id'));
  const [enableDirectOpen, setEnableDirectOpen] = useState<boolean>(
    !!initialIdRef.current,
  );

  const clearIdParam = () => {
    if (searchParams.get('id')) {
      const next = new URLSearchParams(searchParams);
      next.delete('id');
      // 保留其他参数
      if (searchParams.get('page')) next.set('page', searchParams.get('page')!);
      if (searchParams.get('sort')) next.set('sort', searchParams.get('sort')!);
      if (searchParams.get('subSort'))
        next.set('subSort', searchParams.get('subSort')!);
      setSearchParams(next, { replace: true });
    }
  };
  const setIdParam = (pid: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('id', String(pid));
    // 保留其他参数
    if (searchParams.get('page')) next.set('page', searchParams.get('page')!);
    if (searchParams.get('sort')) next.set('sort', searchParams.get('sort')!);
    if (searchParams.get('subSort'))
      next.set('subSort', searchParams.get('subSort')!);
    setSearchParams(next, { replace: true });
  };

  // 更新URL参数的函数
  const updateURLParams = (
    newParams: { page?: number; sort?: string; subSort?: string },
    replace = true,
  ) => {
    const params = new URLSearchParams(searchParams);
    if (newParams.page !== undefined)
      params.set('page', newParams.page.toString());
    if (newParams.sort !== undefined) params.set('sort', newParams.sort);
    if (newParams.subSort !== undefined)
      params.set('subSort', newParams.subSort);

    // 保留id参数
    if (searchParams.get('id')) {
      params.set('id', searchParams.get('id')!);
    }

    // 页码变化时使用replace避免创建过多历史记录
    setSearchParams(params, { replace });
  };

  useEffect(() => {
    checkAdmin().then((res) => setIsAdmin(res.data));
  }, [user]);

  const fetchPosts = async () => {
    if (sort === 'collection') {
      const res = await listPostCollections();
      if (res.success && res.data) {
        const total = res.data.length;
        const startIdx = (pageNum - 1) * pageSize;
        const slicedPosts = res.data
          .slice(startIdx, startIdx + pageSize)
          .map((item) => ({ ...item, collected: true }));
        setPostResult({
          posts: slicedPosts,
          pageNum,
          pageSize,
          total,
        });
      }
    } else if (sort === 'my') {
      const res = await listMyPostChallenges({
        pageSize,
        pageNum,
        sort: subSort,
        period: 'all',
      });
      if (res.success) setPostResult(res.data);
    } else {
      const res = await listPostChallenges({
        pageSize,
        pageNum,
        success:
          sort === 'success' ? true : sort === 'unsuccess' ? false : null,
        sort: subSort,
        period: 'all',
      });
      if (res.success) setPostResult(res.data);
    }
  };

  // 带 ?id= 进页时不加载 list
  useEffect(() => {
    // if (searchParams.get('id')) return;
    fetchPosts();
  }, [sort, subSort, pageNum]);

  // 页码变化时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageNum]);

  const fetchRankData = async () => {
    if (showRank) {
      setRankLoading(true);
      setRanks([]);
      try {
        const res = await challengeRank({ period: rankSort, type: rankType });
        if (res.success) {
          setRanks(res.data);
        }
      } catch (error) {
        message.error('获取排行榜数据失败');
      } finally {
        setRankLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRankData();
  }, [rankSort, rankType, showRank]);

  const handleRankTypeChange = (value: string) => {
    setRankType(value);
  };

  const handleRankSortChange = (value: string) => {
    setRankSort(value);
  };

  useEffect(() => {
    if (!autoOpenId || !enableDirectOpen) return;
    // const fromList = postResult?.posts?.find((p) => p.id === autoOpenId);
    // if (fromList) { setDirectPost(fromList); return; }
    const load = async () => {
      try {
        const res = await getChallengePost({ postId: autoOpenId });
        if (res.success && res.data) setDirectPost(res.data);
        else clearIdParam();
      } catch (e) {
        clearIdParam();
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenId, enableDirectOpen]);

  return (
    <NormalPage
      title="网络迷踪"
      desc="极限挑战，每次确定需要2宝石（会员1宝石），该模式允许使用互联网搜索"
    >
      <PointHint />
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <Button onClick={() => navigator('/interact/create?type=challenge')}>
          发布
        </Button>
        <Button
          style={{ marginLeft: '24px' }}
          onClick={() => setShowRank(true)}
        >
          排行榜
        </Button>
      </div>
      <Segmented
        size="large"
        style={{ marginTop: '10px' }}
        onChange={(v) => {
          let subSortTmp = 'new';
          if (v === 'my') {
            subSortTmp = 'post';
          } else if (v === 'collection') {
            subSortTmp = 'collection';
          }
          // 切换排序时不使用replace，允许用户返回
          updateURLParams({ sort: v, subSort: subSortTmp, page: 1 }, false);
        }}
        value={sort}
        options={[
          { label: '未解', value: 'unsuccess' },
          { label: '已解', value: 'success' },
          { label: '全部', value: 'all' },
          { label: '收藏', value: 'collection' },
          { label: '我的', value: 'my' },
        ]}
      />
      <div></div>
      {sort !== 'collection' && (
        <Segmented
          size="middle"
          style={{ marginTop: '5px' }}
          onChange={(v) => {
            // 切换子排序时不使用replace，允许用户返回
            updateURLParams({ subSort: v, page: 1 }, false);
          }}
          value={subSort}
          options={
            sort === 'success'
              ? [
                  { label: '新题', value: 'new' },
                  { label: '新解', value: 'new_solved' },
                  { label: '新评', value: 'new_comment' },
                ]
              : sort !== 'my'
              ? [
                  { label: '新题', value: 'new' },
                  { label: '新评', value: 'new_comment' },
                ]
              : sort === 'my'
              ? [
                  { label: '发布', value: 'post' },
                  { label: '解决', value: 'success' },
                ]
              : []
          }
        />
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
                  // 直链策略已注释：关闭 modal 后再请求 list
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
          onChange: (page) => {
            // 页码变化时使用replace，避免创建过多历史记录
            updateURLParams({ page }, true);
          },
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
      <Modal
        title="网络迷踪排行榜"
        open={showRank}
        okButtonProps={{ style: { display: 'none' } }}
        onCancel={() => setShowRank(false)}
        cancelText="关闭"
      >
        <Flex gap="small" style={{ margin: '5px 0' }}>
          <Segmented
            value={rankType}
            options={[
              { label: '耗时', value: 'time' },
              { label: '题数', value: 'count' },
            ]}
            onChange={handleRankTypeChange}
          />
        </Flex>
        {rankType === 'time' && (
          <div
            style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}
          >
            耗时=求和用户解决题目的（挑战成功时间 -
            题目发布时间）,代表用户解决题目的难度
          </div>
        )}
        <Flex gap="small" style={{ margin: '5px 0' }}>
          <Segmented
            value={rankSort}
            options={[
              { label: '一天', value: 'day' },
              { label: '一周', value: 'week' },
              { label: '一月', value: 'month' },
              { label: '赛季', value: 'season' },
              { label: '一年', value: 'year' },
              // { label: '全部', value: 'all' }
            ]}
            onChange={handleRankSortChange}
          />
        </Flex>
        <div style={{ minHeight: '200px', position: 'relative' }}>
          {rankLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="加载中..." />
            </div>
          ) : (
            ranks.map((item, index) => (
              <Flex
                key={index}
                align="center"
                justify="space-between"
                style={{ margin: '10px 0' }}
              >
                <Link
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#dcdcdc',
                  }}
                  to={`/user/${item.user.userId}`}
                >
                  <td style={{ width: 32, textAlign: 'right' }}>
                    {index + 1}.
                  </td>
                  <qixunAvatar size={32} user={item.user} />
                  <div style={{ flex: 1, color: 'inherit', marginLeft: '8px' }}>
                    {item.user.userName}
                  </div>
                </Link>
                <div>
                  {rankType === 'count'
                    ? `${item.times}题`
                    : `${
                        item.costTime
                          ? `${(item.costTime / 60.0 / 1000).toFixed(1)}`
                          : '-'
                      }分钟`}
                </div>
              </Flex>
            ))
          )}
        </div>
      </Modal>
    </NormalPage>
  );
};

export default InteractChallenge;
