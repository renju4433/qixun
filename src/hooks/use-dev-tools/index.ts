import { useModel } from '@umijs/max';
import { useEffect } from 'react';

export const useDevTools = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  useEffect(() => {
    if (
      user?.userId === 1 ||
      user?.userId === 3 ||
      user?.userId === 557001 ||
      process.env.REACT_APP_ENV === 'dev'
    ) {
      let el = document.createElement('div');
      document.body.appendChild(el);
      import('eruda').then((eruda) => {
        eruda.default.init({ container: el, tool: ['console', 'elements'] });
      });
    }
  }, []);
};
