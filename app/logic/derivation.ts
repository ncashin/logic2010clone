/**
 * Chapter 1 of Logic 2010: negation and conditional only.
 * A line is a formula plus an annotation. Show lines are goals; CD, ID, and DD
 * box a show line. Nothing else (conjunction, disjunction, derived rules) is accepted.
 */

export type Formula =
  | { kind: "atom"; name: string }
  | { kind: "not"; of: Formula }
  | { kind: "if"; if: Formula; then: Formula };

export type RuleName =
  | "PR"
  | "CD"
  | "ID"
  | "DD"
  | "ASS CD"
  | "ASS ID"
  | "R"
  | "MP"
  | "MT"
  | "DN"
  | "SHOW CONC";

export interface DerivationLine {
  symbols: string;
  annotation: string;
  depth: number;
  /** Set when the annotation is committed with Enter. */
  entered: boolean;
}

export interface ParsedArgument {
  premises: Formula[];
  conclusion: Formula;
}

export interface CheckedLine {
  formula: Formula | null;
  show: boolean;
  boxed: "CD" | "ID" | "DD" | null;
  /** This line successfully closed the show above it. */
  closesShow: boolean;
  error: string | null;
}

const BOX_RULES = new Set(["CD", "ID", "DD"]);

export function parseArgument(problem: string): ParsedArgument | string {
  let parts = problem.split("∴");
  if (parts.length !== 2) return "Problem needs a single ∴ before the conclusion.";
  let conclusion = parseFormula(parts[1] ?? "");
  if (typeof conclusion === "string") return conclusion;
  let premises: Formula[] = [];
  for (let piece of splitPremises(parts[0] ?? "")) {
    if (piece.trim() === "") continue;
    let formula = parseFormula(piece);
    if (typeof formula === "string") return formula;
    premises.push(formula);
  }
  return { premises, conclusion };
}

export function parseFormula(input: string): Formula | string {
  let tokens = tokenize(input);
  if (typeof tokens === "string") return tokens;
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function eat(kind: Token["kind"]) {
    if (peek()?.kind === kind) {
      index += 1;
      return true;
    }
    return false;
  }

  function parseIf(): Formula | string {
    let left = parseNot();
    if (typeof left === "string") return left;
    if (!eat("arrow")) return left;
    let right = parseIf();
    if (typeof right === "string") return right;
    return { kind: "if", if: left, then: right };
  }

  function parseNot(): Formula | string {
    if (eat("not")) {
      let of = parseNot();
      if (typeof of === "string") return of;
      return { kind: "not", of };
    }
    if (eat("lparen")) {
      let inner = parseIf();
      if (typeof inner === "string") return inner;
      if (!eat("rparen")) return "Missing ).";
      return inner;
    }
    let token = peek();
    if (token?.kind === "atom") {
      index += 1;
      return { kind: "atom", name: token.name };
    }
    return "Expected a sentence letter.";
  }

  let formula = parseIf();
  if (typeof formula === "string") return formula;
  if (index !== tokens.length) return "Couldn't read the whole formula.";
  return formula;
}

export function formatFormula(formula: Formula): string {
  switch (formula.kind) {
    case "atom":
      return formula.name;
    case "not":
      return formula.of.kind === "if" ? `~(${formatFormula(formula.of)})` : `~${formatFormula(formula.of)}`;
    case "if": {
      let left = formula.if.kind === "if" ? `(${formatFormula(formula.if)})` : formatFormula(formula.if);
      return `${left}→${formatFormula(formula.then)}`;
    }
  }
}

export function sameFormula(a: Formula, b: Formula): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "atom" && b.kind === "atom") return a.name === b.name;
  if (a.kind === "not" && b.kind === "not") return sameFormula(a.of, b.of);
  if (a.kind === "if" && b.kind === "if") return sameFormula(a.if, b.if) && sameFormula(a.then, b.then);
  return false;
}

export function negate(formula: Formula): Formula {
  return { kind: "not", of: formula };
}

