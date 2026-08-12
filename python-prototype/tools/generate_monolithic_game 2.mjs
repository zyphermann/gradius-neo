import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import ts from '../../browser-prototype-ts/node_modules/typescript/lib/typescript.js';

const projectRoot = path.resolve(import.meta.dirname, '..');
const repositoryRoot = path.resolve(projectRoot, '..');
const sourceRelativePath = process.argv[2] ?? 'browser-prototype-ts/src/game/direct/GradiusNeoGame.ts';
const outputRelativePath = process.argv[3] ?? 'src/gradius_neo/monolithic_generated.py';
const sourcePath = path.resolve(repositoryRoot, sourceRelativePath);
const outputPath = path.resolve(projectRoot, outputRelativePath);
const sourceText = fs.readFileSync(sourcePath, 'utf8');
const sourceHash = crypto.createHash('sha256').update(sourceText).digest('hex');
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

let indent = 0;
const output = [];
const unsupported = new Map();
const breakContexts = [];
let loweredSwitchFallthroughs = 0;

function line(text = '') {
  output.push(text === '' ? '' : `${'    '.repeat(indent)}${text}`);
}

function withIndent(callback) {
  indent++;
  callback();
  indent--;
}

function sourceOf(node) {
  return node.getText(source).replaceAll('\n', ' ').replaceAll(/\s+/g, ' ').slice(0, 180);
}

function todo(kind, node) {
  unsupported.set(kind, (unsupported.get(kind) ?? 0) + 1);
  return `todo_expr(${JSON.stringify(kind)}, ${JSON.stringify(sourceOf(node))})`;
}

function nameOf(node) {
  if (!node) return 'unnamed';
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) return node.text;
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return String(node.text);
  return sourceOf(node).replaceAll(/\W+/g, '_');
}

function isStatic(node) {
  return node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ?? false;
}

function isSyntacticStringExpression(node) {
  if (!node) return false;
  if (ts.isStringLiteralLike(node) || ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return true;
  }
  if (ts.isParenthesizedExpression(node)) return isSyntacticStringExpression(node.expression);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return isSyntacticStringExpression(node.left) || isSyntacticStringExpression(node.right);
  }
  return false;
}

const binaryOperators = new Map([
  [ts.SyntaxKind.PlusToken, '+'], [ts.SyntaxKind.MinusToken, '-'],
  [ts.SyntaxKind.AsteriskToken, '*'], [ts.SyntaxKind.SlashToken, '/'],
  [ts.SyntaxKind.PercentToken, '%'], [ts.SyntaxKind.LessThanToken, '<'],
  [ts.SyntaxKind.LessThanEqualsToken, '<='], [ts.SyntaxKind.GreaterThanToken, '>'],
  [ts.SyntaxKind.GreaterThanEqualsToken, '>='], [ts.SyntaxKind.EqualsEqualsToken, '=='],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, '=='], [ts.SyntaxKind.ExclamationEqualsToken, '!='],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, '!='], [ts.SyntaxKind.AmpersandToken, '&'],
  [ts.SyntaxKind.BarToken, '|'], [ts.SyntaxKind.CaretToken, '^'],
  [ts.SyntaxKind.LessThanLessThanToken, '<<'], [ts.SyntaxKind.GreaterThanGreaterThanToken, '>>'],
  [ts.SyntaxKind.AmpersandAmpersandToken, 'and'], [ts.SyntaxKind.BarBarToken, 'or'],
  [ts.SyntaxKind.QuestionQuestionToken, 'if_not_none'], [ts.SyntaxKind.InstanceOfKeyword, 'instanceof'],
]);

const assignmentOperators = new Map([
  [ts.SyntaxKind.EqualsToken, '='], [ts.SyntaxKind.PlusEqualsToken, '+='],
  [ts.SyntaxKind.MinusEqualsToken, '-='], [ts.SyntaxKind.AsteriskEqualsToken, '*='],
  [ts.SyntaxKind.SlashEqualsToken, '/='], [ts.SyntaxKind.PercentEqualsToken, '%='],
]);

