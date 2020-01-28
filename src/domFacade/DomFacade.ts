import {
	AttributeNodePointer,
	AttributeNodeSilhouette,
	CharacterDataNodePointer,
	CharacterDataNodeSilhouette,
	ChildNodePointer,
	ElementNodePointer,
	ElementNodeSilhouette,
	NodePointer,
	ParentNodePointer,
	ParentNodeSilhouette,
	ProcessingInstructionNodePointer
} from '../domClone/Pointer';
import { Attr, CharacterData, Element, Node } from '../types/Types';
import {
	ConcreteAttributeNode,
	ConcreteChildNode,
	ConcreteParentNode,
	NODE_TYPES
} from './ConcreteNode';
import IDomFacade from './IDomFacade';

const isNodeSilhouette = node => node.isSilhouette;
const isPointer = entry => !!entry.node;

/**
 * Adapter for the DOM, can be used to use a different DOM implementation
 */
class DomFacade {
	public orderOfDetachedNodes: Node[];

	constructor(private readonly _domFacade: IDomFacade) {
		/**
		 * Defines the ordering of detached nodes, to ensure stable sorting of unrelated nodes.
		 */
		this.orderOfDetachedNodes = [];
	}

	public getAllAttributes(
		pointer: ElementNodePointer,
		bucket: string | null = null
	): AttributeNodePointer[] {
		if (pointer.isSilhouette()) {
			const nodeSilhouette = pointer.unwrap() as ElementNodeSilhouette;
			nodeSilhouette.attributes.map((attribute, index) => {
				return {
					graftAncestor: {
						graftAncestor: pointer.getGraftAncestor(),
						offset: index,
						parent: nodeSilhouette
					},
					node: attribute
				};
			});
		}
		const node = pointer.unwrap() as Element;
		return this._domFacade['getAllAttributes'](node, bucket).map((attribute, index) => {
			return new AttributeNodePointer(attribute, pointer.getGraftAncestor());
		});
	}

	public getAttribute(pointer: ElementNodePointer, attributeName: string): string {
		if (pointer.isSilhouette()) {
			const nodeSilhouette = pointer.unwrap() as ElementNodeSilhouette;
			const attributeNode = nodeSilhouette.attributes.find(
				attr => attributeName === attr.name
			);
			return attributeNode ? attributeNode.value : null;
		} else {
			const node = pointer.unwrap() as Element;
			const value = this._domFacade['getAttribute'](node, attributeName);
			return value ? value : null;
		}
	}

	public getChildNodes(
		pointer: ParentNodePointer,
		bucket: string | null = null
	): ChildNodePointer[] {
		let childNodes;
		if (pointer.isSilhouette()) {
			const nodeSilhouette = pointer.unwrap() as ParentNodeSilhouette;
			childNodes = nodeSilhouette.childNodes;
			return childNodes.map((childNode, index) => {
				return new ChildNodePointer(childNode, {
					graftAncestor: pointer.getGraftAncestor(),
					offset: index,
					parent: nodeSilhouette
				});
			});
		}
		childNodes = this._domFacade['getChildNodes'](pointer.unwrap(), bucket);
		if (this.getNodeType(pointer) === NODE_TYPES.DOCUMENT_NODE) {
			childNodes = childNodes.filter(
				childNode => childNode['nodeType'] !== NODE_TYPES.DOCUMENT_TYPE_NODE
			);
		}
		return childNodes.map((childNode, index) => {
			return new ChildNodePointer(childNode, pointer.getGraftAncestor());
		});
	}

	public getData(pointer: AttributeNodePointer | CharacterDataNodePointer): string {
		const unwrappedNode = pointer.unwrap();
		return pointer.isSilhouette()
			? this.getNodeType(pointer) === NODE_TYPES.ATTRIBUTE_NODE
				? (unwrappedNode as AttributeNodeSilhouette).value
				: (unwrappedNode as CharacterDataNodeSilhouette).data
			: this.getNodeType(pointer) === NODE_TYPES.ATTRIBUTE_NODE
			? (unwrappedNode as ConcreteAttributeNode).value
			: this._domFacade['getData'](unwrappedNode as Attr | CharacterData) || '';
	}

	public getFirstChild(
		pointer: ParentNodePointer,
		bucket: string | null = null
	): ChildNodePointer {
		let firstChild;
		if (pointer.isSilhouette()) {
			const nodeSilhouette = pointer.unwrap() as ParentNodeSilhouette;
			firstChild = nodeSilhouette.childNodes[0];
			return firstChild
				? new ChildNodePointer(firstChild, {
						graftAncestor: pointer.getGraftAncestor(),
						offset: 0,
						parent: nodeSilhouette
				  })
				: null;
		}
		const node = pointer.unwrap() as ConcreteParentNode;
		firstChild = this._domFacade['getFirstChild'](node, bucket) as ConcreteChildNode;
		if (firstChild && firstChild.nodeType === NODE_TYPES.DOCUMENT_TYPE_NODE) {
			firstChild = this._domFacade['getNextSibling'](firstChild);
		}
		return firstChild ? new ChildNodePointer(firstChild, pointer.getGraftAncestor()) : null;
	}

