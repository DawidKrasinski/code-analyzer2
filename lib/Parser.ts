import fs from "fs";
import * as parser from "@babel/parser";
import traverse = require("@babel/traverse");
import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export type ClassInfo = {
  name: string;
  superClass: string | null;
  methods: string[];
  properties: string[];
};

export class Parser {
  private classes: ClassInfo[] = [];
  private paths: string[] = [];

  constructor(paths: string[]) {
    this.paths = paths;
  }

  getClasses(): ClassInfo[] {
    this.parseFiles();
    return this.classes;
  }

  private parseFiles() {
    this.paths.forEach((p) => this.parseFile(p));
  }

  private parseFile(path: string) {
    const code = fs.readFileSync(path, "utf8");

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript", "classProperties", "jsx"],
      });
    } catch (err) {
      console.warn(
        `Skipping file ${path}: parse error: ${(err as Error).message}`,
      );
      return;
    }

    traverse.default(ast, {
      ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => {
        const className = path.node.id?.name ?? "Anonymous";

        let superClass: string | null = null;
        if (path.node.superClass) {
          if (t.isIdentifier(path.node.superClass)) {
            superClass = path.node.superClass.name;
          } else if (t.isMemberExpression(path.node.superClass)) {
            superClass =
              path.node.superClass.property.type === "Identifier"
                ? path.node.superClass.property.name
                : "<complex>";
          } else {
            superClass = "<complex>";
          }
        }

        const methods: string[] = [];
        const properties: string[] = [];

        path.node.body.body.forEach(
          (classElement: t.ClassBody["body"][number]) => {
            if (t.isClassMethod(classElement)) {
              if (t.isIdentifier(classElement.key))
                methods.push(classElement.key.name);
            } else if (t.isClassProperty(classElement)) {
              if (t.isIdentifier(classElement.key))
                properties.push(classElement.key.name);
            }
          },
        );

        this.classes.push({
          name: className,
          superClass,
          methods,
          properties,
        });
      },
    });
  }
}
