import dirTree, { DirectoryTree } from "directory-tree";

export class Analyzer {
  private tree: DirectoryTree;

  constructor(path: string = process.cwd()) {
    this.tree = dirTree(path, {
      exclude: /node_modules|\.git|dist|.next/,
      //extensions: /\.(js|ts|jsx|tsx)$/i,
    });
  }

  private collectPaths(node: DirectoryTree): string[] {
    if (node.children && node.children.length > 0) {
      return node.children.flatMap((child) => this.collectPaths(child));
    } else {
      return [node.path];
    }
  }

  getPaths(): string[] {
    return this.collectPaths(this.tree);
  }
}
