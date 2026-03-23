import fs from "fs";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import type { NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import { ClassExtractor } from "./extractors/ClassExtractor";
import { FunctionExtractor } from "./extractors/FunctionExtractor";
import { GlobalVariableExtractor } from "./extractors/GlobalVariableExtractor";
import { CodeEntity } from "./models";
import {
  getSharedPrefixSegments,
  splitToCommonRelativePath,
} from "../utils/entityPath";

export class ParserFacade {
  private entities: CodeEntity[] = [];
  private sharedPrefixSegments: string[];
  private static readonly HTTP_METHODS = new Set([
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

  constructor(private paths: string[]) {
    this.sharedPrefixSegments = getSharedPrefixSegments(paths);
  }

  getEntities(): CodeEntity[] {
    this.parseFiles();
    return this.entities;
  }

  private static isConfigFile(filePath: string): boolean {
    const basename = filePath.split("/").pop() ?? "";
    return /\.config\.[cm]?[jt]sx?$/.test(basename);
  }

  private static toPathSegments(filePath: string): string[] {
    return filePath.replace(/\\/g, "/").split("/").filter(Boolean);
  }

  private static getApiRouteFromFilePath(filePath: string): string | null {
    const segments = ParserFacade.toPathSegments(filePath);
    const appIndex = segments.findIndex(
      (segment, index) => segment === "app" && segments[index + 1] === "api",
    );

    if (appIndex === -1) {
      return null;
    }

    const routeSegments = segments.slice(appIndex + 2);
    if (routeSegments.length === 0) {
      return null;
    }

    const lastSegment = routeSegments[routeSegments.length - 1] ?? "";
    const withoutRouteFile = /^route\.[cm]?[jt]sx?$/i.test(lastSegment)
      ? routeSegments.slice(0, -1)
      : routeSegments;

    return withoutRouteFile.length > 0
      ? `/api/${withoutRouteFile.join("/")}`
      : "/api";
  }

  private static isExportedApiHandler(
    path: NodePath<t.FunctionDeclaration>,
  ): boolean {
    const functionName = path.node.id?.name;
    if (!functionName) {
      return false;
    }

    if (!ParserFacade.HTTP_METHODS.has(functionName)) {
      return false;
    }

    return path.parentPath?.isExportNamedDeclaration() ?? false;
  }

  private static getApiHandlerEntityName(
    method: string,
    apiRoute: string,
  ): string {
    return `${method} ${apiRoute}`;
  }

  private parseFiles() {
    this.paths.forEach((p) => this.parseFile(p));
  }

  private parseFile(filePath: string) {
    const code = fs.readFileSync(filePath, "utf8");
    const pathParts = splitToCommonRelativePath(
      filePath,
      this.sharedPrefixSegments,
    );
    const apiRoute = ParserFacade.getApiRouteFromFilePath(filePath);

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
        const classInfo = ClassExtractor.extract(path, pathParts);
        this.entities.push(classInfo);
      },
      FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => {
        if (apiRoute && ParserFacade.isExportedApiHandler(path)) {
          const method = path.node.id?.name;
          if (method) {
            const functionInfo = FunctionExtractor.extract(
              path,
              filePath,
              pathParts,
            );

            this.entities.push({
              kind: "function",
              name: ParserFacade.getApiHandlerEntityName(method, apiRoute),
              path: pathParts,
              args: functionInfo?.kind === "function" ? functionInfo.args : [],
              returnType:
                functionInfo?.kind === "function"
                  ? functionInfo.returnType
                  : null,
              usedFunctions:
                functionInfo?.kind === "function"
                  ? functionInfo.usedFunctions
                  : undefined,
              usedApiEndpoints:
                functionInfo?.kind === "function"
                  ? functionInfo.usedApiEndpoints
                  : undefined,
            });
          }
          return;
        }

        const functionInfo = FunctionExtractor.extract(
          path,
          filePath,
          pathParts,
        );
        if (functionInfo) {
          this.entities.push(functionInfo);
        }
      },
      VariableDeclaration: (path: NodePath<t.VariableDeclaration>) => {
        if (ParserFacade.isConfigFile(filePath)) return;
        const variables = GlobalVariableExtractor.extract(path, pathParts);
        this.entities.push(...variables);
      },
    });
  }
}
