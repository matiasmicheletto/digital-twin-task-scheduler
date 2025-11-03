export const removeSlash = path => path.startsWith('/') ? path.slice(1) : path;

export const generateUUID32 = () => {
    // Simple UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const generateUUID8 = () => {
    return generateUUID32().slice(0, 8);
};