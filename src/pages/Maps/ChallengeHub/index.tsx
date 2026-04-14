import DailyChallengeRank from '@/components/Game/DailyChanllenge/Rank';
import qixunAvatar from '@/components/User/qixunAvatar';
import NormalPage from '@/pages/NormalPage';
import { getChallengeHubMeta, getDailyChallengeTotal } from '@/services/api';
import { ShareAltOutlined } from '@ant-design/icons';
import { history, useModel, useParams } from '@umijs/max';
import { Button, Flex, Spin, Tag, Typography, message } from 'antd';
import copy from 'copy-to-clipboard';
import { useEffect, useMemo, useState } from 'react';

const { Paragraph, Text, Title } = Typography;

type HubMode = 'classic' | 'infinity' | 'streak';

const MODE_LABEL: Record<HubMode, string> = {
  classic: '经典五题',
  infinity: '无限轮次',
  streak: '国家连胜',
};

function hubModeFromPlayType(playType?: string | null): HubMode {
  if (playType === 'infinity') return 'infinity';
  if (playType === 'map_country_streak') return 'streak';
  return 'classic';
}

function streetViewLabel(m: API.qixunChallengeAO): string {
  const blinkMs = m.blinkTime;
  if (typeof blinkMs === 'number' && blinkMs > 0) {
    return `眨眼模式（${(blinkMs / 1000).toFixed(1)} 秒）`;
  }
  if (m.move) return '移动';
  if (m.pan === false && m.zoom === false) return '固定视角';
  return '固定';
}

function roundTimerLabel(period?: number | null): string {
  if (typeof period === 'number' && period > 0) {
    return `${Math.round(period / 1000)} 秒`;
  }
  return '不限';
}

