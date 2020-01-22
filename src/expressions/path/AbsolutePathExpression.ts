import Expression, { RESULT_ORDERINGS } from '../Expression';

import createPointerValue from '../dataTypes/createPointerValue';
import sequenceFactory from '../dataTypes/sequenceFactory';
import DynamicContext from '../DynamicContext';
import ExecutionParameters from '../ExecutionParameters';
import Specificity from '../Specificity';

class AbsolutePathExpression extends Expression {
	private _relativePathExpression: Expression;
	constructor(relativePathExpression: Expression) {
		super(
			relativePathExpression ? relativePathExpression.specificity : new Specificity({}),
			relativePathExpression ? [relativePathExpression] : [],
			{
				resultOrder: RESULT_ORDERINGS.SORTED,
				subtree: false,
				peer: false,
				canBeStaticallyEvaluated: false
			}
		);

		this._relativePathExpression = relativePathExpression;
	}

	public evaluate(dynamicContext: DynamicContext, executionParameters: ExecutionParameters) {
		if (dynamicContext.contextItem === null) {
			throw new Error('XPDY0002: context is absent, it needs to be present to use paths.');
		}
		const node = dynamicContext.contextItem.value;
		const domFacade = executionParameters.domFacade;
		const documentNode =
			domFacade.getNodeType(node) === node.DOCUMENT_NODE ? node : node.ownerDocument;
		// Assume this is the start, so only one node
		const contextSequence = sequenceFactory.singleton(
			createPointerValue(documentNode, domFacade)
		);
		return this._relativePathExpression
			? this._relativePathExpression.evaluateMaybeStatically(
					dynamicContext.scopeWithFocus(0, contextSequence.first(), contextSequence),
					executionParameters
			  )
			: contextSequence;
	}
}
export default AbsolutePathExpression;
