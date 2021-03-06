import * as chai from 'chai';
import * as slimdom from 'slimdom';
import jsonMlMapper from 'test-helpers/jsonMlMapper';

import {
	evaluateXPathToNodes,
	evaluateXPathToStrings,
	getBucketForSelector,
	getBucketsForNode,
	IDomFacade
} from 'fontoxpath';

let documentNode;
beforeEach(() => {
	documentNode = new slimdom.Document();
});

describe('ancestor', () => {
	it('parses ancestor::', () => {
		jsonMlMapper.parse(
			['someParentElement', ['someElement', { someAttribute: 'someValue' }]],
			documentNode
		);
		chai.assert.deepEqual(
			evaluateXPathToNodes(
				'ancestor::someParentElement',
				documentNode.documentElement.firstChild
			),
			[documentNode.documentElement]
		);
	});

	it('correctly sets contextSequence', () => {
		jsonMlMapper.parse(
			['someParentElement', ['someElement', { someAttribute: 'someValue' }]],
			documentNode
		);
		chai.assert.deepEqual(
			evaluateXPathToStrings(
				'ancestor-or-self::*/position()',
				documentNode.documentElement.firstChild
			),
			['1', '2']
		);
	});

	it('passes buckets for ancestor', () => {
		jsonMlMapper.parse(['parentElement', ['childElement']], documentNode);

		const childNode = documentNode.firstChild.firstChild;
		const expectedBucket = getBucketForSelector('self::parentElement');

		const testDomFacade: IDomFacade = {
			getParentNode: (node: slimdom.Node, bucket: string | null) => {
				chai.assert.equal(bucket, expectedBucket);
				return null;
			}
		} as any;

		evaluateXPathToNodes('ancestor::parentElement', childNode, testDomFacade);
	});
});

describe('ancestor-or-self', () => {
	it('parses ancestor-or-self:: ancestor part', () => {
		jsonMlMapper.parse(
			['someParentElement', ['someElement', { someAttribute: 'someValue' }]],
			documentNode
		);
		chai.assert.deepEqual(
			evaluateXPathToNodes(
				'ancestor-or-self::someParentElement',
				documentNode.documentElement.firstChild
			),
			[documentNode.documentElement]
		);
	});
	it('parses ancestor-or-self:: self part', () => {
		jsonMlMapper.parse(
			['someParentElement', ['someElement', { someAttribute: 'someValue' }]],
			documentNode
		);
		chai.assert.deepEqual(
			evaluateXPathToNodes(
				'ancestor-or-self::someParentElement',
				documentNode.documentElement
			),
			[documentNode.documentElement]
		);
	});
	it('orders self before all ancestors', () => {
		jsonMlMapper.parse(['someParentElement', ['someElement']], documentNode);
		chai.assert.deepEqual(
			evaluateXPathToNodes('ancestor-or-self::*', documentNode.documentElement.firstChild),
			[documentNode.documentElement, documentNode.documentElement.firstChild]
		);
	});

	it('sets the context sequence', () => {
		jsonMlMapper.parse(['someParentElement', ['someElement']], documentNode);
		chai.assert.deepEqual(
			evaluateXPathToNodes('//someElement/ancestor::*[last()]', documentNode),
			[documentNode.documentElement]
		);
	});
});
