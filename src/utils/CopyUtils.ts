import { message } from 'antd';

export const qixunCopy = (text: string | null) => {
  if (!text) return;
  const textarea = document.createElement('textarea');
  textarea.textContent = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const result = document.execCommand('copy');
  document.body.removeChild(textarea);
  message.success('复制成功');
  return result;
};
