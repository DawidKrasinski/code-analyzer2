import { FileCollector } from "./files/FileCollector";

export class Analyzer {
  private collector: FileCollector;

  constructor(path: string = process.cwd()) {
    this.collector = new FileCollector(path);
  }

  getPaths(): string[] {
    return this.collector.getPaths();
  }
}
