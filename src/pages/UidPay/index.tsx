import qixunAvatar from '@/components/User/qixunAvatar';
import NormalPage from '@/pages/NormalPage';
import { getJSPayUrlByUserIdRequest, getqixunUserProfile } from '@/services/api';
import { useModel } from '@@/exports';
import { useDebounce } from 'ahooks';
import { Button, Input, Spin, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

const { Text } = Typography;

function parseUid(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

const UidPay = () => {
  const { isInWeChat } = useModel('@@initialState', (model) => ({
    isInWeChat: model.initialState?.isInWeChat,
  }));

  const [userId, setUserId] = useState<string>('');
  const debouncedUserId = useDebounce(userId, { wait: 400 });
  const [profile, setProfile] = useState<API.UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const uid = parseUid(debouncedUserId);
    if (uid === null) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setProfile(null);
    getqixunUserProfile({ userId: uid })
      .then((res) => {
        if (!cancelled) {
          setProfile(res.data);
          setProfileLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
          setProfileLoading(false);
          message.error('未找到该用户或暂时无法加载');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedUserId]);

  const debouncedUid = parseUid(debouncedUserId);
  const displayProfile =
    profile &&
    debouncedUid !== null &&
    profile.userId === debouncedUid;

  const pay = () => {
    const uid = parseUid(userId);
    if (uid === null) {
      message.error('请输入正确的 uid，须为正整数');
      return;
    }
    getJSPayUrlByUserIdRequest({
      userId: uid,
      period: '1month',
    }).then((res) => {
      location.href =
        'https://saiyuan.top/wxRedirect?orderNo=' + res.data.orderId;
    });
  };

  return (
    <NormalPage>
      {isInWeChat && (
        <>
          <div>请输入用户 uid</div>
          <Input
            value={userId}
            placeholder="输入充值 uid，请检查不要输错"
            onChange={(e) => setUserId(e.target.value)}
            style={{ marginTop: 8, marginBottom: 12 }}
          />
          {profileLoading && (
            <div style={{ marginBottom: 12 }}>
              <Spin size="small" /> <Text type="secondary">正在查询用户…</Text>
            </div>
          )}
          {!profileLoading && displayProfile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                padding: 12,
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 8,
              }}
            >
              <qixunAvatar user={profile} size={48} />
              <div>
                <div style={{ fontWeight: 600 }}>{profile.userName}</div>
                <Text type="secondary">uid：{profile.userId}</Text>
              </div>
            </div>
          )}
          <Button type="primary" onClick={pay}>
            1 个月会员（¥15）
          </Button>
        </>
      )}
      {!isInWeChat && <div>请在微信中打开</div>}
    </NormalPage>
  );
};

export default UidPay;
