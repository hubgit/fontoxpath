define([
], function (
) {
	function Value (value) {
		this.value = value;
	}

	Value.prototype.atomize = function (){
	};

	Value.prototype.getEffectiveBooleanValue = function () {
		throw new Error('Not implemented');
	};

	return Value;
});
