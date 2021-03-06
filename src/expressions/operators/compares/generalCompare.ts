import castToType from '../../dataTypes/castToType';
import isSubtypeOf from '../../dataTypes/isSubtypeOf';
import sequenceFactory from '../../dataTypes/sequenceFactory';
import valueCompare from './valueCompare';

import ISequence from '../../dataTypes/ISequence';
import DynamicContext from '../../DynamicContext';

const OPERATOR_TRANSLATION = {
	['equalOp']: 'eqOp',
	['notEqualOp']: 'neOp',
	['lessThanOrEqualOp']: 'leOp',
	['lessThanOp']: 'ltOp',
	['greaterThanOrEqualOp']: 'geOp',
	['greaterThanOp']: 'gtOp'
};

export default function generalCompare(
	operator: string,
	firstSequence: ISequence,
	secondSequence: ISequence,
	dynamicContext: DynamicContext
): ISequence {
	// Change operator to equivalent valueCompare operator
	operator = OPERATOR_TRANSLATION[operator];

	return secondSequence.mapAll(allSecondValues =>
		firstSequence
			.filter(firstValue => {
				for (let i = 0, l = allSecondValues.length; i < l; ++i) {
					// General comapres are value compare, with one difference:
					// If exactly one of the atomic values is an instance of xs:untypedAtomic, it is
					// cast to a type depending on the other value's dynamic type T according to the
					// following rules, in which V denotes the value to be cast:

					// If T is a numeric type or is derived from a numeric type, then V is cast to
					// xs:double.

					// If T is xs:dayTimeDuration or is derived from xs:dayTimeDuration, then V is
					// cast to xs:dayTimeDuration.

					// If T is xs:yearMonthDuration or is derived from xs:yearMonthDuration, then V
					// is cast to xs:yearMonthDuration.

					// In all other cases, V is cast to the primitive base type of T.
					let secondValue = allSecondValues[i];
					if (
						isSubtypeOf(firstValue.type, 'xs:untypedAtomic') ||
						isSubtypeOf(secondValue.type, 'xs:untypedAtomic')
					) {
						if (isSubtypeOf(firstValue.type, 'xs:numeric')) {
							secondValue = castToType(secondValue, 'xs:double');
						} else if (isSubtypeOf(secondValue.type, 'xs:numeric')) {
							firstValue = castToType(firstValue, 'xs:double');
						} else if (isSubtypeOf(firstValue.type, 'xs:dayTimeDuration')) {
							secondValue = castToType(secondValue, 'xs:dayTimeDuration');
						} else if (isSubtypeOf(secondValue.type, 'xs:dayTimeDuration')) {
							firstValue = castToType(firstValue, 'xs:dayTimeDuration');
						} else if (isSubtypeOf(firstValue.type, 'xs:yearMonthDuration')) {
							secondValue = castToType(secondValue, 'xs:yearMonthDuration');
						} else if (isSubtypeOf(secondValue.type, 'xs:yearMonthDuration')) {
							firstValue = castToType(firstValue, 'xs:yearMonthDuration');
						} else if (isSubtypeOf(firstValue.type, 'xs:untypedAtomic')) {
							firstValue = castToType(firstValue, secondValue.type);
						} else if (isSubtypeOf(secondValue.type, 'xs:untypedAtomic')) {
							secondValue = castToType(secondValue, firstValue.type);
						}
					}

					if (valueCompare(operator, firstValue, secondValue, dynamicContext)) {
						return true;
					}
				}
				return false;
			})
			.switchCases({
				default: () => sequenceFactory.singletonTrueSequence(),
				empty: () => sequenceFactory.singletonFalseSequence()
			})
	);
}
