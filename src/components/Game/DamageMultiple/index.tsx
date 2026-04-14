import { FC } from 'react';
import styles from './style.less';

type DamageMultipleProps = {
  damageMultiple: number;
};

const DamageMultiple: FC<DamageMultipleProps> = ({ damageMultiple }) => (
  <div className={styles.damageMultipleContianer}>
    <div className={styles.damageMultipleIcon}>
      <div className={styles.damageMultipleIconInner}>
        <p>{`x${damageMultiple.toFixed(1)}`}</p>
      </div>
    </div>
  </div>
);

export default DamageMultiple;
