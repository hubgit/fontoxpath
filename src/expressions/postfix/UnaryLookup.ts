import EmptySequence from '../dataTypes/Sequences/EmptySequence';
import DynamicContext from '../DynamicContext';
import ExecutionParameters from '../ExecutionParameters';
import Expression from '../Expression';
import Specificity from '../Specificity';
import evaluateLookup from './evaluateLookup';

class UnaryLookup extends Expression {
	private _keySpecifier: string | number | Expression;

	constructor(keySpecifier: string | number | Expression) {
		super(new Specificity({
			[Specificity.EXTERNAL_KIND]: 1
		}), [], { canBeStaticallyEvaluated: false });

		this._keySpecifier = keySpecifier;
	}

	public evaluate(dynamicContext: DynamicContext, executionParameters: ExecutionParameters) {
		return evaluateLookup(
			dynamicContext.contextItem,
			this._keySpecifier,
			new EmptySequence(),
			dynamicContext,
			executionParameters
			);
	}
}

export default UnaryLookup;