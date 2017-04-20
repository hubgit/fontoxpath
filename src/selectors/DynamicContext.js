/**
 * @typedef {./dataTypes/Sequence}
 */
let Sequence;

/**
 * All possible permutations
 * @typedef {!{contextItemIndex: !number, contextSequence: !Sequence}|{variables: Object}}|{contextItemIndex: number, contextSequence: !Sequence, domFacade: !IDomFacade, variables: !Object}}
 */
let ScopingType;

class DynamicContext {
	/**
	 * @param  {{contextItem: ./dataTypes/Item, contextItemIndex: ?number, contextSequence: ?Sequence, domFacade: !IDomFacade, variables: !Object, cache: Cache}}  context  The context to overlay
	 */
	constructor (context) {
		/**
		 * @type {?number}
		 * @const
		 */
		this.contextItemIndex = context.contextItemIndex;

		/**
		 * @type {?Sequence}
		 * @const
		 */
		this.contextSequence = context.contextSequence;

		/**
		 * @type {?./dataTypes/Item}
		 * @const
		 */
		this.contextItem = context.contextItem;

		/**
		 * @type {!IDomFacade}
		 * @const
		 */
		this.domFacade = context.domFacade;

		/**
		 * @type {!Object}
		 * @const
		 */
		this.variables = context.variables;
	}

	toString () {
		const variables = `(variables ${Object.keys(this.variables).map(varKey => `(var ${varKey} ${this.variables[varKey].toString()})`)})`;
		return `(dynamicContext ${this.contextSequence.value.length} ${this.contextItemIndex} ${this.contextItem.toString()} ${variables})`;
	}

	/**
	 * @param   {!ScopingType}    overlayContext
	 * @return  {!DynamicContext}
	 */
	_createScopedContext (overlayContext) {
		return new DynamicContext({
			contextItemIndex: overlayContext.contextItemIndex !== undefined ? overlayContext.contextItemIndex : this.contextItemIndex,
			contextSequence: overlayContext.contextSequence ? overlayContext.contextSequence : this.contextSequence,
			domFacade: overlayContext.domFacade ? overlayContext.domFacade : this.domFacade,
			variables: overlayContext.variables ? Object.assign({}, this.variables, overlayContext.variables) : this.variables,
			contextItem: overlayContext.contextItem ? overlayContext.contextItem : this.contextItem
		});
	}

	createSequenceIterator (contextSequence) {
		const innerContext = this._createScopedContext({ contextSequence, contextItemIndex: 0 });
		let i = 0;
		const iterator = contextSequence.value();
		return {
			[Symbol.iterator]: function () {
				return this;
			},
			next: () => {
				const value = iterator.next();
				if (value.done) {
					return value;
				}
				return {
					done: false,
					value: innerContext._createScopedContext({
						contextItemIndex: i++,
						contextItem: value.value
					})
				};
			}
		};
	}
}

export default DynamicContext;
