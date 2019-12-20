import ArrayValue from '../dataTypes/ArrayValue';
import ISequence from '../dataTypes/ISequence';
import isSubtypeOf from '../dataTypes/isSubtypeOf';
import MapValue from '../dataTypes/MapValue';
import EmptySequence from '../dataTypes/Sequences/EmptySequence';
import DynamicContext from '../DynamicContext';
import ExecutionParameters from '../ExecutionParameters';
import Expression from '../Expression';
import concatSequences from '../util/concatSequences';
import createDoublyIterableSequence from '../util/createDoublyIterableSequence';

function performLookup (contextItem, lookup, previousSequence) {
	const sequences = [previousSequence];
	let lookupValue;
	let isInteger = false;

	switch (typeof lookup) {
		case 'number':
			lookupValue = lookup;
			isInteger = Number.isInteger(lookup);
			break;
		case 'object':
			lookupValue = lookup.value;
			isInteger = lookup.type === 'xs:integer';
			break;
		default:
			lookupValue = lookup;
	}

	if (isSubtypeOf(contextItem.type, 'array(*)')) {
		if (lookupValue !== '*' && !isInteger) {
			throw new Error('XPTY0004: The key specifier is not an integer.');
		}
		const arrayItem = contextItem as ArrayValue;
		if (arrayItem.members.length < lookupValue || 0 >= lookupValue) {
			throw new Error('FOAY0001: No item at specified index.');
		}
		for (let i = 0; i < arrayItem.members.length; i++) {
			if (lookupValue - 1 === i || lookupValue === '*') {
				const member = arrayItem.members[i];
				sequences.push(member());
				if (lookupValue !== '*') {
					break;
				}
			}
		}
	} else if (isSubtypeOf(contextItem.type, 'map(*)')) {
		const mapItem = contextItem as MapValue;
		for (let i = 0; i < mapItem.keyValuePairs.length; i++) {
			const keyValuePair = mapItem.keyValuePairs[i];
			if (lookupValue === keyValuePair.key.value || lookupValue === '*') {
				if (!keyValuePair) {
					continue;
				}
				const member = keyValuePair.value;
				if (!member) {
					continue;
				}
				sequences.push(member());
				if (lookupValue !== '*') {
					break;
				}
			}
		}
	} else {
		throw new Error('XPTY0004: The provided context item is not a map or an array.');
	}
	return concatSequences(sequences);
}

export default function evaluateLookup(
	contextItem,
	keySpecifier: string | number | Expression,
	initialSequence:ISequence,
	dynamicContext:DynamicContext,
	executionParameters:ExecutionParameters
	) {
	const keyType = typeof keySpecifier as string;
	let createLookupSequence;

	if (keyType !== 'string' && keyType !== 'number') {
		const lookupSequence = (keySpecifier as Expression)
		.evaluateMaybeStatically(dynamicContext, executionParameters);
		createLookupSequence = createDoublyIterableSequence(lookupSequence);
	}

	switch (keyType) {
		case 'number':
		case 'string':
			return performLookup(contextItem, keySpecifier, initialSequence);
		default:
			const deepSequence =  createLookupSequence().mapAll(lookups =>
				lookups.reduce(
					(sequenceToReturn, lookup) => {
						return performLookup(contextItem, lookup, sequenceToReturn);
					}, new EmptySequence())
			);
			return concatSequences([initialSequence, deepSequence]);
	}
}