	public getLastChild(
		pointer: ParentNodePointer,
		bucket: string | null = null
	): ChildNodePointer {
		let lastChild;
		let lastIndex;
		if (pointer.isSilhouette()) {
			const nodeSilhouette = pointer.unwrap() as ParentNodeSilhouette;
			lastIndex = nodeSilhouette.childNodes.length - 1;
			lastChild = nodeSilhouette.childNodes[lastIndex];
			return lastChild
				? new ChildNodePointer(lastChild, {
						graftAncestor: pointer.getGraftAncestor(),
						offset: 0,
						parent: nodeSilhouette
				  })
				: null;
		}
		const node = pointer.unwrap() as ConcreteParentNode;
		lastChild = this._domFacade['getLastChild'](node, bucket) as ConcreteChildNode;
		lastIndex = this.getChildNodes(pointer, bucket).length - 1;
		if (lastChild && lastChild.nodeType === NODE_TYPES.DOCUMENT_TYPE_NODE) {
			lastChild = this._domFacade['getPreviousSibling'](lastChild);
		}
		return lastChild ? new ChildNodePointer(lastChild, pointer.getGraftAncestor()) : null;
	}

	public getLocalName(pointer: ElementNodePointer | AttributeNodePointer): string {
		return pointer.unwrap().localName;
	}

	public getNamespaceURI(pointer: ElementNodePointer | AttributeNodePointer): string {
		return pointer.unwrap().namespaceURI;
	}

	public getNextSibling(
		pointer: ChildNodePointer,
		bucket: string | null = null
	): ChildNodePointer {
		let nextSibling;
		const graftAncestor = pointer.getGraftAncestor();
		if (pointer.isSilhouette()) {
			if (!graftAncestor) {
				return null;
			}
			const offset = graftAncestor.offset;
			const allSiblings = isNodeSilhouette(graftAncestor.parent)
				? (graftAncestor.parent as ParentNodeSilhouette).childNodes
				: this.getChildNodes(this.getParentNode(pointer, bucket), bucket);
			nextSibling = allSiblings[offset + 1];
		} else {
			nextSibling = pointer.unwrap() as Node;
			while (nextSibling) {
				nextSibling = this._domFacade['getNextSibling'](nextSibling as Node, bucket);
				if (nextSibling && nextSibling.nodeType !== NODE_TYPES.DOCUMENT_TYPE_NODE) {
					break;
				}
			}
		}

		return nextSibling
			? new ChildNodePointer(
					nextSibling,
					graftAncestor
						? {
								graftAncestor: graftAncestor.graftAncestor,
								offset: graftAncestor.offset + 1,
								parent: graftAncestor.parent
						  }
						: null
			  )
			: null;
	}

	public getNodeName(pointer: ElementNodePointer | AttributeNodePointer): string {
		return pointer.unwrap().nodeName;
	}

	public getNodeType(pointer: NodePointer): NODE_TYPES {
		return pointer.unwrap().nodeType;
	}

	public getParentNode(
		pointer: ChildNodePointer,
		bucket: string | null = null
	): ParentNodePointer {
		const unwrappedChildNode = pointer.unwrap();
		const graftAncestor = pointer.getGraftAncestor();
		if (!graftAncestor) {
			// check dom, or null if silhouette
			if (pointer.isSilhouette()) {
				return null;
			}
			const unwrappedParentNode = this._domFacade['getParentNode'](
				unwrappedChildNode,
				bucket
			) as ConcreteParentNode;
			return unwrappedParentNode ? new ParentNodePointer(unwrappedParentNode, null) : null;
		}
		// check the child at graftAncestor is that node
		if (unwrappedChildNode === graftAncestor.parent[graftAncestor.offset]) {
			// if yes
			return new ParentNodePointer(
				graftAncestor.parent as ParentNodeSilhouette | ConcreteParentNode,
				graftAncestor.graftAncestor
			);
		} else {
			// if not go to the dom
			if (pointer.isSilhouette()) {
				// if you have a silhouette, it should not be possible, throw error
				throw new Error('Boom, there should not be silhouette at this point');
			}
			const unwrappedParentNode = this._domFacade['getParentNode'](
				pointer.unwrap(),
				bucket
			) as ConcreteParentNode;
			return unwrappedParentNode ? new ParentNodePointer(unwrappedParentNode, null) : null;
		}
	}

	public getPrefix(pointer: AttributeNodePointer | ElementNodePointer): string {
		return pointer.unwrap().prefix;
	}

	public getPreviousSibling(
		pointer: ChildNodePointer,
		bucket: string | null = null
	): ChildNodePointer {
		let previousSibling;
		const graftAncestor = pointer.getGraftAncestor();
		if (pointer.isSilhouette()) {
			if (!graftAncestor) {
				return null;
			}
			const offset = graftAncestor.offset;
			const allSiblings = isNodeSilhouette(graftAncestor.parent)
				? (graftAncestor.parent as ParentNodeSilhouette).childNodes
				: this.getChildNodes(this.getParentNode(pointer, bucket), bucket);
			previousSibling = allSiblings[offset - 1];
		} else {
			previousSibling = pointer.unwrap() as Node;
			while (previousSibling) {
				previousSibling = this._domFacade['getPreviousSibling'](
					previousSibling as Node,
					bucket
				);
				if (previousSibling && previousSibling.nodeType !== NODE_TYPES.DOCUMENT_TYPE_NODE) {
					break;
				}
			}
		}

		return previousSibling
			? new ChildNodePointer(
					previousSibling,
					graftAncestor
						? {
								graftAncestor: graftAncestor.graftAncestor,
								offset: graftAncestor.offset - 1,
								parent: graftAncestor.parent
						  }
						: null
			  )
			: null;
	}

	// Can be used to create an extra frame when tracking dependencies
	public getRelatedNodes(node, callback) {
		return callback(node, this);
	}

	public getTarget(pointer: ProcessingInstructionNodePointer): string {
		return pointer.unwrap().target;
	}

	public unwrap(): IDomFacade {
		return this._domFacade;
	}
}
export default DomFacade;
