import Expression, { RESULT_ORDERINGS } from '../Expression';
import Specificity from '../Specificity';

import { TextNodePointer, TextNodeSilhouette } from '../../domClone/Pointer';
import { NODE_TYPES } from '../../domFacade/ConcreteNode';
import castToType from '../dataTypes/castToType';
import createPointerValue from '../dataTypes/createPointerValue';
import sequenceFactory from '../dataTypes/sequenceFactory';
import DynamicContext from '../DynamicContext';
import ExecutionParameters from '../ExecutionParameters';

class TextConstructor extends Expression {
	private _expr: Expression;
	constructor(expr: Expression | null) {
		super(expr ? expr.specificity : new Specificity({}), expr ? [expr] : [], {
			canBeStaticallyEvaluated: false,
			resultOrder: RESULT_ORDERINGS.UNSORTED
		});

		this._expr = expr;
	}

	public evaluate(dynamicContext: DynamicContext, executionParameters: ExecutionParameters) {
		const nodesFactory = executionParameters.nodesFactory;
		if (!this._expr) {
			return sequenceFactory.empty();
		}
		const sequence = this._expr.evaluateMaybeStatically(dynamicContext, executionParameters);
		return sequence.atomize(executionParameters).mapAll(items => {
			if (items.length === 0) {
				return sequenceFactory.empty();
			}
			const content = items.map(item => castToType(item, 'xs:string').value).join(' ');

			const textNodeSilhouette: TextNodeSilhouette = {
				data: content,
				isSilhouette: true,
				nodeType: NODE_TYPES.TEXT_NODE
			};
			const textNodePointer = new TextNodePointer(textNodeSilhouette, null);

			return sequenceFactory.singleton(
				createPointerValue(
					// nodesFactory.createTextNode(content),
					textNodePointer,
					executionParameters.domFacade
				)
			);
		});
	}
}

export default TextConstructor;
