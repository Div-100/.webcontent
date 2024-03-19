import fs from "node:fs";
import parseFile, { Language } from "./parseFile.js";
import path from "node:path";
import { DuplicateLanguageError, DuplicateScriptFileError } from "./errors.js";

export type AdapterOptions = {
    contentFolder: string;
    autoRefreshTime?: number; // 3_600_000 ms; 1hr (ms)
    baseRoute?: string; // "./"; the route which will replace `~` in the path
};

export class Adapter {
    constructor(options: AdapterOptions) {
        this.autoRefreshTime = options.autoRefreshTime ?? 3_600_000;
        this.baseRoute = options.baseRoute ?? __dirname;
        this.contentFolder = options.contentFolder.replace("~/", `${this.baseRoute}/`);
        
        this.initialise();
        this.currentRefreshTimeout = setTimeout(() => {
            this.initialise();
            this.currentRefreshTimeout = setTimeout(() => {
                this.refresh();
            }, this.autoRefreshTime);
        }, this.autoRefreshTime);

    }

    private contentFolder: string;
    private autoRefreshTime: number;
    private currentRefreshTimeout: ReturnType<typeof setTimeout>;
    private intitialised = false;
    private isInitialising = false;
    private baseRoute: string;

    private languagesByFileRoute: Map<
        string /* Content File Route */,
        Map<string, Language>
    > = new Map();

    private languagesByRoute: Map<
        string /* web route */,
        Map<string, Language>
    > = new Map();

    private languagesByScriptFile: Map<
        string /* script file url */,
        Map<string, Language>
    > = new Map(); // script file url should be given relative to the location of the content folder

    private async parseFile(path: string) {
        const data = await fs.promises.readFile(path, {
            encoding: "utf-8",
            flag: "r",
        });
        return parseFile(data);
    }

    private async initialise() {
        if (this.isInitialising) return;
        this.isInitialising = true;
        this.intitialised = false;
        const files = await fs.promises.readdir(this.contentFolder);
        const webContentFiles = files.filter((file) =>
            file.endsWith(".webcontent")
        );
        const setFileData = async (file: string) => {
            const data = await this.parseFile(
                path.join(this.contentFolder, file)
            );

            // set by file route
            this.languagesByFileRoute.set(
                path.join(this.contentFolder, file),
                data.languages
            );

            // set by script file
            const scriptFile = path.join(
                data.scriptFile.replace("~/", `${this.baseRoute}/`)
            );

            if (this.languagesByScriptFile.has(scriptFile)) {
                throw new DuplicateScriptFileError(scriptFile);
            }

            this.languagesByScriptFile.set(scriptFile, data.languages);

            // set by languages
            for (const [text, language] of data.languages.entries()) {
                const route = language.route.value;
                if (!this.languagesByRoute.has(route)) {
                    this.languagesByRoute.set(route, new Map());
                }
                const existingLanguages = this.languagesByRoute.get(
                    route
                ) as Map<string, Language>;
                if (existingLanguages.has(text)) {
                    throw new DuplicateLanguageError(text, route);
                }
                existingLanguages.set(text, language);
            }
        };

        const promises = webContentFiles.map((file) => setFileData(file));
        Promise.allSettled(promises).then(() => {
            this.intitialised = true;
            this.isInitialising = false;
        });
    }

    waitForInitialisation() {
        if (this.intitialised) return Promise.resolve();

        return new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (this.intitialised) {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);
        });
    }

    async refresh() {
        await this.waitForInitialisation();

        clearTimeout(this.currentRefreshTimeout);
        setTimeout(() => {
            this.initialise();
            this.currentRefreshTimeout = setTimeout(() => {
                this.refresh();
            }, this.autoRefreshTime);
        }, this.autoRefreshTime);

        return this.initialise();
    }

    async getFiles() {
        await this.waitForInitialisation();
        return new Map(this.languagesByFileRoute);
    }

    async getRoutes() {
        await this.waitForInitialisation();
        return new Map(this.languagesByRoute);
    }

    async getScriptFiles() {
        await this.waitForInitialisation();
        return new Map(this.languagesByScriptFile);
    }

    async getLanguagesByFileRoute(route: string) {
        await this.waitForInitialisation();
        return new Map(this.languagesByFileRoute.get(route) ?? new Map());
    }

    async getLanguagesByRoute(route: string) {
        await this.waitForInitialisation();
        return new Map(this.languagesByRoute.get(route) ?? new Map());
    }

    async getLanguagesByScriptFile(route: string) {
        await this.waitForInitialisation();
        return new Map(this.languagesByScriptFile.get(route) ?? new Map());
    }
}
