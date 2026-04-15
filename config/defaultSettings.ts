import { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  title: '棋寻 - 以棋会友',
  pwa: true,
};

export default Settings;
