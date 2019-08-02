import atomize from '../dataTypes/atomize';
import castToType from '../dataTypes/castToType';
import createAtomicValue from '../dataTypes/createAtomicValue';
import ISequence from '../dataTypes/ISequence';
import isSubtypeOf from '../dataTypes/isSubtypeOf';
import sequenceFactory from '../dataTypes/sequenceFactory';
import { FUNCTIONS_NAMESPACE_URI } from '../staticallyKnownNamespaces';
import { DONE_TOKEN, ready } from '../util/iterators';
import zipSingleton from '../util/zipSingleton';
import builtInNumericFunctions from './builtInFunctions.numeric';
import FunctionDefinitionType from './FunctionDefinitionType';

const fnRound = builtInNumericFunctions.functions.round;

function collationError() {
	throw new Error('FOCH0002: No collations are supported');
}

function contextItemAsFirstArgument(fn, dynamicContext, executionParameters, _staticContext) {
	if (dynamicContext.contextItem === null) {
		throw new Error(
			'XPDY0002: The function which was called depends on dynamic context, which is absent.'
		);
	}
	return fn(
		dynamicContext,
		executionParameters,
		_staticContext,
		sequenceFactory.singleton(dynamicContext.contextItem)
	);
}

const fnCompare: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	arg1,
	arg2
) {
	if (arg1.isEmpty() || arg2.isEmpty()) {
		return sequenceFactory.empty();
	}

	const arg1Value = arg1.first().value,
		arg2Value = arg2.first().value;

	if (arg1Value > arg2Value) {
		return sequenceFactory.singleton(createAtomicValue(1, 'xs:integer'));
	}

	if (arg1Value < arg2Value) {
		return sequenceFactory.singleton(createAtomicValue(-1, 'xs:integer'));
	}

	return sequenceFactory.singleton(createAtomicValue(0, 'xs:integer'));
};

const fnConcat: FunctionDefinitionType = function(
	_dynamicContext,
	executionParameters,
	_staticContext
) {
	let stringSequences = Array.from(arguments).slice(3);
	stringSequences = stringSequences.map(function(sequence) {
		return sequence.atomize(executionParameters);
	});
	return zipSingleton(stringSequences, function(stringValues) {
		return sequenceFactory.singleton(
			createAtomicValue(
				stringValues
					.map(stringValue =>
						stringValue === null ? '' : castToType(stringValue, 'xs:string').value
					)
					.join(''),
				'xs:string'
			)
		);
	});
};

const fnContains: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	arg1,
	arg2
) {
	const stringToTest = !arg1.isEmpty() ? arg1.first().value : '';
	const contains = !arg2.isEmpty() ? arg2.first().value : '';
	if (contains.length === 0) {
		return sequenceFactory.singletonTrueSequence();
	}

	if (stringToTest.length === 0) {
		return sequenceFactory.singletonFalseSequence();
	}

	// TODO: choose a collation, this defines whether eszett (ß) should equal 'ss'
	if (stringToTest.includes(contains)) {
		return sequenceFactory.singletonTrueSequence();
	}
	return sequenceFactory.singletonFalseSequence();
};

const fnStartsWith: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	arg1,
	arg2
) {
	const startsWith = !arg2.isEmpty() ? arg2.first().value : '';
	if (startsWith.length === 0) {
		return sequenceFactory.singletonTrueSequence();
	}
	const stringToTest = !arg1.isEmpty() ? arg1.first().value : '';
	if (stringToTest.length === 0) {
		return sequenceFactory.singletonFalseSequence();
	}
	// TODO: choose a collation, this defines whether eszett (ß) should equal 'ss'
	if (stringToTest.startsWith(startsWith)) {
		return sequenceFactory.singletonTrueSequence();
	}
	return sequenceFactory.singletonFalseSequence();
};

const fnEndsWith: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	arg1,
	arg2
) {
	const endsWith = !arg2.isEmpty() ? arg2.first().value : '';
	if (endsWith.length === 0) {
		return sequenceFactory.singletonTrueSequence();
	}
	const stringToTest = !arg1.isEmpty() ? arg1.first().value : '';
	if (stringToTest.length === 0) {
		return sequenceFactory.singletonFalseSequence();
	}
	// TODO: choose a collation, this defines whether eszett (ß) should equal 'ss'
	if (stringToTest.endsWith(endsWith)) {
		return sequenceFactory.singletonTrueSequence();
	}
	return sequenceFactory.singletonFalseSequence();
};

