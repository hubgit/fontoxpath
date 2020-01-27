import createAtomicValue from './createAtomicValue';
import isSubtypeOf from './isSubtypeOf';

import { NODE_TYPES } from 'fontoxpath/domFacade/ConcreteNode';
import DomFacade from '../../domFacade/DomFacade';
import ExecutionParameters from '../ExecutionParameters';
import AtomicValue from './AtomicValue';
import Value from './Value';

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

	const domFacade: DomFacade = executionParameters.domFacade;

	if (isSubtypeOf(value.type, 'node()')) {
		const /** Node */ pointer = value.value;

		// TODO: Mix in types, by default get string value
		if (isSubtypeOf(value.type, 'attribute()')) {
			return createAtomicValue(domFacade.getData(pointer), 'xs:untypedAtomic');
		}

		// Text nodes and documents should return their text, as untyped atomic
		if (isSubtypeOf(value.type, 'text()')) {
			return createAtomicValue(domFacade.getData(pointer), 'xs:untypedAtomic');
		}
		// comments and PIs are string
		if (
			isSubtypeOf(value.type, 'comment()') ||
			isSubtypeOf(value.type, 'processing-instruction()')
		) {
			return createAtomicValue(domFacade.getData(pointer), 'xs:string');
		}

		// This is an element or a document node. Because we do not know the specific type of this element.
		// Documents should always be an untypedAtomic, of elements, we do not know the type, so they are untypedAtomic too
		const allTextNodes = [];
		(function getTextNodes(aNode) {
			if (
				domFacade.getNodeType(aNode) === NODE_TYPES.TEXT_NODE ||
				domFacade.getNodeType(aNode) === NODE_TYPES.CDATA_SECTION_NODE
			) {
				allTextNodes.push(aNode);
				return;
			}
			domFacade.getChildNodes(aNode, null).forEach(childNode => getTextNodes(childNode));
		})(pointer);

		return createAtomicValue(
			allTextNodes
				.map(textNode => {
					return domFacade.getData(textNode);
				})
				.join(''),
			'xs:untypedAtomic'
		);
	}

	// (function || map) && !array
	if (isSubtypeOf(value.type, 'function(*)') && !isSubtypeOf(value.type, 'array(*)')) {
		throw new Error(`FOTY0013: Atomization is not supported for ${value.type}.`);
	}
	throw new Error(`Atomizing ${value.type} is not implemented.`);
}