export interface CheckResult {
  argument: ParsedArgument | null;
  problemError: string | null;
  lines: CheckedLine[];
  complete: boolean;
}

export function checkDerivation(problem: string, lines: DerivationLine[]): CheckResult {
  let parsed = parseArgument(problem);
  if (typeof parsed === "string") {
    return {
      argument: null,
      problemError: parsed,
      lines: lines.map(() => ({ formula: null, show: false, boxed: null, closesShow: false, error: null })),
      complete: false,
    };
  }

  assignDepths(lines);
  let checked = lines.map((line) => readLine(line));

  for (let pass = 0; pass < lines.length + 1; pass += 1) {
    let next = lines.map((line) => readLine(line));

    for (let index = 0; index < lines.length; index += 1) {
      let line = next[index];
      if (!line) continue;
      let annotation = parseAnnotation(lines[index]?.annotation ?? "");
      if (!lines[index]?.entered && annotation.kind !== "empty") continue;
      if (annotation.kind === "partial") continue;
      if (annotation.kind === "empty") {
        if (!line.show && line.formula) line.error = "Add an annotation.";
        continue;
      }
      if (annotation.kind === "invalid") {
        line.error = "Unknown annotation. Use PR1, ASS CD, ASS ID, R, MP, MT, DN, CD, ID, or DD.";
        continue;
      }
      if (line.show) {
        if (annotation.rule === "SHOW CONC") {
          if (line.formula && !sameFormula(line.formula, parsed.conclusion)) line.error = "Show the conclusion.";
        } else if (!BOX_RULES.has(annotation.rule)) {
          line.error = "Close a show line with a cited DD, CD, or ID.";
        }
        continue;
      }
      if (BOX_RULES.has(annotation.rule)) continue;
      if (!line.formula) {
        line.error = "That annotation does not determine a formula.";
        continue;
      }
      line.error = justify(parsed, lines, checked, index, annotation);
    }

    let openShows: number[] = [];
    for (let index = 0; index < lines.length; index += 1) {
      if (next[index]?.show) openShows.push(index);
      if (!lines[index]?.entered) continue;
      let annotation = parseAnnotation(lines[index]?.annotation ?? "");
      if (annotation.kind !== "rule" || !BOX_RULES.has(annotation.rule) || next[index]?.show) continue;
      let showIndex = openShows.at(-1);
      let closer = next[index];
      if (showIndex === undefined || !closer) {
        if (closer) closer.error = "DD, CD, and ID close a show line.";
        continue;
      }
      let rule = annotation.rule as "CD" | "ID" | "DD";
      let error = boxByCitation(lines, next, showIndex, index, rule, annotation.cites);
      if (error) closer.error = error;
      else {
        let show = next[showIndex];
        if (show) show.boxed = rule;
        closer.closesShow = true;
        openShows.pop();
      }
    }

    let stable = next.every((line, index) => {
      let previous = checked[index];
      return line.error === previous?.error && line.boxed === previous?.boxed;
    });
    checked = next;
    if (stable) break;
  }

  let complete = checked.some(
    (line, index) =>
      line.show &&
      line.boxed !== null &&
      lines[index]?.depth === 0 &&
      line.formula !== null &&
      sameFormula(line.formula, parsed.conclusion),
  );

  return { argument: parsed, problemError: null, lines: checked, complete };
}

export function assignDepths(lines: DerivationLine[]) {
  let depth = 0;
  for (let line of lines) {
    line.depth = depth;
    if (isShowLine(line)) depth += 1;
    else if (isCloser(line) && depth > 0) depth -= 1;
  }
}

function isShowLine(line: DerivationLine): boolean {
  if (/^\s*show\b/i.test(line.symbols)) return true;
  if (!line.entered) return false;
  let annotation = parseAnnotation(line.annotation);
  return annotation.kind === "rule" && annotation.rule === "SHOW CONC";
}

function isCloser(line: DerivationLine): boolean {
  if (!line.entered || isShowLine(line)) return false;
  let annotation = parseAnnotation(line.annotation);
  return annotation.kind === "rule" && BOX_RULES.has(annotation.rule);
}

