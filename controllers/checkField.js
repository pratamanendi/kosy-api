export const checkField = (body, required) => {
    const missing = required.filter(field => {
        const keys = field.split('.');
        return keys.reduce((acc, key) => acc && acc[key], body) === undefined;
    }).map(field => {
        const keys = field.split('.');
        return keys[keys.length - 1].charAt(0).toUpperCase() + keys[keys.length - 1].slice(1);
    });

    return missing
}