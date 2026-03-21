export type FunctionInfo = {
  kind: "function";
  name: string;
  path: string[];
  args: string[];
  returnType: string | null;
  usedFunctions?: string[];
  usedApiEndpoints?: string[];
};

export type GlobalVariableInfo = {
  kind: "variable";
  name: string;
  path: string[];
  usedFunctions?: string[];
  usedApiEndpoints?: string[];
};

export type ClassInfo = {
  kind: "class";
  name: string;
  superClass: string | null;
  methods: string[];
  properties: string[];
  path: string[];
  usedFunctions?: string[];
  usedApiEndpoints?: string[];
};

export type ComponentInfo = {
  kind: "component";
  name: string;
  superClass: string | null;
  methods: string[];
  properties: string[];
  path: string[];
  usedFunctions?: string[];
  usedApiEndpoints?: string[];
};

export type CodeEntity =
  | ClassInfo
  | ComponentInfo
  | FunctionInfo
  | GlobalVariableInfo;

export type UMLNodeType =
  | "class"
  | "interface"
  | "abstract"
  | "function"
  | "component"
  | "variable";

export interface UMLNode {
  id: string;
  name: string;
  type: UMLNodeType;
  attributes?: string[];
  methods?: string[];
  args?: string[];
  returnType?: string | null;
  path: string[];
}

export type RelationType =
  | "inheritance"
  | "implementation"
  | "association"
  | "aggregation"
  | "composition"
  | "dependency"
  | "usage"
  | "api-usage";

export interface UMLRelation {
  id: string;
  from: string;
  to: string;
  type: RelationType;
}

export interface UMLGraph {
  nodes: UMLNode[];
  relations: UMLRelation[];
}
