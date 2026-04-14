import { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  title: '棋寻 - 探索世界',
  pwa: true,
};

export default Settings;
