import dirTree from "directory-tree";
export class Analyzer {
    tree;
    constructor(path = process.cwd()) {
        this.tree = dirTree(path, {
            exclude: /node_modules|\.git|dist|.next/,
            //extensions: /\.(js|ts|jsx|tsx)$/i,
        });
    }
    collectPaths(node) {
        if (node.children && node.children.length > 0) {
            return node.children.flatMap((child) => this.collectPaths(child));
        }
        else {
            return [node.path];
        }
    }
    getPaths() {
        return this.collectPaths(this.tree);
    }
}