export function inferSymbols(problem: string, lines: DerivationLine[], index: number): string | null {
  let written = writtenFormula(problem, lines, index);
  if (!written) return null;
  let current = formulaText(lines[index]?.symbols ?? "");
  if (current) {
    let parsed = parseFormula(current);
    let target = parseFormula(formulaText(written));
    if (typeof parsed !== "string" && typeof target !== "string" && sameFormula(parsed, target)) return null;
  }
  return written;
}

function writtenFormula(problem: string, lines: DerivationLine[], index: number): string | null {
  let text = argumentText(problem);
  let annotation = parseAnnotation(lines[index]?.annotation ?? "");
  if (annotation.kind !== "rule" || !text) return null;
  if (annotation.rule === "SHOW CONC") return `Show ${text.conclusion}`;
  if (BOX_RULES.has(annotation.rule)) return null;
  switch (annotation.rule) {
    case "PR":
      return text.premises[(annotation.cites[0] ?? 0) - 1] ?? null;
    case "ASS CD":
    case "ASS ID": {
      let show = formulaText(lines[index - 1]?.symbols ?? "");
      let node = show ? parseNode(show) : null;
      if (!node) return null;
      if (annotation.rule === "ASS CD") return node.formula.kind === "if" && node.left ? sliceOf(show, node.left) : null;
      return `~${parenthesize(show, node)}`;
    }
    case "R":
    case "DN": {
      if (annotation.cites.length !== 1) return null;
      let source = citedText(lines, annotation.cites[0] ?? 0);
      if (!source) return null;
      if (annotation.rule === "R") return source;
      let node = parseNode(source);
      if (!node) return null;
      if (node.formula.kind === "not" && node.of?.formula.kind === "not" && node.of.of) return sliceOf(source, node.of.of);
      return `~~${parenthesize(source, node)}`;
    }
    case "MP":
    case "MT": {
      if (annotation.cites.length !== 2) return null;
      let first = citedText(lines, annotation.cites[0] ?? 0);
      let second = citedText(lines, annotation.cites[1] ?? 0);
      if (!first || !second) return null;
      return annotation.rule === "MP" ? modusPonensText(first, second) : modusTollensText(first, second);
    }
    default:
      return null;
  }
}

function argumentText(problem: string): { premises: string[]; conclusion: string } | null {
  let parts = problem.split("∴");
  if (parts.length !== 2) return null;
  let conclusion = (parts[1] ?? "").trim();
  if (conclusion === "" || typeof parseFormula(conclusion) === "string") return null;
  let premises = splitPremises(parts[0] ?? "")
    .map((piece) => piece.trim())
    .filter((piece) => piece !== "");
  if (premises.some((piece) => typeof parseFormula(piece) === "string")) return null;
  return { premises, conclusion };
}

function formulaText(symbols: string): string {
  return symbols.trim().replace(/^show\b/i, "").trim();
}

function citedText(lines: DerivationLine[], number: number): string | null {
  let text = formulaText(lines[number - 1]?.symbols ?? "");
  return text === "" ? null : text;
}

function modusPonensText(first: string, second: string): string | null {
  let left = parseNode(first);
  let right = parseNode(second);
  if (!left || !right) return null;
  if (left.formula.kind === "if" && left.right && sameFormula(left.formula.if, right.formula)) return sliceOf(first, left.right);
  if (right.formula.kind === "if" && right.right && sameFormula(right.formula.if, left.formula)) return sliceOf(second, right.right);
  return null;
}

function modusTollensText(first: string, second: string): string | null {
  let left = parseNode(first);
  let right = parseNode(second);
  if (!left || !right) return null;
  let denied = tollensAntecedent(left, right);
  if (denied) return `~${parenthesize(first, denied)}`;
  denied = tollensAntecedent(right, left);
  if (denied) return `~${parenthesize(second, denied)}`;
  return null;
}

