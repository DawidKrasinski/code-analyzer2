# Code Analyzer

A lightweight TypeScript/JavaScript code analyzer that traverses a project tree, parses classes and functions, and generates a UML-like class graph (nodes + inheritance relations).

## 🚀 What this project does

`code-analyzer3` provides a modular analysis pipeline:

1. **FileCollector**: Recursively collects supported source files from a path (`.ts`, `.js`, `.tsx`, `.jsx`, `.mjs`, `.cjs`) while excluding `node_modules`, `.git`, `dist`, and `.next`.
2. **ParserFacade**: Parses each file into an AST with Babel and extracts class declarations, methods, properties, inheritance, standalone functions, and global variables.
3. **GraphGenerator**: Converts parsed metadata into a UML-like graph with nodes and relations.
4. **Main runner**: Runs all stages and prints a JSON graph result.

## 🧱 Project structure

- `index.ts` — entry point and orchestration (`main()` function)
- `lib/files/FileCollector.ts` — collects file paths from the filesystem
- `lib/parser/ParserFacade.ts` — Babel parser/traversal to extract entities
- `lib/graph/GraphGenerator.ts` — generates UML graph nodes/relations
- `lib/pipeline/CodeAnalyzerService.ts` — composes collector + parser + graph generator
- `tests/` — unit tests for parser/graph/pipeline/utils
- `template/` — Next.js frontend (for visualization or integration use)

## ✅ Features

- Recursive project file discovery
- Supported extension filter for JS/TS and JSX/TSX
- AST-based class scanning (including private/protected/public class members)
- Class inheritance graph generation
- Unit tests with Jest

## ⚙️ Installation

```bash
npm install
```

## ▶️ Usage

From repo root:

```bash
npm run build
npm start
```

`npm start` builds the TypeScript library and then starts the `template` app (`npm --prefix ./template run dev`).

### Programmatic API

```ts
import { main } from "./index";
const graph = main("/path/to/project");
console.log(JSON.stringify(graph, null, 2));
```

### CLI Behavior

`index.ts` also supports direct Node invocation when compiled (entrypoint ends with `index.js`) and prints JSON.

## 🧭 Data model

`UMLGraph` output looks like:

```json
{
  "nodes": [
    {
      "id": "1",
      "name": "A",
      "type": "class",
      "attributes": ["prop1"],
      "methods": ["method1"],
      "path": "A.ts"
    }
  ],
  "relations": [{ "id": "1", "from": "2", "to": "1", "type": "inheritance" }]
}
```

## 🧪 Tests

Run unit tests:

```bash
npm test
```

## 🔧 Extending the analyzer

- Add new file extensions in `lib/files/FileCollector.ts`
- Add more AST analysis logic in `lib/parser/ParserFacade.ts` and `lib/parser/extractors/*`
- Expand diagram generation in `lib/graph/GraphGenerator.ts` to include additional relation types

## 📌 Notes

- The parser currently skips files that fail to parse and logs a warning.
- Inheritance edges are only generated if both classes appear in the same parsed set.

## ❤️ License

Open source. Use and modify freely.
