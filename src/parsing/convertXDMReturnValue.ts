import { domFacade } from 'fontoxpath';
import DomFacade from 'fontoxpath/domFacade/DomFacade';
import {
	AttributeNodePointer,
	ChildNodePointer,
	CommentNodePointer,
	CommentNodeSilhouette,
	ElementNodePointer,
	ElementNodeSilhouette,
	NodePointer,
	NodeSilhouette,
	Pointer,
	ProcessingInstructionNodePointer,
	ProcessingInstructionNodeSilhouette,
	TextNodePointer,
	TextNodeSilhouette
} from '../domClone/Pointer';
import { NODE_TYPES } from '../domFacade/ConcreteNode';
import { printAndRethrowError } from '../evaluationUtils/printAndRethrowError';
import ArrayValue from '../expressions/dataTypes/ArrayValue';
import atomize from '../expressions/dataTypes/atomize';
import castToType from '../expressions/dataTypes/castToType';
import ISequence from '../expressions/dataTypes/ISequence';
import isSubtypeOf from '../expressions/dataTypes/isSubtypeOf';
import MapValue from '../expressions/dataTypes/MapValue';
import sequenceFactory from '../expressions/dataTypes/sequenceFactory';
import ExecutionParameters from '../expressions/ExecutionParameters';
import { IterationHint } from '../expressions/util/iterators';
import transformXPathItemToJavascriptObject, {
	transformArrayToArray,
	transformMapToObject
} from '../transformXPathItemToJavascriptObject';
import { Node } from '../types/Types';

function createNewNode(pointer: NodePointer, executionParameters: ExecutionParameters) {
	const documentWriter = executionParameters.documentWriter;
	const nodesFactory = executionParameters.nodesFactory;
	const domFacade: DomFacade = executionParameters.domFacade;

	if (pointer.isSilhouette()) {
		switch (domFacade.getNodeType(pointer)) {
			case NODE_TYPES.COMMENT_NODE:
				return nodesFactory.createComment(domFacade.getData(pointer as CommentNodePointer));
			case NODE_TYPES.ELEMENT_NODE:
				const namespaceURI = domFacade.getNamespaceURI(pointer as ElementNodePointer);
				const prefix = domFacade.getPrefix(pointer as ElementNodePointer);
				const localName = domFacade.getLocalName(pointer as ElementNodePointer);
				const element = nodesFactory.createElementNS(
					namespaceURI,
					prefix ? prefix + ':' + localName : localName
				);
				domFacade
					.getChildNodes(pointer as ElementNodePointer)
					.forEach((childPointer, childIndex) => {
						const newChildNode = createNewNode(childPointer, executionParameters);
						documentWriter.insertBefore(element, newChildNode, null);
					});
				domFacade
					.getAllAttributes(pointer as ElementNodePointer)
					.forEach((attributePointer: AttributeNodePointer) => {
						documentWriter.setAttributeNS(
							element,
							domFacade.getNamespaceURI(attributePointer),
							domFacade.getNodeName(attributePointer),
							domFacade.getData(attributePointer)
						);
					});
				return element;
			case NODE_TYPES.PROCESSING_INSTRUCTION_NODE:
				return nodesFactory.createProcessingInstruction(
					domFacade.getTarget(pointer as ProcessingInstructionNodePointer),
					domFacade.getData(pointer as ProcessingInstructionNodePointer)
				);
			case NODE_TYPES.TEXT_NODE:
				return nodesFactory.createComment(domFacade.getData(pointer as TextNodePointer));
		}
	} else {
		// we need to set a rule to create clone or use same node.
		const graftAncestor = pointer.getGraftAncestor();
		const node = pointer.unwrap();
		if (graftAncestor) {
			return (node as any).cloneNode(true);
		} else {
			return node;
		}
	}
}

function getRootPointer(pointer, pathToNodeFromRoot, domFacade) {
	const parentPointer = domFacade.getParentNode(pointer);
	if (parentPointer === null) {
		return pointer;
	}
	const children = domFacade.getChildNodes(parentPointer);
	pathToNodeFromRoot.push(children.indexOf(pointer));
	return getRootPointer(parentPointer, pathToNodeFromRoot, domFacade);
}
function getNodeFromRoot(rootPointer, pathToNodeFromRoot, domFacade) {
	if (pathToNodeFromRoot[0] === undefined) {
		return rootPointer.unwrap();
	}
	const children = domFacade.getChildNodes(rootPointer);
	return getNodeFromRoot(children[pathToNodeFromRoot.pop()], pathToNodeFromRoot, domFacade);
}
const newRootPointerByRootPointer = new WeakMap();
function createDomAndGetActualNode(pointer: NodePointer, executionParameters: ExecutionParameters) {
	const pathToNodeFromRoot = [];
	const rootPointer = getRootPointer(pointer, pathToNodeFromRoot, executionParameters.domFacade);
	let newRootPointer = newRootPointerByRootPointer.get(rootPointer);
	if (!newRootPointer) {
		newRootPointer = new Pointer(createNewNode(rootPointer, executionParameters), null);
		newRootPointerByRootPointer.set(rootPointer, newRootPointer);
	}
	return getNodeFromRoot(newRootPointer, pathToNodeFromRoot, domFacade);
}

