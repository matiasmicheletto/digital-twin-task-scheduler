const modelToDat = (model) => {
    console.log("Converting model to .dat format...");
    console.log(model);
    const text = JSON.stringify(model);
    console.log(text);
    return text;
};

export default modelToDat;