function expr(node) {
  if (!node) return 'None';
  if (ts.isIdentifier(node)) {
    if (node.text === 'undefined') return 'None';
    return node.text;
  }
  if (node.kind === ts.SyntaxKind.ThisKeyword) return 'self';
  if (node.kind === ts.SyntaxKind.SuperKeyword) return 'super()';
  if (node.kind === ts.SyntaxKind.NullKeyword) return 'None';
  if (node.kind === ts.SyntaxKind.TrueKeyword) return 'True';
  if (node.kind === ts.SyntaxKind.FalseKeyword) return 'False';
  if (ts.isNumericLiteral(node)) return node.text;
  if (ts.isBigIntLiteral(node)) return node.text.replace(/n$/, '');
  if (ts.isStringLiteralLike(node)) return JSON.stringify(node.text);
  if (ts.isParenthesizedExpression(node)) return `(${expr(node.expression)})`;
  if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node)) {
    return expr(node.expression);
  }
  if (ts.isPropertyAccessExpression(node)) {
    const target = expr(node.expression);
    if (node.name.text === 'length') return `len(${target})`;
    if (node.name.text === 'message') return `str(${target})`;
    if (node.questionDotToken) return `(${target}.${node.name.text} if ${target} is not None else None)`;
    return `${target}.${node.name.text}`;
  }
  if (ts.isElementAccessExpression(node)) return `${expr(node.expression)}[${expr(node.argumentExpression)}]`;
  if (ts.isArrayLiteralExpression(node)) return `[${node.elements.map(expr).join(', ')}]`;
  if (ts.isObjectLiteralExpression(node)) {
    const properties = node.properties.map((property) => {
      if (ts.isPropertyAssignment(property)) return `${JSON.stringify(nameOf(property.name))}: ${expr(property.initializer)}`;
      if (ts.isShorthandPropertyAssignment(property)) return `${JSON.stringify(property.name.text)}: ${property.name.text}`;
      return `${JSON.stringify('TODO')}: ${todo(ts.SyntaxKind[property.kind], property)}`;
    });
    return `{${properties.join(', ')}}`;
  }
  if (ts.isSpreadElement(node)) return `*${expr(node.expression)}`;
  if (ts.isConditionalExpression(node)) return `(${expr(node.whenTrue)} if ${expr(node.condition)} else ${expr(node.whenFalse)})`;
  if (ts.isPrefixUnaryExpression(node)) {
    if (node.operator === ts.SyntaxKind.ExclamationToken) return `(not ${expr(node.operand)})`;
    if (node.operator === ts.SyntaxKind.MinusToken) return `(-${expr(node.operand)})`;
    if (node.operator === ts.SyntaxKind.PlusToken) return `(+${expr(node.operand)})`;
    if (node.operator === ts.SyntaxKind.TildeToken) return `(~${expr(node.operand)})`;
    if (node.operator === ts.SyntaxKind.PlusPlusToken) return mutationExpression(node.operand, 1, false);
    if (node.operator === ts.SyntaxKind.MinusMinusToken) return mutationExpression(node.operand, -1, false);
  }
  if (ts.isPostfixUnaryExpression(node)) {
    return mutationExpression(node.operand, node.operator === ts.SyntaxKind.PlusPlusToken ? 1 : -1, true);
  }
  if (ts.isBinaryExpression(node)) {
    const operatorKind = node.operatorToken.kind;
    if (operatorKind === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken) {
      return `unsigned_right_shift(${expr(node.left)}, ${expr(node.right)})`;
    }
    if (operatorKind === ts.SyntaxKind.QuestionQuestionToken) {
      const left = expr(node.left);
      return `(${left} if ${left} is not None else ${expr(node.right)})`;
    }
    if (operatorKind === ts.SyntaxKind.InstanceOfKeyword) {
      return `isinstance(${expr(node.left)}, ${expr(node.right)})`;
    }
    if (assignmentOperators.has(operatorKind)) return assignmentExpression(node);
    if (operatorKind === ts.SyntaxKind.SlashToken) {
      const sourceText = sourceOf(node);
      if (sourceText.includes('RENDER_SCALE') || sourceText.includes('SPRITE_SHEET_SCALE')) {
        return `(${expr(node.left)} / ${expr(node.right)})`;
      }
      return `int_div(${expr(node.left)}, ${expr(node.right)})`;
    }
    if (operatorKind === ts.SyntaxKind.AmpersandToken) {
      return `to_int(to_int(${expr(node.left)}) & to_int(${expr(node.right)}))`;
    }
    if (operatorKind === ts.SyntaxKind.BarToken) {
      return `to_int(to_int(${expr(node.left)}) | to_int(${expr(node.right)}))`;
    }
    if (operatorKind === ts.SyntaxKind.CaretToken) {
      return `to_int(to_int(${expr(node.left)}) ^ to_int(${expr(node.right)}))`;
    }
    if (operatorKind === ts.SyntaxKind.LessThanLessThanToken) {
      return `to_int(to_int(${expr(node.left)}) << (to_int(${expr(node.right)}) & 31))`;
    }
    if (operatorKind === ts.SyntaxKind.GreaterThanGreaterThanToken) {
      return `(to_int(${expr(node.left)}) >> (to_int(${expr(node.right)}) & 31))`;
    }
    if (operatorKind === ts.SyntaxKind.PlusToken && isSyntacticStringExpression(node)) {
      return `(str(${expr(node.left)}) + str(${expr(node.right)}))`;
    }
    const operator = binaryOperators.get(operatorKind);
    if (operator) return `(${expr(node.left)} ${operator} ${expr(node.right)})`;
    return todo(`Binary:${ts.SyntaxKind[operatorKind]}`, node);
  }
  if (ts.isCallExpression(node)) return callExpression(node);
  if (ts.isNewExpression(node)) return newExpression(node);
  if (ts.isArrowFunction(node)) {
    const parameters = node.parameters
      .map((parameter) => `${parameter.dotDotDotToken ? '*' : ''}${nameOf(parameter.name)}`)
      .join(', ');
    return ts.isBlock(node.body)
      ? todo('ArrowFunctionBlock', node)
      : `(lambda ${parameters}: ${expr(node.body)})`;
  }
  if (ts.isTemplateExpression(node)) {
    let result = JSON.stringify(node.head.text);
    for (const span of node.templateSpans) result += ` + str(${expr(span.expression)}) + ${JSON.stringify(span.literal.text)}`;
    return `(${result})`;
  }
  return todo(ts.SyntaxKind[node.kind], node);
}

