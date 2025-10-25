export const removeSlash = path => path.startsWith('/') ? path.slice(1) : path;

export const exportJSON = data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graph.json";
    a.click();
    URL.revokeObjectURL(url);
};

export const importJSON = file => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.precedences)) throw Error("Invalid format");
                const tasks = parsed.tasks.map(n => ({...n}));
                const precedences = parsed.precedences.map(e => ({...e}));
                resolve({ tasks, precedences });
            } catch (err) {
                alert("Failed to import: " + err.message);
                reject(err);
            }
        };
        reader.readAsText(file);
    });
};