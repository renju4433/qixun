import { clearUserInfo, getqixunUserProfile } from '@/services/api';
import {
  Button,
  Flex,
  Image,
  InputNumber,
  Modal,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import { FC, useEffect, useState } from 'react';
const { Title, Text } = Typography;

type ClearUserInfoProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

const ClearUserInfo: FC<ClearUserInfoProps> = ({ show, setShow }) => {
  const [userId, setUserId] = useState<number>();
  const [userInfo, setUserInfo] = useState<API.UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  const clearState = () => {
    setUserId(undefined);
    setUserInfo(null);
    setIsLoading(false);
    setIsActionLoading(false);
    setLoaded(false);
    setShow(false);
  };

  const fetchUserInfo = async (uid?: number) => {
    if (!uid) {
      message.error('请输入用户UID');
      return;
    }
    setIsLoading(true);
    try {
      const res = await getqixunUserProfile({ userId: uid });
      if (res.success) {
        setUserInfo(res.data || null);
        setLoaded(true);
        if (!res.data) message.warning('未找到用户信息');
      } else {
        message.error(res.errorMessage || '获取用户信息失败');
        setUserInfo(null);
        setLoaded(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async (action: string, successText: string) => {
    if (!userId) {
      message.error('请输入用户UID');
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await clearUserInfo({ userId, action });
      if (res.success) {
        message.success(successText);
        await fetchUserInfo(userId);
      } else message.error(res.errorMessage || '操作失败');
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    if (!show) clearState();
  }, [show]);

  const ClearButton = ({
    action,
    type,
    danger,
  }: {
    action: string;
    type: string;
    danger?: boolean;
  }) => (
    <Popconfirm
      onConfirm={() => handleClear(action, type + '已重置')}
      title={`确定要重置${type}吗？`}
    >
      <Button disabled={!loaded} loading={isActionLoading} danger={danger}>
        重置{type}
      </Button>
    </Popconfirm>
  );

  return (
    <Modal
      centered
      destroyOnClose
      open={show}
      onCancel={clearState}
      footer={null}
      title="重置用户信息"
    >
      <Flex gap="middle" vertical>
        <Flex align="center" gap="small" wrap>
          <InputNumber
            placeholder="用户UID"
            controls={false}
            value={userId}
            onChange={(v) => setUserId(Number(v))}
            style={{ width: 160 }}
          />
          <Button
            type="primary"
            loading={isLoading}
            onClick={() => fetchUserInfo(userId)}
          >
            查询
          </Button>
          <Text type="secondary">防止误操作 必须先查信息 再重置</Text>
        </Flex>

        {userInfo && (
          <Flex align="center" gap="middle">
            <Image
              alt={`${userInfo.userName}的头像`}
              preview={{ src: `https://b68v.daai.fun/${userInfo.icon}` }}
              src={`https://b68v.daai.fun/${userInfo.icon}?x-oss-process=image/resize,h_200/quality,q_75`}
              height={80}
              width={80}
            />
            <Flex gap={4} vertical>
              <Title level={5} style={{ margin: 0 }}>
                {userInfo.userName}
              </Title>
              <Text>UID：{userInfo.userId}</Text>
              <Text>描述：{userInfo.desc || '无'}</Text>
            </Flex>
          </Flex>
        )}

        <Flex gap="small" justify="space-between">
          <Flex gap="small" wrap>
            <ClearButton action="clear_user_name" type="昵称" />
            <ClearButton action="clear_user_desc" type="描述" />
            <ClearButton action="clear_user_icon" type="头像" />
            <ClearButton action="clear_user_thing" type="全部" danger />
          </Flex>
          <Button onClick={clearState}>取消</Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default ClearUserInfo;
