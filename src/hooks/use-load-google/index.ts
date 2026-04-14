import { Loader } from '@/components/GoogleJSLoader';
import { useEffect, useRef } from 'react';

type useCheckGoogleProps = {
  setLoaded: (loaded: boolean) => void;
};

export const useLoadGoogle = ({ setLoaded }: useCheckGoogleProps) => {
  const loader = useRef<Loader>();

  const callback = () => {
    loader.current = new Loader({
      apiKey: 'AIzaSyCdt719yJI_9hg8WNct5hSbFim7vApmdrU',
      url: 'https://b68v.daai.fun/st_v3/js_v32.js',
    });

    loader.current.importLibrary('streetView').finally(() => {
      setLoaded(true);
    });
  };

  useEffect(() => {
    setTimeout(() => {
      callback();
      // 需要延迟，不然 app.tsx 的 onRouteChange 会触发循环刷新
    }, 50);
  }, []);

  // useCheckGoogle({ callback });
};
