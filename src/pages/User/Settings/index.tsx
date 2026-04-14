import ChangePasswordModal from '@/components/User/ChangePasswordModal';
import SetPhoneModal from '@/components/User/SetPhoneModal';
import { CFBizUri, provinces } from '@/constants';
import NormalPage from '@/pages/NormalPage';
import {
  SetDesc,
  SetProvince,
  checkUserBind,
  getqixunSelfProfile,
  setUserIcon,
  setUserName,
} from '@/services/api';
import { UploadOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  Avatar,
  Button,
  Flex,
  Input,
  Radio,
  Tooltip,
  Typography,
  Upload,
  UploadProps,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import styles from './style.less';
const { Text, Title } = Typography;

const Settings = () => {
  const [userData, setUserData] = useState<API.UserProfile>();
  const [userBind, setUserBind] = useState<API.UserBind>();
  const [userNameLocal, setUserNameLocal] = useState<string>('');
  const [descLocal, setDescLocal] = useState<string>('');
  const [editUserName, setEditUserName] = useState<boolean>(false);
  const [editDesc, setEditDesc] = useState<boolean>(false);
  const [provinceLocal, setProvinceLocal] = useState<string>('');
  const [editProvince, setEditProvince] = useState<boolean>(false);
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [resetPhone, setResetPhone] = useState<boolean>(false);
  // const [organization , setOrganization] = useState('');

  function getUserData() {
    getqixunSelfProfile().then((res) => {
      if (res.success && res.data) {
        setUserData(res.data);
        setUserNameLocal(res.data.userName);
        setDescLocal(res.data.desc ?? '');
        setProvinceLocal(res.data.province ?? '');
      } else {
        // 用户未登录或登录已失效，跳转到登录页
        history.push('/user/login');
      }
    }).catch(() => {
      // 请求失败，跳转到登录页
      history.push('/user/login');
    });
  }

  function getUserBind() {
    checkUserBind().then((res) => {
      if (res.success) setUserBind(res.data);
    });
  }

  useEffect(() => {
    getUserData();
    getUserBind();
  }, []);

  function updateUserIcon(iconName: string) {
    setUserIcon({ imageName: iconName }).then(() => getUserData());
  }

  function updateUserName(userName: string = '') {
    setUserName({ userName: userName }).then((res) => {
      if (res.success) {
        setEditUserName(false);
        getUserData();
      }
    });
  }

  function updateDesc(desc: string = '') {
    SetDesc({ desc: desc }).then((res) => {
      if (res.success) {
        setEditDesc(false);
        getUserData();
      }
    });
  }

  function updateProvince(province: string = '') {
    SetProvince({ province: province }).then((res) => {
      if (res.success) {
        setEditDesc(false);
        getUserData();
      }
    });
  }

  let props: UploadProps = {
    name: 'file',
    action: 'https://saiyuan.top/api/upload_image',
    data(file) {
      return { fileName: file.name };
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        updateUserIcon(info.file.response.data);
      } else if (info.file.status === 'error') {
        message.error(`上传失败`);
      }
    },
  };

  return (
    <NormalPage>
      {userData && (
        <Flex align="flex-start" gap="middle" vertical>
          <Flex align="flex-start" gap="small" vertical>
            <Title level={5} style={{ fontWeight: 'normal', margin: 0 }}>
              头像设置：
            </Title>
            <Avatar
              src={`${CFBizUri}${userData?.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
              size={75}
            />
            <Upload {...props} className={styles.upload}>
              <Button icon={<UploadOutlined />}>点击上传</Button>
            </Upload>
          </Flex>

          <Flex align="flex-start" gap="small" vertical>
            <Title level={5} style={{ fontWeight: 'normal', margin: 0 }}>
              用户名：
            </Title>
            {editUserName ? (
              <>
                <Input
                  autoFocus
                  style={{ fontSize: 18 }}
                  value={userNameLocal}
                  onChange={(e) => setUserNameLocal(e.target.value)}
                />
                <Flex gap="small">
                  <Button onClick={() => setEditUserName(false)}>取消</Button>
                  <Button onClick={() => updateUserName(userNameLocal)}>
                    保存
                  </Button>
                </Flex>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 15 }}>{userData.userName}</Text>
                <Button onClick={() => setEditUserName(true)}>修改</Button>
              </>
            )}
          </Flex>

          <Flex align="flex-start" gap="small" vertical>
            <Title level={5} style={{ fontWeight: 'normal', margin: 0 }}>
              签名(选填):
            </Title>
            {editDesc ? (
              <>
                <Input.TextArea
                  autoFocus
                  style={{ width: 600, maxWidth: '100%' }}
                  value={descLocal}
                  onChange={(e) => setDescLocal(e.target.value)}
                />
                <Flex gap="small">
                  <Button onClick={() => setEditDesc(false)}>取消</Button>
                  <Button onClick={() => updateDesc(descLocal)}>保存</Button>
                </Flex>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 15,
                    color: userData.desc ? 'inherit' : 'gray',
                  }}
                >
                  {userData.desc ?? '暂无签名'}
                </Text>
                <Button onClick={() => setEditDesc(true)}>
                  {userData.desc ? '修改' : '添加'}
                </Button>
              </>
            )}
          </Flex>

          <Flex align="flex-start" gap="small" vertical>
            <Title level={5} style={{ fontWeight: 'normal', margin: 0 }}>
              地域(选填):
            </Title>
            <Text
              style={{
                fontSize: 15,
                color: userData.province !== '' ? 'inherit' : 'gray',
              }}
            >
              {userData.province !== '' ? userData.province : '未设置'}
            </Text>
            {editProvince ? (
              <Radio.Group
                buttonStyle="solid"
                defaultValue={provinceLocal}
                onChange={(e) => {
                  setEditProvince(false);
                  setProvinceLocal(e.target.value);
                  updateProvince(e.target.value);
                }}
              >
                <Radio.Button key="clear">清空</Radio.Button>
                {provinces.map((province) => (
                  <Radio.Button key={province} value={province}>
                    {province}
                  </Radio.Button>
                ))}
              </Radio.Group>
            ) : (
              <Button onClick={() => setEditProvince(true)}>
                {provinceLocal !== '' ? '修改' : '选择'}
              </Button>
            )}
          </Flex>

          <Flex align="flex-start" gap="small" vertical>
            <Title level={5} style={{ fontWeight: 'normal', margin: 0 }}>
              修改密码：
            </Title>
            {userBind && userBind.wechat ? (
              <Button onClick={() => history.push('/user/change-password')}>
                微信扫码修改密码
              </Button>
            ) : (
              <Tooltip title="请先绑定微信后才能修改密码">
                <Button disabled>微信扫码修改密码</Button>
              </Tooltip>
            )}
            {userBind && userBind.phone ? (
              <Button onClick={() => setChangePassword(true)}>
                手机验证码修改密码
              </Button>
            ) : (
              <Tooltip title="请先绑定手机号后才能使用此功能">
                <Button disabled>手机验证码修改密码</Button>
              </Tooltip>
            )}
          </Flex>

          {userBind && (
            <Flex align="flex-start" vertical>
              <Title level={5} style={{ fontWeight: 'normal', margin: 0 }}>
                绑定信息:
              </Title>
              <div>
                手机号：
                {userBind.phone ? (
                  <span style={{ color: 'green' }}>已绑定</span>
                ) : (
                  <span>未绑定</span>
                )}
              </div>
              <div>
                微信账号：
                {userBind.wechat ? (
                  <span style={{ color: 'green' }}>已绑定</span>
                ) : (
                  <span>未绑定</span>
                )}
              </div>
              <div>
                苹果账号：
                {userBind.apple ? (
                  <span style={{ color: 'green' }}>已绑定</span>
                ) : (
                  <span>未绑定</span>
                )}
              </div>

              {userBind && !userBind.phone && (
                <Flex align="center" gap="small">
                  <div>检测到您可以绑定手机号</div>
                  <Button onClick={() => setResetPhone(true)}>去绑定</Button>
                </Flex>
              )}
            </Flex>
          )}

          <ChangePasswordModal
            open={changePassword}
            onClose={() => setChangePassword(false)}
            login={false}
          />
          <SetPhoneModal
            open={resetPhone}
            onClose={() => {
              getUserBind();
              setResetPhone(false);
            }}
          />
        </Flex>
      )}
    </NormalPage>
  );
};

export default Settings;
