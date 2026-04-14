// Bind.tsx
import {
  bindDailyChallengeNew,
  checkBind,
  getBind,
  saveBind,
} from '@/services/api';
import {
  Button,
  Checkbox,
  CheckboxProps,
  ConfigProvider,
  Descriptions,
  Divider,
  Input,
  Modal,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
const { Item } = Descriptions;
const { TextArea } = Input;

const Bind: React.FC = () => {
  const [bindResult, setBindResult] = useState<API.DailyChallengeBind>({
    chinaBind: false,
    worldBind: false,
  });
  const [showBind, setShowBind] = useState<string | null>(null);
  const [links, setLinks] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [solutions, setSolutions] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [today, setToday] = useState<boolean>(false);

  useEffect(() => {
    checkBind().then((result) => setBindResult(result.data));
  }, []);

  const parseSolution = (sols: string[]) => {
    if (sols[0] && sols[0].length > 0) {
      return `今日主题：${sols[0]}\n第1题：${sols[1]}\n第2题：${sols[2]}\n第3题：${sols[3]}\n第4题：${sols[4]}\n第5题：${sols[5]}`;
    } else {
      return `第1题：${sols[1]}\n第2题：${sols[2]}\n第3题：${sols[3]}\n第4题：${sols[4]}`;
    }
  };

  function getLinks(type: string) {
    getBind({ type: type }).then((res) => {
      if (res.data && res.data.length !== 0) {
        console.log(res.data);
        setLinks(res.data);
      }
    });
  }

  function saveLinks() {
    console.log(links);
    saveBind({ links: links.join(','), type: showBind ?? '' }).then(() =>
      message.success('保存成功'),
    );
  }

  function bindLinks() {
    bindDailyChallengeNew({
      links: links.join(','),
      type: showBind ?? '',
      solution: parseSolution(solutions),
      today: today,
    }).then((res) => {
      if (res.success) {
        message.success('绑定成功');
        setShowBind(null);
        setLinks([null, null, null, null, null]);
      }
    });
  }

  const handleButtonClick = (location: string) => {
    setLinks([null, null, null, null, null]);
    setShowBind(location);
    getLinks(location);
  };

  const handleInputChange = (index: number) => (e) => {
    setSolutions(
      solutions.map((solution, i) => (i === index ? e.target.value : solution)),
    );
  };

  const onChange: CheckboxProps['onChange'] = (e) => {
    setToday(e.target.checked);
  };

  const inputsConfig = [
    { index: 0, addonBefore: '主题', placeholder: '若无主题请留空' },
    { index: 1, addonBefore: '第1题' },
    { index: 2, addonBefore: '第2题' },
    { index: 3, addonBefore: '第3题' },
    { index: 4, addonBefore: '第4题' },
    { index: 5, addonBefore: '第5题', placeholder: '若无主题请留空' },
  ];

  return (
    <ConfigProvider
      theme={{ components: { Descriptions: { titleMarginBottom: 6 } } }}
    >
      <Descriptions
        title="每日挑战绑定状态"
        labelStyle={{ alignItems: 'center' }}
      >
        <Item label="中国" span={1}>
          {bindResult.chinaBind ? '已绑定' : '未绑定'}
          <Button
            style={{ marginLeft: '0.5rem' }}
            onClick={() => handleButtonClick('china')}
          >
            {bindResult.chinaBind ? '修改' : '去绑定'}
          </Button>
        </Item>
        <Item label="全球" span={1}>
          {bindResult.worldBind ? '已绑定' : '未绑定'}
          <Button
            style={{ marginLeft: '0.5rem' }}
            onClick={() => handleButtonClick('world')}
          >
            {bindResult.worldBind ? '修改' : '去绑定'}
          </Button>
        </Item>
      </Descriptions>
      <Modal
        open={showBind !== null}
        title={showBind === 'china' ? '中国日挑绑定' : '全球日挑绑定'}
        onCancel={() => {
          setLinks([null, null, null, null, null]);
          setShowBind(null);
        }}
        onOk={bindLinks}
        okText="绑定"
      >
        <Typography.Text>
          填写PanoId, 街景必须在题库中是待发布或者已发布状态；先保存，再绑定！
        </Typography.Text>
        {Array.from({ length: 5 }, (_, index) => index).map((v) => (
          <Input
            style={{ margin: '0.25rem 0' }}
            key={v}
            value={links[v] ?? ''}
            onChange={(e) =>
              setLinks(
                links.map((link, index) => {
                  if (index === v) return e.target.value;
                  else return link;
                }),
              )
            }
          />
        ))}
        <Button style={{ margin: '0.25rem 0' }} onClick={saveLinks}>
          保存
        </Button>
        <Divider />
        {inputsConfig.map((config) => (
          <Input
            key={config.index}
            addonBefore={config.addonBefore}
            style={{ margin: '0.25rem 0' }}
            placeholder={config.placeholder || ''}
            value={solutions[config.index] ?? ''}
            onChange={handleInputChange(config.index)}
          />
        ))}
        <TextArea
          style={{ margin: '0.5rem 0' }}
          value={parseSolution(solutions)}
          disabled
          showCount
          autoSize
        ></TextArea>
        <Checkbox onChange={onChange}>
          绑定到今天（如果已有题目，不会覆盖，可不填；解析一定会被覆盖）
        </Checkbox>
      </Modal>
    </ConfigProvider>
  );
};

export default Bind;
