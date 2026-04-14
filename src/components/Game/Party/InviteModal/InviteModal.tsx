import { CopyOutlined } from '@ant-design/icons';
import { Button, Divider, Input, message, Modal, QRCode, Space } from 'antd';
import copy from 'copy-to-clipboard';
import { FC, useMemo } from 'react';
import styles from './style.less';

type InviteModalProps = {
  open: boolean;
  onOpen: (open: boolean) => void;
  code: string;
};

const InviteModal: FC<InviteModalProps> = ({ open, onOpen, code }) => {
  const url = useMemo(() => `https://saiyuan.top/join/${code}`, [code]);

  return (
    <Modal
      open={open}
      centered
      maskClosable={false}
      title="派对邀请码"
      footer={false}
      onCancel={() => onOpen(false)}
      wrapClassName={styles.partyInviteModal}
    >
      <div className={styles.inviteWrapper}>
        <QRCode value={url} className={styles.qrMobileCode} />
        <div className={styles.inviteByCode}>
          <div className={styles.inviteCode}>
            <p>
              <span>{code}</span>{' '}
              <Button
                shape="round"
                icon={<CopyOutlined />}
                onClick={() => { copy(code); message.success('复制成功'); }}
              />
            </p>
            <p>
              打开 <em>saiyuan.top/join</em> 输入邀请码
            </p>
          </div>
        </div>
        <Divider />
        <div className={styles.inviteByQrCode}>
          <div className={styles.shareQrCode}>
            <QRCode value={url} className={styles.qrCode} />
            <div className={styles.shareText}>
              <h2>或者您可以分享此链接</h2>
              <Space direction="horizontal">
                <Input value={url} />
                <Button
                  shape="round"
                  icon={<CopyOutlined />}
                  onClick={() => { copy(url); message.success('复制成功'); }}
                />
              </Space>
              {/*<Button shape="round" size="large" type="primary">*/}
              {/*  与棋寻好友一起*/}
              {/*</Button>*/}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InviteModal;
