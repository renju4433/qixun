import { Button } from 'antd';
import { FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import HeaderLogo from '@/components/Header/Logo';
import styles from './style.less';

interface ComeBackMaskProps {
    onReturnClick?: () => void;
    pickCoord?: { latitude: number; longitude: number };
}

const STORAGE_KEY = 'COME_BACK_MASK_TRIGGERED';

const ComeBackMask: FC<ComeBackMaskProps> = ({ onReturnClick, pickCoord }) => {
    const [isOpen, setIsOpen] = useState(() => {
        return sessionStorage.getItem(STORAGE_KEY) === 'true';
    });
    const [isLoading, setIsLoading] = useState(false);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);
    const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mutationObserverRef = useRef<MutationObserver | null>(null);

    useEffect(() => {
        isMountedRef.current = true;

        const handleBlur = () => {
            // 防止重复启动定时器，先清除旧的
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
            }
            blurTimerRef.current = setTimeout(() => {
                if (isMountedRef.current && !pickCoord) {
                    setIsOpen(true);
                    sessionStorage.setItem(STORAGE_KEY, 'true');
                }
            }, 1500);
        };

        const handleFocus = () => {
            // 在1.5秒内重新回到页面则取消定时器
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener("mouseleave", handleBlur);
        document.addEventListener("mouseenter", handleFocus);

        return () => {
            isMountedRef.current = false;
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener("mouseleave", handleBlur);
            document.removeEventListener("mouseenter", handleFocus);
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
            }
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
            }
        };
    }, [pickCoord]);

    // 监控遮罩层被隐藏或删除的情况，防止用户通过CSS注入来移除
    useEffect(() => {
        if (!isOpen) return;

        // 定期检查遮罩是否被隐藏
        monitorIntervalRef.current = setInterval(() => {
            const maskElement = document.querySelector(`.${styles.maskContainer}`);

            if (!maskElement) {
                // 遮罩被删除，强制重新渲染
                if (isMountedRef.current) {
                    setIsOpen(true);
                }
                return;
            }

            const computedStyle = window.getComputedStyle(maskElement);
            // 检查是否被设置为隐藏
            if (
                computedStyle.display === 'none' ||
                computedStyle.visibility === 'hidden' ||
                parseFloat(computedStyle.opacity) === 0
            ) {
                // 强制设置为显示
                (maskElement as HTMLElement).style.cssText = `
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                `;
            }
        }, 200);

        // 使用MutationObserver监听DOM变化
        mutationObserverRef.current = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // 如果遮罩被移除了，重新触发显示
                if (mutation.type === 'childList') {
                    const maskElement = document.querySelector(`.${styles.maskContainer}`);
                    if (!maskElement && isMountedRef.current && isOpen) {
                        setIsOpen(true);
                    }
                }
            });
        });

        mutationObserverRef.current.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            if (monitorIntervalRef.current) {
                clearInterval(monitorIntervalRef.current);
            }
            if (mutationObserverRef.current) {
                mutationObserverRef.current.disconnect();
            }
        };
    }, [isOpen, styles.maskContainer]);

    // 监听选点状态，如果用户选点则隐藏遮罩层
    useEffect(() => {
        if (pickCoord) {
            setIsOpen(false);
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }, [pickCoord]);

    const handleReturn = () => {
        setIsLoading(true);
        onReturnClick?.();

        // 保存定时器引用以便组件卸载时清理
        loadingTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setIsLoading(false);
                setIsOpen(false);
                sessionStorage.removeItem(STORAGE_KEY);
            }
        }, 1500);
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className={styles.maskContainer}
        >
            <HeaderLogo className={styles.maskLogo} />
            <div className={styles.maskContent}>
                <div className={styles.maskText}>
                    {isLoading ? '正在回到对局...' : '您已离开对局，请点击返回'}
                </div>
                <Button
                    type="primary"
                    size="large"
                    onClick={handleReturn}
                    disabled={isLoading}
                    loading={isLoading}
                >
                    {isLoading ? '回到对局中' : '返回对局'}
                </Button>
            </div>
        </div>,
        document.body
    );
};

export default ComeBackMask;
