import evaluateXPath from './evaluateXPath';


const cache = Object.create(null);

window['cache'] = cache;

/**
 * Evaluates an XPath on the given contextNode.
 *
 * @param  {!string}           selector     The selector to execute. Supports XPath 3.1.
 * @param  {!Node}             contextNode    The node from which to run the XPath.
 * @param  {?IDomFacade=}      domFacade      The domFacade (or DomFacade like interface) for retrieving relations.
 * @param  {?Object=}          variables      Extra variables (name=>value). Values can be number / string or boolean.
 * @param  {?Object=}           options      Extra options for evaluating this XPath
 *
 * @return  {boolean}
 */
export default function evaluateXPathToBoolean (selector, contextNode, domFacade, variables, options) {
	let cacheForSelector = cache[selector];
	if (!cacheForSelector) {
		cacheForSelector = cache[selector] = new Map();
	}
	if (cacheForSelector.has(contextNode)) {
		const cachedValue = cacheForSelector.get(contextNode);
		cachedValue.uses++;
		return cachedValue.value;
	}

	const value = /** @type {boolean} */(evaluateXPath(selector, contextNode, domFacade, variables, evaluateXPath.BOOLEAN_TYPE, options));
	cacheForSelector.set(contextNode, {
		value,
		uses: 1
	});

	return value;
}
