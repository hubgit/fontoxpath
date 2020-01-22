// import {
// 	AttributeNodePointer,
// 	AttributeNodeSilhouette,
// 	CDATASectionNodePointer,
// 	CDATASectionNodeSilhouette,
// 	CommentNodePointer,
// 	CommentNodeSilhouette,
// 	ConcreteNode,
// 	ElementNodePointer,
// 	ElementNodeSilhouette,
// 	NODE_TYPES,
// 	NodePointer,
// 	Pointer,
// 	ProcessingInstructionNodePointer,
// 	ProcessingInstructionNodeSilhouette,
// 	TextNodePointer,
// 	TextNodeSilhouette
// } from '../domFacade/ConcreteNode';
// import DomFacade from '../domFacade/DomFacade';

// /*
// {
// 	attributes?: Attr[];
// 	childNodes?: Node[];
// 	data?: string;
// 	isSilhouette: true;
// 	localName?: string;
// 	namespaceURI?: string;
// 	nodeName?: string;
// 	nodeType: NODE_TYPES;
// 	prefix?: string;
// };
// */

// export default function createNodeSilhouette(pointer: NodePointer, domFacade: DomFacade) {
// 	const nodeType = domFacade.getNodeType(pointer);

// 	switch (nodeType) {
// 		case NODE_TYPES.ELEMENT_NODE:
// 			pointer = pointer as ElementNodePointer;
// 			return {
// 				nodeType,
// 				isSilhouette: true,
// 				attributes: domFacade.getAllAttributes(pointer),
// 				childNodes: domFacade.getChildNodes(pointer),
// 				nodeName: domFacade.getNodeName(pointer),
// 				namespaceURI: domFacade.getNamespaceURI(pointer),
// 				prefix: domFacade.getPrefix(pointer),
// 				localName: domFacade.getLocalName(pointer)
// 			} as ElementNodeSilhouette;
// 		// case NODE_TYPES.ATTRIBUTE_NODE:
// 		// 	pointer = pointer as AttributeNodePointer;
// 		// 	return {
// 		// 		nodeType,
// 		// 		isSilhouette: true,
// 		// 		nodeName: domFacade.getNodeName(pointer),
// 		// 		namespaceURI: domFacade.getNamespaceURI(pointer),
// 		// 		localName: domFacade.getLocalName(pointer),
// 		// 		name: domFacade.getNodeName(pointer),
// 		// 		prefix: domFacade.getPrefix(pointer),
// 		// 		value: domFacade.getData(pointer)
// 		// 	} as AttributeNodeSilhouette;
// 		// case NODE_TYPES.PROCESSING_INSTRUCTION_NODE:
// 		// 	pointer = pointer as ProcessingInstructionNodePointer;
// 		// 	return {
// 		// 		nodeType,
// 		// 		isSilhouette: true,
// 		// 		data: domFacade.getData(pointer)
// 		// 	} as ProcessingInstructionNodeSilhouette;
// 		// case NODE_TYPES.TEXT_NODE:
// 		// 	pointer = pointer as TextNodePointer;
// 		// 	return {
// 		// 		nodeType,
// 		// 		isSilhouette: true,
// 		// 		data: domFacade.getData(pointer)
// 		// 	} as TextNodeSilhouette;
// 		// case NODE_TYPES.CDATA_SECTION_NODE:
// 		// 	pointer = pointer as CDATASectionNodePointer;
// 		// 	return {
// 		// 		nodeType,
// 		// 		isSilhouette: true,
// 		// 		data: domFacade.getData(pointer)
// 		// 	} as CDATASectionNodeSilhouette;
// 		// case NODE_TYPES.COMMENT_NODE:
// 		// 	pointer = pointer as CommentNodePointer;
// 		// 	return {
// 		// 		nodeType,
// 		// 		isSilhouette: true,
// 		// 		data: domFacade.getData(pointer)
// 		// 	} as CommentNodeSilhouette;
// 		// 	break;

// 		// case NODE_TYPES.DOCUMENT_NODE:
// 		// 	nodeSilhouette.value = domSpecifications.getValue(node);
// 		// 	return nodeSilhouette;
// 		// case NODE_TYPES.DOCUMENT_TYPE_NODE:
// 		// 	nodeSilhouette.value = domSpecifications.getValue(node);
// 		// 	return nodeSilhouette;
// 		// case NODE_TYPES.DOCUMENT_FRAGMENT_NODE:
// 		// 	nodeSilhouette.value = domSpecifications.getValue(node);
// 		// 	return nodeSilhouette;
// 	}
// }
