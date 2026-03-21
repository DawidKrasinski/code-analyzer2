import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { GlobalVariableInfo } from "../models";
import { collectUsedEntities } from "./collectUsedEntities";
import { collectUsedApiEndpoints } from "./collectUsedApiEndpoints";

export class GlobalVariableExtractor {
  static extract(
    path: NodePath<t.VariableDeclaration>,
    pathParts: string[],
  ): GlobalVariableInfo[] {
    const isTopLevelVariableDeclaration =
      path.parentPath?.isProgram() ||
      (path.parentPath?.isExportNamedDeclaration() &&
        path.parentPath.parentPath?.isProgram());

    if (!isTopLevelVariableDeclaration) {
      return [];
    }

    const variables: GlobalVariableInfo[] = [];

    for (const declaration of path.node.declarations) {
      if (!t.isIdentifier(declaration.id)) {
        continue;
      }

      variables.push({
        kind: "variable",
        name: declaration.id.name,
        path: pathParts,
        usedFunctions: collectUsedEntities(declaration.init),
        usedApiEndpoints: collectUsedApiEndpoints(declaration.init),
      });
    }

    return variables;
  }
}
