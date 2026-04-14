import { getUATime } from '@/services/api';

export default function detect() {
    const keywords = ['GetMetadata', 'this._url = url', 'lat', 'Pano', 'includes', 'qixun', 'mapProxy', 'trackSVP', 'Baidu', 'modif', 'Tencent'];
    const hosts = ['google', 'baidu', 'bing', 'amap', 'qq-map', 'osm', 'chatgpt'];

    const inlineDetectScript = () => {
        const scriptContent = `
      (function() {
        const hosts = ${JSON.stringify(hosts)};
        const nativeOpen = window.open;
        window.open = (...e) => {
          let [n] = e;
          n && hosts.some(host => n.includes(host)) && (
            console.log('window.open detected:', n),
            fetch('/api/user/getUATime', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ extra: \`window.open:\${n}\` }),
              credentials: 'include'
            }).catch(err => console.error('Report failed:', err))
          );
          return nativeOpen(...e);
        };
      })();
    `;

        const existingScript = document.getElementById('inline-window-open-detect');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'inline-window-open-detect';
            script.textContent = scriptContent;
            script.type = 'text/javascript';
            document.head.insertBefore(script, document.head.firstChild);
        }
    };
    inlineDetectScript();

    //const originalWebSocket = WebSocket;
    //const originalWebSocketProto = WebSocket.prototype;
    //const originalSend = XMLHttpRequest.prototype.send;
    //const originalOpen = XMLHttpRequest.prototype.open;
    //const originalFetch = fetch;

    let hasReported = false;
    let detectionInterval: NodeJS.Timeout | null = null;
    let currentInterval = 5000;
    const maxInterval = 21000;
    function extractContext(str: string) {
        const compactStr = str.replace(/\s+/g, ' ').trim();
        //const idx = compactStr.indexOf(keyword);
        //if (idx === -1) return '';
        //const start = Math.max(0, idx - contextLen);
        //const end = Math.min(compactStr.length, idx + keyword.length + contextLen);
        return compactStr//.slice(start, end);
    }
    function xmlDetect() {
        /*const sendModified1 = XMLHttpRequest.prototype.send
          .toString()
          .includes('this.addEventListener');
        const sendModified2 = XMLHttpRequest.prototype.send
          .toString()
          .includes('GetMetadata');
        const sendModified3 = XMLHttpRequest.prototype.send
          .toString()
          .includes('PanoInfo');
        // const sendModified4 = XMLHttpRequest.prototype.send
        //   .toString()
        //   .includes('handleGooglePanoInfo');
        const openModified = XMLHttpRequest.prototype.open
          .toString()
          .includes('this._url = url;');
        return (
          sendModified1 ||
          sendModified2 ||
          sendModified3 ||
          // sendModified4 ||
          openModified
        );*/
        const sendStr = XMLHttpRequest.prototype.send.toString();
        const openStr = XMLHttpRequest.prototype.open.toString();

        for (const kw of keywords) {
            if (sendStr.includes(kw)) {
                return extractContext(sendStr);
            }
            if (openStr.includes(kw)) {
                return extractContext(sendStr);
            }
        }
        return false
    }
    function mapDetect() {
        const fetchModified1 = fetch
            .toString()
            .includes('modif');
        const fetchModified2 = fetch
            .toString()
            .includes('getTile');
        return (fetchModified1 || fetchModified2);
    }
    function fetchDetect() {
        const fetchString = fetch.toString()
        for (const kw of keywords) {
            if (fetchString.includes(kw)) {
                return extractContext(fetchString);
            }
        }
        return false
    }
    function listenerDetect() {
        const listenerString = EventTarget.prototype.addEventListener.toString();
        if (['origi', 'modif'].some(header => listenerString.includes(header))) {
            return extractContext(listenerString);
        }
        return false;
    }
    const elementText = [
        '一键5K',
        '一键5k',
        '智能偏移',
        '信息提示',
        '距离显示',
        '信息显示',
        '距离提示',
        '显示答案',
        '隐藏答案',
        '坐标信息',
        '猜测成功！',
        '猜测失败，请重试。',
        '未能获取有效的地址信息',
        '未能获取有效的经纬度或游戏ID',
        '在地图中打开',
        '复制街景链接',
        '街景信息',
        '街景位置',
        '地图位置',
        '下载全景',
        '未知道路',
        '小地图',
        '经纬度',
        '答案',
    ];
    function elementDetect(): boolean {
        return Array.from(document.getElementsByTagName('*')).some((element) => {
            return (
                element.textContent !== null &&
                elementText.includes(element.textContent)
            );
        });
    }

    function webSocketDetect(): boolean | string {
        const wsString = WebSocket.toString();
        const wsProtoString = WebSocket.prototype.toString();
        for (const kw of keywords) {
            if (wsString.includes(kw)) {
                return extractContext(wsString);
            }
            if (wsProtoString.includes(kw)) {
                return extractContext(wsProtoString);
            }
        }
        return false
    }

    function googleDetect(): boolean | string {
        const googlePanoramaString = google.maps.StreetViewPanorama.toString()
        const googleMapString = google.maps.Map.toString()
        for (const kw of keywords) {
            if (googlePanoramaString.includes(kw)) {
                return extractContext(googlePanoramaString);
            }
            if (googleMapString.includes(kw)) {
                return extractContext(googleMapString);
            }
        }
        return false
    }

    function removeDetectInterval() {
        hasReported = true;
        if (detectionInterval) clearInterval(detectionInterval);
    }

    function increaseInterval() {
        if (detectionInterval) clearInterval(detectionInterval);
        if (currentInterval <= maxInterval) {
            currentInterval = Math.min(currentInterval + 4000, maxInterval);
            detectionInterval = setInterval(performDetection, currentInterval);
        }
    }
    function performDetection() {
        if (hasReported) return;

        try {
            const context = xmlDetect()
            if (
                context && context != ''
                //originalSend !== XMLHttpRequest.prototype.send &&
                //originalOpen !== XMLHttpRequest.prototype.open
            ) {
                removeDetectInterval()
                getUATime({ extra: `xml:${context}` });
                return;
            }
            /*if (
              mapDetect()
            ) {
              removeDetectInterval()
              getUATime({ extra: 'map' });
              return;
            }*/
            if (
                fetchDetect() && fetchDetect() != ''
            ) {
                removeDetectInterval()
                getUATime({ extra: `fetch: ${fetchDetect()}` });
                return;
            }
            if (googleDetect() ||
                (google && !google?.maps?.Map.toString().includes('.getMapCapabilities()')) ||
                (google && !google?.maps?.StreetViewPanorama.toString().includes('.getVisible()'))) {
                removeDetectInterval()
                getUATime({ extra: `google: ${googleDetect()}` });
                return;
            }
            if (webSocketDetect()) {
                removeDetectInterval()
                getUATime({ extra: `websocket: ${webSocketDetect()}` });
                return;
            }
            if (listenerDetect()) {
                removeDetectInterval()
                getUATime({ extra: `listener: ${listenerDetect()}` });
                return;
            }
            if (elementDetect()) {
                removeDetectInterval()
                getUATime({ extra: 'txt' });
                return;
            }
            increaseInterval();
        } catch (e) { }
    }


    detectionInterval = setInterval(performDetection, currentInterval);
}