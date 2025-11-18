export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function hextorgba(hex, alpha) {
    if (!hex || typeof hex !== 'string' || hex.length < 4) {
        return `rgba(50, 50, 50, ${alpha})`; // Fallback color
    }
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function placePopup(popupWidth, popupHeight, targetRect) {
    let x = targetRect.left;
    let y = targetRect.bottom + 8; // Default below the target

    const popupHeightNum = (typeof popupHeight === 'string' && popupHeight.endsWith('px')) ?
        parseFloat(popupHeight) :
        (typeof popupHeight === 'number' ? popupHeight : 200);

    // Adjust horizontal position
    if (x + popupWidth > window.innerWidth - 8) {
        x = window.innerWidth - popupWidth - 8;
    }
    if (x < 8) {
        x = 8;
    }

    // Adjust vertical position
    if (y + popupHeightNum > window.innerHeight - 8) {
        y = targetRect.top - popupHeightNum - 8; // Place above if not enough space below
    }
    if (y < 8) {
        y = 8;
    }

    return {
        position: 'fixed',
        top: `${Math.round(y)}px`,
        left: `${Math.round(x)}px`,
        width: typeof popupWidth === 'number' ? `${popupWidth}px` : popupWidth,
        height: typeof popupHeight === 'number' ? `${popupHeight}px` : popupHeight,
    };
}

export const throttle = (fn, wait) => {
    let inThrottle, lastFn, lastTime;
    return function (...args) {
        const context = this;
        if (!inThrottle) {
            fn.apply(context, args);
            lastTime = Date.now();
            inThrottle = true;
        } else {
            clearTimeout(lastFn);
            lastFn = setTimeout(() => {
                if (Date.now() - lastTime >= wait) {
                    fn.apply(context, args);
                    lastTime = Date.now();
                }
            }, Math.max(wait - (Date.now() - lastTime), 0));
        }
    };
};
