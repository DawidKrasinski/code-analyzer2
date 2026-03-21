import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ClassInfo, ComponentInfo } from "../models";

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

function collectUsedEntities(node: t.Node | null | undefined): string[] {
  if (!node) {
    return [];
  }

  const usedEntities = new Set<string>();
  const localDeclarations = new Set<string>();

  // First pass: collect locally declared names (function/class declarations)
  const collectLocalDeclarations = (
    currentNode: t.Node | null | undefined,
    isRoot = false,
  ) => {
    if (!currentNode) return;
    if (!isRoot && isNestedScope(currentNode)) return;

    // Collect function/class declarations
    if (
      t.isFunctionDeclaration(currentNode) &&
      t.isIdentifier(currentNode.id)
    ) {
      localDeclarations.add(currentNode.id.name);
    } else if (
      t.isClassDeclaration(currentNode) &&
      t.isIdentifier(currentNode.id)
    ) {
      localDeclarations.add(currentNode.id.name);
    }

    const visitorKeys = t.VISITOR_KEYS[currentNode.type] ?? [];
    for (const key of visitorKeys) {
      const value = currentNode[key as keyof t.Node];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNodeLike(child)) collectLocalDeclarations(child, false);
        }
      } else if (isNodeLike(value)) {
        collectLocalDeclarations(value, false);
      }
    }
  };

  // Second pass: collect used entities
  const visit = (currentNode: t.Node | null | undefined, isRoot = false) => {
    if (!currentNode) return;
    if (!isRoot && isNestedScope(currentNode)) return;

    // Collect function calls: funcName()
    if (
      t.isCallExpression(currentNode) ||
      t.isOptionalCallExpression(currentNode)
    ) {
      const callee = currentNode.callee;
      if (t.isIdentifier(callee)) {
        if (!localDeclarations.has(callee.name)) {
          usedEntities.add(callee.name);
        }
      }
    }

    // Collect JSX element usage: <ComponentName />
    if (t.isJSXElement(currentNode)) {
      const openingElement = currentNode.openingElement;
      if (t.isJSXIdentifier(openingElement.name)) {
        const name = openingElement.name.name;
        if (!localDeclarations.has(name)) {
          usedEntities.add(name);
        }
      }
    }

    // Collect class instantiation: new ClassName()
    if (t.isNewExpression(currentNode)) {
      const callee = currentNode.callee;
      if (t.isIdentifier(callee)) {
        if (!localDeclarations.has(callee.name)) {
          usedEntities.add(callee.name);
        }
      }
    }

    const visitorKeys = t.VISITOR_KEYS[currentNode.type] ?? [];
    for (const key of visitorKeys) {
      const value = currentNode[key as keyof t.Node];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isNodeLike(child)) visit(child);
        }
      } else if (isNodeLike(value)) {
        visit(value);
      }
    }
  };

  collectLocalDeclarations(node);
  visit(node, true);
  return [...usedEntities];
}

function isComponentClass(
  className: string,
  superClass: t.Expression | null | undefined,
) {
  if (className.endsWith("Component")) return true;
  if (!superClass) return false;
  if (t.isMemberExpression(superClass)) {
    return (
      t.isIdentifier(superClass.object) &&
      superClass.object.name === "React" &&
      t.isIdentifier(superClass.property) &&
      superClass.property.name === "Component"
    );
  }
  if (t.isIdentifier(superClass) && superClass.name === "Component")
    return true;
  return false;
}

export class ClassExtractor {
  static extract(
    path: NodePath<t.ClassDeclaration>,
    pathParts: string[],
  ): ClassInfo | ComponentInfo {
    const className = path.node.id?.name ?? "Anonymous";
    let superClass: string | null = null;

    if (path.node.superClass) {
      if (t.isIdentifier(path.node.superClass)) {
        superClass = path.node.superClass.name;
      } else if (t.isMemberExpression(path.node.superClass)) {
        superClass = t.isIdentifier(path.node.superClass.property)
          ? path.node.superClass.property.name
          : "<complex>";
      } else {
        superClass = "<complex>";
      }
    }

    const methods: string[] = [];
    const properties: string[] = [];
    const usedFunctions = new Set<string>();

    path.node.body.body.forEach((classElement) => {
      if (t.isClassMethod(classElement)) {
        for (const entityName of collectUsedEntities(classElement.body)) {
          usedFunctions.add(entityName);
        }

        if (t.isIdentifier(classElement.key)) {
          const name = classElement.key.name;
          const accessibility = (classElement as any).accessibility;
          if (accessibility === "private") methods.push(`private ${name}`);
          else if (accessibility === "protected")
            methods.push(`protected ${name}`);
          else if (accessibility === "public") methods.push(`public ${name}`);
          else methods.push(name);
        }
      } else if (t.isClassProperty(classElement)) {
        for (const entityName of collectUsedEntities(classElement.value)) {
          usedFunctions.add(entityName);
        }

        if (t.isIdentifier(classElement.key)) {
          const name = classElement.key.name;
          const accessibility = (classElement as any).accessibility;
          if (accessibility === "private") properties.push(`private ${name}`);
          else if (accessibility === "protected")
            properties.push(`protected ${name}`);
          else if (accessibility === "public")
            properties.push(`public ${name}`);
          else properties.push(name);
        }
      }
    });

    const isComponent = isComponentClass(className, path.node.superClass);

    if (isComponent) {
      return {
        kind: "component",
        name: className,
        superClass,
        methods,
        properties,
        path: pathParts,
        usedFunctions: [...usedFunctions],
      };
    }

    return {
      kind: "class",
      name: className,
      superClass,
      methods,
      properties,
      path: pathParts,
      usedFunctions: [...usedFunctions],
    };
  }
}
