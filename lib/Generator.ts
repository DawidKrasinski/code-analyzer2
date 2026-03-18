import { GraphGenerator as NewGraphGenerator } from "./graph/GraphGenerator";
import { CodeEntity, UMLGraph } from "./parser/models";

export class Generator {
  private generator: NewGraphGenerator;

  constructor(entities: CodeEntity[]) {
    this.generator = new NewGraphGenerator(entities);
  }

  generate(): UMLGraph {
    return this.generator.generate();
  }
}

export type { UMLGraph, UMLNode, UMLRelation } from "./parser/models";
