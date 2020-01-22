import {
	Attr,
	CDATASection,
	Comment,
	Document,
	Element,
	Node,
	ProcessingInstruction,
	Text
} from '../types/Types';

export const enum NODE_TYPES {
	ELEMENT_NODE = 1,
	ATTRIBUTE_NODE = 2,
	TEXT_NODE = 3,
	CDATA_SECTION_NODE = 4,
	PROCESSING_INSTRUCTION_NODE = 7,
	COMMENT_NODE = 8,
	DOCUMENT_NODE = 9,
	DOCUMENT_TYPE_NODE = 10,
	DOCUMENT_FRAGMENT_NODE = 11
}

// Concretes
export type ConcreteTextNode = Text & { nodeType: NODE_TYPES.TEXT_NODE };
export type ConcreteElementNode = Element & { nodeType: NODE_TYPES.ELEMENT_NODE };
export type ConcreteCommentNode = Comment & { nodeType: NODE_TYPES.COMMENT_NODE };
export type ConcreteCDATASectionNode = CDATASection & { nodeType: NODE_TYPES.CDATA_SECTION_NODE };
export type ConcreteAttributeNode = Attr & { nodeType: NODE_TYPES.ATTRIBUTE_NODE };
export type ConcreteDocumentNode = Document & { nodeType: NODE_TYPES.DOCUMENT_NODE };
export type ConcreteProcessingInstructionNode = ProcessingInstruction & {
	nodeType: NODE_TYPES.PROCESSING_INSTRUCTION_NODE;
};
export type ConcreteParentNode = ConcreteElementNode | ConcreteDocumentNode;
export type ConcreteChildNode =
	| ConcreteElementNode
	| ConcreteTextNode
	| ConcreteProcessingInstructionNode
	| ConcreteCommentNode
	| ConcreteCDATASectionNode;
export type ConcreteCharacterDataNode =
	| ConcreteTextNode
	| ConcreteCDATASectionNode
	| ConcreteProcessingInstructionNode
	| ConcreteCommentNode;
export type ConcreteNode = ConcreteChildNode | ConcreteParentNode | ConcreteAttributeNode;

// // Silhouettes
// type Silhouette = { isSilhouette: true };
// export type ElementNodeSilhouette = Silhouette &
// 	ConcreteElementNode & {
// 		attributes?: ConcreteAttributeNode[];
// 		childNodes?: ConcreteChildNode[];
// 	};
// export type AttributeNodeSilhouette = Silhouette & ConcreteAttributeNode;
// export type TextNodeSilhouette = Silhouette & ConcreteTextNode;
// export type CommentNodeSilhouette = Silhouette & ConcreteCommentNode;
// export type CDATASectionNodeSilhouette = Silhouette & ConcreteCDATASectionNode;
// export type ProcessingInstructionNodeSilhouette = Silhouette & ConcreteProcessingInstructionNode;
// export type DocumentNodeSilhouette = Silhouette & ConcreteDocumentNode;

// export type ParentNodeSilhouette = ElementNodeSilhouette | DocumentNodeSilhouette;

// export type ChildNodeSilhouette =
// 	| ElementNodeSilhouette
// 	| TextNodeSilhouette
// 	| ProcessingInstructionNodeSilhouette
// 	| CommentNodeSilhouette
// 	| CDATASectionNodeSilhouette;

// export type CharacterDataNodeSilhouette =
// 	| TextNodeSilhouette
// 	| CDATASectionNodeSilhouette
// 	| ProcessingInstructionNodeSilhouette
// 	| CommentNodeSilhouette;

// export type NodeSilhouette = ChildNodeSilhouette | ParentNodeSilhouette | AttributeNodeSilhouette;

// export type NodeSilhouette<T extends ConcreteNode = ConcreteNode> = T & Silhouette;

// Graft and Pointers
// export type GraftPoint = {
// 	graftAncestor: GraftPoint | null;
// 	offset: number;
// 	parent: NodeSilhouette;
// };

// export type Pointer<T extends ConcreteNode> = {
// 	graftAncestor: GraftPoint | null;
// 	node: T;
// };

// export type TextNodePointer = Pointer<ConcreteTextNode | TextNodeSilhouette>;
// export type ElementNodePointer = Pointer<ConcreteElementNode | ElementNodeSilhouette>;
// export type ProcessingInstructionNodePointer = Pointer<
// 	ConcreteProcessingInstructionNode | ProcessingInstructionNodeSilhouette
// >;
// export type CommentNodePointer = Pointer<ConcreteCommentNode | CommentNodeSilhouette>;
// export type CDATASectionNodePointer = Pointer<
// 	ConcreteCDATASectionNode | CDATASectionNodeSilhouette
// >;
// export type AttributeNodePointer = Pointer<ConcreteAttributeNode | AttributeNodeSilhouette>;
// export type DocumentNodePointer = Pointer<ConcreteDocumentNode | DocumentNodeSilhouette>;
// export type ParentNodePointer = Pointer<ConcreteParentNode | ParentNodeSilhouette>;
// export type NodePointer = Pointer<ConcreteNode | NodeSilhouette>;
// export type ChildNodePointer = Pointer<ConcreteChildNode | ChildNodeSilhouette>;

// export type CharacterDataNodePointer = Pointer<
// 	ConcreteCharacterDataNode | CharacterDataNodeSilhouette
// >;