const fnString: FunctionDefinitionType = function(
	_dynamicContext,
	executionParameters,
	_staticContext,
	sequence
) {
	return sequence.switchCases({
		empty: () => sequenceFactory.singleton(createAtomicValue('', 'xs:string')),
		default: () =>
			sequence.map(value => {
				if (isSubtypeOf(value.type, 'node()')) {
					const stringValue = atomize(value, executionParameters);
					if (isSubtypeOf(value.type, 'attribute()')) {
						return castToType(stringValue, 'xs:string');
					}
					return stringValue;
				}
				return castToType(value, 'xs:string');
			})
	});
};

const fnStringJoin: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	sequence,
	separator
) {
	return zipSingleton([separator], ([separatorString]) =>
		sequence.mapAll(allStrings => {
			const joinedString = allStrings
				.map(stringValue => castToType(stringValue, 'xs:string').value)
				.join(separatorString.value);
			return sequenceFactory.singleton(createAtomicValue(joinedString, 'xs:string'));
		})
	);
};

const fnStringLength: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	sequence
) {
	if (sequence.isEmpty()) {
		return sequenceFactory.singleton(createAtomicValue(0, 'xs:integer'));
	}
	const stringValue = sequence.first().value;
	// In ES6, Array.from(💩).length === 1
	return sequenceFactory.singleton(
		createAtomicValue(Array.from(stringValue).length, 'xs:integer')
	);
};

const fnSubstringBefore: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	arg1,
	arg2
) {
	let strArg1;
	if (arg1.isEmpty()) {
		strArg1 = '';
	} else {
		strArg1 = arg1.first().value;
	}
	let strArg2;
	if (arg2.isEmpty()) {
		strArg2 = '';
	} else {
		strArg2 = arg2.first().value;
	}

	if (strArg2 === '') {
		return sequenceFactory.singleton(createAtomicValue('', 'xs:string'));
	}
	const startIndex = strArg1.indexOf(strArg2);
	if (startIndex === -1) {
		return sequenceFactory.singleton(createAtomicValue('', 'xs:string'));
	}
	return sequenceFactory.singleton(
		createAtomicValue(strArg1.substring(0, startIndex), 'xs:string')
	);
};

const fnSubstringAfter: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	arg1,
	arg2
) {
	let strArg1;
	if (arg1.isEmpty()) {
		strArg1 = '';
	} else {
		strArg1 = arg1.first().value;
	}
	let strArg2;
	if (arg2.isEmpty()) {
		strArg2 = '';
	} else {
		strArg2 = arg2.first().value;
	}

	if (strArg2 === '') {
		return sequenceFactory.singleton(createAtomicValue(strArg1, 'xs:string'));
	}
	const startIndex = strArg1.indexOf(strArg2);
	if (startIndex === -1) {
		return sequenceFactory.singleton(createAtomicValue('', 'xs:string'));
	}
	return sequenceFactory.singleton(
		createAtomicValue(strArg1.substring(startIndex + strArg2.length), 'xs:string')
	);
};

const fnSubstring: FunctionDefinitionType = function(
	dynamicContext,
	executionParameters,
	staticContext,
	sourceString,
	start,
	length
) {
	const roundedStart = fnRound(
		false,
		dynamicContext,
		executionParameters,
		staticContext,
		start,
		null
	);
	const roundedLength =
		length !== null
			? fnRound(false, dynamicContext, executionParameters, staticContext, length, null)
			: null;

	let done = false;
	let sourceStringItem = null;
	let startItem = null;
	let lengthItem = null;
	return sequenceFactory.create({
		next: () => {
			if (done) {
				return DONE_TOKEN;
			}
			if (!sourceStringItem) {
				sourceStringItem = sourceString.tryGetFirst();
				if (!sourceStringItem.ready) {
					sourceStringItem = null;
					return sourceStringItem;
				}

				if (sourceStringItem.value === null) {
					// The first argument can be the empty sequence
					done = true;
					return ready(createAtomicValue('', 'xs:string'));
				}
			}

			if (!startItem) {
				startItem = roundedStart.tryGetFirst();
				if (!startItem.ready) {
					const toReturn = startItem;
					startItem = null;
					return toReturn;
				}
			}

			if (!lengthItem && length) {
				lengthItem = null;
				lengthItem = roundedLength.tryGetFirst();
				if (!lengthItem.ready) {
					const toReturn = lengthItem;
					lengthItem = null;
					return toReturn;
				}
			}

			done = true;

			const strValue = sourceStringItem.value.value;
			return ready(
				createAtomicValue(
					Array.from(strValue)
						.slice(
							Math.max(startItem.value.value - 1, 0),
							length ? startItem.value.value + lengthItem.value.value - 1 : undefined
						)
						.join(''),
					'xs:string'
				)
			);
		}
	});
};

const fnTokenize: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	input,
	pattern
) {
	if (input.isEmpty() || input.first().value.length === 0) {
		return sequenceFactory.empty();
	}
	const string = input.first().value,
		patternString = pattern.first().value;
	return sequenceFactory.create(
		string.split(new RegExp(patternString)).map(function(token) {
			return createAtomicValue(token, 'xs:string');
		})
	);
};

