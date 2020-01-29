import IDocumentWriter from '../../documentWriter/IDocumentWriter';
import {
	AttributeNodePointer,
	CDATASectionNodePointer,
	CharacterDataNodePointer,
	CommentNodePointer,
	DocumentNodePointer,
	ElementNodePointer,
	NodePointer,
	ParentNodePointer,
	ProcessingInstructionNodePointer,
	TextNodePointer
} from '../../domClone/Pointer';
import {
	ConcreteDocumentNode,
	ConcreteElementNode,
	NODE_TYPES
} from '../../domFacade/ConcreteNode';
import DomFacade from '../../domFacade/DomFacade';
import INodesFactory from '../../nodesFactory/INodesFactory';
import createPointerValue from '../dataTypes/createPointerValue';
import ISequence from '../dataTypes/ISequence';
import isSubtypeOf from '../dataTypes/isSubtypeOf';
import sequenceFactory from '../dataTypes/sequenceFactory';
import QName from '../dataTypes/valueTypes/QName';
import DynamicContext from '../DynamicContext';
import ExecutionParameters from '../ExecutionParameters';
import Expression, { RESULT_ORDERINGS } from '../Expression';
import { separateXDMValueFromUpdatingExpressionResult } from '../PossiblyUpdatingExpression';
import Specificity from '../Specificity';
import StaticContext from '../StaticContext';
import UpdatingExpressionResult from '../UpdatingExpressionResult';
import { IAsyncIterator, IterationHint, ready } from '../util/iterators';
import { IPendingUpdate } from './IPendingUpdate';
import { applyUpdates, mergeUpdates } from './pulRoutines';
import UpdatingExpression from './UpdatingExpression';
import { errXUDY0014, errXUDY0037, errXUTY0013 } from './XQueryUpdateFacilityErrors';

function deepCloneNode(
	pointer: NodePointer,
	domFacade: DomFacade,
	nodesFactory: INodesFactory,
	documentWriter: IDocumentWriter
): NodePointer {
	// Each copied node receives a new node identity. The parent, children, and attributes properties of the copied nodes are set so as to preserve their inter-node relationships. The parent property of the copy of $node is set to empty. Other properties of the copied nodes are determined as follows:

	// For a copied document node, the document-uri property is set to empty.
	// For a copied element node, the type-name property is set to xs:untyped, and the nilled, is-id, and is-idrefs properties are set to false.
	// For a copied attribute node, the type-name property is set to xs:untypedAtomic and the is-idrefs property is set to false. The is-id property is set to true if the qualified name of the attribute node is xml:id; otherwise it is set to false.
	// The string-value of each copied element and attribute node remains unchanged, and its typed value becomes equal to its string value as an instance of xs:untypedAtomic.
	// 	Note:Implementations that store only the typed value of a node are required at this point to convert the typed value to a string form.
	// If copy-namespaces mode in the static context specifies preserve, all in-scope-namespaces of the original element are retained in the new copy. If copy-namespaces mode specifies no-preserve, the new copy retains only those in-scope namespaces of the original element that are used in the names of the element and its attributes.
	// All other properties of the copied nodes are preserved.

	switch (domFacade.getNodeType(pointer)) {
		case NODE_TYPES.ELEMENT_NODE:
			pointer = pointer as ElementNodePointer;
			const cloneElem = nodesFactory.createElementNS(
				domFacade.getNamespaceURI(pointer as ElementNodePointer),
				domFacade.getNodeName(pointer as ElementNodePointer)
			);
			domFacade
				.getAllAttributes(pointer as ElementNodePointer)
				.forEach(attr =>
					documentWriter.setAttributeNS(
						cloneElem,
						domFacade.getNamespaceURI(attr),
						domFacade.getNodeName(attr),
						domFacade.getData(attr)
					)
				);
			for (const child of domFacade.getChildNodes(pointer as ElementNodePointer)) {
				const descendant = deepCloneNode(child, domFacade, nodesFactory, documentWriter);
				documentWriter.insertBefore(
					cloneElem as ConcreteElementNode,
					descendant.unwrap(),
					null
				);
			}
			return new ElementNodePointer(cloneElem, null);
		case NODE_TYPES.ATTRIBUTE_NODE:
			pointer = pointer as AttributeNodePointer;
			const cloneAttr = nodesFactory.createAttributeNS(
				domFacade.getNamespaceURI(pointer as AttributeNodePointer),
				domFacade.getNodeName(pointer as AttributeNodePointer)
			);
			cloneAttr.value = domFacade.getData(pointer as AttributeNodePointer);
			return new AttributeNodePointer(cloneAttr, null);
		case NODE_TYPES.CDATA_SECTION_NODE:
			return new CharacterDataNodePointer(
				nodesFactory.createCDATASection(
					domFacade.getData(pointer as CDATASectionNodePointer)
				),
				null
			);
		case NODE_TYPES.COMMENT_NODE:
			return new CommentNodePointer(
				nodesFactory.createComment(domFacade.getData(pointer as AttributeNodePointer)),
				null
			);
		case NODE_TYPES.DOCUMENT_NODE:
			const cloneDoc = nodesFactory.createDocument();
			for (const child of domFacade.getChildNodes(pointer as ParentNodePointer)) {
				const descendant = deepCloneNode(child, domFacade, nodesFactory, documentWriter);
				documentWriter.insertBefore(
					cloneDoc as ConcreteDocumentNode,
					descendant.unwrap(),
					null
				);
			}
			return new DocumentNodePointer(cloneDoc, null);
		case NODE_TYPES.PROCESSING_INSTRUCTION_NODE:
			return new ProcessingInstructionNodePointer(
				nodesFactory.createProcessingInstruction(
					domFacade.getTarget(pointer as ProcessingInstructionNodePointer),
					domFacade.getData(pointer as ProcessingInstructionNodePointer)
				),
				null
			);
		case NODE_TYPES.TEXT_NODE:
			return new TextNodePointer(
				nodesFactory.createTextNode(domFacade.getData(pointer as TextNodePointer)),
				null
			);
	}
}

