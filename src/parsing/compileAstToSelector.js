import PathSelector from '../selectors/path/PathSelector';
import ForExpression from '../selectors/ForExpression';
import MapConstructor from '../selectors/maps/MapConstructor';
import ArrayConstructor from '../selectors/arrays/ArrayConstructor';
import AbsolutePathSelector from '../selectors/path/AbsolutePathSelector';
import Filter from '../selectors/postfix/Filter';
import AttributeAxis from '../selectors/axes/AttributeAxis';
import AncestorAxis from '../selectors/axes/AncestorAxis';
import ChildAxis from '../selectors/axes/ChildAxis';
import DescendantAxis from '../selectors/axes/DescendantAxis';
import FollowingSiblingAxis from '../selectors/axes/FollowingSiblingAxis';
import ParentAxis from '../selectors/axes/ParentAxis';
import PrecedingSiblingAxis from '../selectors/axes/PrecedingSiblingAxis';
import SelfSelector from '../selectors/axes/SelfAxis';
import NameTest from '../selectors/tests/NameTest';
import KindTest from '../selectors/tests/KindTest';
import PITest from '../selectors/tests/PITest';
import TypeTest from '../selectors/tests/TypeTest';
import FunctionCall from '../selectors/functions/FunctionCall';
import InlineFunction from '../selectors/functions/InlineFunction';
import AndOperator from '../selectors/operators/boolean/AndOperator';
import OrOperator from '../selectors/operators/boolean/OrOperator';
import UniversalSelector from '../selectors/operators/UniversalSelector';
import Union from '../selectors/operators/Union';
import IntersectExcept from '../selectors/operators/IntersectExcept';
import SequenceOperator from '../selectors/operators/SequenceOperator';
import SimpleMapOperator from '../selectors/operators/SimpleMapOperator';
import Unary from '../selectors/operators/numeric/Unary';
import BinaryNumericOperator from '../selectors/operators/numeric/BinaryNumericOperator';
import Compare from '../selectors/operators/compares/Compare';
import InstanceOfOperator from '../selectors/operators/types/InstanceOfOperator';
import CastAsOperator from '../selectors/operators/types/CastAsOperator';
import CastableAsOperator from '../selectors/operators/types/CastableAsOperator';
import QuantifiedExpression from '../selectors/quantified/QuantifiedExpression';
import IfExpression from '../selectors/conditional/IfExpression';
import Literal from '../selectors/literals/Literal';
import LetExpression from '../selectors/LetExpression';
import NamedFunctionRef from '../selectors/NamedFunctionRef';
import VarRef from '../selectors/VarRef';

import DirElementConstructor from '../selectors/xquery/DirElementConstructor';
import DirCommentConstructor from '../selectors/xquery/DirCommentConstructor';

import Selector from '../selectors/Selector';

const precompiledAstFragmentsByString = Object.create(null);

// Basic and incomplete implementation of single steps as defined in XPATH 1.0 (http://www.w3.org/TR/xpath/)
// Only single steps are allowed, because that's what selectors offer. Anyway: all paths have synonyms as (nested) predicates.
// Missing:
//  * various functions, such as:
//    * last()
//    * first()
//    * position()
//    * name()
//  * operators, such as >, <, *, +, | and =, unless in the context of attributes
//  * variables
/**
 * @param  {!Array<?>}  ast
 * @return {!Selector}
 */
