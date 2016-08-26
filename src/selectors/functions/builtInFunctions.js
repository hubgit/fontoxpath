define([
	'fontoxml-blueprints',

	'../dataTypes/Sequence',
	'../dataTypes/BooleanValue',
	'../dataTypes/StringValue',
	'../dataTypes/IntegerValue',
	'../dataTypes/DoubleValue'
], function (
	blueprints,

	Sequence,
	BooleanValue,
	StringValue,
	IntegerValue,
	DoubleValue
) {
	'use strict';

	var blueprintQuery = blueprints.blueprintQuery;

	function fnNot (dynamicContext, sequence) {
		return Sequence.singleton(new BooleanValue(!sequence.getEffectiveBooleanValue()));
	}

	function fnTrue () {
		return Sequence.singleton(new BooleanValue(true));
	}

	function fnFalse () {
		return Sequence.singleton(new BooleanValue(false));
	}

	function fnCount (dynamicContext, sequence) {
		return Sequence.singleton(new IntegerValue(sequence.value.length));
	}

	function fnPosition (dynamicContext) {
		// Note: +1 because XPath is one-based
		return Sequence.singleton(new IntegerValue(dynamicContext.contextSequence.value.indexOf(dynamicContext.contextItem.value[0]) + 1));
	}

	function fnLast (dynamicContext) {
		return Sequence.singleton(new IntegerValue(dynamicContext.contextSequence.value.length));
	}

	function opTo (dynamicContext, fromValue, toValue) {
		var from = fromValue.value[0].value,
		to = toValue.value[0].value;

		if (from > to) {
			return Sequence.empty();
		}

		// RangeExpr is inclusive: 1 to 3 will make (1,2,3)
		return new Sequence(
			Array.apply(null, {length: to - from + 1})
				.map(function (_, i) {
					return new IntegerValue(from+i);
				}));
	}

	function fnConcat (dynamicContext) {
		var stringSequences = Array.from(arguments).slice(1);
		if (!stringSequences.length) {
			throw new Error('No such function fn:concat(). Did your mean concat($a as xs:anyAtomicValue, $a as xs:anyAtomicValue, ...)?');
		}

		stringSequences = stringSequences.map(function (sequence) { return sequence.atomize(); });
		var strings = stringSequences.map(function (sequence) {
				return sequence.value[0].value;
			});

		// RangeExpr is inclusive: 1 to 3 will make (1,2,3)
		return Sequence.singleton(new StringValue(strings.join('')));
	}

	function fnBoolean (dynamicContext, sequence) {
		return Sequence.singleton(new BooleanValue(sequence.getEffectiveBooleanValue()));
	}

	function fnString (dynamicContext, sequence) {
		if (sequence.isEmpty()) {
			return Sequence.singleton(new StringValue(''));
		}

		if (sequence.value[0].instanceOfType('node()')) {
			return Sequence.singleton(new StringValue(blueprintQuery.getTextContent(dynamicContext.domFacade, sequence.value[0])));
		}

		return Sequence.singleton(StringValue.cast(sequence.value[0]));
	}

	function fnNormalizeSpace (dynamicContext, arg) {
		if (arg.isEmpty()) {
			return Sequence.singleton(new StringValue(''));
		}
		var string = arg.value[0].value;
		return Sequence.singleton(new StringValue(string.replace(/\s\s/g, ' ')));
	}

	function fnTokenize (dynamicContext, input, pattern, flags) {
		if (input.isEmpty() || input.value[0].value.length === 0) {
			return new Sequence([]);
		}

		var string = input.value[0].value,
			patternString = pattern.value[0].value;

		return new Sequence(
			string.split(new RegExp(patternString))
				.map(function (token) {return new StringValue(token);}));
	}

	function fnStringLength (dynamicContext, sequence) {
		if (sequence.isSingleton()) {
			return Sequence.singleton(new IntegerValue(0));
		}

		// In ES6, Array.from(💩).length === 1
		return Sequence.singleton(new IntegerValue(Array.from(sequence.value[0].value).length));
	}

	function fnNumber (dynamicContext, sequence) {
		if (sequence.isEmpty()) {
			return Sequence.singleton(new DoubleValue(NaN));
		}

		return Sequence.singleton(DoubleValue.cast(sequence.value[0]));
	}

	function fontoMarkupLabel (dynamicContext, sequence) {
		if (sequence.isEmpty()) {
			return sequence;
		}
		return Sequence.singleton(new StringValue(sequence.value[0].value.nodeName));
	}

	function contextItemAsFirstArgument (fn, dynamicContext) {
		return fn(dynamicContext, dynamicContext.contextItem);
	}

	return [
		{
			name: 'not',
			typeDescription: ['item()*'],
			callFunction: fnNot
		},
		{
			name: 'true',
			typeDescription: [],
			callFunction: fnTrue
		},
		{
			name: 'false',
			typeDescription: [],
			callFunction: fnFalse
		},
		{
			name: 'count',
			typeDescription: ['item()*'],
			callFunction: fnCount
		},
		{
			name: 'position',
			typeDescription: [],
			callFunction: fnPosition
		},
		{
			name: 'last',
			typeDescription: [],
			callFunction: fnLast
		},
		{
			name: 'op:to',
			typeDescription: ['xs:integer', 'xs:integer'],
			callFunction: opTo
		},
		{
			name: 'concat',
			typeDescription: ['xs:anyAtomicType?', 'xs:anyAtomicType?', '...'],
			callFunction: fnConcat
		},
		{
			name: 'boolean',
			typeDescription: ['item()*'],
			callFunction: fnBoolean
		},
		{
			name: 'string',
			typeDescription: [],
			callFunction: contextItemAsFirstArgument.bind(undefined, fnString)
		},
		{
			name: 'string',
			typeDescription: ['item()?'],
			callFunction: fnString
		},
		{
			name: 'normalize-space',
			typeDescription: [],
			callFunction: function (dynamicContext) {
				return fnNormalizeSpace(dynamicContext, fnString(dynamicContext, dyanmicContext.contextItem));
			}
		},
		{
			name: 'normalize-space',
			typeDescription: ['xs:string?'],
			callFunction: fnNormalizeSpace
		},
		{
			name: 'tokenize',
			typeDescription: ['xs:string?'],
			callFunction: function (dynamicContext, input) {
				return fnTokenize(dynamicContext, fnNormalizeSpace(dynamicContext, input), Sequence.singleton(new StringValue(' ')));
			}
		},
		{
			name: 'tokenize',
			typeDescription: ['xs:string?', 'xs:string'],
			callFunction: fnTokenize
		},
		{
			name: 'tokenize',
			typeDescription: ['xs:string?', 'xs:string', 'xs:string'],
			callFunction: function (dynamicContext, input, pattern, flags) {
				throw new Error('Using flags in tokenize is not supported');
			}
		},
		{
			name: 'string-length',
			typeDescription: [],
			callFunction: contextItemAsFirstArgument.bind(undefined, fnStringLength)
		},
		{
			name: 'string-length',
			typeDescription: ['string()?'],
			callFunction: fnStringLength
		},
		{
			name: 'number',
			typeDescription: [],
			callFunction: contextItemAsFirstArgument.bind(undefined, fnNumber)
		},
		{
			name: 'number',
			typeDescription: ['xs:anyAtomicType?'],
			callFunction: fnNumber
		},
		{
			name: 'fonto:markupLabel',
			typeDescription: [],
			callFunction: fontoMarkupLabel
		}
	];
});