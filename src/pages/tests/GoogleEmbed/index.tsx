import styles from './style.less';
const GoogleEmbed = () => {
  return (
    <iframe
      className={styles.wrapper}
      src={
        'https://www.google.com/maps/embed?pb=!4v1688666627432!6m8!1m7!1sGU4PYK2QjLKpUUBM01WlrQ!2m2!1d43.27930873613993!2d-70.59514020216821!3f112.6!4f-2.430000000000007!5f1.5404434693091535'
      }
    ></iframe>
  );
};

export default GoogleEmbed;
