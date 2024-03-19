import {
    DuplicateKnownKeywordError,
    DuplicateLanguageError,
    DuplicateCustomKeywordError,
    ImproperUsageOfSemicolon,
    InvalidCharacterError,
    InvalidSyntaxError,
    MissingKeyword,
    StartNewKeywordWithoutAssigningValueError,
    UnknownKeywordError,
    UnknownPlacementOfCharacterError,
    ValueExpected,
    potentialImproperUsageOfColon,
} from "./errors";

const KNOWN_KEYWORDS = ["scriptfile", "title", "route", "metadata", "content"];

type InternalKeyword = {
    text: string;
    doneWithKeyword: boolean;
    valueAssigned: boolean; // if 1) value is assigned to this keyword  OR 2) something with this as a parent exists
    value?: string; // not always needed
    isCustom?: boolean; // if the keyword is a custom keyword (with colon; false by default)
    parent?: [number, number]; // the keyword that is the parent of this keyword [hierarchy, index in hierarchy]
    children?: Array<InternalKeyword>; // the keywords that are children of this keyword, if any, to be processed in part II
};

export type Keyword =
    | {
          text: string;
          value: string;
      }
    | {
          text: string;
          children: Map<string, Keyword>;
      }
    | {
          text: string;
          value: string;
          children: Map<string, Keyword>;
      }; // A keyword may have a value, children, or both. If it has children, it will be a map of the children, with the key being the text of the child keyword.

export type Language = {
    name: { value: string };
    title: { value: string };
    route: { value: string };
    metadata: {
        children: Map<string, Keyword>;
        value: string;
    };
    content: { value: string; children: Map<string, Keyword> };
};

export type File = {
    scriptFile: string;
    languages: Map<string, Language>;
};

type KeywordHierarchy = Array<Array<InternalKeyword>>;

