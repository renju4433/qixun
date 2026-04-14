import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({
  port: 8080,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024, // Size (in bytes) below which messages
    // should not be compressed if context takeover is disabled.
  },
});

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  let n = 0;
  setInterval(() => {
    n++;

    if (n < 11) {
      ws.send(
        JSON.stringify({
          scope: 'qixun',
          data: {
            type: 'tick',
            onlineNums: 6,
            newOnlineNums: 13,
            status: 'wait',
            contentType: 'panorama',
            heading: 269.77,
            timeLeft: 10 - n,
            vHeading: 212,
            vZoom: 0,
            vPitch: 0,
            confirmed: false,
            needLogin: false,
            panoId: '09024800122004171457187735H',
            baiduPano: '09024800122004171457187735H',
          },
        }),
      );
    } else if (n < 16) {
      ws.send(
        JSON.stringify({
          scope: 'qixun',
          data: {
            type: 'tick',
            onlineNums: 6,
            newOnlineNums: 13,
            status: 'rank',
            contentType: 'panorama',
            heading: 269.77,
            timeLeft: 16 - n,
            lat: 24.2902288603,
            lng: 85.4780528295,
            vHeading: 212,
            vZoom: 0,
            vPitch: 0,
            confirmed: false,
            needLogin: false,
            ranks: [
              {
                rank: 1,
                userAO: {
                  userId: 188129,
                  userName: '黄前久美子',
                  icon: 'biz/1682343097250_df0630dce7a34b3588b94a81acea6a6a_0.jpg',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 1486900.8773708984,
                latLng: {
                  lat: 22.6181459059912,
                  lng: 71.00919306563884,
                  time: 28.168,
                },
                ratingChange: 19,
                rating: 1593,
              },
              {
                rank: 2,
                userAO: {
                  userId: 336460,
                  userName: '肋骨。',
                  icon: 'biz/1685604766537_c042b54d5f994c01966392b66c654eb1_0.jpg',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 6034984.150022934,
                latLng: {
                  lat: -0.5104649694311973,
                  lng: 35.61894559711027,
                  time: 25.253,
                },
                ratingChange: 3,
                rating: 1549,
              },
              {
                rank: 3,
                userAO: {
                  userId: 490983,
                  userName: '炒饭63060529',
                  icon: 'f58b7f52d7c801ba0806e2125a776a44.png',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 6802023.599042614,
                latLng: {
                  lat: 1.354982558918195,
                  lng: 26.70876372047178,
                  time: 27.714,
                },
                ratingChange: -1,
                rating: 1460,
              },
              {
                rank: 4,
                userAO: {
                  userId: 486754,
                  userName: '地球背面',
                  icon: 'f58b7f52d7c801ba0806e2125a776a44.png',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 7159346.077979131,
                latLng: {
                  lat: 67.14923736796419,
                  lng: 166.82741564761267,
                  time: 16.37,
                },
                ratingChange: 10,
                rating: 1186,
              },
              {
                rank: 5,
                userAO: {
                  userId: 465854,
                  userName: 'yuanlove',
                  icon: 'biz/1692030841456_93f8d84385974830bf4f7becaf4e3ec0_0.jpg',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 8674667.022593522,
                latLng: {
                  lat: -26.652106410846677,
                  lng: 24.25895208087809,
                  time: 23.54,
                },
                ratingChange: -24,
                rating: 1616,
              },
              {
                rank: 6,
                userAO: {
                  userId: 486823,
                  userName: '黑屏战士',
                  icon: 'f58b7f52d7c801ba0806e2125a776a44.png',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 15103376.94175973,
                latLng: {
                  lat: -16.032288418670518,
                  lng: -48.078543855638,
                  time: 17.486,
                },
                ratingChange: -22,
                rating: 1293,
              },
            ],
            panoId: '09024800122004171457187735H',
            baiduPano: '09024800122004171457187735H',
          },
        }),
      );
    } else if (n < 26) {
      ws.send(
        JSON.stringify({
          scope: 'qixun',
          data: {
            type: 'tick',
            onlineNums: 6,
            newOnlineNums: 13,
            status: 'wait',
            contentType: 'panorama',
            heading: 218.8408050537,
            timeLeft: 26 - n,
            vHeading: 212,
            vZoom: 0,
            vPitch: 0,
            confirmed: false,
            needLogin: false,
            panoId: '8OjJ7mf34SZmMjT64paGlg',
          },
        }),
      );
    } else if (n < 31) {
      ws.send(
        JSON.stringify({
          scope: 'qixun',
          data: {
            type: 'tick',
            onlineNums: 6,
            newOnlineNums: 13,
            status: 'rank',
            contentType: 'panorama',
            heading: 218.8408050537,
            timeLeft: 31 - n,
            lat: 24.2902288603,
            lng: 85.4780528295,
            vHeading: 212,
            vZoom: 0,
            vPitch: 0,
            confirmed: false,
            needLogin: false,
            ranks: [
              {
                rank: 1,
                userAO: {
                  userId: 188129,
                  userName: '黄前久美子',
                  icon: 'biz/1682343097250_df0630dce7a34b3588b94a81acea6a6a_0.jpg',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 1486900.8773708984,
                latLng: {
                  lat: 22.6181459059912,
                  lng: 71.00919306563884,
                  time: 28.168,
                },
                ratingChange: 19,
                rating: 1593,
              },
              {
                rank: 2,
                userAO: {
                  userId: 336460,
                  userName: '肋骨。',
                  icon: 'biz/1685604766537_c042b54d5f994c01966392b66c654eb1_0.jpg',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 6034984.150022934,
                latLng: {
                  lat: -0.5104649694311973,
                  lng: 35.61894559711027,
                  time: 25.253,
                },
                ratingChange: 3,
                rating: 1549,
              },
              {
                rank: 3,
                userAO: {
                  userId: 490983,
                  userName: '炒饭63060529',
                  icon: 'f58b7f52d7c801ba0806e2125a776a44.png',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 6802023.599042614,
                latLng: {
                  lat: 1.354982558918195,
                  lng: 26.70876372047178,
                  time: 27.714,
                },
                ratingChange: -1,
                rating: 1460,
              },
              {
                rank: 4,
                userAO: {
                  userId: 486754,
                  userName: '地球背面',
                  icon: 'f58b7f52d7c801ba0806e2125a776a44.png',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 7159346.077979131,
                latLng: {
                  lat: 67.14923736796419,
                  lng: 166.82741564761267,
                  time: 16.37,
                },
                ratingChange: 10,
                rating: 1186,
              },
              {
                rank: 5,
                userAO: {
                  userId: 465854,
                  userName: 'yuanlove',
                  icon: 'biz/1692030841456_93f8d84385974830bf4f7becaf4e3ec0_0.jpg',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 8674667.022593522,
                latLng: {
                  lat: -26.652106410846677,
                  lng: 24.25895208087809,
                  time: 23.54,
                },
                ratingChange: -24,
                rating: 1616,
              },
              {
                rank: 6,
                userAO: {
                  userId: 486823,
                  userName: '黑屏战士',
                  icon: 'f58b7f52d7c801ba0806e2125a776a44.png',
                  ups: 0,
                  followers: 0,
                  focused: false,
                  focus: 0,
                },
                distance: 15103376.94175973,
                latLng: {
                  lat: -16.032288418670518,
                  lng: -48.078543855638,
                  time: 17.486,
                },
                ratingChange: -22,
                rating: 1293,
              },
            ],
            panoId: '8OjJ7mf34SZmMjT64paGlg',
          },
        }),
      );
    } else {
      n = 0;
    }
  }, 1000);
});
