export class MetaTemplateValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MetaTemplateValidationError';
    }
}
const VARIABLE_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
export function validateMetaTemplate(content, variables = []) {
    // 1. Longitud
    if (content.length > 1024) {
        throw new MetaTemplateValidationError('Template content exceeds 1024 characters (Meta limit)');
    }
    // 2. Extraer variables en orden de aparición
    const foundVariables = [];
    let match;
    while ((match = VARIABLE_REGEX.exec(content)) !== null) {
        foundVariables.push(match[1]);
    }
    // 3. Variables duplicadas
    const duplicates = foundVariables.filter((v, i) => foundVariables.indexOf(v) !== i);
    if (duplicates.length > 0) {
        throw new MetaTemplateValidationError(`Duplicate variables not allowed: ${[...new Set(duplicates)].join(', ')}`);
    }
    // 4. Comparar con las declaradas
    const missing = foundVariables.filter(v => !variables.includes(v));
    const unused = variables.filter(v => !foundVariables.includes(v));
    if (missing.length > 0) {
        throw new MetaTemplateValidationError(`Variables used in content but not declared: ${missing.join(', ')}`);
    }
    if (unused.length > 0) {
        throw new MetaTemplateValidationError(`Declared variables not used in content: ${unused.join(', ')}`);
    }
    // 5. Orden exacto
    const orderMismatch = variables.length === foundVariables.length &&
        variables.some((v, i) => v !== foundVariables[i]);
    if (orderMismatch) {
        throw new MetaTemplateValidationError(`Variable order mismatch. Expected: [${foundVariables.join(', ')}]`);
    }
}
