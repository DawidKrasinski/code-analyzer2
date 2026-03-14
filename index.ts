import { Analyzer } from "./lib/Analyzer";
import { Generator } from "./lib/Generator";
import { Parser } from "./lib/Parser";

export function main(path: string = process.cwd()) {
  try {
    const analyzer = new Analyzer(path);
    const paths = analyzer.getPaths();
    const parser = new Parser(paths);
    const classes = parser.getClasses();
    const generator = new Generator(classes);
    const graph = generator.generate();

    return graph;
  } catch (err) {
    console.error("Błąd podczas analizy:", err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  const graph = main();
  console.log(JSON.stringify(graph, null, 2));
}