function tollensAntecedent(conditional: Node, denied: Node): Node | null {
  if (conditional.formula.kind !== "if" || !conditional.left || !conditional.right) return null;
  if (!sameFormula(denied.formula, negate(conditional.formula.then))) return null;
  return conditional.left;
}

function parenthesize(input: string, node: Node): string {
  let text = sliceOf(input, node);
  if (node.formula.kind === "if" && !(input[node.start] === "(" && input[node.end - 1] === ")")) return `(${text})`;
  return text;
}

function sliceOf(input: string, node: Node): string {
  return input.slice(node.start, node.end).trim();
}

interface Node {
  formula: Formula;
  start: number;
  end: number;
  left?: Node;
  right?: Node;
  of?: Node;
}

function parseNode(input: string): Node | null {
  let tokens = tokenizeAt(input);
  if (!tokens) return null;
  let index = 0;

  function peek() {
    return tokens?.[index];
  }

  function parseIf(): Node | null {
    let left = parseNot();
    if (!left || peek()?.kind !== "arrow") return left;
    let arrow = tokens?.[index];
    index += 1;
    let right = parseIf();
    if (!right || !arrow) return null;
    return {
      formula: { kind: "if", if: left.formula, then: right.formula },
      start: left.start,
      end: right.end,
      left,
      right,
    };
  }

  function parseNot(): Node | null {
    let token = peek();
    if (token?.kind === "not") {
      index += 1;
      let of = parseNot();
      if (!of) return null;
      return { formula: { kind: "not", of: of.formula }, start: token.start, end: of.end, of };
    }
    if (token?.kind === "lparen") {
      index += 1;
      let inner = parseIf();
      let close = peek();
      if (!inner || close?.kind !== "rparen") return null;
      index += 1;
      return { ...inner, start: token.start, end: close.end };
    }
    if (token?.kind === "atom") {
      index += 1;
      return { formula: { kind: "atom", name: token.name }, start: token.start, end: token.end };
    }
    return null;
  }

  let node = parseIf();
  if (!node || index !== tokens.length) return null;
  return node;
}

function tokenizeAt(input: string): Array<{ kind: Token["kind"]; name: string; start: number; end: number }> | null {
  let tokens: Array<{ kind: Token["kind"]; name: string; start: number; end: number }> = [];
  let cursor = 0;
  while (cursor < input.length) {
    let char = input[cursor] ?? "";
    if (/\s/.test(char)) {
      cursor += 1;
      continue;
    }
    let start = cursor;
    if (/[A-Za-z]/.test(char)) {
      tokens.push({ kind: "atom", name: char.toUpperCase(), start, end: cursor + 1 });
      cursor += 1;
      continue;
    }
    if (char === "~" || char === "¬") {
      tokens.push({ kind: "not", name: "", start, end: cursor + 1 });
      cursor += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ kind: "lparen", name: "", start, end: cursor + 1 });
      cursor += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ kind: "rparen", name: "", start, end: cursor + 1 });
      cursor += 1;
      continue;
    }
    if (char === "→" || char === "⊃" || input.slice(cursor, cursor + 2) === "->") {
      let end = char === "-" ? cursor + 2 : cursor + 1;
      tokens.push({ kind: "arrow", name: "", start, end });
      cursor = end;
      continue;
    }
    return null;
  }
  return tokens;
}

