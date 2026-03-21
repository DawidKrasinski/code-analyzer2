import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ParamStringifier } from "../ParamStringifier";
import { TypeAnnotationSerializer } from "../TypeAnnotationSerializer";
import { ComponentInfo, FunctionInfo } from "../models";

function isNestedScope(node: t.Node): boolean {
  return (
    t.isFunctionDeclaration(node) ||
    t.isFunctionExpression(node) ||
    t.isArrowFunctionExpression(node) ||
    t.isClassDeclaration(node) ||
    t.isClassExpression(node)
  );
}

function isNodeLike(value: unknown): value is t.Node {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

function collectUsedFunctions(node: t.Node | null | undefined): string[] {
  if (!node) {
    return [];
  }

  const calledFunctions = new Set<string>();

  const visit = (currentNode: t.Node | null | undefined, isRoot = false) => {
    if (!currentNode) {
      return;
    }

    if (!isRoot && isNestedScope(currentNode)) {
      return;
    }

    if (
      t.isCallExpression(currentNode) ||
      t.isOptionalCallExpression(currentNode)
    ) {
      const callee = currentNode.callee;
      if (t.isIdentifier(callee)) {
        calledFunctions.add(callee.name);
      }
    }

    const visitorKeys = t.VISITOR_KEYS[currentNode.type] ?? [];

    for (const key of visitorKeys) {
      const value = currentNode[key as keyof t.Node];

      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNodeLike(child)) {
            visit(child);
          }
        }
        continue;
      }

      if (isNodeLike(value)) {
        visit(value);
      }
    }
  };

  visit(node, true);
  return [...calledFunctions];
}

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
    const usedFunctions = collectUsedFunctions(path.node.body);

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
        usedFunctions,
      };
    }

    return {
      kind: "function",
      name: functionName,
      path: pathParts,
      args,
      returnType,
      usedFunctions,
    };
  }
}
