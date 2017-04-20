import Selector from '../Selector';
import Sequence from '../dataTypes/Sequence';
import NodeValue from '../dataTypes/NodeValue';

function createChildGenerator (domFacade, node) {
	const childNodes = domFacade.getChildNodes(node);
	let i = 0;
	const l = childNodes.length;
	return {
		next () {
			if (i >= l) {
				return { done: true };
			}
			return {
				done: false,
				value: childNodes[i++]
			};
		}
	};
}

function createDescendantGenerator (domFacade, node, inclusive) {
	const descendantIteratorQueue = [createChildGenerator(domFacade, node, inclusive)];
	return {
		next: () => {
			if (inclusive) {
				inclusive = false;
				return {
					done: false,
					value: new NodeValue(node)
				};
			}
			if (!descendantIteratorQueue.length) {
				return { done: true };
			}
			let value = descendantIteratorQueue[0].next();
			while (value.done) {
				descendantIteratorQueue.shift();
				if (!descendantIteratorQueue.length) {
					return { done: true };
				}
				value = descendantIteratorQueue[0].next();
			}
			// Iterator over these children next
			descendantIteratorQueue.unshift(createChildGenerator(domFacade, value.value));
			return {
				done: false,
				value: new NodeValue(value.value)
			};
		}
	};
}

/**
 * @extends {Selector}
 */
class DescendantAxis extends Selector {
	/**
	 * @param  {!Selector}  descendantSelector
	 * @param  {{inclusive:boolean}=}    options
	 */
	constructor (descendantSelector, options) {
		options = options || { inclusive: false };
		super(descendantSelector.specificity, Selector.RESULT_ORDERINGS.SORTED);

		this._descendantSelector = descendantSelector;
		this._isInclusive = !!options.inclusive;
		this._getStringifiedValue = () => `(descendant ${this._isInclusive} ${this._descendantSelector.toString()})`;
	}

	evaluate (dynamicContext) {
		const inclusive = this._isInclusive;
		const descendantSelector = this._descendantSelector;
		const descendantSequence = new Sequence(() => createDescendantGenerator(
			dynamicContext.domFacade,
			dynamicContext.contextItem.value,
			inclusive));
		return descendantSequence.filter((item, i) => {
			const result = descendantSelector.evaluate(dynamicContext._createScopedContext({
				contextSequence: descendantSequence,
				contextItemIndex: i,
				contextItem: item
			}));

			return result.getEffectiveBooleanValue();
		});
	}
}
export default DescendantAxis;
