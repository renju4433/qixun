import { FC } from 'react';
import styles from './style.less';

const LngLatCvtTip: FC = ({}) => {
  return (
    <div>
      <h3>
        <b className={styles.red}>转换不一定正确，请手动检查！</b>
      </h3>
      <h3>支持以下几种方式:</h3>
      {/* 1 */}
      <h4>1. 经度, 纬度</h4>
      &nbsp;&nbsp;例&nbsp;
      <i>116.3942, 40.00835</i>
      <br />
      &nbsp;&nbsp;支持中英文逗号 和 连续空格
      {/* 2 */}
      <h4>2. 纬度, 经度</h4>
      &nbsp;&nbsp;例&nbsp;
      <i>40.00835, 116.3942</i>
      <br />
      &nbsp;&nbsp;仅当 经度 &gt; 90° 或 经度 &lt; -90° 时生效，即
      国内大部分地区是可以的
      {/* 百度地图 */}
      <h4>3. 百度地图</h4>
      <h5>&nbsp;&nbsp;3.1 网页网址</h5>
      &nbsp;&nbsp;例&nbsp;
      <i>https://map.baidu.com/@12957771,4840356,21z</i>
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <i>
        https://map.baidu.com/poi/@12957832,4840295,21z?uid=7fb5c2010bda03a28b2fb507&compat=1&querytype=detailConInfo
      </i>
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <i>
        https://map.baidu.com/@12957857.2,4840157.03,21z#panoid=09002200121902131035064848O&panotype=street&heading=341.03
      </i>
      <h5>&nbsp;&nbsp;3.2 app 长按地图/选择一个兴趣点 - 分享 - 复制链接</h5>
      &nbsp;&nbsp;例&nbsp;
      <i>https://j.map.baidu.com/df/-Ac</i>
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <i>https://j.map.baidu.com/6d/UAIk</i>
      <h5>&nbsp;&nbsp;3.3 app 分享街景</h5>
      &nbsp;&nbsp;例&nbsp;
      <i>
        https://map.baidu.com/mapscenes/static/h5-project/pano-share/pano-share.html?pid=09002200121902131035106188O&uid=&heading=6&pitch=48&panoType=street
      </i>
      {/* 高德地图 */}
      <h4>4. 高德地图</h4>
      <h5>&nbsp;&nbsp;4.1 网页网址</h5>
      &nbsp;&nbsp;例&nbsp;
      <i>https://ditu.amap.com/place/B000AA3ZCC</i>
      <h5>&nbsp;&nbsp;4.2 app 长按地图/选择一个兴趣点 - 分享 - 复制链接</h5>
      &nbsp;&nbsp;例&nbsp;
      <i>https://surl.amap.com/uGn6IqhY4fM</i>
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <i>https://surl.amap.com/DVYZWG1n3L7</i>
      {/* Google地图 */}
      <h4>5. Google地图、Google地球 网址</h4>
      &nbsp;&nbsp;例&nbsp;
      <i>
        https://www.google.com/maps/@40.0069617,116.3882885,112m/data=!3m1!1e3
      </i>
      <br />
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <i>
        https://earth.google.com/web/@40.00663928,116.38799227,37a,12000d,1y,0h,0t,0r
      </i>
      {/* 6 */}
      <h4>6. 需要更多请联系开发人员</h4>
    </div>
  );
};

export default LngLatCvtTip;
