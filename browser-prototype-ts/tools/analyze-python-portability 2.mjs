import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(projectRoot, 'src/game/direct/GradiusNeoGame.ts');
const sourceText = fs.readFileSync(sourcePath, 'utf8');
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const findings = {
  compoundIntegerDivision: [],
  complexForLoops: [],
  valueProducingMutation: [],
};

function location(node) {
  const start = source.getLineAndCharacterOfPosition(node.getStart(source));
  return {
    line: start.line + 1,
    source: node.getText(source).replaceAll(/\s+/g, ' ').slice(0, 180),
  };
}

function isSimpleRangeLoop(node) {
  if (!node.initializer || !ts.isVariableDeclarationList(node.initializer)) return false;
  if (node.initializer.declarations.length !== 1 || !node.condition || !node.incrementor) return false;
  const declaration = node.initializer.declarations[0];
  if (!ts.isIdentifier(declaration.name) || !declaration.initializer) return false;
  if (!ts.isBinaryExpression(node.condition)) return false;
  if (!ts.isPostfixUnaryExpression(node.incrementor) && !ts.isPrefixUnaryExpression(node.incrementor)) return false;
  return ts.isIdentifier(node.incrementor.operand) && node.incrementor.operand.text === declaration.name.text;
}

function visit(node) {
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.SlashEqualsToken
  ) {
    findings.compoundIntegerDivision.push(location(node));
  }

  if (ts.isForStatement(node) && !isSimpleRangeLoop(node)) {
    findings.complexForLoops.push(location(node));
  }

  if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    if (
      node.operator === ts.SyntaxKind.PlusPlusToken ||
      node.operator === ts.SyntaxKind.MinusMinusToken
    ) {
      const isStandalone = ts.isExpressionStatement(node.parent);
      const isForIncrement = ts.isForStatement(node.parent) && node.parent.incrementor === node;
      if (!isStandalone && !isForIncrement) findings.valueProducingMutation.push(location(node));
    }
  }

  ts.forEachChild(node, visit);
}

visit(source);

const summary = Object.fromEntries(Object.entries(findings).map(([name, entries]) => [name, entries.length]));
console.log(JSON.stringify({ source: path.relative(projectRoot, sourcePath), summary, findings }, null, 2));

