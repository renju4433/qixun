import { useModel, useNavigate } from '@umijs/max';

const PointHint = () => {
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const link = 'https://www.yuque.com/chaofun/qixun/season';
  const navigator = useNavigate();
  return (
    <div
      style={{
        cursor: 'pointer',
        textDecoration: 'underline',
        textAlign: 'center',
      }}
      onClick={() => {
        if (isInApp) {
          navigator('/iframe?url=' + encodeURIComponent(link));
        } else {
          window.location.href = link;
        }
      }}
    >
      第十三赛季：2026年4月1日至6月30日
    </div>
  );
};

export default PointHint;
