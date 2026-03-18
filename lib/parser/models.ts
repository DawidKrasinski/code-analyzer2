export type FunctionInfo = {
  kind: "function";
  name: string;
  path: string;
  args: string[];
  returnType: string | null;
};

export type ClassInfo = {
  kind: "class";
  name: string;
  superClass: string | null;
  methods: string[];
  properties: string[];
  path: string;
};

export type CodeEntity = ClassInfo | FunctionInfo;

export type UMLNodeType = "class" | "interface" | "abstract" | "function";

export interface UMLNode {
  id: string;
  name: string;
  type: UMLNodeType;
  attributes?: string[];
  methods?: string[];
  args?: string[];
  returnType?: string | null;
  path: string;
}

export type RelationType =
  | "inheritance"
  | "implementation"
  | "association"
  | "aggregation"
  | "composition"
  | "dependency";

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
