const MOBILE_SCREEN_WIDTH = 679;
const MOBILE_SCREEN_HEIGHT = 679;

/**
 * 判断是否手机端
 *
 * @export
 * @return {boolean} true: 手机端, false: 非手机端
 */
export function useIsMobile(): boolean {
  if (window.innerWidth > window.innerHeight) {
    return window.innerHeight <= MOBILE_SCREEN_HEIGHT;
  } else {
    return window.innerWidth <= MOBILE_SCREEN_WIDTH;
  }
}