const detectKeywords: Function = (text: string): KeywordHierarchy => {
    let keywordHierarchy: KeywordHierarchy = [[]];
    let isInString = false;
    let currentHierarchy = 0; // heirarchy in terms of brackets (index in the keywordHierarchy array)
    let currentIndex = 0; // index in the current hierarchy
    let currentParent: Array<[number, number]> = []; // [hierarchy, index in hierarchy]
    let previousCharacter = ""; // previous character in the text - Only to be used when needed to check for escape characters or something else of similar nature. Can be more than one.
    let parsedString = "";

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        const checkToAddNewKeywords = () => {
            if (keywordHierarchy[currentHierarchy].length - 1 < currentIndex) {
                keywordHierarchy[currentHierarchy].push({
                    text: "",
                    doneWithKeyword: false,
                    valueAssigned: false,
                });

                if (currentParent.length > 0) {
                    keywordHierarchy[currentHierarchy][currentIndex].parent =
                        currentParent[currentParent.length - 1];
                }

                checkToAddNewKeywords();
            }
        };
        checkToAddNewKeywords();

        const currentElement = keywordHierarchy[currentHierarchy][currentIndex];

        if (char === "\r") {
            continue;
        }

        if (!isInString) {
            if (!/[a-zA-z0-9{};,: "`\n/]/g.test(char)) {
                throw new InvalidCharacterError(char);
            }

            if (char === "{") {
                currentParent.push([currentHierarchy, currentIndex]);
                currentHierarchy++;
                if (currentHierarchy > keywordHierarchy.length - 1) {
                    keywordHierarchy.push([]);
                    currentIndex = 0;
                } else {
                    currentIndex = keywordHierarchy[currentHierarchy].length;
                }
                continue;
            }

            if (char === "}") {
                currentHierarchy--;
                currentIndex = keywordHierarchy[currentHierarchy].length - 1;
                if (currentParent.length > 0) {
                    keywordHierarchy[
                        currentParent[currentParent.length - 1][0]
                    ][
                        currentParent[currentParent.length - 1][1]
                    ].valueAssigned = true;

                    currentParent.pop();
                }
                continue;
            }

            if (char === ";") {
                if (currentParent.length !== 0) {
                    throw new ImproperUsageOfSemicolon();
                } else {
                    currentElement.valueAssigned = true;
                }
                currentIndex++;
                continue;
            }

            if (/[a-zA-Z0-9/]/g.test(char)) {
                if (currentElement.doneWithKeyword) {
                    if (!currentElement.valueAssigned) {
                        throw new StartNewKeywordWithoutAssigningValueError();
                    }
                } else {
                    currentElement.text += char;
                }
                continue;
            }

            if (char === " " || char === "\n" || char === "\t") {
                if (
                    currentElement.text.length > 0 &&
                    !currentElement.doneWithKeyword
                ) {
                    if (KNOWN_KEYWORDS.includes(currentElement.text)) {
                        currentElement.doneWithKeyword = true;
                    } else {
                        throw new UnknownKeywordError(currentElement.text);
                    }
                }
                continue;
            }

            if (char === ":") {
                if (currentElement.text.length === 0) {
                    throw new InvalidSyntaxError("No word found before colon");
                }
                if (KNOWN_KEYWORDS.includes(currentElement.text)) {
                    potentialImproperUsageOfColon(currentElement.text);
                }
                currentElement.doneWithKeyword = true;
                currentElement.isCustom = true;
                continue;
            }

            if (char === '"') {
                if (
                    currentElement.text.length > 0 &&
                    !currentElement.doneWithKeyword
                ) {
                    if (KNOWN_KEYWORDS.includes(currentElement.text)) {
                        currentElement.doneWithKeyword = true;
                    } else {
                        throw new UnknownKeywordError(currentElement.text);
                    }
                }
                previousCharacter = char;
                continue;
            }

            if (char === "`") {
                if (previousCharacter === '"') {
                    isInString = true;
                    previousCharacter = "";
                    continue;
                } else {
                    throw new UnknownPlacementOfCharacterError(char);
                }
            }

            if (char === ",") {
                if (!currentElement.valueAssigned) {
                    throw new StartNewKeywordWithoutAssigningValueError();
                }
                currentIndex++;
                continue;
            }

            // SHOULD CONTINUE BEFORE THIS.
            // IF NOT, THEN IT IS AN INVALID CHARACTER
            throw new UnknownPlacementOfCharacterError(char);
        } else {
            if (char === "\\") {
                if (previousCharacter === "\\") {
                    parsedString += char;
                    previousCharacter = "";
                    continue;
                }
                previousCharacter = char;
                continue;
            }

            if (char === "`" && previousCharacter !== "\\") {
                previousCharacter = "`";
                continue;
            }

            if (char === '"' && previousCharacter === "`") {
                isInString = false;
                previousCharacter = "";
                currentElement.value = parsedString;
                currentElement.valueAssigned = true;
                parsedString = "";
                continue;
            }

            // if it should not add, it should be escaped till now. So, it should be added.
            if (previousCharacter === "\\") {
                parsedString += `\\${char}`;
                previousCharacter = "";
                continue;
            }

            parsedString += char;
        }
    }
    return keywordHierarchy;
};

