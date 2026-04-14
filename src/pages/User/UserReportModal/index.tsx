import { reportUser } from '@/services/api';
import { Alert, Input, Modal, Radio, Space, Typography, message } from 'antd';
import { FC, useEffect, useState } from 'react';

const { Paragraph } = Typography;

type ReportModalProps = {
  userId: number;
  open: boolean;
  gameId?: string | null;
  source?: string | null;
  gameType?: string;
  partyId?: string | null;
  onClose: () => void;
  // Modal 相关属性
  getContainer?: false | HTMLElement | (() => HTMLElement);
  zIndex?: number;
};

export const UserReportModal: FC<ReportModalProps> = ({
  userId,
  open,
  gameId,
  gameType,
  partyId,
  source,
  onClose,
  getContainer,
  zIndex,
}) => {
  const [reason, setReason] = useState<string>('');
  const [more, setMore] = useState<string>('');

  const [okDisabled, setIsOkDisabled] = useState<boolean>(false);
  const [reasons, setReasons] = useState<string[]>([
    '全球积分赛作弊',
    '全球匹配作弊',
    '中国匹配作弊',
    '每日挑战作弊',
    '高分用户小号/炸鱼',
    '派对/娱乐匹配作弊',
    '故意掉分',
    '私信骚扰',
    '个人信息违规',
    '互动/网络迷踪违规',
  ]);

  useEffect(() => {
    if (source === 'replay') {
      //reasons remove 全球积分赛作弊
      setReasons((reasons) => {
        return reasons.filter(
          (reason) =>
            reason !== '全球积分赛作弊' &&
            reason !== '私信骚扰' &&
            reason !== '互动/网络迷踪违规',
        );
      });
    }
  }, [source]);
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={'举报用户'}
      okButtonProps={{ disabled: okDisabled }}
      getContainer={getContainer}
      zIndex={zIndex}
      onOk={() => {
        if (reason === '全球匹配作弊' || reason === '中国匹配作弊') {
          if (!more || more.length <= 2) {
            message.error('请详细填写附加信息');
            return;
          }
          if (!/([\d一二三四五六七八九十]+)/.test(more)) {
            message.error('请填写轮次信息');
            return;
          }
        }
        if (
          (reason === '全球积分赛作弊' ||
            reason === '私信骚扰' ||
            reason === '互动/网络迷踪违规') &&
          !more
        ) {
          message.error('请填写附加信息');
          return;
        }
        if (!reason) {
          message.error('请选择举报理由');
          return;
        }

        reportUser({ target: userId, reason, more, gameId }).then(() => {
          message.success('举报成功');
          onClose();
        });
      }}
    >
      <Space direction="vertical">
        请确认举报理由真实有效，请勿重复举报同一用户。
        <Typography>
          <Paragraph>
            <blockquote>
              <a href="https://www.yuque.com/chaofun/qixun/rules">
                《违规封禁规则》
              </a>
              <b>第十一条第六款 </b>
              滥用举报功能，在短期之内多次重复举报同一人的，或未按要求填写详细原因的，或举报原因和细节明显不成立的，处
              1 日至 7 日封禁。有意编造举报理由的，从重处理。
            </blockquote>
          </Paragraph>
        </Typography>
        <Radio.Group
          onChange={(e) => {
            setReason(e.target.value);
            setIsOkDisabled(
              e.target.value === '每日挑战作弊' ||
              (gameType !== 'solo_match' &&
                (e.target.value === '全球匹配作弊' ||
                  e.target.value === '中国匹配作弊')) ||
              (gameType !== 'team_match' && !partyId &&
                e.target.value === '派对/娱乐匹配作弊'),
            );
          }}
          value={reason}
        >
          {reasons.map((reason, index) => (
            <Radio key={index} value={reason}>
              {reason}
            </Radio>
          ))}
        </Radio.Group>
        {(gameId === null ||
          gameId === undefined ||
          (gameType !== 'solo_match' && gameType !== 'team_match')) &&
          (reason === '全球匹配作弊' ||
            reason === '中国匹配作弊' ||
            reason === '派对/娱乐匹配作弊') && ( // 个人首页不接受匹配作弊举报
            <Alert
              message="匹配和对局作弊举报请直接在对局复盘页面举报，管理员能直接看到链接～"
              type="warning"
            />
          )}
        {reason === '每日挑战作弊' && ( // 不再接受日挑小号举报
          <Alert
            message="每天都会根据实际情况封禁一批账号，感谢您的监督～"
            type="warning"
          />
        )}
        {reason === '派对/娱乐匹配作弊' &&
          gameType !== 'team_match' && !partyId && (
            <Alert
              message="举报类型错误，请在派对或娱乐匹配对局复盘中进行举报。"
              type="warning"
            />
          )}
        {(reason === '全球匹配作弊' || reason === '中国匹配作弊') &&
          gameType !== 'solo_match' && (
            <Alert
              message="举报类型错误，请在积分匹配对局复盘中进行举报。"
              type="warning"
            />
          )}
        {reason === '全球积分赛作弊' && (
          <Alert
            message="请不要用“全球积分赛作弊”的理由举报其他作弊，使用错误的理由将得不到处理！"
            type="warning"
          />
        )}
        {!okDisabled && (
          <Input
            value={more}
            placeholder={
              reason === '全球匹配作弊' || reason === '中国匹配作弊'
                ? '（必填）请补充具体轮次和怀疑点'
                : (reason === '全球积分赛作弊' ||
                  reason === '私信骚扰' ||
                  reason === '互动/网络迷踪违规'
                  ? '（必填）'
                  : '（选填）') +
                '其他信息补充，理由详细的举报可以得到优先处理'
            }
            onChange={(e) => setMore(e.target.value)}
          />
        )}
        {gameId && <div>对局id: {gameId}</div>}
      </Space>
    </Modal>
  );
};

export default UserReportModal;
