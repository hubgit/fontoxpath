import * as chai from 'chai';
import * as slimdom from 'slimdom';

import {
	AttributeNodePointer,
	ChildNodePointer,
	ElementNodePointer,
	ParentNodePointer
} from 'fontoxpath/domClone/Pointer';
import jsonMlMapper from 'test-helpers/jsonMlMapper';
import { domFacade as adaptingDomFacade } from '../../src';
import DomFacade from '../../src/domFacade/DomFacade';

describe('DomFacade', () => {
	let documentNode: slimdom.Document;
	let domFacade;
	let attributeNode: slimdom.Attr;
	let attributeNodePointer: AttributeNodePointer;

	beforeEach(() => {
		documentNode = new slimdom.Document();
		jsonMlMapper.parse(
			[
				'someElement',
				{
					someAttribute: 'someValue'
				},
				['someChildElement'],
				['someChildElement']
			],
			documentNode
		);

		documentNode.insertBefore(
			documentNode.implementation.createDocumentType('qname', 'publicid', 'systemid'),
			documentNode.firstChild
		);

		attributeNode = documentNode.documentElement.getAttributeNode('someAttribute');
		attributeNodePointer = new AttributeNodePointer(attributeNode, null);
		domFacade = new DomFacade(adaptingDomFacade);
	});

	describe('getFirstChild()', () => {
		it('returns null for attributes', () =>
			chai.assert.isNull(domFacade.getFirstChild(attributeNodePointer)));
		it('returns the first child', () =>
			chai.assert.equal(
				domFacade
					.getFirstChild(new ParentNodePointer(documentNode.documentElement, null))
					.unwrap(),
				documentNode.documentElement.firstChild
			));
		it('returns null for attributes', () =>
			chai.assert.isNull(domFacade.getFirstChild(attributeNodePointer)));
		it('returns the first child', () =>
			chai.assert.equal(
				domFacade
					.getFirstChild(new ParentNodePointer(documentNode.documentElement, null))
					.unwrap(),
				documentNode.documentElement.firstChild
			));
		it('skips document type nodes', () => {
			chai.assert.equal(
				domFacade.getFirstChild(new ParentNodePointer(documentNode, null)).unwrap(),
				documentNode.documentElement
			);
		});
	});

	describe('getLastChild()', () => {
		it('returns null for attributes', () =>
			chai.assert.isNull(domFacade.getLastChild(attributeNodePointer)));
		it('returns the last child', () =>
			chai.assert.equal(
				domFacade
					.getLastChild(new ParentNodePointer(documentNode.documentElement, null))
					.unwrap(),
				documentNode.documentElement.lastChild
			));
		it('skips document type nodes', () => {
			documentNode.removeChild(documentNode.documentElement);
			// Now only the doctype is left
			chai.assert.isNull(domFacade.getLastChild(new ParentNodePointer(documentNode, null)));
		});
	});

	describe('getNextSibling()', () => {
		it('returns null for attributes', () =>
			chai.assert.isNull(domFacade.getNextSibling(attributeNodePointer)));
		it('returns the next sibling', () =>
			chai.assert.equal(
				domFacade
					.getNextSibling(
						new ChildNodePointer(
							documentNode.documentElement.firstChild as slimdom.Element,
							null
						)
					)
					.unwrap(),
				documentNode.documentElement.lastChild
			));
		it('skips document type nodes', () => {
			const commentNode = documentNode.insertBefore(
				documentNode.createComment('First'),
				documentNode.firstChild
			);
			chai.assert.equal(
				domFacade.getNextSibling(new ChildNodePointer(commentNode, null)).unwrap(),
				documentNode.lastChild
			);
		});
	});

	describe('getPreviousSibling()', () => {
		it('returns null for attributes', () =>
			chai.assert.isNull(domFacade.getPreviousSibling(attributeNodePointer)));
		it('returns the previous sibling', () =>
			chai.assert.equal(
				domFacade
					.getPreviousSibling(
						new ChildNodePointer(
							documentNode.documentElement.lastChild as slimdom.Element,
							null
						)
					)
					.unwrap(),
				documentNode.documentElement.firstChild
			));
		it('skips document type nodes', () => {
			chai.assert.isNull(
				domFacade.getPreviousSibling(
					new ChildNodePointer(documentNode.documentElement, null)
				)
			);
		});
	});

	describe('getChildNodes()', () => {
		it('returns empty array for attributes', () =>
			chai.assert.deepEqual(domFacade.getChildNodes(attributeNodePointer), []));
		it('returns the childNodes', () =>
			chai.assert.deepEqual(
				domFacade
					.getChildNodes(new ParentNodePointer(documentNode.documentElement, null))
					.map(e => e.unwrap()),
				documentNode.documentElement.childNodes
			));
	});

	describe('getParentNode()', () => {
		it('returns the defining element for attributes', () =>
			chai.assert.equal(
				domFacade.getParentNode(attributeNodePointer).unwrap(),
				documentNode.documentElement
			));
		it('returns the parentNode', () =>
			chai.assert.equal(
				domFacade
					.getParentNode(new ChildNodePointer(documentNode.documentElement, null))
					.unwrap(),
				documentNode
			));
	});

	describe('getAttribute()', () => {
		it('returns null for attributes', () =>
			chai.assert.isNull(domFacade.getAttribute(attributeNodePointer, 'attributeName')));
		it('returns an attribute value', () =>
			chai.assert.equal(
				domFacade.getAttribute(
					new ElementNodePointer(documentNode.documentElement, null),
					'someAttribute'
				),
				'someValue'
			));
		it('returns null if not attribute defined', () =>
			chai.assert.isNull(
				domFacade.getAttribute(
					new ElementNodePointer(documentNode.documentElement, null),
					'no_such_attribute'
				)
			));
	});

	describe('getAllAttributes()', () => {
		it('returns empty array for attributes', () =>
			chai.assert.deepEqual(domFacade.getAllAttributes(attributeNodePointer), []));
		it('returns an attribute value', () => {
			chai.assert.deepEqual(
				domFacade
					.getAllAttributes(new ElementNodePointer(documentNode.documentElement, null))
					.map(ap => ap.unwrap())
					.map(({ name, value }) => ({ name, value })),
				[{ name: 'someAttribute', value: 'someValue' }]
			);
		});
	});

	describe('getData()', () => {
		it('returns the value for attributes', () =>
			chai.assert.equal(domFacade.getData(attributeNodePointer), 'someValue'));
		it('returns the empty string for elements', () =>
			chai.assert.equal(
				domFacade.getData(new ElementNodePointer(documentNode.documentElement, null)),
				''
			));
	});

	describe('getRelatedNodes()', () => {
		it('returns the result of the callback', () =>
			chai.assert.equal(
				domFacade.getRelatedNodes(attributeNodePointer, () => documentNode),
				documentNode
			));
	});
});
