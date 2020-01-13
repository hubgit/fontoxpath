import atomize from '../dataTypes/atomize';
import castToType from '../dataTypes/castToType';
import sequenceFactory from '../dataTypes/sequenceFactory';

import { FUNCTIONS_NAMESPACE_URI } from '../staticallyKnownNamespaces';

import FunctionDefinitionType from './FunctionDefinitionType';

const fnTrace: FunctionDefinitionType = (
	_dynamicContext,
	executionParameters,
	_staticContext,
	arg,
	label
) => {
	return arg.mapAll(allItems => {
		const argumentAsStrings = allItems.map(value =>
			castToType(atomize(value, executionParameters), 'xs:string')
		);
		const message = label ? [argumentAsStrings, label.first().value] : [argumentAsStrings];
		if (executionParameters.logOutput === undefined) {
			// tslint:disable-next-line:no-console
			console.log.apply(console, message);
		} else {
			let newMessage = '';
			for (let i = 0; i < message[0].length; i++) {
				newMessage +=
					'{type: ' + message[0][i].type + ', value: ' + message[0][i].value + '}\n';
			}
			executionParameters.logOutput(newMessage);
		}
		return sequenceFactory.create(allItems);
	});
};

export default {
	declarations: [
		{
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			localName: 'trace',
			argumentTypes: ['item()*'],
			returnType: 'item()*',
			callFunction: fnTrace
		},
		{
			namespaceURI: FUNCTIONS_NAMESPACE_URI,
			localName: 'trace',
			argumentTypes: ['item()*', 'xs:string'],
			returnType: 'item()*',
			callFunction: fnTrace
		}
	]
};