function isCreatedNode(node, createdNodes, domFacade) {
	if (createdNodes.includes(node)) {
		return true;
	}
	const parent = domFacade.getParentNode(node);
	return parent ? isCreatedNode(parent, createdNodes, domFacade) : false;
}

type VariableBinding = { registeredVariable?: string; sourceExpr: Expression; varRef: QName };

class TransformExpression extends UpdatingExpression {
	public _modifyExpr: Expression;
	public _returnExpr: Expression;
	public _variableBindings: VariableBinding[];

	constructor(
		variableBindings: VariableBinding[],
		modifyExpr: Expression,
		returnExpr: Expression
	) {
		super(
			new Specificity({}),
			variableBindings.reduce(
				(childExpressions, variableBinding) => {
					childExpressions.push(variableBinding.sourceExpr);
					return childExpressions;
				},
				[modifyExpr, returnExpr]
			),
			{
				canBeStaticallyEvaluated: false,
				resultOrder: RESULT_ORDERINGS.UNSORTED
			}
		);
		this._variableBindings = variableBindings;
		this._modifyExpr = modifyExpr;
		this._returnExpr = returnExpr;
	}

	public evaluate(
		dynamicContext: DynamicContext,
		executionParameters: ExecutionParameters
	): ISequence {
		// If we were updating, the calling code would have called the evaluateWithUpdateList
		// method. We can assume we're not actually updating
		const pendingUpdateIterator = this.evaluateWithUpdateList(
			dynamicContext,
			executionParameters
		);
		return separateXDMValueFromUpdatingExpressionResult(pendingUpdateIterator, _pul => {});
	}