function mutationExpression(target, delta, postfix) {
  if (ts.isIdentifier(target)) {
    return postfix
      ? `(${target.text}, (${target.text} := ${target.text} + (${delta})))[0]`
      : `(${target.text} := ${target.text} + (${delta}))`;
  }
  if (ts.isElementAccessExpression(target)) {
    return `_mutate_item(${expr(target.expression)}, ${expr(target.argumentExpression)}, ${delta}, ${postfix ? 'True' : 'False'})`;
  }
  if (ts.isPropertyAccessExpression(target)) {
    return `_mutate_attr(${expr(target.expression)}, ${JSON.stringify(target.name.text)}, ${delta}, ${postfix ? 'True' : 'False'})`;
  }
  return todo('MutationTarget', target);
}

function assignmentExpression(node) {
  const operator = assignmentOperators.get(node.operatorToken.kind);
  if (operator !== '=') {
    const right = expr(node.right);
    const operation = operator === '/='
      ? (current) => `int_div(${current}, ${right})`
      : (current) => `(${current} ${operator.slice(0, -1)} ${right})`;
    if (ts.isIdentifier(node.left)) {
      return `(${node.left.text} := ${operation(node.left.text)})`;
    }
    if (ts.isElementAccessExpression(node.left)) {
      const owner = expr(node.left.expression);
      const index = expr(node.left.argumentExpression);
      return `_set_item(${owner}, ${index}, ${operation(`${owner}[${index}]`)})`;
    }
    if (ts.isPropertyAccessExpression(node.left)) {
      const owner = expr(node.left.expression);
      const attribute = node.left.name.text;
      return `_set_attr(${owner}, ${JSON.stringify(attribute)}, ${operation(`${owner}.${attribute}`)})`;
    }
    return todo('CompoundAssignmentTarget', node.left);
  }
  if (ts.isIdentifier(node.left)) return `(${node.left.text} := ${expr(node.right)})`;
  if (ts.isElementAccessExpression(node.left)) {
    return `_set_item(${expr(node.left.expression)}, ${expr(node.left.argumentExpression)}, ${expr(node.right)})`;
  }
  if (ts.isPropertyAccessExpression(node.left)) {
    return `_set_attr(${expr(node.left.expression)}, ${JSON.stringify(node.left.name.text)}, ${expr(node.right)})`;
  }
  return todo('AssignmentTarget', node.left);
}

