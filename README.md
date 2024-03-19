# .webcontent

.webcontent is a file extension designed to empower content writers and developers to work together in harmony.
It is a file format, which is similar to JSON, but with more freedom that allows content writers to write content in a structured manner and developers to access it with ease. The file format is designed to be simple, flexible, and easy to use, making it ideal for websites.

## Installation

```bash
npm i webcontent
```

```bash
yarn add webcontent
```

```bash
pnpm add webcontent
```

## Design Guidelines for the filetype

-   To allow the user to have the utmost level of freedom.
-   To have built-in support for multiple languages.
-   To provide ease of development and ease of content writing
-   Hierarchal arrangement of content and metadata
-   To have two types of keywords - known and custom.
-   Centred around Map objects for ease of access.
-   Separation of different pages by using different files.

## File Structure

### Script File

The primary file of your page. For e.g. in remix.run, it will be the file which contains your loader and action functions
Supported values: string

### Languages

Supported values: children
Known Keywords:

-   \*Route: The route of the language, multiple languages can have the same route. (string)
-   \*Title: The title of the page. (string)
-   Metadata: The metadata of the page. (string, children)
    Can contain as many children to any depth.
-   Content: The content of the page. (string, children)
    Can contain as many children to any depth.

(\*) Indicates that the keyword is required

## Usage

```typescript
import { Adapter } from 'webcontent';

const adapter = new Adapter({
    contentFolder: "path/to/content/folder", // required; path to the folder containing the .webcontent files (relative to baseRoute)
    autoRefreshTime: 3_600_000, // optional, default: 3_600_000ms; the time in milliseconds after which the adapter will refresh the content
    baseRoute: "path/to/base/route" // optional, default: __dirname; the base route for the content folder; replaces "~" in all given routes
});

// When fetching content
.........
const content = await adapter.getLanguagesByFileRoute("~/path/to/content/file.webcontent");
// OR
const content = await adapter.getLanguagesByRoute("route/to/page");
// OR
const content = await adapter.getLanguagesByScriptFile("~/path/to/script/file");
```

## Known Issues

[Issues](https://github.com/Div-100/.webcontent/issues)

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on [GitHub](https://github.com/Div-100/.webcontent).

## Pull Request Guidelines

To contribute to this project, please follow these steps to create a pull request:

1. Fork the repository: Click on the "Fork" button at the top right corner of the repository page. This will create a copy of the repository in your GitHub account.

2. Clone the forked repository: Open your terminal and navigate to the directory where you want to clone the repository. Use the following command to clone the repository:

    ```bash
    git clone https://github.com/your-username/.webcontent.git
    ```

    Replace `your-username` with your GitHub username.

3. Create a new branch: Change to the repository directory by using the following command:

    ```bash
    cd .webcontent
    ```

    Create a new branch for your changes:

    ```bash
    git checkout -b my-feature
    ```

    Replace `my-feature` with a descriptive name for your branch.

4. Make your changes

5. Commit your changes: After making the changes, save the file and commit your changes using the following command:

    ```bash
    git add *
    git commit -m "Add my changes"
    ```

6. Push your changes: Push your changes to your forked repository using the following command:

    ```bash
    git push origin my-feature
    ```

7. Create a pull request: Go to the original repository on GitHub and click on the "New pull request" button. Select your branch (`my-feature`) and provide a descriptive title and description for your pull request. Click on the "Create pull request" button to submit your changes for review.

8. Review and merge: The project maintainers will review your pull request and provide feedback if necessary. Once your changes are approved, they will be merged into the main repository.

Congratulations! You have successfully created a pull request. Thank you for your contribution!

## License
GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007
[License](https://github.com/Div-100/.webcontent/blob/main/LICENSE)

## Author
[Divyansh Choudhary](https://github.com/Div-100)
