import { ReactComponent as SvgLoading } from '@/assets/loading.svg';
import Icon from '@ant-design/icons';
import styles from './style.less';

const Loading = () => (
  <div className={styles.loading}>
    <Icon component={SvgLoading} spin />
    <span>棋寻</span>
  </div>
);

export default Loading;