const generateFileData = (parsedData: Array<InternalKeyword>) => {
    const fileData: File = {
        scriptFile: "",
        languages: new Map(),
    };
    for (let i = 0; i < parsedData.length; i++) {
        const currentKeyword = parsedData[i];

        if (currentKeyword.text.toLowerCase() === "scriptfile") {
            if (
                currentKeyword.value?.length === 0 ||
                currentKeyword.value === undefined
            ) {
                throw new ValueExpected();
            }
            if (fileData.scriptFile.length > 0) {
                throw new DuplicateKnownKeywordError(
                    currentKeyword.text.toLowerCase()
                );
            }
            fileData.scriptFile = currentKeyword.value;
            continue;
        }

        if (fileData.languages.has(currentKeyword.text)) {
            throw new DuplicateLanguageError(currentKeyword.text);
        }

        if (currentKeyword.children === undefined) {
            throw new MissingKeyword("title, route");
        }

        let currentLanguage: Language = {
            name: { value: currentKeyword.text },
            title: { value: "" },
            route: { value: "" },
            metadata: {
                children: new Map(),
                value: "",
            },
            content: { value: "", children: new Map() },
        };

        for (let j = 0; j < currentKeyword.children.length; j++) {
            const child = currentKeyword.children[j];

            if (child.text.toLowerCase() === "title") {
                if (
                    (child.value?.length ?? 0) === 0 ||
                    child.value === undefined
                ) {
                    throw new ValueExpected();
                }

                if (currentLanguage.title.value.length > 0) {
                    throw new DuplicateKnownKeywordError(
                        currentKeyword.text.toLowerCase()
                    );
                }

                currentLanguage.title.value = child.value;
                continue;
            }

            if (child.text.toLowerCase() === "route") {
                if (
                    (child.value?.length ?? 0) === 0 ||
                    child.value === undefined
                ) {
                    throw new ValueExpected();
                }

                if (currentLanguage.route.value.length > 0) {
                    throw new DuplicateKnownKeywordError(
                        currentKeyword.text.toLowerCase()
                    );
                }

                currentLanguage.route.value = child.value;
                continue;
            }

            if (child.text.toLowerCase() === "metadata") {
                if (
                    (child.children === undefined ||
                        child.children.length === 0) &&
                    (child.value === undefined || child.value.length === 0)
                ) {
                    continue;
                }
                if (child.children !== undefined && child.children.length > 0) {
                    const metadata = recursivelySimplifyChildren(
                        child.children
                    );

                    for (const key of metadata.keys()) {
                        const data = metadata.get(key) as Keyword;
                        if (currentLanguage.metadata.children.has(key)) {
                            throw new DuplicateCustomKeywordError();
                        }
                        currentLanguage.metadata.children.set(key, data);
                    }
                }
                if (child.value !== undefined && child.value.length > 0) {
                    currentLanguage.metadata.value = child.value;
                }

                continue;
            }

            if (child.text.toLowerCase() === "content") {
                if (
                    (child.children === undefined ||
                        child.children.length === 0) &&
                    (child.value === undefined || child.value.length === 0)
                ) {
                    continue;
                }

                if (child.children !== undefined && child.children.length > 0) {
                    const content = recursivelySimplifyChildren(child.children);

                    for (const key of content.keys()) {
                        const data = content.get(key) as Keyword;
                        if (currentLanguage.content.children.has(key)) {
                            throw new DuplicateCustomKeywordError();
                        }
                        currentLanguage.content.children.set(key, data);
                    }
                }

                if (child.value !== undefined && child.value.length > 0) {
                    currentLanguage.content.value = child.value;
                }
                continue;
            }
        }

        fileData.languages.set(currentKeyword.text, currentLanguage);
    }
    
    return fileData;
};

function recursivelySimplifyChildren(children: Array<InternalKeyword>) {
    const returnMap: Map<string, Keyword> = new Map();

    for (let j = 0; j < children.length; j++) {
        const child = children[j];
        if (child.children === undefined || child.children.length === 0) {
            if (child.value === undefined || child.value.length === 0) {
                throw new ValueExpected();
            }
            if (returnMap.has(child.text)) {
                throw new DuplicateCustomKeywordError();
            }

            returnMap.set(child.text, {
                text: child.text,
                value: child.value,
            });

            continue;
        } else {
            if (child.value === undefined || child.value.length === 0) {
                if (returnMap.has(child.text)) {
                    throw new DuplicateCustomKeywordError();
                }
                returnMap.set(child.text, {
                    text: child.text,
                    children: recursivelySimplifyChildren(child.children),
                });
            } else {
                if (returnMap.has(child.text)) {
                    throw new DuplicateCustomKeywordError();
                }
                returnMap.set(child.text, {
                    text: child.text,
                    value: child.value,
                    children: recursivelySimplifyChildren(child.children),
                });
            }
        }
    }

    return returnMap;
}

export default function parseFile(text: string) {
    // PART I: Detecting keywords
    const keywordHierarchy: KeywordHierarchy = detectKeywords(text);

    // PART II: Assigning children to their parents
    for (let i = 0; i < keywordHierarchy.length; i++) {
        const array = Array.from(keywordHierarchy).reverse()[i];
        for (let j = 0; j < array.length; j++) {
            const keyword = array[j];
            if (keyword.text.length < 1) {
                continue;
            }
            if (keyword.parent !== undefined) {
                const parent =
                    keywordHierarchy[keyword.parent[0]][keyword.parent[1]];
                if (parent.children === undefined) {
                    parent.children = [keyword];
                } else {
                    parent.children.push(keyword);
                }
            }
        }
    }
    
    // PART III: Converting keywords into structured file data
    const parsedData = Array.from(keywordHierarchy[0]);
    const fileData = generateFileData(parsedData);

    // Final checks
    if (fileData.scriptFile.length === 0)
        throw new MissingKeyword("scriptfile");
    if (fileData.languages.size === 0) throw new MissingKeyword("language");

    return fileData;
}
