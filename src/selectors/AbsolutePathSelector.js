define([
	'fontoxml-blueprints',
	'./Selector',
	'./dataTypes/Sequence'
], function (
	blueprints,
	Selector,
	Sequence
) {
	'use strict';

	var blueprintQuery = blueprints.blueprintQuery;

	/**
	 * @param  {Selector}  relativePathSelector
	 */
	function AbsolutePathSelector (relativePathSelector) {
		Selector.call(this, relativePathSelector.specificity);

		this._relativePathSelector = relativePathSelector;
	}

	AbsolutePathSelector.prototype = Object.create(Selector.prototype);
	AbsolutePathSelector.prototype.constructor = AbsolutePathSelector;

	AbsolutePathSelector.prototype.equals = function (otherSelector) {
		return otherSelector instanceof AbsolutePathSelector &&
			this._relativePathSelector.equals(otherSelector.relativePathSelector);
	};

	AbsolutePathSelector.prototype.evaluate = function (nodeSequence, blueprint) {
		// Assume this is the start, so only one node
		return this._relativePathSelector.evaluate(
			Sequence.singleton(blueprintQuery.getDocumentNode(blueprint, nodeSequence.value[0])), blueprint);
	};

	return AbsolutePathSelector;
});