const fnUpperCase: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	stringSequence
) {
	if (stringSequence.isEmpty()) {
		return sequenceFactory.singleton(createAtomicValue('', 'xs:string'));
	}
	return stringSequence.map(string => createAtomicValue(string.value.toUpperCase(), 'xs:string'));
};

const fnLowerCase: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	stringSequence
) {
	if (stringSequence.isEmpty()) {
		return sequenceFactory.singleton(createAtomicValue('', 'xs:string'));
	}
	return stringSequence.map(string => createAtomicValue(string.value.toLowerCase(), 'xs:string'));
};

const fnNormalizeSpace: FunctionDefinitionType = function(
	_dynamicContext,
	_executionParameters,
	_staticContext,
	arg
) {
	if (arg.isEmpty()) {
		return sequenceFactory.singleton(createAtomicValue('', 'xs:string'));
	}
	const string = arg.first().value.trim();
	return sequenceFactory.singleton(createAtomicValue(string.replace(/\s+/g, ' '), 'xs:string'));
};

const fnTranslate: FunctionDefinitionType = (
	_dynamicContext,
	_executionParameters,
	_staticContext,
	argSequence,
	mapStringSequence,
	transStringSequence
) => {
	return zipSingleton(
		[argSequence, mapStringSequence, transStringSequence],
		([argValue, mapStringSequenceValue, transStringSequenceValue]) => {
			const argArr = Array.from(argValue ? argValue.value : '');
			const mapStringArr = Array.from(mapStringSequenceValue.value);
			const transStringArr = Array.from(transStringSequenceValue.value);

			const result = argArr.map(letter => {
				if (mapStringArr.includes(letter)) {
					const index = mapStringArr.indexOf(letter);
					if (index <= transStringArr.length) {
						return transStringArr[index];
					}
				} else {
					return letter;
				}
			});
			return sequenceFactory.singleton(createAtomicValue(result.join(''), 'xs:string'));
		}
	);
};

const fnCodepointsToString: FunctionDefinitionType = (
	_dynamicContext,
	_executionParameters,
	_staticContext,
	numberSequence: ISequence
) => {
	return numberSequence.mapAll(numbers => {
		const str = numbers
			.map(num => {
				const numericValue: number = num.value;
				if (
					numericValue === 0x9 ||
					numericValue === 0xa ||
					numericValue === 0xd ||
					(numericValue >= 0x20 && numericValue <= 0xd7ff) ||
					(numericValue >= 0xe000 && numericValue <= 0xfffd) ||
					(numericValue >= 0x10000 && numericValue <= 0x10ffff)
				) {
					return String.fromCodePoint(numericValue);
				} else {
					throw new Error('FOCH0001');
				}
			})
			.join('');
		return sequenceFactory.singleton(createAtomicValue(str, 'xs:string'));
	});
};

const fnStringToCodepoints: FunctionDefinitionType = (
	_dynamicContext,
	_executionParameters,
	_staticContext,
	stringSequence: ISequence
) => {
	return zipSingleton([stringSequence], ([str]) => {
		const characters = str ? (str.value as string).split('') : [];
		if (characters.length === 0) {
			return sequenceFactory.empty();
		}

		return sequenceFactory.create(
			characters.map(character => createAtomicValue(character.codePointAt(0), 'xs:integer'))
		);
	});
};

const fnCodepointEqual: FunctionDefinitionType = (
	_dynamicContext,
	_executionParameters,
	_staticContext,
	stringSequence1: ISequence,
	stringSequence2: ISequence
) => {
	return zipSingleton([stringSequence1, stringSequence2], ([value1, value2]) => {
		if (value1 === null || value2 === null) {
			return sequenceFactory.empty();
		}

		const string1: string = value1.value;
		const string2: string = value2.value;

		if (string1.length !== string2.length) {
			return sequenceFactory.singletonFalseSequence();
		}
		const string1Characters = string1.split('');
		const string2Characters = string2.split('');

		for (let i = 0; i < string1Characters.length; i++) {
			if (string1Characters[i].codePointAt(0) !== string2Characters[i].codePointAt(0)) {
				return sequenceFactory.singletonFalseSequence();
			}
		}

		return sequenceFactory.singletonTrueSequence();
	});
};