	public evaluateWithUpdateList(
		dynamicContext: DynamicContext,
		executionParameters: ExecutionParameters
	): IAsyncIterator<UpdatingExpressionResult> {
		const { domFacade, nodesFactory, documentWriter } = executionParameters;

		const sourceValueIterators: IAsyncIterator<UpdatingExpressionResult>[] = [];
		let modifyValueIterator: IAsyncIterator<UpdatingExpressionResult>;
		let returnValueIterator: IAsyncIterator<UpdatingExpressionResult>;

		let modifyPul: IPendingUpdate[];
		const createdNodes = [];
		const toMergePuls = [];

		return {
			next: () => {
				if (createdNodes.length !== this._variableBindings.length) {
					// The copy clause contains one or more variable bindings, each of which consists of a variable name and an expression called the source expression.
					for (let i = createdNodes.length; i < this._variableBindings.length; i++) {
						const variableBinding = this._variableBindings[i];
						let sourceValueIterator: IAsyncIterator<UpdatingExpressionResult> =
							sourceValueIterators[i];

						// Each variable binding is processed as follows:
						if (!sourceValueIterator) {
							sourceValueIterators[
								i
							] = sourceValueIterator = this.ensureUpdateListWrapper(
								variableBinding.sourceExpr
							)(dynamicContext, executionParameters);
						}
						const sv = sourceValueIterator.next(IterationHint.NONE);
						if (!sv.ready) {
							return sv;
						}

						// The result of evaluating the source expression must be a single node [err:XUTY0013]. Let $node be this single node.
						if (
							sv.value.xdmValue.length !== 1 ||
							!isSubtypeOf(sv.value.xdmValue[0].type, 'node()')
						) {
							throw errXUTY0013();
						}
						const node = sv.value.xdmValue[0];

						// A new copy is made of $node and all nodes that have $node as an ancestor, collectively referred to as copied nodes.
						const copiedNodes = createPointerValue(
							deepCloneNode(node.value, domFacade, nodesFactory, documentWriter),
							domFacade
						);
						createdNodes.push(copiedNodes.value);
						toMergePuls.push(sv.value.pendingUpdateList);

						// The variable name is bound to the top-level copied node generated in the previous step. The scope of this variable binding includes all subexpressions of the containing copy modify expression that appear after the variable binding clause, including the source expressions of later variable bindings, but it does not include the source expression to which the current variable name is bound.
						dynamicContext = dynamicContext.scopeWithVariableBindings({
							[variableBinding.registeredVariable]: () =>
								sequenceFactory.singleton(copiedNodes)
						});
					}
				}

				if (!modifyPul) {
					// The expression in the modify clause is evaluated,
					if (!modifyValueIterator) {
						modifyValueIterator = this.ensureUpdateListWrapper(this._modifyExpr)(
							dynamicContext,
							executionParameters
						);
					}
					const mv = modifyValueIterator.next(IterationHint.NONE);
					if (!mv.ready) {
						return mv;
					}
					// resulting in a pending update list (denoted $pul) and an XDM instance. The XDM instance is discarded, and does not form part of the result of the copy modify expression.
					modifyPul = mv.value.pendingUpdateList;
				}

				modifyPul.forEach(pu => {
					// If the target node of any update primitive in $pul is a node that was not newly created in Step 1, a dynamic error is raised [err:XUDY0014].
					if (pu.target && !isCreatedNode(pu.target, createdNodes, domFacade)) {
						throw errXUDY0014(pu.target);
					}

					// If $pul contains a upd:put update primitive, a dynamic error is raised [err:XUDY0037].
					if (pu.type === 'put') {
						throw errXUDY0037();
					}
				});

				// Let $revalidation-mode be the value of the revalidation mode in the static context of the library or main module containing the copy modify expression, and $inherit-namespaces be the value of inherit-namespaces in the static context of the copy modify expression. The following update operation is invoked: upd:applyUpdates($pul, $revalidation-mode, $inherit-namespaces).
				applyUpdates(modifyPul, null, null, domFacade, nodesFactory, documentWriter);

				// The return clause is evaluated, resulting in a pending update list and an XDM instance.
				if (!returnValueIterator) {
					returnValueIterator = this.ensureUpdateListWrapper(this._returnExpr)(
						dynamicContext,
						executionParameters
					);
				}
				const rv = returnValueIterator.next(IterationHint.NONE);
				if (!rv.ready) {
					return rv;
				}

				//  The result of the copy modify expression is the XDM instance returned, as well as a pending update list constructed by merging the pending update lists returned by any of the copy modify expression's copy or return clause operand expressions using upd:mergeUpdates. During evaluation of the return clause, changes applied to copied nodes by the preceding step are visible.
				return ready({
					xdmValue: rv.value.xdmValue,
					pendingUpdateList: mergeUpdates(rv.value.pendingUpdateList, ...toMergePuls)
				});
			}
		};
	}

	public performStaticEvaluation(staticContext: StaticContext) {
		staticContext.introduceScope();
		this._variableBindings.forEach(
			variableBinding =>
				(variableBinding.registeredVariable = staticContext.registerVariable(
					variableBinding.varRef.namespaceURI,
					variableBinding.varRef.localName
				))
		);
		super.performStaticEvaluation(staticContext);
		staticContext.removeScope();

		// If all of the copy modify expression's copy and return clauses have operand expressions
		// that are simple expressions, then the copy modify expression is a simple expression.

		// If any of the copy modify expression's copy or return clauses have operand expressions
		// that are updating expressions, then the copy modify expression is a updating expression.
		this.isUpdating =
			this._variableBindings.some(varBinding => varBinding.sourceExpr.isUpdating) ||
			this._returnExpr.isUpdating;
	}
}

export default TransformExpression;
