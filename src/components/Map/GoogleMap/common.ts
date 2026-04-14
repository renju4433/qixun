const black = `https://sv0.map.qq.com/tile?svid=36031024140711184829000&x=15&y=7&level=1`;

export const getCustomPanoramaTileUrl = (
  panoId: string,
  zoom: number,
  tileX: number,
  tileY: number,
) => {
  const bdimgSv = Math.round(Math.random());

  return zoom === 0
    ? `https://b68a.daai.fun/bd/thumb/${panoId}`
    : `https://mapsv${bdimgSv}.bdimg.com/?qt=pdata&sid=${panoId}&pos=${tileY}_${tileX}&z=${
        zoom + 1
      }`;
};

export const getQQPanoramaTileUrl = (
  // 4 -> 1; 3 -> 2
  panoId: string,
  zoom: number,
  tileX: number,
  tileY: number,
) => {
  const qqimgSv = Math.round(Math.random() * 8);
  if (zoom === 0) {
    return `https://b68a.daai.fun/qq/thumb/${panoId}`;
  }
  if (zoom <= 2) {
    return `https://b68a.daai.fun/qq/tile/${panoId}/${tileX}/${tileY}/${zoom}`;
  }
  if (zoom === 4 && tileY >= 6) return black;
  if (zoom === 3 && tileY >= 3) return black;
  return `https://sv${qqimgSv}.map.qq.com/tile?svid=${panoId}&x=${tileX}&y=${tileY}&from=web&level=${
    zoom === 4 ? 1 : 2
  }`;
};

// 预加载图片
export const preloadImage = (panoId: string) => {
  const img = new Image();
  img.src = `https://b68a.daai.fun/bd/thumb/${panoId}`;
};

export const preloadQQImage = (panoId: string) => {
  const img = new Image();
  img.src = `https://b68a.daai.fun/qq/thumb/${panoId}`;
};
