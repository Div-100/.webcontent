export class DuplicateScriptFileError extends Error {
    constructor(scriptFile: string) {
        super(
            `[ERRR] You cannot repeat the same script file in multiple webcontent files; the script file - ${scriptFile} - is repeated.`
        );
    }
}

export class UnknownKeywordError extends Error {
    constructor(keyword: string) {
        super(
            `[ERRR] The given keyword - ${keyword} - is not an allowed keyword; refer to docs for list of allowed keywords.`
        );
    }
}

export class StartNewKeywordWithoutAssigningValueError extends Error {
    constructor() {
        super(
            `[ERRR] The previous keyword has not yet been assigned a value; did you forget to assign a value to the keyword or to use a string?`
        );
    }
}

export class ValueExpected extends Error {
    constructor() {
        super(
            `[ERRR] Value expected; did you forget to assign a value to the keyword or to use a string?`
        );
    }
}

export class DuplicateKnownKeywordError extends Error {
    constructor(keyword: string) {
        super(
            `[ERRR] The given keyword - ${keyword} - is a known keyword and should not be repeated; refer to docs for list of allowed keywords.`
        );
    }
}

export class DuplicateLanguageError extends Error {
    constructor(language: string, route?: string) {
        if (route) {
            super(
                `[ERRR] The given language - ${language} - has already been defined in the route - ${route}.`
            )
        } else {
            super(
                `[ERRR] The given language - ${language} - has already been defined.`
            );
        }
    }
}

export class DuplicateCustomKeywordError extends Error {
    constructor() {
        super(
            `[ERRR] The given custom keyword value is defined twice in the same language, in the same hierarchy.`
        );
    }
}

export class MissingKeyword extends Error {
    constructor(keyword: string) {
        super(`[ERRR] The given keyword - ${keyword} - is missing.`);
    }
}

export class InvalidSyntaxError extends Error {
    constructor(message: string) {
        super(`[ERRR] Invalid syntax: ${message}`);
    }
}

export class InvalidCharacterError extends InvalidSyntaxError {
    constructor(character: string) {
        super(
            `Invalid character in base document: ${character}; did you mean to put it in a string? Refer to docs for how to use a string.`
        );
    }
}

export class UnknownPlacementOfCharacterError extends InvalidSyntaxError {
    constructor(character: string) {
        super(
            `Unknown placement of character: ${character}; did you mean to put it in a string? Refer to docs for how to use a string.`
        );
    }
}

export class ImproperUsageOfSemicolon extends InvalidSyntaxError {
    constructor() {
        super(
            `Improper usage of semicolon; semicolons can only be used in the root heirarchy of the document. Did you mean to use a comma? Refer to docs for the proper structuring guidleines. `
        );
    }
}

// WARNINGS
export function potentialImproperUsageOfColon(keyword: string) {
    console.warn(
        `[WARN] The detected keyword - ${keyword} is a known keyword and should not be followed by a colon; did you mean to put a string after the keyword? Refer to docs for a list of known keywords`
    );
}
