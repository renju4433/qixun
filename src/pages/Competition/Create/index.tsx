/* eslint-disable @typescript-eslint/no-unused-vars */
import { getRecommendMaps, searchUser } from '@/services/api';
import { useDebounceFn } from 'ahooks';
import {
  Button,
  ConfigProvider,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  TimePicker,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import NormalPage from '../../NormalPage';
const { Option } = Select;
const { Link, Text } = Typography;
const { Item } = Form;

const tournamentTypes = [
  { label: '锦标', color: 'green' },
  { label: '杯赛', color: 'orange' },
  { label: '联赛', color: 'red' },
  { label: '友谊', color: 'blue' },
  { label: '邀请', color: 'purple' },
];

const gameModes = ['单败淘汰', '双败淘汰', '积分排位', '小组', '循环'];

const Create = () => {
  const [form] = Form.useForm();
  const [name, setName] = useState<string>('');
  const [tag, setTag] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const onFinish = (values: any) => {
    console.log('Form values:', values);
    console.log('Form values:', form.getFieldsValue(true));
    message.success('保存成功');
  };

  /* 快速设置
  useEffect(() => {
    if (tag) {
      message.success('快速设置成功');
      form.setFieldsValue({
        tag: tag,
      });
      console.log(form.getFieldsValue(true));
    }
  }, [tag]);
  */

  // 赛事组成员
  const [userList, setUserList] = useState<API.UserProfile[]>([]);
  const [admins, setAdmins] = useState<API.UserProfile[]>([]);
  const loadUsers = (key: string) => {
    if (!key) {
      setUserList([]);
      return;
    }
    searchUser({ keyword: key, pageNum: 1, pageSize: 10 }).then((res) => {
      const users = res.data.map((user) => ({
        ...user,
        value: user.userName,
        label: user.userName,
      }));
      setUserList(users);
    });
  };
  const { run: debounceLoadUsers } = useDebounceFn(loadUsers, { wait: 300 });

  // 赛制设计
  const [type, setType] = useState<string>('单一');
  const [participateType, setParticipateType] = useState<string>('个人');
  const [mapScope, setMapScopeSetting] = useState<string>('全球');
  const [duration, setDuration] = useState<string>('一日');
  const [designSettings, setDesignSettings] = useState({
    isMixed: false,
    isTeam: false,
    isChina: false,
    isMultiDay: false,
  });
  const [singleMode, setSingleMode] = useState<string | null>(null);
  const [preliminaryMode, setPreliminaryMode] = useState<string | null>(null);
  const [finalMode, setFinalMode] = useState<string | null>(null);

  // 直播地址
  const [showLive, setShowLive] = useState<boolean>(false);
  const [liveUrl, setLiveUrl] = useState<string>('');
  const [liveHost, setLiveHost] = useState<string>('');
  const [applyRecording, setApplyRecording] = useState<boolean>(false);

  // 题库选择
  const [mapList, setMapList] = useState<API.MapItem[]>([]);
  const [maps, setMaps] = useState<API.MapItem[]>([]);
  const [randomMap, setRandomMap] = useState<boolean>(false);
  useEffect(() => {
    getRecommendMaps({ count: 100 }).then((res) => {
      res.data.sort((a, b) => a.name.localeCompare(b.name));
      setMapList(
        res.data.map((item) => ({
          ...item,
          value: item.name,
          label: item.name,
        })),
      );
    });
  }, []);

  // 选手设置
  const [ratingLimit, setRatingLimit] = useState<number>();
  const [numberOfPlayers, setNumberOfPlayers] = useState<number>();
  const [numberOfTeams, setNumberOfTeams] = useState<number>();
  const [numberOfGroups, setNumberOfGroups] = useState<number>();

  // 派对设置
  const [showPartySetting, setShowPartySetting] = useState<boolean>(false);
  const [health, setHealth] = useState<number>(6000);
  const [startRound, setStartRound] = useState<number>(6);
  const [increment, setIncrement] = useState<number>(0.5);
  const [timeLimit, settimeLimit] = useState<number>(30);
  const [mapView, setMapView] = useState<string>('自由');

  const initialValues = {
    name: name,
    tag: tag,
    note: note,
    dateSetting: {
      startDate: '',
      startTime: '',
      endDate: '',
    },
    participatantSetting: {
      ratingLimit: ratingLimit,
      numberOfPlayers: numberOfPlayers,
      numberOfTeams: numberOfTeams,
      numberOfGroups: numberOfGroups,
    },
    baseSetting: {
      type: type,
      mapScope: mapScope,
      duration: duration,
      singleMode: singleMode,
      preliminaryMode: preliminaryMode,
      finalMode: finalMode,
      participateType: participateType,
    },
    mapSetting: {
      maps: maps,
      randomMap: randomMap,
    },
    liveSetting: {
      liveUrl: liveUrl,
      liveHost: liveHost,
      applyRecording: applyRecording,
    },
    partySetting: {
      health: health,
      startRound: startRound,
      increment: increment,
      timeLimit: timeLimit,
      mapView: mapView,
    },
  };

  const needGroup =
    singleMode === '小组' ||
    singleMode === '积分排位' ||
    preliminaryMode === '小组' ||
    preliminaryMode === '积分排位' ||
    finalMode === '小组' ||
    finalMode === '积分排位';

  return (
    <NormalPage title="棋寻赛事策划">
      <ConfigProvider
        theme={{
          components: {
            Form: {
              itemMarginBottom: 16,
            },
          },
        }}
      >
        <Form
          form={form}
          onFinish={onFinish}
          requiredMark={false}
          initialValues={initialValues}
        >
          <Flex wrap="wrap" gap="small">
            <Item label="赛事名称" required style={{ flex: 1 }}>
              <Input
                placeholder="请输入赛事名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Item>
            <Item label="赛事属性">
              <Select allowClear placeholder="选择属性" variant="borderless">
                {tournamentTypes.map((item) => (
                  <Option key={item.label} value={item.label}>
                    <Tag color={item.color} onClick={() => setTag(item.label)}>
                      {item.label}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Item>
          </Flex>

          <Flex wrap="wrap" justify="space-between" gap="small">
            <Item label="赛事组" required style={{ flex: 1 }}>
              <Select
                mode="multiple"
                options={userList.map((user) => ({
                  key: user.userId,
                  value: user.userId,
                  label: `${user.userName} (uid: ${user.userId})`,
                }))}
                onSearch={(value) => debounceLoadUsers(value)}
                onSelect={(value) => {
                  const newAdmins = [
                    ...admins,
                    ...userList.filter((user) => user.userId === value),
                  ];
                  setAdmins(newAdmins);
                }}
                placeholder="输入昵称来搜索赛事组成员"
              />
            </Item>
            <Item label="直播">
              {liveUrl ? (
                <Space>
                  <Link href={liveUrl} target="_blank">
                    {liveHost}
                  </Link>
                  <Button onClick={() => setShowLive(true)}>修改</Button>
                </Space>
              ) : (
                <Button onClick={() => setShowLive(true)}>填写网址信息</Button>
              )}
            </Item>
          </Flex>

          <Flex wrap="wrap" gap="small">
            <Item label="赛制类型" required>
              <Switch
                checkedChildren="混合"
                unCheckedChildren="单一"
                value={designSettings.isMixed}
                checked={designSettings.isMixed}
                onChange={(checked) => {
                  setType(checked ? '混合' : '单一');
                  setDesignSettings({ ...designSettings, isMixed: checked });
                }}
              />
            </Item>
            <Item label="参赛形式" required>
              <Switch
                checkedChildren="组队"
                unCheckedChildren="个人"
                value={designSettings.isTeam}
                checked={designSettings.isTeam}
                onChange={(checked) => {
                  setParticipateType(checked ? '组队' : '个人');
                  setDesignSettings({ ...designSettings, isTeam: checked });
                }}
              />
            </Item>
            <Item label="比赛时长" required>
              <Switch
                checkedChildren="多日"
                unCheckedChildren="一日"
                value={designSettings.isMultiDay}
                checked={designSettings.isMultiDay}
                onChange={(checked) => {
                  setDuration(checked ? '多日' : '一日');
                  setDesignSettings({ ...designSettings, isMultiDay: checked });
                }}
              />
            </Item>
            <Item label="比赛范围" required>
              <Switch
                checkedChildren="中国"
                unCheckedChildren="全球"
                value={designSettings.isChina}
                checked={designSettings.isChina}
                onChange={(checked) => {
                  setMapScopeSetting(checked ? '中国' : '全球');
                  setDesignSettings({ ...designSettings, isChina: checked });
                }}
              />
            </Item>
            <Button onClick={() => setShowPartySetting(true)}>派对设置</Button>
          </Flex>

          <Flex wrap="wrap" gap="small">
            <Item name={['dateSetting', 'startDate']} label="开赛日期" required>
              <DatePicker />
            </Item>
            <Item name={['dateSetting', 'startTime']} label="开赛时间" required>
              <TimePicker format="HH:mm" />
            </Item>
            {designSettings.isMultiDay && (
              <Item name={['dateSetting', 'endDate']} label="结束日期">
                <DatePicker />
              </Item>
            )}
          </Flex>

          <Flex wrap="wrap" gap="small">
            <Item label="积分限制">
              <InputNumber
                min={0}
                step={100}
                placeholder="请输入积分限制"
                value={ratingLimit}
                onChange={(value) => setRatingLimit(value ?? 1500)}
              />
            </Item>
            <Item label="选手数">
              <InputNumber
                min={2}
                placeholder="请输入选手数量"
                value={numberOfPlayers}
                onChange={(value) => setNumberOfPlayers(value ?? 0)}
              />
            </Item>
            {designSettings.isTeam && (
              <Item label="队伍数">
                <InputNumber
                  min={2}
                  placeholder="请输入队伍数量"
                  value={numberOfTeams}
                  onChange={(value) => setNumberOfTeams(value ?? 0)}
                />
              </Item>
            )}
            {needGroup && (
              <Item label="分组数">
                <InputNumber
                  min={2}
                  placeholder="请输入分组数量"
                  value={numberOfGroups}
                  onChange={(value) => setNumberOfGroups(value ?? 0)}
                />
              </Item>
            )}
          </Flex>

          <Flex wrap="wrap">
            <Item label="比赛模式" required>
              {designSettings.isMixed ? (
                <Flex vertical>
                  <Space>
                    <Text type="secondary">预赛/初赛</Text>
                    <Radio.Group
                      options={gameModes}
                      value={preliminaryMode}
                      onChange={(e) => setPreliminaryMode(e.target.value)}
                    />
                  </Space>
                  <Space>
                    <Text type="secondary">复赛/决赛</Text>
                    <Radio.Group
                      options={gameModes}
                      value={finalMode}
                      onChange={(e) => setFinalMode(e.target.value)}
                    />
                  </Space>
                </Flex>
              ) : (
                <Radio.Group
                  options={gameModes}
                  value={singleMode}
                  onChange={(e) => setSingleMode(e.target.value)}
                />
              )}
            </Item>
          </Flex>

          <Flex wrap="wrap" gap="small">
            <Item label="比赛题库" style={{ flex: 1 }} required>
              <Select
                mode="multiple"
                placeholder="从编辑精选列表中选择题库"
                options={mapList}
                onSelect={(value) => {
                  const newMaps = [...maps, value];
                  setMaps(newMaps);
                }}
              />
            </Item>
            {maps.length > 1 && (
              <Item label="随机题库">
                <Switch
                  checkedChildren="随机"
                  unCheckedChildren="固定"
                  value={randomMap}
                  checked={randomMap}
                  onChange={(checked) => setRandomMap(checked)}
                />
              </Item>
            )}
          </Flex>

          <Item label="赛事备注">
            <Input.TextArea
              placeholder="请输入赛事备注"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Item>

          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form>
      </ConfigProvider>

      <Modal
        open={showLive}
        title="填写直播地址"
        onCancel={() => setShowLive(false)}
        onOk={() => setShowLive(false)}
      >
        <Input
          allowClear
          placeholder="请输入直播间网址"
          value={liveUrl}
          onChange={(e) => setLiveUrl(e.target.value)}
        />
        <Flex gap="small" align="center" style={{ marginTop: 8 }}>
          <Select
            allowClear
            placeholder="选择直播主机用户"
            options={admins.map((user) => ({
              key: user.userId,
              value: user.userId,
              label: `${user.userName} (uid: ${user.userId})`,
            }))}
            onChange={(e) => setLiveHost(e)}
            style={{ flex: 1 }}
          />
          <Switch
            checkedChildren="申请录播"
            unCheckedChildren="自行录制"
            value={applyRecording}
            checked={applyRecording}
            onChange={(checked) => setApplyRecording(checked)}
          />
        </Flex>
      </Modal>

      <Modal
        open={showPartySetting}
        title="派对设置"
        onCancel={() => setShowPartySetting(false)}
        onOk={() => setShowPartySetting(false)}
      >
        <Flex gap={5}>
          <Item label="单轮血量">
            <InputNumber
              prefix="HP"
              min={1000}
              step={1000}
              defaultValue={6000}
              value={health}
              onChange={(value) => setHealth(value ?? 6000)}
              placeholder="请输入单轮血量"
            />
          </Item>
          <Item label="开始加倍">
            <InputNumber
              prefix="第"
              addonAfter="轮"
              min={2}
              step={1}
              defaultValue={6}
              value={startRound}
              onChange={(value) => setStartRound(value ?? 6)}
              placeholder="请输入开始加倍轮次"
            />
          </Item>
          <Item label="倍率增速">
            <InputNumber
              addonAfter="倍"
              min={0.2}
              step={0.1}
              defaultValue={0.5}
              value={increment}
              onChange={(value) => setIncrement(value ?? 0.5)}
              placeholder="请输入倍率增速"
            />
          </Item>
          <Item label="单轮限时">
            <InputNumber
              addonAfter="秒"
              min={5}
              step={5}
              defaultValue={30}
              value={timeLimit}
              onChange={(value) => settimeLimit(value ?? 30)}
              placeholder="请输入限时"
            />
          </Item>
        </Flex>
        <Item label="所用视角">
          <Select
            defaultValue="自由"
            value={mapView}
            onChange={(value) => setMapView(value)}
            placeholder="请选择视角"
          >
            <Option value="自由">自由｜NM</Option>
            <Option value="移动">移动｜Move</Option>
            <Option value="固定视角">固定｜NMPZ</Option>
          </Select>
        </Item>
      </Modal>
    </NormalPage>
  );
};

export default Create;
