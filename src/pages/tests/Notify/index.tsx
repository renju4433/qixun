import NormalPage from '@/pages/NormalPage';
import { Button } from 'antd';

const Notify = () => {
  return (
    <NormalPage>
      <Button
        onClick={() => {
          if ('Notification' in window) {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                const options = {
                  body: '这是通知的正文内容',
                  icon: 'https://via.placeholder.com/80',
                };
                setTimeout(() => {
                  const notification = new Notification(
                    'Hello, World!',
                    options,
                  );

                  console.log('notification');

                  // 可选：处理点击事件
                  notification.onclick = function () {
                    window.open('https://example.com');
                  };
                }, 1000);
              }
            });
          } else {
            alert('这个浏览器不支持桌面通知');
          }
        }}
      >
        测试
      </Button>
    </NormalPage>
  );
};

export default Notify;
