import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ParamStringifier } from "../ParamStringifier";
import { TypeAnnotationSerializer } from "../TypeAnnotationSerializer";
import { ComponentInfo, FunctionInfo } from "../models";

function functionReturnsJSX(path: NodePath<t.FunctionDeclaration>): boolean {
  let hasJSX = false;
  path.traverse({
    ReturnStatement(retPath) {
      const arg = retPath.node.argument;
      if (t.isJSXElement(arg) || t.isJSXFragment(arg)) {
        hasJSX = true;
        retPath.stop();
      }
    },
  });
  return hasJSX;
}

export class FunctionExtractor {
  static extract(
    path: NodePath<t.FunctionDeclaration>,
    sourceFilePath: string,
    pathParts: string[],
  ): FunctionInfo | ComponentInfo | null {
    const functionName = path.node.id?.name;
    if (!functionName) {
      return null;
    }

    const args = path.node.params.map((param) =>
      ParamStringifier.stringify(param),
    );
    const returnType =
      path.node.returnType && !t.isNoop(path.node.returnType)
        ? TypeAnnotationSerializer.serialize(
            path.node.returnType.typeAnnotation,
          )
        : null;

    const isJSXFile = /\.(jsx|tsx)$/i.test(sourceFilePath);
    const isComponentName = /^[A-Z]/.test(functionName);
    const hasJSXReturn = functionReturnsJSX(path);

    if (isJSXFile && isComponentName && hasJSXReturn) {
      return {
        kind: "component",
        name: functionName,
        superClass: null,
        methods: [],
        properties: [],
        path: pathParts,
      };
    }

    return {
      kind: "function",
      name: functionName,
      path: pathParts,
      args,
      returnType,
    };
  }
}
