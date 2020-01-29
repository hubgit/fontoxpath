import {
	ConcreteAttributeNode,
	ConcreteCDATASectionNode,
	ConcreteCharacterDataNode,
	ConcreteChildNode,
	ConcreteCommentNode,
	ConcreteDocumentNode,
	ConcreteElementNode,
	ConcreteNode,
	ConcreteParentNode,
	ConcreteProcessingInstructionNode,
	ConcreteTextNode
} from '../domFacade/ConcreteNode';

// Silhouettes
type Silhouette = { isSilhouette: true };
export type ElementNodeSilhouette = Silhouette &
	ConcreteElementNode & {
		attributes?: ConcreteAttributeNode[];
		childNodes?: ConcreteChildNode[];
	};
export type AttributeNodeSilhouette = Silhouette & ConcreteAttributeNode;
export type TextNodeSilhouette = Silhouette & ConcreteTextNode;
export type CommentNodeSilhouette = Silhouette & ConcreteCommentNode;
export type CDATASectionNodeSilhouette = Silhouette & ConcreteCDATASectionNode;
export type ProcessingInstructionNodeSilhouette = Silhouette & ConcreteProcessingInstructionNode;
export type DocumentNodeSilhouette = Silhouette &
	ConcreteDocumentNode & {
		childNodes?: ConcreteChildNode[];
	};

export type ParentNodeSilhouette = ElementNodeSilhouette | DocumentNodeSilhouette;

export type ChildNodeSilhouette =
	| ElementNodeSilhouette
	| TextNodeSilhouette
	| ProcessingInstructionNodeSilhouette
	| CommentNodeSilhouette
	| CDATASectionNodeSilhouette;

export type CharacterDataNodeSilhouette =
	| TextNodeSilhouette
	| CDATASectionNodeSilhouette
	| ProcessingInstructionNodeSilhouette
	| CommentNodeSilhouette;

export type NodeSilhouette = ChildNodeSilhouette | ParentNodeSilhouette | AttributeNodeSilhouette;

// Graft and Pointers
export type GraftPoint = {
	graftAncestor: GraftPoint | null;
	offset: number | string;
	parent: NodeSilhouette;
};

export class Pointer<TNode extends ConcreteNode, TSilhouette extends NodeSilhouette> {
	private readonly graftAncestor: GraftPoint | null;
	private readonly node: TNode | TSilhouette;

	constructor(node: TNode | TSilhouette, graftAncestor: GraftPoint) {
		this.node = node;
		this.graftAncestor = graftAncestor;
	}

	public getGraftAncestor(): GraftPoint {
		return this.graftAncestor;
	}

	public isSilhouette(): boolean {
		return !!(this.node as any).isSilhouette;
	}

	public unwrap(): TNode | TSilhouette {
		return this.node;
	}
}

// tslint:disable: max-classes-per-file
export class AttributeNodePointer extends Pointer<ConcreteAttributeNode, AttributeNodeSilhouette> {}
export class CDATASectionNodePointer extends Pointer<
	ConcreteCDATASectionNode,
	CDATASectionNodeSilhouette
> {}
export class CommentNodePointer extends Pointer<ConcreteCommentNode, CommentNodeSilhouette> {}
export class DocumentNodePointer extends Pointer<ConcreteDocumentNode, DocumentNodeSilhouette> {}
export class ElementNodePointer extends Pointer<ConcreteElementNode, ElementNodeSilhouette> {}
export class ProcessingInstructionNodePointer extends Pointer<
	ConcreteProcessingInstructionNode,
	ProcessingInstructionNodeSilhouette
> {}
export class TextNodePointer extends Pointer<ConcreteTextNode, TextNodeSilhouette> {}

export class NodePointer extends Pointer<ConcreteNode, NodeSilhouette> {}
export class CharacterDataNodePointer extends Pointer<
	ConcreteCharacterDataNode,
	CharacterDataNodeSilhouette
> {}
export class ChildNodePointer extends Pointer<ConcreteChildNode, ChildNodeSilhouette> {}
export class ParentNodePointer extends Pointer<ConcreteParentNode, ParentNodeSilhouette> {}
