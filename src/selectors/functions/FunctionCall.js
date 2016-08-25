define([
	'./FunctionRegistry',
	'../../parsing/customTestsByName',
	'../dataTypes/Sequence',
	'../dataTypes/BooleanValue',
	'../Selector',
	'../Specificity'
], function (
	FunctionRegistry,
	customTestsByName,
	Sequence,
	BooleanValue,
	Selector,
	Specificity
	) {
	'use strict';

	/**
	 * @param  {string}      functionName  The name of the function to execute
	 * @param  {Selector[]}  args          The arguments for the function. Evaluated and passed to the function
	 */
	function FunctionCall (functionName, args) {
		Selector.call(this, new Specificity({external: 1}));

		// TODO: fonto(-|:).* syntax

		this._args = args;
		this._functionName = functionName;
	}

	FunctionCall.prototype = Object.create(Selector.prototype);
	FunctionCall.prototype.constructor = FunctionCall;

	FunctionCall.prototype.evaluate = function (dynamicContext) {
		var contextItem = dynamicContext.contextItem,
			domFacade = dynamicContext.domFacade;
		var evaluatedArguments = this._args.map(function (argument) {
				return argument.evaluate(dynamicContext);
			});

		// Important to know: all functions having the fonto: syntax are simplified tests which should directly be called with JavaScript simple types. One pro: they always resolve to a boolean
		if (this._functionName.startsWith('fonto:')) {
			var customFunction = customTestsByName[this._functionName];
			var simplifiedArguments = evaluatedArguments.map(function (arg) {
					return arg.value[0].value;
				});
			var result = customFunction.bind.apply(
					customFunction,
					[undefined].concat(simplifiedArguments))
			// TODO: Fix this when doing dep tracking
				.call(undefined, contextItem.value[0].value, domFacade._blueprint);
			return Sequence.singleton(new BooleanValue(!!result));
		}

		var registeredFunction = FunctionRegistry.getFunction(this._functionName, evaluatedArguments);
		return registeredFunction.apply(
			undefined,
			[dynamicContext].concat(evaluatedArguments));
	};

	FunctionCall.prototype.equals = function (otherSelector) {
		if (this === otherSelector) {
			return true;
		}

		if (!(otherSelector instanceof FunctionCall)) {
			return false;
		}

		return this._functionName === otherSelector._functionName &&
			this._args.length === otherSelector.args.length &&
			this._args.every(function (arg, i) {
				return arg.equals(otherSelector.args[i]);
			});
	};

	return FunctionCall;
});