export function inferFormula(problem: string, lines: DerivationLine[], index: number): Formula | null {
  let parsed = parseArgument(problem);
  if (typeof parsed === "string") return null;
  let annotation = parseAnnotation(lines[index]?.annotation ?? "");
  if (annotation.kind !== "rule" || BOX_RULES.has(annotation.rule)) return null;
  let checked = checkDerivation(problem, lines).lines;

  switch (annotation.rule) {
    case "PR":
      return parsed.premises[(annotation.cites[0] ?? 0) - 1] ?? null;
    case "ASS CD":
    case "ASS ID": {
      let show = index > 0 ? checked[index - 1] : undefined;
      if (!show?.show || !show.formula) return null;
      if (annotation.rule === "ASS CD") return show.formula.kind === "if" ? show.formula.if : null;
      return negate(show.formula);
    }
    case "R":
    case "DN": {
      if (annotation.cites.length !== 1) return null;
      let source = citedFormula(lines, checked, index, annotation.cites[0] ?? 0);
      if (!source) return null;
      return annotation.rule === "R" ? source : collapsedDoubleNegation(source);
    }
    case "MP":
    case "MT": {
      if (annotation.cites.length !== 2) return null;
      let first = citedFormula(lines, checked, index, annotation.cites[0] ?? 0);
      let second = citedFormula(lines, checked, index, annotation.cites[1] ?? 0);
      if (!first || !second) return null;
      return annotation.rule === "MP" ? modusPonensResult(first, second) : modusTollensResult(first, second);
    }
    default:
      return null;
  }
}

function justify(
  argument: ParsedArgument,
  lines: DerivationLine[],
  checked: CheckedLine[],
  index: number,
  annotation: Extract<ParsedAnnotation, { kind: "rule" }>,
): string | null {
  let formula = checked[index]?.formula;
  if (!formula) return null;

  switch (annotation.rule) {
    case "PR": {
      if (annotation.cites.length !== 1) return "Name the premise, as in PR1.";
      let premise = argument.premises[(annotation.cites[0] ?? 0) - 1];
      if (!premise) return "That premise is not in the problem.";
      if (!sameFormula(formula, premise)) return `That premise is ${formatFormula(premise)}.`;
      return null;
    }
    case "ASS CD": {
      let show = previousLine(lines, index);
      if (show === null || !checked[show]?.show) return "ASS CD must follow its show line.";
      let target = checked[show]?.formula;
      if (!target || target.kind !== "if") return "ASS CD follows a show of a conditional.";
      if (!sameFormula(formula, target.if)) return `Assumption must be ${formatFormula(target.if)}.`;
      return null;
    }
    case "ASS ID": {
      let show = previousLine(lines, index);
      if (show === null || !checked[show]?.show) return "ASS ID must follow its show line.";
      let target = checked[show]?.formula;
      if (!target || !sameFormula(formula, negate(target))) {
        return target ? `Assumption must be ${formatFormula(negate(target))}.` : "The show line has no formula.";
      }
      return null;
    }
    case "R": {
      let cited = citedLines(lines, checked, index, annotation.cites);
      if (typeof cited === "string") return cited;
      if (cited.length !== 1) return "R cites one line.";
      let source = checked[cited[0] ?? -1]?.formula;
      if (!source || !sameFormula(formula, source)) return "R must repeat that line.";
      return null;
    }
    case "DN": {
      let cited = citedLines(lines, checked, index, annotation.cites);
      if (typeof cited === "string") return cited;
      if (cited.length !== 1) return "DN cites one line.";
      let source = checked[cited[0] ?? -1]?.formula;
      if (!source || !doubleNegation(formula, source)) return "DN adds or removes a double negation.";
      return null;
    }
    case "MP": {
      let cited = citedLines(lines, checked, index, annotation.cites);
      if (typeof cited === "string") return cited;
      if (cited.length !== 2) return "MP cites two lines.";
      if (!modusPonens(formula, cited.map((item) => checked[item]?.formula ?? null))) {
        return "MP needs a conditional and its antecedent.";
      }
      return null;
    }
    case "MT": {
      let cited = citedLines(lines, checked, index, annotation.cites);
      if (typeof cited === "string") return cited;
      if (cited.length !== 2) return "MT cites two lines.";
      if (!modusTollens(formula, cited.map((item) => checked[item]?.formula ?? null))) {
        return "MT needs a conditional and the negation of its consequent.";
      }
      return null;
    }
    default:
      return "That rule does not justify a formula.";
  }
}