function callExpression(node) {
  if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
    return `super().__init__(${node.arguments.map(expr).join(', ')})`;
  }
  if (ts.isPropertyAccessExpression(node.expression)) {
    const owner = expr(node.expression.expression);
    const method = node.expression.name.text;
    const args = node.arguments.map(expr);
    if (owner === 'Math' && method === 'trunc') return `int(${args[0]})`;
    if (owner === 'Math' && method === 'max') return `max(${args.join(', ')})`;
    if (owner === 'Math' && method === 'min') return `min(${args.join(', ')})`;
    if (owner === 'Math' && method === 'abs') return `abs(${args[0]})`;
    if (owner === 'Math' && method === 'floor') return `math.floor(${args[0]})`;
    if (method === 'charCodeAt') return `ord(${owner}[${args[0]}])`;
    if (method === 'substring') return `${owner}[${args[0]}:${args[1] ?? ''}]`;
    if (method === 'fill') return `_fill(${owner}, ${args[0] ?? 'None'})`;
    if (method === 'push') return `${owner}.append(${args.join(', ')})`;
    if (method === 'yield') return `getattr(${owner}, "yield")(${args.join(', ')})`;
    return `${owner}.${method}(${args.join(', ')})`;
  }
  const callee = expr(node.expression);
  const args = node.arguments.map(expr);
  if (callee === 'Number' || callee === 'BigInt') return `int(${args[0] ?? 0})`;
  if (callee === 'intDiv') return `int_div(${args.join(', ')})`;
  if (callee === 'toByte') return `to_byte(${args.join(', ')})`;
  if (callee === 'toShort') return `to_short(${args.join(', ')})`;
  if (callee === 'toInt') return `to_int(${args.join(', ')})`;
  return `${callee}(${args.join(', ')})`;
}

function newExpression(node) {
  const constructor = expr(node.expression);
  const args = (node.arguments ?? []).map(expr);
  if (['Int8Array', 'Uint8Array', 'Int16Array', 'Int32Array', 'BigInt64Array'].includes(constructor)) {
    if (node.arguments?.length === 1 && ts.isArrayLiteralExpression(node.arguments[0])) return expr(node.arguments[0]);
    return `[0] * (${args[0] ?? 0})`;
  }
  if (constructor === 'Array') return `[None] * (${args[0] ?? 0})`;
  return `${constructor}(${args.join(', ')})`;
}

function emitAssignmentStatement(expression) {
  const node = expression;
  const operator = assignmentOperators.get(node.operatorToken.kind);
  const left = expr(node.left);
  if (operator === '/=') line(`${left} = int_div(${left}, ${expr(node.right)})`);
  else line(`${left} ${operator} ${expr(node.right)}`);
}

