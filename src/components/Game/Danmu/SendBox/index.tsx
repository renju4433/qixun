import {
  CommentOutlined,
  SendOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { ModalForm, ProForm, ProFormText } from '@ant-design/pro-components';
import data from '@emoji-mart/data';
import i18n from '@emoji-mart/data/i18n/zh.json';
import Picker from '@emoji-mart/react';
import { useModel } from '@umijs/max';
import { useKeyPress } from 'ahooks';
import { Button, InputRef, Popover, message } from 'antd';
import { FC, useRef, useState } from 'react';
import styles from './style.less';

type DanmuProps = {
  model: 'Point.model';
};

const SendBox: FC<DanmuProps> = ({ model }) => {
  const { sendMessage } = useModel(model, (model) => ({
    sendMessage: model.sendMessage,
  }));

  const [form] = ProForm.useForm();

  const [emojiModalVisible, setEmojiModalVisible] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<InputRef>(null);

  useKeyPress('enter', () => {
    buttonRef.current?.click();
  });

  // 发送弹幕
  const onSendDanmu = (text?: string) => {
    sendMessage(
      JSON.stringify({
        scope: 'qixun',
        data: { type: 'send_bullet', text },
      }),
    );
  };

  return (
    <ModalForm
      form={form}
      submitter={false}
      layout="inline"
      modalProps={{
        mask: true,
        maskClosable: true,
        closeIcon: false,
        maskStyle: {
          pointerEvents: 'none',
          backgroundColor: 'transparent',
        },
        wrapClassName: styles.danmuModal,
        width: '50%',
        afterOpenChange: (visible) => {
          if (!visible) form.resetFields();
          else inputRef.current?.focus();
        },
      }}
      trigger={
        <Button
          shape="circle"
          type="primary"
          size="large"
          className={styles.danmuButton}
          icon={<CommentOutlined />}
          ref={buttonRef}
        />
      }
      autoFocusFirstInput
      onFinish={async (values) => {
        if (values.danmu) {
          onSendDanmu(values.danmu);
          message.success('发送成功！');
        }
        return true;
      }}
    >
      <ProFormText
        name="danmu"
        placeholder="请输入弹幕"
        allowClear={false}
        fieldProps={{ ref: inputRef, size: 'large' }}
      />

      <Popover
        trigger="click"
        content={
          <Picker
            data={data}
            i18n={i18n}
            onEmojiSelect={({ native }: { native: string }) => {
              form.setFieldsValue({
                danmu: `${form.getFieldValue('danmu') ?? ''}${native}`,
              });

              setEmojiModalVisible(false);
            }}
          />
        }
        open={emojiModalVisible}
        onOpenChange={setEmojiModalVisible}
      >
        <Button
          className={styles.emojiButton}
          type="primary"
          shape="circle"
          size="large"
          icon={<SmileOutlined />}
        />
      </Popover>

      <Button
        type="primary"
        htmlType="submit"
        shape="circle"
        size="large"
        icon={<SendOutlined />}
      />
    </ModalForm>
  );
};

export default SendBox;
