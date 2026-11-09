/**
 * Display form for sentence logic. Conditionals associate to the right,
 * conjunction binds tighter than disjunction, and both bind tighter than
 * the conditional and the biconditional. Every binary compound is wrapped
 * so the grouping is visible.
 */

type Wff =
  | { kind: "atom"; name: string }
  | { kind: "not"; of: Wff }
  | { kind: "and" | "or" | "if" | "iff"; left: Wff; right: Wff };

type Token =
  | { kind: "not" }
  | { kind: "and" }
  | { kind: "or" }
  | { kind: "if" }
  | { kind: "iff" }
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "atom"; name: string };

const OPS: Record<Exclude<Wff, { kind: "atom" | "not" }>["kind"], string> = {
  and: "&",
  or: "|",
  if: "→",
  iff: "↔",
};

function tokenize(input: string): Token[] | null {
  let tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    let ch = input[i] ?? "";
    if (ch === " " || ch === "\t") {
      i += 1;
      continue;
    }
    if (ch === "~" || ch === "¬") {
      tokens.push({ kind: "not" });
      i += 1;
      continue;
    }
    if (ch === "&" || ch === "∧") {
      tokens.push({ kind: "and" });
      i += 1;
      continue;
    }
    if (ch === "|" || ch === "∨") {
      tokens.push({ kind: "or" });
      i += 1;
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "lparen" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen" });
      i += 1;
      continue;
    }
    if (ch === "↔" || input.startsWith("<->", i) || input.startsWith("<=>", i)) {
      tokens.push({ kind: "iff" });
      i += ch === "↔" ? 1 : 3;
      continue;
    }
    if (ch === "→" || input.startsWith("->", i) || input.startsWith("=>", i)) {
      tokens.push({ kind: "if" });
      i += ch === "→" ? 1 : 2;
      continue;
    }
    if (/[A-Z]/.test(ch)) {
      tokens.push({ kind: "atom", name: ch });
      i += 1;
      continue;
    }
    return null;
  }
  return tokens;
}

function parseWff(input: string): Wff | null {
  let tokens = tokenize(input);
  if (!tokens) return null;
  let index = 0;

  function peek() {
    return tokens?.[index];
  }

  function eat(kind: Token["kind"]) {
    if (peek()?.kind === kind) {
      index += 1;
      return true;
    }
    return false;
  }

  function parseIff(): Wff | null {
    let left = parseIf();
    if (!left || !eat("iff")) return left;
    let right = parseIf();
    if (!right || peek()?.kind === "iff") return null;
    return { kind: "iff", left, right };
  }

  function parseIf(): Wff | null {
    let left = parseOr();
    if (!left || !eat("if")) return left;
    let right = parseIf();
    if (!right) return null;
    return { kind: "if", left, right };
  }

  function parseOr(): Wff | null {
    let left = parseAnd();
    if (!left) return null;
    while (eat("or")) {
      let right = parseAnd();
      if (!right) return null;
      left = { kind: "or", left, right };
    }
    return left;
  }

  function parseAnd(): Wff | null {
    let left = parseNot();
    if (!left) return null;
    while (eat("and")) {
      let right = parseNot();
      if (!right) return null;
      left = { kind: "and", left, right };
    }
    return left;
  }

  function parseNot(): Wff | null {
    if (eat("not")) {
      let of = parseNot();
      if (!of) return null;
      return { kind: "not", of };
    }
    if (eat("lparen")) {
      let inner = parseIff();
      if (!inner || !eat("rparen")) return null;
      return inner;
    }
    let token = peek();
    if (token?.kind === "atom") {
      index += 1;
      return { kind: "atom", name: token.name };
    }
    return null;
  }

  let formula = parseIff();
  if (!formula || index !== tokens.length) return null;
  return formula;
}

export function formatWff(formula: Wff): string {
  switch (formula.kind) {
    case "atom":
      return formula.name;
    case "not":
      return `~${formatWff(formula.of)}`;
    default:
      return `(${formatWff(formula.left)}${OPS[formula.kind]}${formatWff(formula.right)})`;
  }
}

/** One formula, or premises separated by "." with a conclusion after ".:". */
export function formatLogicStatement(input: string): string {
  let therefore = input.split(".:");
  if (therefore.length > 2) return input;
  let conclusionText = therefore.length === 2 ? therefore[1] : undefined;
  let premiseText = therefore[0] ?? "";
  let pieces = conclusionText === undefined ? [input] : premiseText.split(".");
  let formatted: string[] = [];
  for (let piece of pieces) {
    if (piece.trim() === "") continue;
    let formula = parseWff(piece);
    if (!formula) return input;
    formatted.push(formatWff(formula));
  }
  if (conclusionText === undefined) return formatted[0] ?? input;
  let conclusion = parseWff(conclusionText);
  if (!conclusion) return input;
  let premises = formatted.join(". ");
  return premises === "" ? `∴ ${formatWff(conclusion)}` : `${premises} ∴ ${formatWff(conclusion)}`;
}