const MapChallengeHub = () => {
  const { hubId } = useParams<{ hubId: string }>();
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [challengers, setChallengers] = useState<number | null>(null);
  const [playMeta, setPlayMeta] = useState<API.qixunChallengeAO | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState(false);

  const mode = useMemo(
    () => (playMeta ? hubModeFromPlayType(playMeta.playType) : null),
    [playMeta],
  );

  const mapsId = useMemo(() => {
    const id = playMeta?.mapsId ?? playMeta?.map?.id;
    return typeof id === 'number' && !Number.isNaN(id) ? id : null;
  }, [playMeta]);

  const mapDisplayName = useMemo(() => {
    const n = playMeta?.map?.name?.trim();
    if (n) return n;
    if (mapsId !== null) return `题库 #${mapsId}`;
    return '题库';
  }, [playMeta?.map?.name, mapsId]);

  const playPath = useMemo(() => {
    if (!hubId || !mode) return '';
    return mode === 'classic'
      ? `/challenge/${encodeURIComponent(hubId)}?fromHub=1`
      : `/solo/${encodeURIComponent(hubId)}`;
  }, [hubId, mode]);

  const shareUrl = useMemo(() => {
    if (!hubId || typeof window === 'undefined') return '';
    return `${window.location.origin}/challenge-hub/${encodeURIComponent(hubId)}`;
  }, [hubId]);

  useEffect(() => {
    if (!hubId) return;
    let cancelled = false;
    setPlayMeta(null);
    setMetaLoading(true);
    setMetaError(false);
    (async () => {
      const c = await getChallengeHubMeta({ challengeId: hubId });
      if (cancelled) return;
      if (c.success && c.data) {
        setPlayMeta(c.data);
        setMetaLoading(false);
        return;
      }
      setMetaError(true);
      setMetaLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hubId]);

  useEffect(() => {
    if (!playMeta) return;
    const name = playMeta.map?.name?.trim();
    document.title = name
      ? `${name} · 题库挑战 - 棋寻`
      : '题库挑战 - 棋寻';
  }, [playMeta]);

  useEffect(() => {
    if (!hubId || mode !== 'classic') {
      setChallengers(null);
      return;
    }
    getDailyChallengeTotal({ challengeId: hubId }).then((res) => {
      if (res.success && typeof res.data === 'number') {
        setChallengers(res.data);
      }
    });
  }, [hubId, mode]);

  const handleShare = () => {
    const name = mapDisplayName || '棋寻题库';
    const modeText = mode ? MODE_LABEL[mode] : '题库挑战';
    const text = `棋寻「${name}」${modeText}\n来挑战：\n${shareUrl}`;
    if (copy(text)) message.success('挑战链接已复制');
    else message.error('复制失败，请手动复制链接');
  };

  const goPlay = () => {
    if (!playPath) return;
    if (!user?.userId) {
      history.push('/user/login?redirect=' + encodeURIComponent(location.href));
      return;
    }
    history.push(playPath);
  };

  if (!hubId) {
    return (
      <NormalPage title="题库挑战">
        <Paragraph>链接无效</Paragraph>
      </NormalPage>
    );
  }

  if (metaLoading) {
    return (
      <NormalPage title="题库挑战">
        <Flex justify="center" align="center" style={{ minHeight: 240 }}>
          <Spin size="large" />
        </Flex>
      </NormalPage>
    );
  }

  if (metaError || !playMeta || mode === null) {
    return (
      <NormalPage title="题库挑战">
        <Paragraph>挑战不存在或已过期</Paragraph>
      </NormalPage>
    );
  }

  return (
    <NormalPage title="题库挑战">
      <Flex align="center" gap="large" vertical style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 48px' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <Flex
            justify="center"
            align="center"
            gap={8}
            wrap="wrap"
            style={{ marginBottom: 8 }}
          >
            <Text type="secondary">题库</Text>
            <Title
              level={3}
              style={{
                margin: 0,
                cursor: mapsId !== null ? 'pointer' : 'default',
                color: '#1677ff',
              }}
              onClick={() => {
                if (mapsId !== null) history.push(`/map/${mapsId}`);
              }}
            >
              {mapDisplayName}
            </Title>
          </Flex>
          {playMeta.creator &&
            typeof playMeta.creator.userId === 'number' &&
            playMeta.creator.icon && (
              <Flex
                align="center"
                justify="center"
                gap={10}
                style={{ marginTop: 4, marginBottom: 4 }}
              >
                <Text type="secondary">挑战创建者</Text>
                <Flex
                  align="center"
                  gap={8}
                  style={{ cursor: 'pointer' }}
                  onClick={() => history.push(`/user/${playMeta.creator!.userId}`)}
                >
                  <qixunAvatar
                    user={{
                      userId: playMeta.creator.userId,
                      icon: playMeta.creator.icon,
                      avatarFrame: playMeta.creator.avatarFrame ?? undefined,
                    }}
                    size={32}
                  />
                  <Text>{playMeta.creator.userName || `用户${playMeta.creator.userId}`}</Text>
                </Flex>
              </Flex>
            )}
          <Flex
            justify="center"
            align="center"
            gap="small"
            wrap="wrap"
            style={{ marginTop: 10, width: '100%' }}
          >
            <Tag>{MODE_LABEL[mode]}</Tag>
            <Tag>街景 · {streetViewLabel(playMeta)}</Tag>
            {!playMeta.move && playMeta.noCar && <Tag>无车模式</Tag>}
            <Tag>单轮限时 · {roundTimerLabel(playMeta.roundTimerPeriod)}</Tag>
          </Flex>
        </div>

        {mode !== 'classic' && (
          <Paragraph type="secondary" style={{ marginBottom: 0, textAlign: 'center' }}>
            将本局链接发给好友，对方可进入同一场对局体验（无限/连胜模式无统一题目排行）。
          </Paragraph>
        )}

        {mode === 'classic' && challengers !== null && (
          <Flex justify="center" align="center" gap={8} wrap="wrap" style={{ width: '100%' }}>
            <Text type="secondary">完成人数</Text>
            <Text strong style={{ fontSize: 20, lineHeight: 1.2 }}>
              {challengers}
            </Text>
          </Flex>
        )}

        {mode === 'classic' && playMeta.viewerCompleted === true && (
          <Text type="secondary" style={{ textAlign: 'center' }}>
            你已提交过本挑战成绩，每个挑战仅可完成一次。
          </Text>
        )}

        <Flex gap="middle" wrap="wrap" justify="center">
          {mode === 'classic' ? (
            playMeta.viewerCompleted === true ? (
              <Button
                type="primary"
                size="large"
                disabled={!playMeta.gameId}
                title={!playMeta.gameId ? '暂无关联对局记录，无法打开复盘' : undefined}
                onClick={() => {
                  const gid = playMeta.gameId;
                  if (!gid) return;
                  history.push(`/replay?gameId=${encodeURIComponent(gid)}`);
                }}
              >
                复盘
              </Button>
            ) : (
              <Button type="primary" size="large" onClick={goPlay} disabled={!playPath}>
                {playMeta.gameId ? '继续挑战' : '开始挑战'}
              </Button>
            )
          ) : (
            <Button type="primary" size="large" onClick={goPlay} disabled={!playPath}>
              开始挑战
            </Button>
          )}
          <Button size="large" icon={<ShareAltOutlined />} onClick={handleShare}>
            复制挑战链接
          </Button>
        </Flex>

        <Paragraph
          copyable={{ text: shareUrl, tooltips: ['复制链接', '已复制'] }}
          style={{ wordBreak: 'break-all', marginBottom: 0 }}
        >
          {shareUrl}
        </Paragraph>

        {mode === 'classic' && (
          <DailyChallengeRank challengeId={hubId} globalRankFirst />
        )}

        {mode !== 'classic' && (
          <Text type="secondary" style={{ textAlign: 'center' }}>
            无限轮次与国家连胜为个人对局，暂无与经典五题相同的挑战排行。
          </Text>
        )}
      </Flex>
    </NormalPage>
  );
};

export default MapChallengeHub;
