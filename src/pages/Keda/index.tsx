import NormalPage from '@/pages/NormalPage';
import { Image } from 'antd';

const Keda = () => {
  return (
    <NormalPage
      title={'棋寻X中科大关于非正式学习的问卷调研'}
      desc={'填写UID以后次日有50宝石奖励'}
    >
      <div>说明：</div>
      <div style={{ marginTop: '1rem' }}>
        中国科大科技传播系为研究棋寻玩家的非正式学习行为发起此次问卷调查，此次调查收集到的数据仅用于学术研究，非常感谢您的参与！！
      </div>

      <div style={{ marginTop: '1rem' }}>
        填写此问卷需费您5-8分钟时间，填写UID并提交成功后将会在次日得到50个宝石的奖励，奖励按照每日填写名单发放。
      </div>

      <div style={{ marginTop: '1rem' }}>
        这是第二期，第一期填写了的用户同样可以填写并获得宝石奖励, 目前进度 830 /
        900。
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <Image
          preview={{ mask: false }}
          src={'https://b68v.daai.fun/front/activities/keda.png'}
          style={{ maxWidth: '300px' }}
        ></Image>
        <div style={{ marginTop: '1rem' }}>
          <a
            href={'https://qr71.cn/oI6CBp/qDJduu6'}
            target={'_blank'}
            rel="noreferrer"
          >
            扫码或点击打开问卷
          </a>
        </div>
      </div>
    </NormalPage>
  );
};

export default Keda;
