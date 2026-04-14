import { checkCanBack } from '@/components/Header/Logo';
import { gotoAppHome } from '@/services/js-bridge';
import { history } from '@umijs/max';

export function qixunGoHome() {
  const isInApp = window.navigator.userAgent.includes('qixun');
  if (isInApp) gotoAppHome();
  else location.href = 'https://saiyuan.top';
}

export function qixunGoback(path: string | null) {
  if (checkCanBack()) history.back();
  else {
    if (path && path !== '/') history.push(path!);
    else qixunGoHome();
  }
}
