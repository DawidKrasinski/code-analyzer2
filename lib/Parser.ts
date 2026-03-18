import { ParserFacade } from "./parser/ParserFacade";
import { ClassInfo, CodeEntity } from "./parser/models";

export type { ClassInfo, CodeEntity } from "./parser/models";

export class Parser {
  private parser: ParserFacade;

  constructor(paths: string[]) {
    this.parser = new ParserFacade(paths);
  }

  getEntities(): CodeEntity[] {
    return this.parser.getEntities();
  }

  getClasses(): ClassInfo[] {
    return this.parser
      .getEntities()
      .filter((e): e is ClassInfo => e.kind === "class");
  }
}
