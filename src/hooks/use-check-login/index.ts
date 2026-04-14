import { history } from '@@/core/history';
import { useModel } from '@@/exports';
import { message } from 'antd';

export const useCheckLogin = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const checkLogin = (onSuccess: () => void) => {
    if (!user) {
      message.warning('需要登录');
      history.push('/user/login?redirect=' + encodeURIComponent(location.href));
    } else onSuccess();
  };

  return checkLogin;
};
