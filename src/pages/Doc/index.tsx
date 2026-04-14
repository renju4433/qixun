import { qixunCopy } from '@/utils/CopyUtils';
import { useModel } from '@umijs/max';
import { Button, Flex, Modal, QRCode, Typography } from 'antd';
const { Link, Text, Title } = Typography;

const Doc = () => {
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));
  return (
    <Modal title="棋寻文档" open={true} closable={false} footer={null}>
      <Flex vertical gap="small">
        <Text>
          「棋寻」是一款通过现实全景图来猜测位置的娱乐化学习应用，帮助您学习地理人文知识，足不出户遨游世界各地。
        </Text>
        <Text>
          「棋寻文档」知识库拥有文档、教程数百篇，均由社群贡献，按模式分为中国和世界两类，包括 ©Plonk It 教程汉化、寻友教程等多个部分。
        </Text>
        <Flex align="center" justify="center" gap="middle" wrap="wrap">
          <QRCode
            value="https://www.yuque.com/chaofun/qixun/"
            icon="https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*vMxOQIh4KBMAAAAAAAAAAAAADvuFAQ/original"
          />
          <Flex align="center" vertical>
            <Title level={2} type="warning" style={{ margin: 0 }}>棋寻文档</Title>
            {isInApp ? (
              'https://www.yuque.com/chaofun/qixun'
            ) : (
              <Link
                href="https://www.yuque.com/chaofun/qixun"
                target="_blank"
                rel="noreferrer"
                style={{ textWrap: 'nowrap' }}
              >
                https://www.yuque.com/chaofun/qixun
              </Link>
            )}
            <br />
            <Button onClick={() => qixunCopy('https://www.yuque.com/chaofun/qixun/')}>
              复制链接
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default Doc;