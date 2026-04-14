import { addTip, deleteTip, editTip, listTips } from '@/services/api';
import { Button, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';

type TipsManageProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

const TipsManage: FC<TipsManageProps> = ({ show, setShow }) => {
  const [tips, setTips] = useState<API.TipInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<API.TipInfo | null>(null);
  const [form] = Form.useForm();

  const loadTips = () => {
    setLoading(true);
    listTips().then((res) => {
      if (res.data) {
        setTips(res.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    if (show) loadTips();
  }, [show]);

  const handleAdd = () => {
    setEditingTip(null);
    form.resetFields();
    setEditModalOpen(true);
  };

  const handleEdit = (record: API.TipInfo) => {
    setEditingTip(record);
    form.setFieldsValue({ tip: record.tip });
    setEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteTip({ id }).then((res) => {
      if (res.success) {
        message.success('删除成功');
        loadTips();
      } else {
        message.error('删除失败');
      }
    });
  };

  const handleEditConfirm = () => {
    form.validateFields().then((values) => {
      const tip = values.tip?.trim();
      if (!tip) {
        message.error('提示内容不能为空');
        return;
      }
      if (editingTip) {
        editTip({ id: editingTip.id, tip }).then((res) => {
          if (res.success) {
            message.success('修改成功');
            setEditModalOpen(false);
            loadTips();
          } else {
            message.error('修改失败');
          }
        });
      } else {
        addTip({ tip }).then((res) => {
          if (res.success) {
            message.success('添加成功');
            setEditModalOpen(false);
            loadTips();
          } else {
            message.error('添加失败');
          }
        });
      }
    });
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '提示内容', dataIndex: 'tip', key: 'tip', ellipsis: true },
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      width: 170,
      render: (v: string | null) =>
        v ? moment(Number(v)).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: API.TipInfo) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该提示？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title="提示管理"
        open={show}
        onCancel={() => setShow(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Button
          type="primary"
          onClick={handleAdd}
          style={{ marginBottom: 16 }}
        >
          新增提示
        </Button>
        <Table
          dataSource={tips}
          columns={columns}
          rowKey={(record) => record.id.toString()}
          loading={loading}
          pagination={false}
          size="small"
          scroll={{ y: 500 }}
        />
      </Modal>

      <Modal
        title={editingTip ? '编辑提示' : '新增提示'}
        open={editModalOpen}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalOpen(false)}
        okText={editingTip ? '修改' : '添加'}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tip"
            label="提示内容"
            rules={[{ required: true, message: '请输入提示内容' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TipsManage;
