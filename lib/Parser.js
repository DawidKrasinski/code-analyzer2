import fs from "fs";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
export class Parser {
    classes = [];
    paths = [];
    constructor(paths) {
        this.paths = paths;
    }
    getClasses() {
        this.parseFiles();
        return this.classes;
    }
    parseFiles() {
        this.paths.forEach((p) => this.parseFile(p));
    }
    parseFile(path) {
        const code = fs.readFileSync(path, "utf8");
        const ast = parser.parse(code, {
            sourceType: "module",
            plugins: ["typescript", "classProperties"],
        });
        console.log(traverse);
        // traverse(ast, {
        //   ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => {
        //     const className = path.node.id?.name ?? "Anonymous";
        //     let superClass: string | null = null;
        //     if (path.node.superClass) {
        //       if (t.isIdentifier(path.node.superClass)) {
        //         superClass = path.node.superClass.name;
        //       } else if (t.isMemberExpression(path.node.superClass)) {
        //         superClass =
        //           path.node.superClass.property.type === "Identifier"
        //             ? path.node.superClass.property.name
        //             : "<complex>";
        //       } else {
        //         superClass = "<complex>";
        //       }
        //     }
        //     const methods: string[] = [];
        //     const properties: string[] = [];
        //     path.node.body.body.forEach(
        //       (classElement: t.ClassBody["body"][number]) => {
        //         if (t.isClassMethod(classElement)) {
        //           if (t.isIdentifier(classElement.key))
        //             methods.push(classElement.key.name);
        //         } else if (t.isClassProperty(classElement)) {
        //           if (t.isIdentifier(classElement.key))
        //             properties.push(classElement.key.name);
        //         }
        //       },
        //     );
        //     this.classes.push({
        //       name: className,
        //       superClass,
        //       methods,
        //       properties,
        //     });
        //   },
        // });
    }
}
