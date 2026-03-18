import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ParamStringifier } from "../ParamStringifier";
import { TypeAnnotationSerializer } from "../TypeAnnotationSerializer";
import { FunctionInfo } from "../models";

export class FunctionExtractor {
  static extract(
    path: NodePath<t.FunctionDeclaration>,
    filePath: string,
  ): FunctionInfo | null {
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

    return {
      kind: "function",
      name: functionName,
      path: filePath,
      args,
      returnType,
    };
  }
}