function boxByCitation(
  lines: DerivationLine[],
  checked: CheckedLine[],
  showIndex: number,
  closerIndex: number,
  rule: "CD" | "ID" | "DD",
  cites: number[],
): string | null {
  let show = checked[showIndex]?.formula;
  if (!show) return "The show line has no formula.";
  let cited = cites.map((number) => {
    let index = number - 1;
    let line = checked[index];
    if (index <= showIndex || index >= closerIndex || !line?.formula || line.error) return null;
    return line.formula;
  });
  if (cited.some((formula) => formula === null)) return "Cite a line inside this show.";
  if (rule === "DD") {
    if (cited.length !== 1) return "DD cites the line that matches the show.";
    if (!cited[0] || !sameFormula(cited[0], show)) return "DD needs the show formula on the cited line.";
    return null;
  }
  if (rule === "CD") {
    if (show.kind !== "if" || cited.length !== 1) return "CD cites the consequent.";
    if (!cited[0] || !sameFormula(cited[0], show.then)) return "CD needs the consequent on the cited line.";
    return null;
  }
  if (cited.length !== 2 || !cited[0] || !cited[1]) return "ID cites a formula and its negation.";
  if (!sameFormula(cited[0], negate(cited[1])) && !sameFormula(cited[1], negate(cited[0]))) {
    return "ID needs a formula and its negation.";
  }
  return null;
}

function boxError(
  _argument: ParsedArgument,
  lines: DerivationLine[],
  checked: CheckedLine[],
  index: number,
  rule: "CD" | "ID" | "DD",
): string | null {
  let formula = checked[index]?.formula;
  if (!formula) return "Show line has no formula.";
  let body = establishedBody(lines, checked, index);
  if (rule === "CD") {
    if (formula.kind !== "if") return "CD boxes a conditional.";
    if (!body.some((item) => sameFormula(item, formula.then))) return "CD needs the consequent on a later line.";
    return null;
  }
  if (rule === "DD") {
    if (!body.some((item) => sameFormula(item, formula))) return "DD needs this formula on a later line.";
    return null;
  }
  let contradicted = body.some((item) => body.some((other) => sameFormula(other, negate(item))));
  if (!contradicted) return "ID needs a formula and its negation.";
  return null;
}

function establishedBody(lines: DerivationLine[], checked: CheckedLine[], showIndex: number): Formula[] {
  let showDepth = lines[showIndex]?.depth ?? 0;
  let found: Formula[] = [];
  for (let index = showIndex + 1; index < lines.length; index += 1) {
    if ((lines[index]?.depth ?? 0) <= showDepth) break;
    if (insideBoxedShow(lines, checked, showIndex, index)) continue;
    let line = checked[index];
    if (!line?.formula || line.error) continue;
    if (line.show && !line.boxed) continue;
    if (line.show && line.boxed) {
      found.push(line.formula);
      continue;
    }
    if (!line.show) found.push(line.formula);
  }
  return found;
}

function insideBoxedShow(
  lines: DerivationLine[],
  checked: CheckedLine[],
  outer: number,
  index: number,
): boolean {
  for (let show = outer + 1; show < index; show += 1) {
    if (!checked[show]?.boxed) continue;
    let depth = lines[show]?.depth ?? 0;
    let end = show;
    for (let cursor = show + 1; cursor < lines.length; cursor += 1) {
      if ((lines[cursor]?.depth ?? 0) <= depth) break;
      end = cursor;
    }
    if (index > show && index <= end && (lines[index]?.depth ?? 0) > depth) return true;
  }
  return false;
}

function citedLines(
  lines: DerivationLine[],
  checked: CheckedLine[],
  index: number,
  cites: number[],
): number[] | string {
  let resolved: number[] = [];
  for (let number of cites) {
    let cited = number - 1;
    if (cited < 0 || cited >= index) return `Line ${number} is not available.`;
    if (!isAvailable(lines, checked, index, cited)) return `Line ${number} is not available.`;
    resolved.push(cited);
  }
  return resolved;
}

