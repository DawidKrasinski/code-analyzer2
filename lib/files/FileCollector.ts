import dirTree from "directory-tree";
import type { DirectoryTree } from "directory-tree";
import { IFileCollector } from "./IFileCollector";

const ALLOWED_EXTENSIONS = /\.(ts|js|jsx|tsx|mjs|cjs)$/i;

export class FileCollector implements IFileCollector {
  private tree: DirectoryTree;

  constructor(path: string = process.cwd()) {
    this.tree = dirTree(path, {
      exclude: /node_modules|\.git|dist|\.next/,
      extensions: ALLOWED_EXTENSIONS,
    });
  }

  private collectPaths(node: DirectoryTree): string[] {
    if (node.children && node.children.length > 0) {
      return node.children.flatMap((child) => this.collectPaths(child));
    }

    if (typeof node.path === "string" && ALLOWED_EXTENSIONS.test(node.path)) {
      return [node.path];
    }
    return [];
  }

  getPaths(): string[] {
    return this.collectPaths(this.tree);
  }
}