function emitStatement(node) {
  if (ts.isBlock(node)) {
    if (node.statements.length === 0) line('pass');
    else node.statements.forEach(emitStatement);
    return;
  }
  if (ts.isExpressionStatement(node)) {
    if (ts.isBinaryExpression(node.expression) && assignmentOperators.has(node.expression.operatorToken.kind)) {
      emitAssignmentStatement(node.expression);
    } else if (ts.isPostfixUnaryExpression(node.expression) || ts.isPrefixUnaryExpression(node.expression)) {
      const operand = expr(node.expression.operand);
      const plus = node.expression.operator === ts.SyntaxKind.PlusPlusToken;
      line(`${operand} ${plus ? '+=' : '-='} 1`);
    } else line(expr(node.expression));
    return;
  }
  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      line(`${nameOf(declaration.name)} = ${declaration.initializer ? expr(declaration.initializer) : 'None'}`);
    }
    return;
  }
  if (ts.isIfStatement(node)) {
    line(`if ${expr(node.expression)}:`);
    withIndent(() => emitStatement(node.thenStatement));
    if (node.elseStatement) {
      line('else:');
      withIndent(() => emitStatement(node.elseStatement));
    }
    return;
  }
  if (ts.isWhileStatement(node)) {
    line(`while ${expr(node.expression)}:`);
    breakContexts.push('loop');
    withIndent(() => emitStatement(node.statement));
    breakContexts.pop();
    return;
  }
  if (ts.isDoStatement(node)) {
    line('while True:');
    breakContexts.push('loop');
    withIndent(() => {
      emitStatement(node.statement);
      line(`if not (${expr(node.expression)}):`);
      withIndent(() => line('break'));
    });
    breakContexts.pop();
    return;
  }
  if (ts.isForStatement(node)) {
    emitForStatement(node);
    return;
  }
  if (ts.isForOfStatement(node)) {
    const declaration = node.initializer.declarations?.[0];
    const variable = declaration ? nameOf(declaration.name) : expr(node.initializer);
    line(`for ${variable} in ${expr(node.expression)}:`);
    breakContexts.push('loop');
    withIndent(() => emitStatement(node.statement));
    breakContexts.pop();
    return;
  }
  if (ts.isSwitchStatement(node)) {
    emitSwitchStatement(node);
    return;
  }
  if (ts.isReturnStatement(node)) {
    line(node.expression ? `return ${expr(node.expression)}` : 'return');
    return;
  }
  if (ts.isBreakStatement(node)) {
    line(breakContexts.at(-1) === 'switch' ? 'raise _SwitchBreak()' : 'break');
    return;
  }
  if (ts.isContinueStatement(node)) {
    line('continue');
    return;
  }
  if (ts.isThrowStatement(node)) {
    line(`raise ${expr(node.expression)}`);
    return;
  }
  if (ts.isTryStatement(node)) {
    line('try:');
    withIndent(() => emitStatement(node.tryBlock));
    if (node.catchClause) {
      const variable = node.catchClause.variableDeclaration ? nameOf(node.catchClause.variableDeclaration.name) : 'error';
      line(`except Exception as ${variable}:`);
      withIndent(() => emitStatement(node.catchClause.block));
    }
    if (node.finallyBlock) {
      line('finally:');
      withIndent(() => emitStatement(node.finallyBlock));
    }
    return;
  }
  if (ts.isEmptyStatement(node)) {
    line('pass');
    return;
  }
  line(`todo_statement(${JSON.stringify(ts.SyntaxKind[node.kind])}, ${JSON.stringify(sourceOf(node))})`);
  unsupported.set(`Statement:${ts.SyntaxKind[node.kind]}`, (unsupported.get(`Statement:${ts.SyntaxKind[node.kind]}`) ?? 0) + 1);
}

function emitForStatement(node) {
  const declaration = node.initializer && ts.isVariableDeclarationList(node.initializer)
    ? node.initializer.declarations[0]
    : null;
  const increment = node.incrementor;
  const condition = node.condition;
  const isUnitIncrement = increment &&
    (ts.isPostfixUnaryExpression(increment) || ts.isPrefixUnaryExpression(increment)) &&
    (increment.operator === ts.SyntaxKind.PlusPlusToken || increment.operator === ts.SyntaxKind.MinusMinusToken);
  if (declaration && ts.isIdentifier(declaration.name) && condition && ts.isBinaryExpression(condition) && isUnitIncrement) {
    const variable = declaration.name.text;
    const start = expr(declaration.initializer);
    const conditionOperator = condition.operatorToken.kind;
    let stop = expr(condition.right);
    if (conditionOperator === ts.SyntaxKind.LessThanEqualsToken) stop = `(${stop}) + 1`;
    if (conditionOperator === ts.SyntaxKind.GreaterThanEqualsToken) stop = `(${stop}) - 1`;
    const descending = (ts.isPostfixUnaryExpression(increment) || ts.isPrefixUnaryExpression(increment)) &&
      increment.operator === ts.SyntaxKind.MinusMinusToken;
    if ([ts.SyntaxKind.LessThanToken, ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.GreaterThanEqualsToken].includes(conditionOperator)) {
      line(`for ${variable} in range(${start}, ${stop}${descending ? ', -1' : ''}):`);
      breakContexts.push('loop');
      withIndent(() => emitStatement(node.statement));
      breakContexts.pop();
      return;
    }
  }
  line(`# TODO-PORT general for-loop: ${sourceOf(node).replaceAll('#', '')}`);
  if (node.initializer) {
    if (ts.isVariableDeclarationList(node.initializer)) {
      for (const item of node.initializer.declarations) line(`${nameOf(item.name)} = ${expr(item.initializer)}`);
    } else line(expr(node.initializer));
  }
  line(`while ${condition ? expr(condition) : 'True'}:`);
  breakContexts.push('loop');
  withIndent(() => {
    emitStatement(node.statement);
    if (increment) line(expr(increment));
  });
  breakContexts.pop();
}