function isAvailable(
  lines: DerivationLine[],
  checked: CheckedLine[],
  from: number,
  target: number,
): boolean {
  let line = checked[target];
  if (!line?.formula || line.error) return false;
  if (line.show && !line.boxed) return false;
  let targetBox = boxOf(lines, checked, target);
  if (targetBox !== null && !(line.show && line.boxed)) {
    let end = showBodyEnd(lines, targetBox);
    if (from <= targetBox || from > end) return false;
  }
  return (lines[target]?.depth ?? 0) <= (lines[from]?.depth ?? 0);
}

function showBodyEnd(lines: DerivationLine[], show: number): number {
  let depth = lines[show]?.depth ?? 0;
  let end = show;
  for (let cursor = show + 1; cursor < lines.length; cursor += 1) {
    if ((lines[cursor]?.depth ?? 0) <= depth) break;
    end = cursor;
  }
  return end;
}

function boxOf(lines: DerivationLine[], checked: CheckedLine[], index: number): number | null {
  let found: number | null = null;
  for (let show = 0; show < index; show += 1) {
    if (!checked[show]?.boxed) continue;
    let depth = lines[show]?.depth ?? 0;
    let end = showBodyEnd(lines, show);
    if (index > show && index <= end && (lines[index]?.depth ?? 0) > depth) found = show;
  }
  return found;
}

function previousLine(lines: DerivationLine[], index: number): number | null {
  return index > 0 ? index - 1 : null;
}

function citedFormula(
  lines: DerivationLine[],
  checked: CheckedLine[],
  index: number,
  number: number,
): Formula | null {
  let cited = citedLines(lines, checked, index, [number]);
  if (typeof cited === "string") return null;
  return checked[cited[0] ?? -1]?.formula ?? null;
}

function collapsedDoubleNegation(source: Formula): Formula {
  if (source.kind === "not" && source.of.kind === "not") return source.of.of;
  return { kind: "not", of: { kind: "not", of: source } };
}

function modusPonensResult(first: Formula, second: Formula): Formula | null {
  if (first.kind === "if" && sameFormula(first.if, second)) return first.then;
  if (second.kind === "if" && sameFormula(second.if, first)) return second.then;
  return null;
}

function modusTollensResult(first: Formula, second: Formula): Formula | null {
  if (first.kind === "if" && sameFormula(second, negate(first.then))) return negate(first.if);
  if (second.kind === "if" && sameFormula(first, negate(second.then))) return negate(second.if);
  return null;
}

function doubleNegation(next: Formula, source: Formula): boolean {
  if (next.kind === "not" && next.of.kind === "not" && sameFormula(next.of.of, source)) return true;
  if (source.kind === "not" && source.of.kind === "not" && sameFormula(source.of.of, next)) return true;
  return false;
}

function modusPonens(result: Formula, sources: Array<Formula | null>): boolean {
  let [first, second] = sources;
  if (!first || !second) return false;
  if (first.kind === "if" && sameFormula(first.if, second) && sameFormula(first.then, result)) return true;
  if (second.kind === "if" && sameFormula(second.if, first) && sameFormula(second.then, result)) return true;
  return false;
}

function modusTollens(result: Formula, sources: Array<Formula | null>): boolean {
  let [first, second] = sources;
  if (!first || !second || result.kind !== "not") return false;
  return (
    tollens(first, second, result.of) || tollens(second, first, result.of)
  );
}

function tollens(conditional: Formula, denied: Formula, antecedent: Formula): boolean {
  return (
    conditional.kind === "if" &&
    sameFormula(conditional.if, antecedent) &&
    sameFormula(denied, negate(conditional.then))
  );
}

function readLine(line: DerivationLine): CheckedLine {
  let raw = line.symbols.trim();
  if (raw === "") return { formula: null, show: false, boxed: null, closesShow: false, error: null };
  let show = /^show\b/i.test(raw);
  let text = show ? raw.replace(/^show\b/i, "").trim() : raw;
  if (text === "") return { formula: null, show, boxed: null, closesShow: false, error: "Show needs a formula." };
  let formula = parseFormula(text);
  if (typeof formula === "string") return { formula: null, show, boxed: null, closesShow: false, error: formula };
  return { formula, show, boxed: null, closesShow: false, error: null };
}

