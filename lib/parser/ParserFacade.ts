import fs from "fs";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import { ClassExtractor } from "./extractors/ClassExtractor";
import { FunctionExtractor } from "./extractors/FunctionExtractor";
import { CodeEntity } from "./models";

export class ParserFacade {
  private entities: CodeEntity[] = [];

  constructor(private paths: string[]) {}

  getEntities(): CodeEntity[] {
    this.parseFiles();
    return this.entities;
  }

  private parseFiles() {
    this.paths.forEach((p) => this.parseFile(p));
  }

  private parseFile(filePath: string) {
    const code = fs.readFileSync(filePath, "utf8");

    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript", "classProperties", "jsx"],
      });
    } catch (err) {
      console.warn(
        `Skipping file ${filePath}: parse error: ${(err as Error).message}`,
      );
      return;
    }

    traverse(ast, {
      ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => {
        const classInfo = ClassExtractor.extract(path, filePath);
        this.entities.push(classInfo);
      },
      FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
        const functionInfo = FunctionExtractor.extract(path, filePath);
        if (functionInfo) {
          this.entities.push(functionInfo);
        }
      },
    });
  }
}
