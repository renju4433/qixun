import { replyAppeal } from '@/services/api';
import { Button, Flex, Input, message, Modal } from 'antd';
import { useState } from 'react';

interface ReplyModalProps {
  open: boolean;
  userId?: number;
  onClose: () => void;
}

const { TextArea } = Input;

const templates = [
  {
    key: '无效',
    value: '你的申诉无效，因此不予解封。\n请参阅《违规申诉指南》（https://www.yuque.com/chaofun/qixun/appeal），了解申诉流程和注意事项。',
  },
  {
    key: '解封',
    value: '你好！经再次核实，依据《违规封禁规则》（https://www.yuque.com/chaofun/qixun/rules），现就你的申诉作解封处理，感谢你对我们工作的支持与理解。',
  },
  {
    key: '日挑',
    value: '如果要申诉，请解释你【日期】【中国/全球】每日挑战的解题思路。',
  },
  {
    key: '故意掉分',
    value:
      '依据《违规封禁规则》（https://www.yuque.com/chaofun/qixun/rules）：\n在积分模式中，有下列消极行为的，处 30 日以上封禁：\n1. 匹配对局中有意不选，连续三局以上的；\n2. 有意偏离合理范围，一局中达两轮，累计三局以上的；\n3. 主观希望积分降低，连续五局以上的。\n使用小号故意掉分、控分、炸鱼的，大号同处封禁。\n你【行为】，构成故意掉分，因此处以封禁。\n如有特殊情况，请说明。',
  },
  {
    key: '恶意举报',
    value:
      '依据《违规封禁规则》（https://www.yuque.com/chaofun/qixun/rules），\n以下行为属于滥用举报功能，处 1 日以上封禁：\n1. 短期多次举报同一账号；\n2. 多次未按要求填写详细原因；\n3. 举报原因和细节明显不成立；\n4. 人身攻击被举报人或举报处理人；\n有意编造举报理由的，从重处理。\n你【行为】，构成恶意举报，因此处以封禁。\n如有特殊情况，请说明。',
  },
  {
    key: '不知晓规则',
    value:
      '你好！你在注册时即收到一条包含《新手入门说明》的消息，其中指出棋寻使用《违规封禁规则》作为处理依据。\n《违规封禁规则》明确规定：【规定具体内容】。\n基于棋寻在你注册时即将规则发送给你的事实，不知晓规则不能作为违规的理由，因此就你的申诉作不予解封处理。',
  },
  {
    key: '搜索-不予解封',
    value:
      '根据给定的回放记录，你在注意到信息后有长时间的不合理停顿、未移动街景视角和地图，或移开视角随后离开对局，重新开始操作或回到棋寻界面后，立即放大至信息指向地，搜索痕迹明显。\n因此，就你的申诉作不予解封处理，感谢你的理解与配合。',
  },
  {
    key: '日挑-不予解封-答案',
    value:
      '根据你的复盘回放判断，你有明显的预先获取答案的行为。\n因此，就你的申诉作不予解封处理，感谢你的理解与配合。',
  },
  {
    key: '日挑-不予解封-搜索',
    value:
      '根据你的复盘回放判断，你有明显的网络搜索的行为。\n因此，就你的申诉作不予解封处理，感谢你的理解与配合。',
  },
];

const ReplyModal: React.FC<ReplyModalProps> = ({ open, userId, onClose }) => {
  const [text, setText] = useState<string>();

  return (
    <Modal
      centered
      open={open}
      title={`回复 uid: ${userId} 的申诉`}
      okText="发送"
      okButtonProps={{ danger: true }}
      onCancel={() => {
        setText(undefined);
        onClose();
      }}
      onOk={() => {
        if (userId && text) {
          if (text.includes('【') || text.includes('】')) {
            message.warning('请修改模板！');
            return;
          }
          replyAppeal({ userId: userId, text: text }).then((res) => {
            if (res.success) {
              message.success('发送成功');
              setText(undefined);
              onClose();
            } else {
              message.error('发送失败，该用户可能未被封禁');
            }
          });
        }
      }}
    >
      <Flex gap={4} wrap="wrap">
        {templates.map(({ key, value }) => (
          <Button
            key={key.toString()}
            onClick={() => setText(value)}
            size="small"
          >
            {key}
          </Button>
        ))}
      </Flex>
      <TextArea
        style={{ marginTop: 10 }}
        rows={10}
        placeholder="消息"
        value={text}
        onChange={(v) => setText(v.target.value)}
      />
    </Modal>
  );
};

export default ReplyModal;