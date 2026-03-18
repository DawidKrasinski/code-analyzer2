import { FileCollector } from "../files/FileCollector";
import { ParserFacade } from "../parser/ParserFacade";
import { GraphGenerator } from "../graph/GraphGenerator";
import type { UMLGraph } from "../parser/models";

export class CodeAnalyzerService {
  constructor(private basePath: string = process.cwd()) {}

  analyze(): UMLGraph {
    const collector = new FileCollector(this.basePath);
    const paths = collector.getPaths();
    const parser = new ParserFacade(paths);
    const entities = parser.getEntities();
    const generator = new GraphGenerator(entities);
    return generator.generate();
  }
}
