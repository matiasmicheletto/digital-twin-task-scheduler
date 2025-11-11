export const getRandomScreenPosition = () => {
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    return {
        x: (0.5*Math.random()) * (screenWidth - 200),
        y: (0.5*Math.random()) * (screenHeight - 200)
    };
};

export const exportFile = (data, json=false) => {
    const text = json ? JSON.stringify(data, null, 2) : data;
    const blob = new Blob([text], {
        type: json ? "application/json" : "text/plain"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "download" + (json ? ".json" : ".dat");
    a.click();
    URL.revokeObjectURL(url);
};

export const importFile = (file, json=false) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = ev.target.result;
                resolve(json ? JSON.parse(data) : data);
            } catch (err) {
                alert("Failed to import: " + err.message);
                reject(err);
            }
        };
        reader.readAsText(file);
    });
};

export const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const loadFromLocalStorage = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};