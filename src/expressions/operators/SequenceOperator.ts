import sequenceFactory from '../dataTypes/sequenceFactory';
import Expression, { RESULT_ORDERINGS } from '../Expression';
import PossiblyUpdatingExpression from '../PossiblyUpdatingExpression';
import Specificity from '../Specificity';
import concatSequences from '../util/concatSequences';

/**
 * The Sequence selector evaluates its operands and returns them as a single sequence
 */
class SequenceOperator extends PossiblyUpdatingExpression {
	constructor(expressions: Expression[]) {
		super(
			expressions.reduce((specificity, selector) => {
				return specificity.add(selector.specificity);
			}, new Specificity({})),
			expressions,
			{
				canBeStaticallyEvaluated: expressions.every(
					selector => selector.canBeStaticallyEvaluated
				),
				resultOrder: RESULT_ORDERINGS.UNSORTED
			}
		);
	}

	public performFunctionalEvaluation(dynamicContext, _executionParameters, sequenceCallbacks) {
		if (!sequenceCallbacks.length) {
			return sequenceFactory.empty();
		}
		return concatSequences(sequenceCallbacks.map(cb => cb(dynamicContext)));
	}
}

export default SequenceOperator;