type ParsedAnnotation =
  | { kind: "empty" }
  | { kind: "partial" }
  | { kind: "invalid" }
  | { kind: "rule"; rule: RuleName; cites: number[] };

function parseAnnotation(input: string): ParsedAnnotation {
  let text = input.trim().replace(/^["']+|["']+$/g, "").replace(/\s+/g, " ").toUpperCase();
  if (text === "") return { kind: "empty" };
  if (text === "SHOW CONC") return { kind: "rule", rule: "SHOW CONC", cites: [] };
  let premise = /^PR\s*(\d+)$/.exec(text);
  if (premise?.[1]) return { kind: "rule", rule: "PR", cites: [Number(premise[1])] };
  if (text === "ASS CD" || text === "ASS ID" || text === "CD" || text === "ID" || text === "DD") {
    return { kind: "rule", rule: text as RuleName, cites: [] };
  }
  let box = /^([\d,\s]+)\s+(DD|CD|ID)$/.exec(text);
  if (box?.[1] && (box[2] === "DD" || box[2] === "CD" || box[2] === "ID")) {
    let cites = box[1]
      .split(/[\s,]+/)
      .filter((piece) => piece !== "")
      .map((piece) => Number(piece));
    if (cites.every((cite) => Number.isInteger(cite) && cite >= 1)) {
      return { kind: "rule", rule: box[2], cites };
    }
  }
  let match = /^(.*?)(?:\s+)?(MP|MT|DN|R)$/.exec(text);
  if (match) {
    let cites = (match[1] ?? "")
      .split(/[\s,]+/)
      .filter((piece) => piece !== "")
      .map((piece) => Number(piece));
    let rule = match[2];
    if (
      (rule === "MP" || rule === "MT" || rule === "DN" || rule === "R") &&
      cites.every((cite) => Number.isInteger(cite) && cite >= 1)
    ) {
      return { kind: "rule", rule, cites };
    }
  }
  if (
    /^[\d,\s]*$/.test(text) ||
    /^(PR\s*\d*|ASS( CD| ID)?|C|CD|I|ID|D|DD|R|M|MP|MT|N|DN)$/.test(text) ||
    /^SHOW(\s+C(O(N(C)?)?)?)?$/.test(text) ||
    /^[\d,\s]+(D|DD|C|CD|I|ID)?$/.test(text)
  ) {
    return { kind: "partial" };
  }
  if (/^[\d,\s]+(M|N|D|R|P)?$/.test(text)) return { kind: "partial" };
  return { kind: "invalid" };
}

type Token =
  | { kind: "atom"; name: string }
  | { kind: "not" }
  | { kind: "arrow" }
  | { kind: "lparen" }
  | { kind: "rparen" };

function tokenize(input: string): Token[] | string {
  let tokens: Token[] = [];
  let cursor = 0;
  while (cursor < input.length) {
    let char = input[cursor] ?? "";
    if (/\s/.test(char)) {
      cursor += 1;
      continue;
    }
    if (/[A-Za-z]/.test(char)) {
      tokens.push({ kind: "atom", name: char.toUpperCase() });
      cursor += 1;
      continue;
    }
    if (char === "~" || char === "¬") {
      tokens.push({ kind: "not" });
      cursor += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ kind: "lparen" });
      cursor += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ kind: "rparen" });
      cursor += 1;
      continue;
    }
    if (char === "→" || char === "⊃" || input.slice(cursor, cursor + 2) === "->") {
      tokens.push({ kind: "arrow" });
      cursor += char === "-" ? 2 : 1;
      continue;
    }
    return `Unexpected "${char}".`;
  }
  return tokens;
}

function splitPremises(input: string): string[] {
  let pieces: string[] = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < input.length; index += 1) {
    let char = input[index];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "." && depth === 0) {
      pieces.push(input.slice(start, index));
      start = index + 1;
    }
  }
  pieces.push(input.slice(start));
  return pieces;
}