/**
 * @public
 */
export enum ReturnType {
	ANY = 0,
	NUMBER = 1,
	STRING = 2,
	BOOLEAN = 3,
	NODES = 7,
	FIRST_NODE = 9,
	STRINGS = 10,
	MAP = 11,
	ARRAY = 12,
	NUMBERS = 13,
	ASYNC_ITERATOR = 99
}

/**
 * @public
 */
export interface IReturnTypes<T extends Node> {
	[ReturnType.ANY]: any;
	[ReturnType.NUMBER]: number;
	[ReturnType.STRING]: string;
	[ReturnType.BOOLEAN]: boolean;
	[ReturnType.NODES]: T[] | undefined[];
	[ReturnType.FIRST_NODE]: T | null;
	[ReturnType.STRINGS]: string[];
	[ReturnType.MAP]: { [s: string]: any };
	[ReturnType.ARRAY]: any[];
	[ReturnType.NUMBERS]: number[];
	[ReturnType.ASYNC_ITERATOR]: AsyncIterableIterator<any>;
}

export default function convertXDMReturnValue<
	TNode extends Node,
	TReturnType extends keyof IReturnTypes<TNode>
>(
	expression: string,
	rawResults: ISequence,
	returnType: TReturnType,
	executionParameters: ExecutionParameters
): IReturnTypes<TNode>[TReturnType] {
	switch (returnType) {
		case ReturnType.BOOLEAN: {
			const ebv = rawResults.tryGetEffectiveBooleanValue();
			if (!ebv.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}
			return ebv.value;
		}

		case ReturnType.STRING: {
			const allValues = rawResults.tryGetAllValues();
			if (!allValues.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}
			if (!allValues.value.length) {
				return '';
			}
			// Atomize to convert (attribute)nodes to be strings
			return allValues.value
				.map(value => castToType(atomize(value, executionParameters), 'xs:string').value)
				.join(' ');
		}
		case ReturnType.STRINGS: {
			const allValues = rawResults.tryGetAllValues();
			if (!allValues.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}
			if (!allValues.value.length) {
				return [];
			}
			// Atomize all parts
			return allValues.value.map(value => {
				return atomize(value, executionParameters).value + '';
			});
		}

		case ReturnType.NUMBER: {
			const first = rawResults.tryGetFirst();
			if (!first.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}
			if (!first.value) {
				return NaN;
			}
			if (!isSubtypeOf(first.value.type, 'xs:numeric')) {
				return NaN;
			}
			return first.value.value;
		}

		case ReturnType.FIRST_NODE: {
			const first = rawResults.tryGetFirst();
			if (!first.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}
			if (!first.value) {
				return null;
			}
			if (!isSubtypeOf(first.value.type, 'node()')) {
				throw new Error(
					'Expected XPath ' + expression + ' to resolve to Node. Got ' + first.value.type
				);
			}
			// over here: unravel pointers. if they point to actual nodes:return them. if they point
			// to lightweights, really make them, if they point to clones, clone them etc

			// const node = first.value.value.node;
			// return createNewNode(first.value.value, executionParameters);
			return createDomAndGetActualNode(first.value.value, executionParameters);
		}

		case ReturnType.NODES: {
			const allResults = rawResults.tryGetAllValues();
			if (!allResults.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}

			if (
				!allResults.value.every(value => {
					return isSubtypeOf(value.type, 'node()');
				})
			) {
				throw new Error(
					'Expected XPath ' + expression + ' to resolve to a sequence of Nodes.'
				);
			}
			return allResults.value.map(nodeValue => {
				// const node = nodeValue.value.node;
				// return createNewNode(nodeValue.value, executionParameters);
				createDomAndGetActualNode(nodeValue.value, executionParameters);
			});
		}

		case ReturnType.MAP: {
			const allValues = rawResults.tryGetAllValues();
			if (!allValues.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}

			if (allValues.value.length !== 1) {
				throw new Error('Expected XPath ' + expression + ' to resolve to a single map.');
			}
			const first = allValues.value[0];
			if (!isSubtypeOf(first.type, 'map(*)')) {
				throw new Error('Expected XPath ' + expression + ' to resolve to a map');
			}
			const transformedMap = transformMapToObject(first as MapValue).next(IterationHint.NONE);
			if (!transformedMap.ready) {
				throw new Error(
					'Expected XPath ' + expression + ' to synchronously resolve to a map'
				);
			}
			return transformedMap.value;
		}

		case ReturnType.ARRAY: {
			const allValues = rawResults.tryGetAllValues();
			if (!allValues.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}

			if (allValues.value.length !== 1) {
				throw new Error('Expected XPath ' + expression + ' to resolve to a single array.');
			}
			const first = allValues.value[0];
			if (!isSubtypeOf(first.type, 'array(*)')) {
				throw new Error('Expected XPath ' + expression + ' to resolve to an array');
			}
			const transformedArray = transformArrayToArray(first as ArrayValue).next(
				IterationHint.NONE
			);
			if (!transformedArray.ready) {
				throw new Error(
					'Expected XPath ' + expression + ' to synchronously resolve to a map'
				);
			}
			return transformedArray.value;
		}

		case ReturnType.NUMBERS: {
			const allValues = rawResults.tryGetAllValues();
			if (!allValues.ready) {
				throw new Error(`The expression ${expression} can not be resolved synchronously.`);
			}
			return allValues.value.map(value => {
				if (!isSubtypeOf(value.type, 'xs:numeric')) {
					throw new Error('Expected XPath ' + expression + ' to resolve to numbers');
				}
				return value.value;
			});
		}

		case ReturnType.ASYNC_ITERATOR: {
			const it = rawResults.value;
			let transformedValueGenerator = null;
			let done = false;
			const getNextResult: () => Promise<IteratorResult<any>> = () => {
				while (!done) {
					if (!transformedValueGenerator) {
						const value = it.next(IterationHint.NONE);
						if (value.done) {
							done = true;
							break;
						}
						if (!value.ready) {
							return value.promise.then(getNextResult);
						}
						transformedValueGenerator = transformXPathItemToJavascriptObject(
							value.value
						);
					}
					const transformedValue = transformedValueGenerator.next();
					if (!transformedValue.ready) {
						return transformedValue.promise.then(getNextResult);
					}
					transformedValueGenerator = null;
					return transformedValue;
				}
				return Promise.resolve({
					done: true,
					value: null
				});
			};
			let toReturn: AsyncIterableIterator<any>;
			if ('asyncIterator' in Symbol) {
				toReturn = {
					[Symbol.asyncIterator]() {
						return this;
					},
					next: () =>
						new Promise<IteratorResult<any>>(resolve => resolve(getNextResult())).catch(
							error => {
								printAndRethrowError(expression, error);
								throw error;
							}
						)
				};
			} else {
				toReturn = {
					next: () => new Promise(resolve => resolve(getNextResult()))
				} as AsyncIterableIterator<any>;
			}
			return toReturn;
		}

		default: {
			const allValues = rawResults.tryGetAllValues();
			if (!allValues.ready) {
				throw new Error('The XPath ' + expression + ' can not be resolved synchronously.');
			}
			const allValuesAreNodes = allValues.value.every(value => {
				return isSubtypeOf(value.type, 'node()') && !isSubtypeOf(value.type, 'attribute()');
			});
			if (allValuesAreNodes) {
				if (allValues.value.length === 1) {
					return allValues.value[0].value;
				}
				return allValues.value.map(nodeValue => {
					return nodeValue.value;
				});
			}
			if (allValues.value.length === 1) {
				const first = allValues.value[0];
				if (isSubtypeOf(first.type, 'array(*)')) {
					const transformedArray = transformArrayToArray(first as ArrayValue).next(
						IterationHint.NONE
					);
					if (!transformedArray.ready) {
						throw new Error(
							'Expected XPath ' + expression + ' to synchronously resolve to an array'
						);
					}
					return transformedArray.value;
				}
				if (isSubtypeOf(first.type, 'map(*)')) {
					const transformedMap = transformMapToObject(first as MapValue).next(
						IterationHint.NONE
					);
					if (!transformedMap.ready) {
						throw new Error(
							'Expected XPath ' + expression + ' to synchronously resolve to a map'
						);
					}
					return transformedMap.value;
				}
				return atomize(allValues.value[0], executionParameters).value;
			}

			return sequenceFactory
				.create(allValues.value)
				.atomize(executionParameters)
				.getAllValues()
				.map(atomizedValue => {
					return atomizedValue.value;
				});
		}
	}
}
