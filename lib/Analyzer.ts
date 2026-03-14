import dirTree from "directory-tree";
import type { DirectoryTree } from "directory-tree";

const ALLOWED_EXTENSIONS = /\.(ts|js|jsx|tsx|mjs|cjs)$/i;

export class Analyzer {
  private tree: DirectoryTree;

  constructor(path: string = process.cwd()) {
    console.log(`Analyzing directory: ${path}`);
    this.tree = dirTree(path, {
      exclude: /node_modules|\.git|dist|\.next/,
      extensions: ALLOWED_EXTENSIONS,
    });
  }

  private collectPaths(node: DirectoryTree): string[] {
    if (node.children && node.children.length > 0) {
      return node.children.flatMap((child) => this.collectPaths(child));
    }

    // `directory-tree` may omit the type field for file nodes; treat leaf nodes as files.
    if (typeof node.path === "string" && ALLOWED_EXTENSIONS.test(node.path)) {
      return [node.path];
    }
    return [];
  }

  getPaths(): string[] {
    return this.collectPaths(this.tree);
  }
}
