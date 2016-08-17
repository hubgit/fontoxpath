define([
	'../Selector',
	'../Specificity',
	'../dataTypes/Sequence',
	'../dataTypes/BooleanValue'
], function (
	Selector,
	Specificity,
	Sequence,
	BooleanValue
) {
	'use strict';

	function UniversalSelector () {
		Selector.call(this, new Specificity({universal: 1}));
	}

	UniversalSelector.prototype = Object.create(Selector.prototype);
	UniversalSelector.prototype.constructor = UniversalSelector;

	/**
	 * @param  {Node}       node
	 * @param  {Blueprint}  blueprint
	 */
	UniversalSelector.prototype.matches = function (node, blueprint) {
		return true;
	};

	UniversalSelector.prototype.equals = function (otherSelector) {
		if (this === otherSelector) {
			return true;
		}

		return otherSelector instanceof UniversalSelector;
	};

	UniversalSelector.prototype.evaluate = function () {
		return Sequence.singleton(new BooleanValue(true));
	};

	return UniversalSelector;
});