export default {
	declarations: [
		{
			argumentTypes: ['xs:string?', 'xs:string?'],
			callFunction: fnCompare,
			localName: 'compare',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:integer?',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?', 'xs:string'],
			callFunction: collationError,
			localName: 'compare',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:integer?',
		},

		{
			argumentTypes: ['xs:anyAtomicType?', 'xs:anyAtomicType?', '...'],
			callFunction: fnConcat,
			localName: 'concat',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?', 'xs:string?'],
			callFunction: collationError,
			localName: 'contains',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:boolean',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?'],
			callFunction: fnContains,
			localName: 'contains',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:boolean',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?'],
			callFunction: fnEndsWith,
			localName: 'ends-with',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:boolean',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?', 'xs:string'],
			callFunction: collationError,
			localName: 'ends-with',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:boolean',
		},

		{
			argumentTypes: ['xs:string?'],
			callFunction: fnNormalizeSpace,
			localName: 'normalize-space',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: [],
			callFunction: contextItemAsFirstArgument.bind(
				null,
				(dynamicContext, executionParameters, staticContext, contextItem) =>
					fnNormalizeSpace(
						dynamicContext,
						executionParameters,
						staticContext,
						fnString(dynamicContext, executionParameters, staticContext, contextItem)
					)
			),
			localName: 'normalize-space',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?'],
			callFunction: fnStartsWith,
			localName: 'starts-with',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:boolean',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?', 'xs:string'],
			callFunction: collationError,
			localName: 'starts-with',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:boolean',
		},

		{
			argumentTypes: ['item()?'],
			callFunction: fnString,
			localName: 'string',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: [],
			callFunction: contextItemAsFirstArgument.bind(null, fnString),
			localName: 'string',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?'],
			callFunction: fnSubstringBefore,
			localName: 'substring-before',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?'],
			callFunction: fnSubstringAfter,
			localName: 'substring-after',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:anyAtomicType*', 'xs:string'],
			callFunction: fnStringJoin,
			localName: 'string-join',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?', 'xs:double'],
			callFunction: fnSubstring,
			localName: 'substring',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?', 'xs:double', 'xs:double'],
			callFunction: fnSubstring,
			localName: 'substring',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?'],
			callFunction: fnUpperCase,
			localName: 'upper-case',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?'],
			callFunction: fnLowerCase,
			localName: 'lower-case',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string*'],
			callFunction(dynamicContext, executionParameters, staticContext, arg1) {
				return fnStringJoin(
					dynamicContext,
					executionParameters,
					staticContext,
					arg1,
					sequenceFactory.singleton(createAtomicValue('', 'xs:string'))
				);
			},
			localName: 'string-join',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string',
		},

		{
			argumentTypes: ['xs:string?'],
			callFunction: fnStringLength,
			localName: 'string-length',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:integer',
		},

		{
			argumentTypes: [],
			callFunction: contextItemAsFirstArgument.bind(
				null,
				(dynamicContext, executionParameters, staticContext, contextItem) =>
					fnStringLength(
						dynamicContext,
						executionParameters,
						staticContext,
						fnString(dynamicContext, executionParameters, staticContext, contextItem)
					)
			),
			localName: 'string-length',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:integer',
		},

		{
			callFunction(
				_dynamicContext,
				_executionParameters,
				_staticContext,
				_input,
				_pattern,
				_flags
			) {
				throw new Error('Not implemented: Using flags in tokenize is not supported');
			},
			argumentTypes: ['xs:string?', 'xs:string', 'xs:string'],
			localName: 'tokenize',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string*',
		},

		{
			argumentTypes: ['xs:string?', 'xs:string'],
			localName: 'tokenize',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string*',
			callFunction: fnTokenize
		},

		{
			argumentTypes: ['xs:string?'],
			localName: 'tokenize',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string*',
			callFunction(dynamicContext, executionParameters, staticContext, input) {
				return fnTokenize(
					dynamicContext,
					executionParameters,
					staticContext,
					fnNormalizeSpace(dynamicContext, executionParameters, staticContext, input),
					sequenceFactory.singleton(createAtomicValue(' ', 'xs:string'))
				);
			}
		},

		{
			argumentTypes: ['xs:string?', 'xs:string', 'xs:string'],
			callFunction: fnTranslate,
			localName: 'translate',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string'
		},

		{
			argumentTypes: ['xs:integer*'],
			callFunction: fnCodepointsToString,
			localName: 'codepoints-to-string',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:string'
		},

		{
			argumentTypes: ['xs:string?'],
			callFunction: fnStringToCodepoints,
			localName: 'string-to-codepoints',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:integer*'
		},

		{
			argumentTypes: ['xs:string?', 'xs:string?'],
			callFunction: fnCodepointEqual,
			localName: 'codepoint-equal',
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			returnType: 'xs:boolean?'
		}
	],
	functions: {
		concat: fnConcat,
		endsWith: fnEndsWith,
		normalizeSpace: fnNormalizeSpace,
		startsWith: fnStartsWith,
		string: fnString,
		stringJoin: fnStringJoin,
		stringLength: fnStringLength,
		tokenize: fnTokenize
	}
};
