import * as chai from 'chai';
import * as slimdom from 'slimdom';

import { evaluateXPath, evaluateXPathToFirstNode } from 'fontoxpath';
import evaluateXPathToAsyncSingleton from 'test-helpers/evaluateXPathToAsyncSingleton';

let documentNode;
beforeEach(() => {
	documentNode = new slimdom.Document();
});

describe('AttributeConstructor', () => {
	it('can create an attribute', () => {
		const attribute = evaluateXPathToFirstNode<slimdom.Attr>(
			'attribute attr {"val"}',
			documentNode,
			undefined,
			{},
			{ language: evaluateXPath.XQUERY_3_1_LANGUAGE }
		);

		chai.assert.equal(attribute.nodeType, 2);
		chai.assert.equal(attribute.name, 'attr');
		chai.assert.equal(attribute.value, 'val');
	});
	it('can create an attribute with asynchronous', async () => {
		const attribute = await evaluateXPathToAsyncSingleton(
			`
		declare namespace fontoxpath="http://fontoxml.com/fontoxpath";
		attribute {fontoxpath:sleep("attr", 100)} {fontoxpath:sleep("val", 100)}`,
			documentNode,
			undefined,
			{},
			{ language: evaluateXPath.XQUERY_3_1_LANGUAGE }
		);

		chai.assert.equal(attribute.nodeType, 2);
		chai.assert.equal(attribute.name, 'attr');
		chai.assert.equal(attribute.value, 'val');
	});
});
