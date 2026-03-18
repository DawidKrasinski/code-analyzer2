# Code Analyzer

A lightweight TypeScript/JavaScript code analyzer that traverses a project tree, parses classes and functions, and generates a UML-like class graph (nodes + inheritance relations).

## 🚀 What this project does

`code-analyzer3` provides a modular analysis pipeline:

1. **Analyzer**: Recursively collects supported source files from a path (`.ts`, `.js`, `.tsx`, `.jsx`, `.mjs`, `.cjs`) while excluding `node_modules`, `.git`, `dist`, and `.next`.
2. **Parser**: Parses each file into an AST with Babel and extracts class declarations, methods, properties, inheritance, and standalone functions.
3. **Generator**: Converts parsed class metadata into a UML-like graph with nodes and inheritance edges.
4. **Main runner**: Runs all stages and prints a JSON graph result.

## 🧱 Project structure

- `index.ts` — entry point and orchestration (`main()` function)
- `lib/Analyzer.ts` — collects file paths from the filesystem
- `lib/Parser.ts` — Babel parser/traversal to extract class/function metadata
- `lib/Generator.ts` — generates UML graph nodes/relations
- `tests/` — unit tests for Analyzer, Parser, Generator
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

- Add new file extensions in `lib/Analyzer.ts`
- Add more AST analysis logic in `lib/Parser.ts` (interfaces, decorators, composition relations, etc.)
- Expand diagram generation in `lib/Generator.ts` to include associations and dependencies

## 📌 Notes

- The parser currently skips files that fail to parse and logs a warning.
- Inheritance edges are only generated if both classes appear in the same parsed set.

## ❤️ License

Open source. Use and modify freely.
