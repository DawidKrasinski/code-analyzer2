import { Analyzer } from "./lib/Analyzer";
import { Parser } from "./lib/Parser";

async function main() {
  try {
    const analyzer = new Analyzer();
    const paths = analyzer.getPaths();
    const parser = new Parser(paths);
    const classes = parser.getClasses();

    console.log("Classes:", classes);
  } catch (err) {
    console.error("Błąd podczas analizy:", err);
  }
}

// start programu
main();
