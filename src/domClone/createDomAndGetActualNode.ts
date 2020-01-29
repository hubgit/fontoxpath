import { IReturnTypes, Node } from 'src';
import { NODE_TYPES } from '../domFacade/ConcreteNode';
import DomFacade from '../domFacade/DomFacade';
import ExecutionParameters from '../expressions/ExecutionParameters';
import arePointersEqual from '../expressions/operators/compares/arePointersEqual';
import {
	AttributeNodePointer,
	CommentNodePointer,
	ElementNodePointer,
	NodePointer,
	Pointer,
	ProcessingInstructionNodePointer,
	TextNodePointer
} from './Pointer';

function createNewNode(pointer: NodePointer, executionParameters: ExecutionParameters) {
	const documentWriter = executionParameters.documentWriter;
	const nodesFactory = executionParameters.nodesFactory;
	const domFacade: DomFacade = executionParameters.domFacade;

	if (pointer.isSilhouette()) {
		switch (domFacade.getNodeType(pointer)) {
			case NODE_TYPES.ATTRIBUTE_NODE:
				const newAttributePointer = pointer as AttributeNodePointer;
				const newAttributeNode = nodesFactory.createAttributeNS(
					domFacade.getNamespaceURI(newAttributePointer),
					domFacade.getNodeName(newAttributePointer)
				);
				newAttributeNode.value = domFacade.getData(newAttributePointer);
				return newAttributeNode;
			case NODE_TYPES.COMMENT_NODE:
				return nodesFactory.createComment(domFacade.getData(pointer as CommentNodePointer));
			case NODE_TYPES.ELEMENT_NODE:
				const elementNodePointer = pointer as ElementNodePointer;
				const namespaceURI = domFacade.getNamespaceURI(elementNodePointer);
				const prefix = domFacade.getPrefix(elementNodePointer);
				const localName = domFacade.getLocalName(elementNodePointer);
				const element = nodesFactory.createElementNS(
					namespaceURI,
					prefix ? prefix + ':' + localName : localName
				);
				domFacade.getChildNodes(elementNodePointer).forEach(childPointer => {
					const newChildNode = createNewNode(childPointer, executionParameters);
					documentWriter.insertBefore(element, newChildNode, null);
				});
				domFacade
					.getAllAttributes(elementNodePointer)
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
				const pIPointer = pointer as ProcessingInstructionNodePointer;
				return nodesFactory.createProcessingInstruction(
					domFacade.getTarget(pIPointer),
					domFacade.getData(pIPointer)
				);
			case NODE_TYPES.TEXT_NODE:
				return nodesFactory.createTextNode(domFacade.getData(pointer as TextNodePointer));
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
	if (domFacade.getNodeType(pointer) === NODE_TYPES.ATTRIBUTE_NODE) {
		// To track the attribute node
		const name = domFacade.getNodeName(pointer);
		pathToNodeFromRoot.push(name);
	} else {
		const children = domFacade.getChildNodes(parentPointer);
		pathToNodeFromRoot.push(children.findIndex(child => arePointersEqual(child, pointer)));
	}

	return getRootPointer(parentPointer, pathToNodeFromRoot, domFacade);
}

function getNodeFromRoot(rootPointer, pathToNodeFromRoot, domFacade) {
	if (pathToNodeFromRoot[0] === undefined) {
		return rootPointer.unwrap();
	}

	const childIndex = pathToNodeFromRoot.pop();
	let child;
	if (typeof childIndex === 'string') {
		const attributes = domFacade.getAllAttributes(rootPointer);
		child = attributes.find(attr => domFacade.getNodeName(attr) === childIndex);
	} else {
		const children = domFacade.getChildNodes(rootPointer);
		child = children[childIndex];
	}

	return getNodeFromRoot(child, pathToNodeFromRoot, domFacade);
}

const newRootPointerByRootPointer = new WeakMap();

function createDomAndGetActualNode(
	pointer: NodePointer,
	executionParameters: ExecutionParameters
): Node {
	if (!pointer.isSilhouette()) {
		// we need to set a rule to create clone or use same node.
		const graftAncestor = pointer.getGraftAncestor();
		const node = pointer.unwrap();
		if (graftAncestor) {
			return (node as any).cloneNode(true);
		} else {
			return node;
		}
	}
	const pathToNodeFromRoot = [];
	const rootPointer = getRootPointer(pointer, pathToNodeFromRoot, executionParameters.domFacade);
	let newRootPointer = newRootPointerByRootPointer.get(rootPointer);
	if (!newRootPointer) {
		newRootPointer = new Pointer(createNewNode(rootPointer, executionParameters), null);
		newRootPointerByRootPointer.set(rootPointer, newRootPointer);
	}
	return getNodeFromRoot(newRootPointer, pathToNodeFromRoot, executionParameters.domFacade);
}

export default createDomAndGetActualNode;