function compile (ast) {
	const stringifiedAstFragment = JSON.stringify(ast);
	let compiledAstFragment = precompiledAstFragmentsByString[stringifiedAstFragment];

	if (!compiledAstFragment) {
		const args = ast.slice(1);
		switch (ast[0]) {
				// Operators
			case 'and':
				compiledAstFragment = and(args);
				break;
			case 'or':
				compiledAstFragment = or(args);
				break;
			case 'compare':
				compiledAstFragment = compare(args);
				break;
			case 'unaryPlus':
				compiledAstFragment = unaryPlus(args);
				break;
			case 'unaryMinus':
				compiledAstFragment = unaryMinus(args);
				break;
			case 'binaryOperator':
				compiledAstFragment = binaryOperator(args);
				break;
			case 'sequence':
				compiledAstFragment = sequence(args);
				break;
			case 'union':
				compiledAstFragment = union(args);
				break;
			case 'intersectExcept':
				compiledAstFragment = intersectExcept(args);
				break;

				// Tests
			case 'nameTest':
				compiledAstFragment = nameTest(args);
				break;
			case 'kindTest':
				compiledAstFragment = kindTest(args);
				break;
			case 'typeTest':
				compiledAstFragment = typeTest(args);
				break;

				// Axes
			case 'ancestor':
				compiledAstFragment = ancestor(args);
				break;
			case 'ancestor-or-self':
				compiledAstFragment = ancestorOrSelf(args);
				break;
			case 'attribute':
				compiledAstFragment = attribute(args);
				break;
			case 'child':
				compiledAstFragment = child(args);
				break;
			case 'descendant':
				compiledAstFragment = descendant(args);
				break;
			case 'descendant-or-self':
				compiledAstFragment = descendantOrSelf(args);
				break;
			case 'parent':
				compiledAstFragment = parent(args);
				break;
			case 'following-sibling':
				compiledAstFragment = followingSibling(args);
				break;
			case 'preceding-sibling':
				compiledAstFragment = precedingSibling(args);
				break;
			case 'self':
				compiledAstFragment = self(args);
				break;

				// Path
			case 'absolutePath':
				compiledAstFragment = absolutePath(args);
				break;
			case 'path':
				compiledAstFragment = path(args);
				break;

				// Postfix operators
			case 'filter':
				compiledAstFragment = filter(args);
				break;

				// Functions
			case 'functionCall':
				compiledAstFragment = functionCall(args);
				break;
			case 'inlineFunction':
				compiledAstFragment = inlineFunction(args);
				break;

			case 'literal':
				compiledAstFragment = literal(args);
				break;

				// Variables
			case 'let':
				compiledAstFragment = letExpression(args);
				break;
			case 'varRef':
				compiledAstFragment = varRef(args);
				break;
			case 'namedFunctionRef':
				compiledAstFragment = namedFunctionRef(args);
				break;
			case 'forExpression':
				compiledAstFragment = forExpression(args);
				break;

				// Quantified
			case 'quantified':
				compiledAstFragment = quantified(args);
				break;

				// Conditional
			case 'conditional':
				compiledAstFragment = conditional(args);
				break;

			case 'instance of':
				compiledAstFragment = instanceOf(args);
				break;
			case 'cast as':
				compiledAstFragment = castAs(args);
				break;
			case 'castable as':
				compiledAstFragment = castableAs(args);
				break;

			case 'simpleMap':
				compiledAstFragment = simpleMap(args);
				break;

			case 'mapConstructor':
				compiledAstFragment = mapConstructor(args);
				break;

			case 'arrayConstructor':
				compiledAstFragment = arrayConstructor(args);
				break;

				// XQuery element constructors
			case 'DirElementConstructor':
				compiledAstFragment = dirElementConstructor(args);
				break;

			case 'DirCommentConstructor':
				compiledAstFragment = dirCommentConstructor(args);
				break;

			default:
				throw new Error('No selector counterpart for: ' + ast[0] + '.');
		}
		precompiledAstFragmentsByString[stringifiedAstFragment] = compiledAstFragment;
	}
	return compiledAstFragment;
}

function arrayConstructor (args) {
	return new ArrayConstructor(args[0], args.slice(1).map(compile));
}

function mapConstructor (args) {
	return new MapConstructor(args.map(function (keyValuePair) {
		return {
			key: compile(keyValuePair[0]),
			value: compile(keyValuePair[1])
		};
	}));
}

function absolutePath (args) {
	return new AbsolutePathSelector(compile(args[0]));
}

function ancestor (args) {
	return new AncestorAxis(compile(args[0]));
}

function ancestorOrSelf (args) {
	const subSelector = compile(args[0]);
	return new AncestorAxis(subSelector, { inclusive: true });
}

function and (args) {
	return new AndOperator(args.map(compile));
}

function attribute (args) {
	return new AttributeAxis(compile(args[0]));
}

function binaryOperator (args) {
	const kind = args[0];
	const a = compile(args[1]);
	const b = compile(args[2]);

	return new BinaryNumericOperator(kind, a, b);
}

function child (args) {
	return new ChildAxis(compile(args[0]));
}

function descendant (args) {
	return new DescendantAxis(compile(args[0]));
}

function descendantOrSelf (args) {
	const subSelector = compile(args[0]);
	return new DescendantAxis(subSelector, { inclusive: true });
}

function castAs (args) {
	const expression = compile(args[0]);
	const [[prefix, namespaceURI, name], multiplicity] = args[1];

	return new CastAsOperator(expression, { prefix, namespaceURI, name }, multiplicity);
}

function castableAs (args) {
	const expression = compile(args[0]);
	const [[prefix, namespaceURI, name], multiplicity] = args[1];

	return new CastableAsOperator(expression, { prefix, namespaceURI, name }, multiplicity);
}

// Binary compare (=, !=, le, is, etc)
function compare (args) {
	return new Compare(args[0], compile(args[1]), compile(args[2]));
}

function conditional (args) {
	return new IfExpression(compile(args[0]), compile(args[1]), compile(args[2]));
}

function filter (args) {
	return new Filter(compile(args[0]), compile(args[1]));
}

function followingSibling (args) {
	return new FollowingSiblingAxis(compile(args[0]));
}

function forExpression ([[prefix, namespaceURI, name], expression, returnExpression]) {
	return new ForExpression(
		{
			varName: { prefix, namespaceURI, name },
			expression: compile(expression)
		},
		compile(returnExpression));
}