function statementAlwaysTerminates(node) {
  if (!node) return false;
  if (
    ts.isBreakStatement(node) ||
    ts.isReturnStatement(node) ||
    ts.isThrowStatement(node) ||
    ts.isContinueStatement(node)
  ) return true;
  if (ts.isBlock(node)) return statementAlwaysTerminates(node.statements.at(-1));
  if (ts.isIfStatement(node)) {
    return Boolean(
      node.elseStatement &&
      statementAlwaysTerminates(node.thenStatement) &&
      statementAlwaysTerminates(node.elseStatement),
    );
  }
  return false;
}

function clauseAlwaysTerminates(clause) {
  return statementAlwaysTerminates(clause.statements.at(-1));
}

function emitFollowingFallthroughClauses(originalClauses, clause) {
  let nextIndex = originalClauses.indexOf(clause) + 1;
  while (nextIndex < originalClauses.length) {
    const nextClause = originalClauses[nextIndex];
    if (nextClause.statements.length === 0) {
      nextIndex++;
      continue;
    }

    loweredSwitchFallthroughs++;
    line(`# TypeScript switch fallthrough into source clause ${nextIndex}`);
    nextClause.statements.forEach(emitStatement);
    if (clauseAlwaysTerminates(nextClause)) return;
    nextIndex++;
  }
}

function emitSwitchStatement(node) {
  line('try:');
  withIndent(() => {
    line(`match ${expr(node.expression)}:`);
    withIndent(() => {
      const originalClauses = [...node.caseBlock.clauses];
      const clauses = [
        ...originalClauses.filter((clause) => !ts.isDefaultClause(clause)),
        ...originalClauses.filter(ts.isDefaultClause),
      ];
      for (let index = 0; index < clauses.length; index++) {
        const labels = [];
        let clause = clauses[index];
        while (clause && clause.statements.length === 0 && ts.isCaseClause(clause)) {
          labels.push(expr(clause.expression));
          clause = clauses[++index];
        }
        if (!clause) break;
        if (ts.isCaseClause(clause)) labels.push(expr(clause.expression));
        line(ts.isDefaultClause(clause) ? 'case _:' : `case ${labels.join(' | ')}:`);
        breakContexts.push('switch');
        withIndent(() => {
          if (clause.statements.length === 0) line('pass');
          else clause.statements.forEach(emitStatement);
          if (clause.statements.length > 0 && !clauseAlwaysTerminates(clause)) {
            emitFollowingFallthroughClauses(originalClauses, clause);
          }
        });
        breakContexts.pop();
      }
    });
  });
  line('except _SwitchBreak:');
  withIndent(() => line('pass'));
}

function emitEnum(node) {
  line(`class ${nameOf(node.name)}(IntEnum):`);
  withIndent(() => {
    let nextValue = 0;
    for (const member of node.members) {
      const value = member.initializer ? expr(member.initializer) : String(nextValue);
      line(`${nameOf(member.name)} = ${value}`);
      if (member.initializer && ts.isNumericLiteral(member.initializer)) nextValue = Number(member.initializer.text) + 1;
      else nextValue++;
    }
  });
  line();
}

function emitFunction(node) {
  const parameters = node.parameters.map(parameterSignature).join(', ');
  line(`def ${nameOf(node.name)}(${parameters}):`);
  withIndent(() => emitStatement(node.body));
  line();
}

function parameterSignature(parameter) {
  const name = nameOf(parameter.name);
  if (parameter.initializer) return `${name}=${expr(parameter.initializer)}`;
  if (parameter.questionToken) return `${name}=None`;
  return name;
}

