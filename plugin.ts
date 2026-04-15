import { IApi } from '@umijs/max';

const { REACT_APP_ENV = 'dev' } = process.env;
const { REACT_APP_USE_LEGACY_CDN = 'false' } = process.env;

export default (api: IApi) => {
  api.modifyHTML(($) => {
    // 本地环境跳过
    if (
      REACT_APP_ENV === 'dev' ||
      REACT_APP_ENV === 'uat' ||
      REACT_APP_USE_LEGACY_CDN !== 'true'
    ) {
      return $;
    }

    const cdnPrefix = 'https://b68res.daai.fun/qixun';

    // 处理head中的script标签
    $('head script').each((_, element) => {
      const src = $(element).attr('src');
      if (src && !src.startsWith('http') && !src.startsWith('https')) {
        $(element).attr('src', cdnPrefix + src);
      }
    });

    // 处理head中的link标签
    $('head link').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('https')) {
        $(element).attr('href', cdnPrefix + href);
      }
    });

    // 处理body中的script标签
    $('body script').each((_, element) => {
      const src = $(element).attr('src');
      if (src && !src.startsWith('http') && !src.startsWith('https')) {
        $(element).attr('src', cdnPrefix + src);
      }
    });

    return $;
  });
};
