import Ban from '@/components/Admin/Ban';
import { listAppeals, unbanUser } from '@/services/api';
import { Alert, Button, Popconfirm, Table, Tag, Timeline, message } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import ReplyModal from './ReplyModal';
import './style.less';

const renderMore = (text: string) => {
  try {
    const linkRegex =
      /https:\/\/qixun\.fun\/replay-pano\?gameId=[a-f0-9-]+&round=\d+|https:\/\/qixun\.fun\/replay\?gameId=[a-f0-9-]+/g;
    const parts = text.split(linkRegex);
    const result: (JSX.Element | JSX.Element[])[] = [];

    parts.forEach((part, index) => {
      result.push(
        part.split('\n').map((v, i) => (
          <>
            {v}
            {i < part.split('\n').length - 1 && <br></br>}
          </>
        )),
      );

      if (index < parts.length - 1) {
        if (!text.match(linkRegex)) return;
        const url = text.match(linkRegex)![index];
        result.push(
          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>,
        );
      }
    });

    return result;
  } catch {
    return text;
  }
};

const AppealManage = () => {
  const [appealList, setAppealList] = useState<API.AppealManageItem[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [textUid, setTextUid] = useState<number>();
  const [show, setShow] = useState<boolean>(false);
  const [showBan, setShowBan] = useState<boolean>(false);

  const loadAppeals = () => {
    setIsLoading(true);
    listAppeals().then((res) => {
      if (res.data) {
        setAppealList(
          res.data.sort((a, b) => b.gmtLastAppeal - a.gmtLastAppeal),
        );
        setIsLoading(false);
      }
    });
  };

  useEffect(loadAppeals, []);

  const formatTime = (time: string | undefined) => {
    if (time === undefined) return '';
    // if (time.includes('-')) {
    //   return moment(time);
    // }
    // const time1 = parseInt(time);
    const time1 = time.includes('-') ? time : parseInt(time);
    return moment(time1).year() === moment().year()
      ? moment(time1).month() === moment().month() &&
        moment(time1).date() === moment().date()
        ? moment(time1).format('今天 HH:mm')
        : moment(time1).format('MM-DD HH:mm')
      : moment(time1).format('YYYY-MM-DD');
  };

  const splitLmt = (str: string, delim: string, count: number) => {
    const parts = str.split(delim);
    const tail = parts.slice(count - 1).join(delim);
    const result = parts.slice(0, count - 1);
    result.push(tail);
    return result;
  };

  const parseTimeline = (events: string) => {
    let parsed = [];
    for (let event1 of events.split('; ')) {
      if (!event1.length) continue;
      const base = splitLmt(event1, ': ', 2)[0];
      const text = splitLmt(event1, ': ', 2)[1];
      if (base.includes(', ')) {
        parsed.push({
          gmt: base.split(', ', 2)[0].includes('-')
            ? moment(base.split(', ', 2)[0], 'YYYY-MM-DD HH:mm:ss').unix() *
            1000
            : Number(base.split(', ', 2)[0]),
          operatorId: Number(base.split(', ', 2)[1]),
          text: text,
        });
      } else {
        parsed.push({
          gmt: base.includes('-')
            ? moment(base, 'YYYY-MM-DD HH:mm:ss').unix() * 1000
            : Number(base),
          text: text,
        });
      }
    }
    return parsed;
  };

  const getTimeline = (record: API.AppealManageItem) => {
    let timeline: {
      labell: number | undefined;
      label?: string;
      type: string;
      color: string;
      children: JSX.Element;
    }[] = [
        {
          labell: record.gmtBan,
          color: 'green',
          type: 'ban',
          children: (
            <>
              {record.permanent ? (
                <>
                  {`${record.operator.userName} (uid: ${record.operator.userId})`}{' '}
                  将 {`${record.user.userName} (uid: ${record.user.userId})`} 以{' '}
                  {record.banReason} 永久封禁
                </>
              ) : (
                <>
                  {`${record.operator.userName} (uid: ${record.operator.userId})`}{' '}
                  将 {`${record.user.userName} (uid: ${record.user.userId})`} 以{' '}
                  {record.banReason} 封禁至{' '}
                </>
              )}
              {formatTime(record.gmtUntil?.toString())}
              <br></br>
              {record.banDetail && <>{renderMore(record.banDetail)}</>}
            </>
          ),
        },
      ];
    parseTimeline(record.appealText).forEach((v) => {
      timeline.push({
        labell: v.gmt,
        color: 'red',
        type: 'appeal',
        children: <>玩家申诉： {v.text}</>,
      });
    });
    if (record.revoked) {
      timeline.push({
        labell: record.gmtRevoke,
        color: 'green',
        type: 'unban',
        children: (
          <>
            {`${record.revoker.userName} (uid: ${record.revoker.userId})`} 解封
          </>
        ),
      });
    }
    if (record.appealReplyText) {
      parseTimeline(record.appealReplyText).forEach((v) => {
        timeline.push({
          labell: v.gmt,
          color: 'blue',
          type: 'reply',
          children: (
            <>
              {v.operatorId ? `${v.operatorId}` : '管理'} 回复： {v.text}
            </>
          ),
        });
      });
    }
    if (!record.permanent && record.gmtUntil <= new Date().getTime()) {
      timeline.push({
        labell: record.gmtUntil,
        color: 'green',
        type: 'auto_unban',
        children: <>玩家封禁到期，自动解封</>,
      });
    }
    for (let time of timeline) {
      time.label = formatTime(time.labell?.toString() ?? undefined);
    }
    return [...timeline].sort((a, b) => (a.labell ?? 0) - (b.labell ?? 0));
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    {
      title: '玩家',
      key: 'info',
      render: (_: string, record: API.AppealManageItem) => (
        <a href={`/user/${record.user.userId}`}>
          {record.user.userName}
          <br />
          uid: {record.user.userId}
        </a>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: string, record: API.AppealManageItem) => (
        <>
          {record.gmtRevoke && <Tag color="green">已解封</Tag>}
          {record.gmtUntil && record.gmtUntil <= new Date().getTime() && (
            <Tag color="orange">已到期</Tag>
          )}
          {getTimeline(record)[getTimeline(record).length - 1].type ===
            'appeal' && <Tag color="red">未回复</Tag>}
        </>
      ),
      filters: [
        { text: '未回复', value: '未回复' },
        { text: '已解封', value: '已解封' },
      ],
      onFilter: (value: string, record: API.AppealManageItem) => {
        if (value === '已解封') {
          return record.gmtRevoke !== null;
        } else if (value === '未回复') {
          return (
            getTimeline(record)[getTimeline(record).length - 1].type ===
            'appeal'
          );
        }
      },
    },
    Table.EXPAND_COLUMN,
    {
      title: '时间线',
      key: 'timeline',
      render: (_: string, record: API.AppealManageItem) =>
        getTimeline(record).length > 5 ||
          (record.gmtUntil && record.gmtUntil <= new Date().getTime()) ? (
          <>展开查看</>
        ) : !isMobile ? (
          <Timeline mode="left" items={getTimeline(record)} pending={false} />
        ) : (
          getTimeline(record).map((v) => (
            <p key={v.labell?.toString()}>{v.children}</p>
          ))
        ),
      filters: [...new Set(appealList?.map((apl) => apl.operator.userId))]
        .sort((a, b) => a - b)
        .map((oid) => ({ text: oid, value: oid })),
      onFilter: (value: number, record: API.AppealManageItem) =>
        record.operator.userId === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: string, record: API.AppealManageItem) => (
        <>
          <Popconfirm
            placement="leftTop"
            title="解封确认"
            description={`是否确认解封 uid: ${record.user.userId}？`}
            okText="确认解封"
            cancelText="取消"
            onConfirm={() => {
              unbanUser({ userId: record.user.userId }).then((res) => {
                if (res.success) {
                  message.success(`解封 uid: ${record.user.userId} 成功`);
                }
              });
            }}
            okButtonProps={{ danger: true }}
          >
            <Button>解封</Button>
          </Popconfirm>
          {record.banReason === '疑似小号' && (
            <Button
              onClick={() => {
                setShowBan(true);
                setTextUid(record.user.userId);
              }}
            >
              查小号
            </Button>
          )}
          <Button
            onClick={() => {
              setTextUid(record.user.userId);
              setShow(true);
            }}
          >
            回复
          </Button>
        </>
      ),
    },
  ].filter((v) => !isMobile || (v.key !== 'id' && v.key !== 'status'));

  if (appealList)
    return (
      <>
        {!isMobile && (
          <Alert
            style={{ width: '90%', margin: '1rem auto' }}
            type="warning"
            message={
              <>
                <h3>
                  <b>未回复申诉条数（不予受理的也会计入，请忽略）</b>
                </h3>
                {[
                  ...appealList
                    .filter(
                      (v) =>
                        getTimeline(v)[getTimeline(v).length - 1].type ===
                        'appeal',
                    )
                    .map((v) => v.operator.userName)
                    .reduce(
                      (map, num) => map.set(num, (map.get(num) || 0) + 1),
                      new Map(),
                    ),
                ]
                  .sort((a, b) => b[1] - a[1])
                  .map((v) => (
                    <>
                      {v[0]} {v[1]}
                      <br />
                    </>
                  ))}
              </>
            }
          />
        )}
        <Table
          className="table"
          dataSource={appealList}
          columns={columns}
          loading={isLoading}
          expandable={{
            expandedRowRender: (record: API.AppealManageItem) => (
              <Timeline
                mode="left"
                items={getTimeline(record)}
                pending={false}
              />
            ),
            rowExpandable: (record: API.AppealManageItem) =>
              getTimeline(record).length > 5 ||
              (record.gmtUntil !== null &&
                record.gmtUntil <= new Date().getTime()),
          }}
          rowKey={(record) => record.id.toString()}
          pagination={false}
        />
        <ReplyModal
          open={show}
          onClose={() => setShow(false)}
          userId={textUid}
        />
        <Ban show={showBan} setShow={setShowBan} bUid={textUid} />
      </>
    );
};

export default AppealManage;
