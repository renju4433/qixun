const useNotify = () => {
  const notify = (message: string) => {
    try {
      // @ts-ignore
      const Notification =
        window.Notification ||
        // @ts-ignore
        window.mozNotification ||
        // @ts-ignore
        window.webkitNotification;
      if (Notification) {
        Notification.requestPermission(function (status) {
          console.log(status);
          try {
            if ('granted' !== status) {
            } else {
              const notify = new Notification('棋寻通知', {
                dir: 'auto',
                data: '',
                lang: 'zh-CN',
                requireInteraction: false,
                // tag: ,//实例化的notification的id
                icon: 'https://b68v.daai.fun/biz/08a2d3a676f4f520cb99910496e48b4e.png?x-oss-process=image/resize,h_80/quality,q_75', //通知的缩略图,//icon 支持ico、png、jpg、jpeg格式
                body: message,
              });
              notify.onclick = () => {
                //如果通知消息被点击,通知窗口将被激活
                parent.focus();
                window.focus();
                notify.close();
              };
              notify.onshow = function () {
                setTimeout(notify.close.bind(notify), 5000);
              };
              notify.onerror = function () {
                console.log('HTML5桌面消息出错！！！');
              };
              notify.onclose = function () {
                console.log('HTML5桌面消息关闭！！！');
              };
            }
          } catch (e) {
            console.log(e);
          }
        });
      } else {
        console.log('您的浏览器不支持桌面消息');
      }
    } catch (e) {
      console.log(e);
    }
  };

  return notify;
};

export default useNotify;
