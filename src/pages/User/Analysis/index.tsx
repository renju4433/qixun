import VipModal from '@/components/Vip';
import NormalPage from '@/pages/NormalPage';
import { getUserAnalysis } from '@/services/api';
import { Column } from '@ant-design/plots';
import { useModel } from '@umijs/max';
import {
  Button,
  ConfigProvider,
  Descriptions,
  Flex,
  Segmented,
  Spin,
  Table,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { FC, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { convertToPinyin } from 'tiny-pinyin';
import styles from './style.less';
const { Item } = Descriptions;

const TableComponent: FC<{
  columns: ColumnsType<API.CountryState | API.ProvinceState>;
  dataSource: API.CountryState[] | API.ProvinceState[];
  title: string;
  type?: string;
}> = ({ columns, dataSource, title, type }) => (
  <div
    className={type === 'big' ? styles.bigTableWrapper : styles.tableWrapper}
  >
    <h3 style={{ textAlign: 'center' }}>{title}</h3>
    <Table
      size="small"
      pagination={false}
      columns={columns}
      dataSource={dataSource}
    />
  </div>
);

const Analysis: FC = () => {
  // 模式
  const [searchParams] = useSearchParams();
  const [type, setType] = useState<string>('world');
  const [userId, setUserId] = useState<number | undefined>();
  useMemo(() => {
    setType(searchParams.get('type') || 'world');
    const userIdParam = searchParams.get('userId');
    setUserId(userIdParam ? Number(userIdParam) : undefined);
  }, [searchParams]);

  // 数据
  const [uaResult, setUaResult] = useState<API.UAResult>();
  const [config, setConfig] = useState<any>({});
  useEffect(() => {
    let latest = true;
    getUserAnalysis({ type: type, userId: userId }).then((res) => {
      if (latest) {
        setUaResult(res.data);
        setConfig({
          data: res.data.scoreBucketList,
          xField: 'scoreMin',
          yField: 'count',
        });
      }
    });
    return () => {
      latest = false;
    };
  }, [type, userId]);

  const convert2Pinyin = (s: string) => {
    if (s === '重庆') return 'chong qing';
    return convertToPinyin(s);
  };

  // 其他
  const [showVip, setShowVip] = useState<boolean>(false);

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  // 配置
  const meanColumns: ColumnsType<API.CountryState | API.ProvinceState> = [
    {
      title: '国家/地区',
      dataIndex: 'country',
      key: 'country',
      render: (text, record) =>
        record.docLink ? (
          isInApp ? (
            <a href={`/iframe?url=${encodeURIComponent(record.docLink)}`}>
              {text}
            </a>
          ) : (
            <a href={record.docLink}>{text}</a>
          )
        ) : (
          <div>{text}</div>
        ),
    },
    {
      title: '均分',
      dataIndex: 'mean',
      key: 'mean',
      render: (text) => text.toFixed(2),
    },
    {
      title: '出现',
      dataIndex: 'count',
      key: 'count',
    },
  ];
  const meanColumnsChina = meanColumns.slice();
  meanColumnsChina[0] = {
    title: '省份',
    dataIndex: 'province',
    key: 'province',
  };
  const rightColumns = meanColumns.slice();
  rightColumns[1] = { title: '选对', dataIndex: 'right', key: 'right' };
  const wrongColumns = meanColumns.slice();
  wrongColumns[1] = { title: '选错', dataIndex: 'wrong', key: 'wrong' };
  const rightColumnsChina = meanColumnsChina.slice();
  rightColumnsChina[1] = { title: '选对', dataIndex: 'right', key: 'right' };
  const wrongColumnsChina = meanColumnsChina.slice();
  wrongColumnsChina[1] = { title: '选错', dataIndex: 'wrong', key: 'wrong' };
  const allColumns: ColumnsType<API.CountryState | API.ProvinceState> = [
    {
      title: '国家/地区',
      dataIndex: 'country',
      key: 'country',
      render: (text, record) =>
        record.docLink ? (
          <a href={record.docLink}>{text}</a>
        ) : (
          <div>{text}</div>
        ),
      sorter: (a, b) =>
        convert2Pinyin(a.country) > convert2Pinyin(b.country) ? 1 : -1,
    },
    {
      title: '均分',
      dataIndex: 'mean',
      key: 'mean',
      render: (text) => text.toFixed(2),
      sorter: (a, b) => a.mean - b.mean,
    },
    {
      title: '选对',
      dataIndex: 'right',
      key: 'right',
      sorter: (a, b) => a.right - b.right,
    },
    {
      title: '选错',
      dataIndex: 'wrong',
      key: 'wrong',
      sorter: (a, b) => a.wrong - b.wrong,
    },
    {
      title: '出现',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    },
  ];
  const allColumnsChina = allColumns.slice();
  allColumnsChina[0] = {
    title: '省份',
    dataIndex: 'province',
    key: 'province',
    sorter: (a, b) =>
      convert2Pinyin(a.province) > convert2Pinyin(b.province) ? 1 : -1,
  };

  return (
    <NormalPage>
      <div className={styles.container}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem' }}>技术分析</h2>
        <Segmented
          options={[
            { label: '全球积分', value: 'world' },
            { label: '中国积分', value: 'china' },
          ]}
          value={type}
          onChange={(v) => {
            setUaResult(undefined);
            setType(v.toString());
          }}
        />
        {uaResult ? (
          <>
            <Descriptions
              bordered
              title="用户信息"
              contentStyle={{ padding: 10 }}
              labelStyle={{ padding: 10, textAlign: 'center' }}
              style={{ textAlign: 'center' }}
            >
              <Item label="用户名">{uaResult.userName}</Item>
              <Item label="UID">{uaResult.userId}</Item>
              <Item label="模式积分">{uaResult.rating}</Item>
              <Item label="匹配次数">{uaResult.gameCount}</Item>
              <Item label="总轮次数">{uaResult.roundCount}</Item>
              <Item label="局均轮数">
                {uaResult.gameCount
                  ? (uaResult.roundCount / uaResult.gameCount).toFixed(1)
                  : 'N/A'}
              </Item>
              <Item label="5k个数">{uaResult.score5000}</Item>
              <Item label="4990个数">{uaResult.score4990}</Item>
              <Item label="轮平均分">
                {typeof uaResult.mean !== 'string'
                  ? uaResult.mean?.toFixed(2)
                  : '0'}
              </Item>
              <Item label="轮均耗时">
                {uaResult.meanTimeConsume
                  ? (uaResult.meanTimeConsume / 1000).toFixed(2) + '秒'
                  : 'N/A'}
              </Item>
              <Item label="标准差">
                {typeof uaResult.standard !== 'string'
                  ? uaResult.standard?.toFixed(2)
                  : '0'}
              </Item>
              <Item label="轮次方差">
                {typeof uaResult.variance !== 'string'
                  ? uaResult.variance?.toFixed(2)
                  : '0'}
              </Item>
            </Descriptions>

            <div
              style={{
                margin: '1rem 0',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              最近100局积分匹配 单轮得分分布
              <br />
              <br />
              <Column {...config} style={{ height: '100px' }} />
              <br />
              <b style={{ fontSize: 16 }}>分地区数据</b>
            </div>
            <Flex vertical>
              <Flex wrap="wrap" justify="space-between">
                <TableComponent
                  title="选对最多"
                  columns={type === 'world' ? rightColumns : rightColumnsChina}
                  dataSource={uaResult.mostRight}
                />
                <TableComponent
                  title="选错最多"
                  columns={type === 'world' ? wrongColumns : wrongColumnsChina}
                  dataSource={uaResult.mostWrong}
                />
                <TableComponent
                  title="均分最高"
                  columns={type === 'world' ? meanColumns : meanColumnsChina}
                  dataSource={uaResult.highestMean}
                />
                <TableComponent
                  title="均分最低"
                  columns={type === 'world' ? meanColumns : meanColumnsChina}
                  dataSource={uaResult.lowestMean}
                />
              </Flex>
              {uaResult.allCountries === null &&
              uaResult.allProvinces === null ? (
                <ConfigProvider
                  renderEmpty={() => (
                    <div
                      style={{
                        backgroundColor: '#1d1d1d',
                        padding: 10,
                        borderRadius: 5,
                      }}
                    >
                      <span style={{ color: 'white' }}>
                        开通会员解锁全部详细数据
                      </span>
                      <br></br>
                      <Button
                        onClick={() => setShowVip(true)}
                        type="primary"
                        style={{ marginTop: 10 }}
                      >
                        开通
                      </Button>
                    </div>
                  )}
                >
                  <TableComponent
                    title="详细数据"
                    columns={type === 'world' ? allColumns : allColumnsChina}
                    dataSource={[]}
                    type="big"
                  />
                </ConfigProvider>
              ) : (
                <TableComponent
                  title="详细数据"
                  columns={type === 'world' ? allColumns : allColumnsChina}
                  dataSource={
                    type === 'world'
                      ? uaResult.allCountries?.sort(
                          (a, b) =>
                            a.wrong / (a.right + a.wrong) -
                            b.wrong / (b.right + b.wrong),
                        )
                      : uaResult.allProvinces?.sort(
                          (a, b) =>
                            a.wrong / (a.right + a.wrong) -
                            b.wrong / (b.right + b.wrong),
                        )
                  }
                  type="big"
                />
              )}
            </Flex>
            {showVip && (
              <VipModal open={showVip} hide={() => setShowVip(false)} />
            )}
          </>
        ) : (
          <Flex gap="middle" justify="center" vertical>
            <br />
            <Spin tip="加载中" size="large">
              加载中
            </Spin>
          </Flex>
        )}
      </div>
    </NormalPage>
  );
};

export default Analysis;