function emitClass(node) {
  const className = nameOf(node.name);
  const baseClasses = node.heritageClauses
    ?.filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
    .flatMap((clause) => clause.types.map((type) => expr(type.expression))) ?? [];
  const instanceProperties = node.members.filter(
    (member) => ts.isPropertyDeclaration(member) && !isStatic(member),
  );
  const staticProperties = node.members.filter(
    (member) => ts.isPropertyDeclaration(member) && isStatic(member),
  );
  line(`class ${className}${baseClasses.length ? `(${baseClasses.join(', ')})` : ''}:`);
  withIndent(() => {
    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member)) continue;
      if (ts.isConstructorDeclaration(member)) {
        const parameters = member.parameters.map(parameterSignature);
        line(`def __init__(self${parameters.length ? `, ${parameters.join(', ')}` : ''}):`);
        withIndent(() => {
          for (const parameter of member.parameters) {
            if ((parameter.modifiers?.length ?? 0) > 0) {
              const parameterName = nameOf(parameter.name);
              line(`self.${parameterName} = ${parameterName}`);
            }
          }
          for (const property of instanceProperties) {
            line(`self.${nameOf(property.name)} = ${property.initializer ? expr(property.initializer) : 'None'}`);
          }
          emitStatement(member.body);
        });
        line();
      } else if (ts.isMethodDeclaration(member)) {
        if (isStatic(member)) line('@staticmethod');
        const parameters = member.parameters.map(parameterSignature);
        const signature = isStatic(member) ? parameters.join(', ') : ['self', ...parameters].join(', ');
        line(`def ${nameOf(member.name)}(${signature}):`);
        withIndent(() => emitStatement(member.body));
        line();
      }
    }
  });
  for (const property of staticProperties) {
    line(`${className}.${nameOf(property.name)} = ${property.initializer ? expr(property.initializer) : 'None'}`);
  }
  if (staticProperties.length > 0) line();
}

line('"""Generated mechanically from GradiusNeoGame.ts. Do not edit by hand."""');
line(`SOURCE_SHA256 = ${JSON.stringify(sourceHash)}`);
line('import math');
line('from enum import IntEnum');
line('from gradius_neo.generated_runtime import *');
line('from gradius_neo.integer_math import int_div, to_byte, to_int, to_short, unsigned_right_shift');
line('RENDER_SCALE = 3 / 4');
line('SPRITE_SHEET_SCALE = 3 / 4');
line();
line('class _SwitchBreak(Exception):');
withIndent(() => line('pass'));
line();
line('def todo_expr(kind, source):');
withIndent(() => line('raise NotImplementedError(f"TODO-PORT expression {kind}: {source}")'));
line('def todo_statement(kind, source):');
withIndent(() => line('raise NotImplementedError(f"TODO-PORT statement {kind}: {source}")'));
line('def _set_item(container, index, value):');
withIndent(() => { line('container[index] = value'); line('return value'); });
line('def _set_attr(owner, name, value):');
withIndent(() => { line('setattr(owner, name, value)'); line('return value'); });
line('def _mutate_item(container, index, delta, postfix):');
withIndent(() => { line('old = container[index]'); line('container[index] = old + delta'); line('return old if postfix else container[index]'); });
line('def _mutate_attr(owner, name, delta, postfix):');
withIndent(() => { line('old = getattr(owner, name)'); line('setattr(owner, name, old + delta)'); line('return old if postfix else getattr(owner, name)'); });
line('def _fill(values, value):');
withIndent(() => { line('values[:] = [value] * len(values)'); line('return values'); });
line();

for (const statement of source.statements) {
  if (ts.isImportDeclaration(statement)) continue;
  if (ts.isEnumDeclaration(statement)) emitEnum(statement);
  else if (ts.isFunctionDeclaration(statement)) emitFunction(statement);
  else if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      line(`${nameOf(declaration.name)} = ${expr(declaration.initializer)}`);
    }
    line();
  } else if (ts.isClassDeclaration(statement)) emitClass(statement);
}

const stats = {
  source: path.relative(repositoryRoot, sourcePath),
  sourceSha256: sourceHash,
  outputLines: output.length,
  loweredSwitchFallthroughs,
  unsupported: Object.fromEntries([...unsupported].sort(([a], [b]) => a.localeCompare(b))),
};
line();
line(`GENERATOR_STATS = ${JSON.stringify(stats)}`);
fs.writeFileSync(outputPath, `${output.join('\n')}\n`);
console.log(JSON.stringify(stats, null, 2));
