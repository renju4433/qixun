import { createAchievement, editAchievement } from '@/services/api';
import { Form, Input, InputNumber, Modal, Switch, message } from 'antd';
import { FC, useEffect } from 'react';
const { Item } = Form;

type AchievementProps = {
  achievement?: API.AchievementManageItem | null;
  typ: string;
  show: boolean;
  setShow: (show: boolean) => void;
  reload: () => void;
};

const AchieveEdit: FC<AchievementProps> = ({
  achievement,
  typ,
  show,
  setShow,
  reload,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(achievement);
    if (achievement === null) form.resetFields();
  }, [show]);

  const confirm = () => {
    const newAchievement = form.getFieldsValue();
    if (newAchievement?.name) {
      if (typ === 'edit') {
        try {
          editAchievement({
            ...newAchievement,
          }).then((res) => {
            if (res.success) {
              message.success('修改成功');
              setShow(false);
              reload();
            } else message.error('修改失败');
          });
        } catch (error) {
          message.error('未知错误，修改失败');
        }
      } else if (typ === 'create') {
        try {
          createAchievement({
            ...newAchievement,
          }).then((res) => {
            if (res.success) {
              message.success('创建成功');
              setShow(false);
              reload();
            } else message.error('创建失败');
          });
        } catch (error) {
          message.error('未知错误，创建失败');
        }
      }
    } else message.error('请填写完整信息');
  };

  return (
    <Modal
      centered
      destroyOnClose
      open={show}
      onOk={confirm}
      onCancel={() => setShow(false)}
      okText={typ === 'edit' ? '修改' : '创建'}
      title={'成就' + (typ === 'edit' ? '修改' : '创建')}
      modalRender={(dom) => (
        <Form layout="horizontal" form={form} name="form_in_modal">
          {dom}
        </Form>
      )}
    >
      <Item name="id" label="成就 ID">
        <InputNumber disabled />
      </Item>
      <Item
        name="name"
        label="成就名称"
        rules={[{ required: true, message: '成就名称不能为空！' }]}
      >
        <Input />
      </Item>
      <Item name="hint" label="成就描述">
        <Input />
      </Item>
      <Item name="task" label="达成方式">
        <Input />
      </Item>
      <Item name="gems" label="宝石奖励">
        <InputNumber />
      </Item>
      <Item name="seriesId" label="系列标识">
        <Input />
      </Item>
      <Item name="seriesSeq" label="系列位次">
        <InputNumber />
      </Item>
      <Item name="hidden" label="是否隐藏">
        <Switch />
      </Item>
      <Item name="disabled" label="是否禁用">
        <Switch />
      </Item>
      <Item
        name="action"
        label="授予条件"
        rules={[{ required: true, message: '授予条件不能为空！' }]}
      >
        <Input />
      </Item>
      <Item
        name="actionCount"
        label="阈值"
        rules={[{ required: true, message: '授予阈值不能为空！' }]}
      >
        <InputNumber />
      </Item>
    </Modal>
  );
};

export default AchieveEdit;
