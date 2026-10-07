export const logGaEvent = (eventName, eventParams = {}) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventParams);
    }
};

export const setGaUserId = (userId) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
            'user_id': userId
        });
    }
};