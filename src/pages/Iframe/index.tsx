import NormalPage from '@/pages/NormalPage';
import { useSearchParams } from 'react-router-dom';

// 域名白名单
const ALLOWED_DOMAINS = [
  'yuque.com',
  'www.yuque.com',
  'docs.qq.com',
  'qq.com',
  'feishu.cn',
  'www.feishu.cn',
  'mp.weixin.qq.com', // 微信公众号
];

const Iframe = () => {
  const [searchParams] = useSearchParams();
  const encodedUrl = searchParams.get('url');
  const decodedUrl = encodedUrl ? decodeURIComponent(encodedUrl) : '';

  // 检查 URL 是否在白名单内
  const isUrlAllowed = (url: string) => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return ALLOWED_DOMAINS.some((domain) =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  };

  const urlAllowed = isUrlAllowed(decodedUrl);

  return (
    <NormalPage fullscreen>
      {decodedUrl ? (
        urlAllowed ? (
          <iframe
            src={decodedUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="iframe content"
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            该 URL 不在白名单内，无法加载
          </div>
        )
      ) : (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: '20px',
          }}
        >
          未提供有效的 URL 参数
        </div>
      )}
    </NormalPage>
  );
};

export default Iframe;