function functionCall (args) {
	return new FunctionCall(compile(args[0]), args[1].map(arg => arg === 'argumentPlaceholder' ? null : compile(arg)));
}

function inlineFunction (args) {
	const [params, returnType, body] = args;
	return new InlineFunction(
		params.map(([[prefix, namespaceURI, name], type]) => ([{ prefix, namespaceURI, name }, type])),
		returnType,
		compile(body));
}

function instanceOf (args) {
	const expression = compile(args[0]);
	const sequenceType = args[1];

	return new InstanceOfOperator(expression, compile(sequenceType[0]), sequenceType[1] || '');
}

function letExpression (args) {
	const [prefix, namespaceURI, name] = args[0];
	const bindingSequence = compile(args[1]);
	const returnExpression = compile(args[2]);

	return new LetExpression({ prefix, namespaceURI, name }, bindingSequence, returnExpression);
}

function literal (args) {
	return new Literal(args[0], args[1]);
}

function namedFunctionRef (args) {
	const [[prefix, namespaceURI, name], arity] = args;
	return new NamedFunctionRef({ prefix, namespaceURI, name }, arity);
}

function nameTest (args) {
	const [prefix, namespaceURI, localName] = args[0];
	return new NameTest(prefix, namespaceURI, localName);
}

function kindTest (args) {
	switch (args[0]) {
		case 'item()':
			return new UniversalSelector();
		case 'node()':
			return new TypeTest(null, null, 'node()');
		case 'element()':
			if (args.length === 2) {
				return new NameTest(args[1][0], args[1][1], args[1][2], { kind: 1 });
			}

			if (args.length > 2) {
				throw new Error('element() with more than 1 argument is not supported.');
			}

			return new KindTest(1);
		case 'text()':
			return new KindTest(3);
		case 'processing-instruction()':
			if (args.length > 1) {
				return new PITest(args[1]);
			}
			return new KindTest(7);
		case 'comment()':
			return new KindTest(8);
		case 'document-node()':
			return new KindTest(9);
		case 'attribute()':
			if (args.length === 2) {
				return new NameTest(args[1][0], args[1][1], args[1][2], { kind: 2 });
			}

			if (args.length > 2) {
				throw new Error('attribute() with more than 1 argument is not supported.');
			}

			return new KindTest(2);
		default:
			throw new Error('Unrecognized nodeType: ' + args[0]);
	}
}

function or (args) {
	return new OrOperator(args.map(compile));
}

function parent (args) {
	return new ParentAxis(compile(args[0]));
}

function path (args) {
	return new PathSelector(args.map(compile));
}

function precedingSibling (args) {
	return new PrecedingSiblingAxis(compile(args[0]));
}

function quantified (args) {
	const inClauses = args[1].map(([[prefix, namespaceURI, name], expression]) => {
		return [{ prefix, namespaceURI, name }, compile(expression)];
	});
	return new QuantifiedExpression(args[0], inClauses, compile(args[2]));
}

function self (args) {
	return new SelfSelector(compile(args[0]));
}

function sequence (args) {
	return new SequenceOperator(args.map(compile));
}

function simpleMap (args) {
	return new SimpleMapOperator(compile(args[0]), compile(args[1]));
}

function typeTest (args) {
	const [prefix, namespaceURI, name] = args[0];
	return new TypeTest(prefix, namespaceURI, name);
}

function unaryPlus (args) {
	return new Unary('+', compile(args[0]));
}

function unaryMinus (args) {
	return new Unary('-', compile(args[0]));
}

function union (args) {
	return new Union(args.map(compile));
}

function intersectExcept (args) {
	return new IntersectExcept(args[0], compile(args[1]), compile(args[2]));
}

function varRef (args) {
	const [prefix, namespaceURI, name] = args[0];
	return new VarRef(prefix, namespaceURI, name);
}


// XQuery Node constructors
function dirElementConstructor (args) {
	const [[prefix, name], closingQName, attList, contents] = args;
	if (closingQName) {
		// Throw a parsing error if the closingName does not match up
		const [closingPrefix, closingName] = closingQName;

		if (prefix !== closingPrefix || name !== closingName) {
			throw new Error('XQST0118: The start and the end tag of an element constructor must be equal');
		}
	}

	return new DirElementConstructor(
		prefix,
		name,
		attList.map(([name, val]) => ({
			name: name,
			partialValues: val.map(partialValue => {
				if (typeof partialValue === 'string') {
					return partialValue;
				}
				return compile(partialValue);
			})
		})),
		contents.map(content => {
			if (typeof content === 'string') {
				return compile(['literal', content, 'xs:string']);
			}
			return compile(content);
		}));
}

function dirCommentConstructor (args) {
	return new DirCommentConstructor(args[0]);
}

/**
 * @param   {!Array<?>}  xPathAst
 * @return  {!Selector}
 */
export default function parseSelectorAsync (xPathAst) {
    return compile(xPathAst);
}
