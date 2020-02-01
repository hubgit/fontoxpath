import ArrayValue from './ArrayValue';
import createAtomicValue from './createAtomicValue';
import isSubtypeOf from './isSubtypeOf';

import ExecutionParameters from '../ExecutionParameters';
import AtomicValue from './AtomicValue';
import sequenceFactory from './sequenceFactory';
import Value from './Value';

const TEXT_NODE = 3;

export default function atomize(
	value: Value,
	executionParameters: ExecutionParameters
): AtomicValue {
	if (
		isSubtypeOf(value.type, 'xs:anyAtomicType') ||
		isSubtypeOf(value.type, 'xs:untypedAtomic') ||
		isSubtypeOf(value.type, 'xs:boolean') ||
		isSubtypeOf(value.type, 'xs:decimal') ||
		isSubtypeOf(value.type, 'xs:double') ||
		isSubtypeOf(value.type, 'xs:float') ||
		isSubtypeOf(value.type, 'xs:integer') ||
		isSubtypeOf(value.type, 'xs:numeric') ||
		isSubtypeOf(value.type, 'xs:QName') ||
		isSubtypeOf(value.type, 'xs:string')
	) {
		return value;
	}

	if (isSubtypeOf(value.type, 'node()')) {
		const /** Node */ node = value.value;

		// TODO: Mix in types, by default get string value
		if (isSubtypeOf(value.type, 'attribute()')) {
			return createAtomicValue(node.value, 'xs:untypedAtomic');
		}

		// Text nodes and documents should return their text, as untyped atomic
		if (isSubtypeOf(value.type, 'text()')) {
			return createAtomicValue(
				executionParameters.domFacade.getData(node),
				'xs:untypedAtomic'
			);
		}
		// comments and PIs are string
		if (
			isSubtypeOf(value.type, 'comment()') ||
			isSubtypeOf(value.type, 'processing-instruction()')
		) {
			return createAtomicValue(executionParameters.domFacade.getData(node), 'xs:string');
		}

		// This is an element or a document node. Because we do not know the specific type of this element.
		// Documents should always be an untypedAtomic, of elements, we do not know the type, so they are untypedAtomic too
		const allTextNodes = [];
		(function getTextNodes(aNode) {
			if (aNode.nodeType === TEXT_NODE || aNode.nodeType === 4) {
				allTextNodes.push(aNode);
				return;
			}
			executionParameters.domFacade.getChildNodes(aNode, null).forEach(function(childNode) {
				getTextNodes(childNode);
			});
		})(node);

		return createAtomicValue(
			allTextNodes
				.map(textNode => {
					return executionParameters.domFacade.getData(textNode);
				})
				.join(''),
			'xs:untypedAtomic'
		);
	}

	// array
	if (isSubtypeOf(value.type, 'array(*)')) {
		const arrayValue = value.value as ArrayValue;

		// recursively atomize the members of the array
		const atomizedArray: any[] = (arrayValue.members || []).map(child =>
			child()
				.getAllValues()
				.map(childValue => atomize(childValue, executionParameters))
		);

		// flatten the array
		const flattenedArray = atomizedArray.flat(Infinity);

		// turn the array into a sequence
		const sequence = sequenceFactory.create(flattenedArray);

		return createAtomicValue(sequence, 'xs:untypedAtomic');
	}

	// (function || map)
	if (isSubtypeOf(value.type, 'function(*)')) {
		throw new Error(`FOTY0013: Atomization is not supported for ${value.type}.`);
	}

	throw new Error(`Atomizing ${value.type} is not implemented.`);
}
