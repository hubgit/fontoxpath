import IDocumentWriter from '../../documentWriter/IDocumentWriter';
import { NODE_TYPES } from '../../domFacade/ConcreteNode';
import DomFacade from '../../domFacade/DomFacade';
import IDomFacade from '../../domFacade/IDomFacade';
import INodesFactory from '../../nodesFactory/INodesFactory';
import QName from '../dataTypes/valueTypes/QName';
import {
	deletePu,
	insertAfter,
	insertAttributes,
	insertBefore,
	insertInto,
	insertIntoAsFirst,
	insertIntoAsLast,
	rename,
	replaceElementContent,
	replaceNode,
	replaceValue
} from './applyPulPrimitives';
import { IPendingUpdate } from './IPendingUpdate';
import { DeletePendingUpdate } from './pendingUpdates/DeletePendingUpdate';
import { InsertAfterPendingUpdate } from './pendingUpdates/InsertAfterPendingUpdate';
import { InsertAttributesPendingUpdate } from './pendingUpdates/InsertAttributesPendingUpdate';
import { InsertBeforePendingUpdate } from './pendingUpdates/InsertBeforePendingUpdate';
import { InsertIntoAsFirstPendingUpdate } from './pendingUpdates/InsertIntoAsFirstPendingUpdate';
import { InsertIntoAsLastPendingUpdate } from './pendingUpdates/InsertIntoAsLastPendingUpdate';
import { InsertIntoPendingUpdate } from './pendingUpdates/InsertIntoPendingUpdate';
import { RenamePendingUpdate } from './pendingUpdates/RenamePendingUpdate';
import { ReplaceElementContentPendingUpdate } from './pendingUpdates/ReplaceElementContentPendingUpdate';
import { ReplaceNodePendingUpdate } from './pendingUpdates/ReplaceNodePendingUpdate';
import { ReplaceValuePendingUpdate } from './pendingUpdates/ReplaceValuePendingUpdate';
import { errXUDY0015, errXUDY0016, errXUDY0017, errXUDY0024 } from './XQueryUpdateFacilityErrors';

export const applyUpdates = (
	pul: any[],
	_revalidationModule,
	_inheritNamespaces,
	domFacade: DomFacade,
	nodesFactory: INodesFactory,
	documentWriter: IDocumentWriter
) => {};

const compatibilityCheck = (pul: any[], domFacade) => {
	function findDuplicateTargets(type, onFoundDuplicate) {
		const targets = new Set();
		pul.filter(pu => pu.type === type)
			.map(pu => pu.target)
			.forEach(target => {
				if (targets.has(target)) {
					onFoundDuplicate(target);
				}
				targets.add(target);
			});
	}

	// A dynamic error if any of the following conditions are detected:

	// 1. Two or more upd:rename primitives in $pul have the same target node [err:XUDY0015].
	findDuplicateTargets('rename', target => {
		throw errXUDY0015(target);
	});

	// 2. Two or more upd:replaceNode primitives in $pul have the same target node [err:XUDY0016].
	findDuplicateTargets('replaceNode', target => {
		throw errXUDY0016(target);
	});

	// 3. Two or more upd:replaceValue primitives in $pul have the same target node [err:XUDY0017].
	findDuplicateTargets('replaceValue', target => {
		throw errXUDY0017(target);
	});

	// 4. Two or more upd:replaceElementContent primitives in $pul have the same target node [err:XUDY0017].
	findDuplicateTargets('replaceElementContent', target => {
		throw errXUDY0017(target);
	});

	// 5. Two or more upd:put primitives in $pul have the same $uri operand [err:XUDY0031].

	// 6. Two or more primitives in $pul create conflicting namespace bindings for the same element node [err:XUDY0024].
	// The following kinds of primitives create namespace bindings:
	const newQNamesByElement = new Map();
	const getAttributeName = attribute =>
		new QName(attribute.prefix, attribute.namespaceURI, attribute.localName);
	// a. upd:insertAttributes creates one namespace binding on the $target element corresponding to
	//    the implied namespace binding of the name of each attribute node in $content.
	// b. upd:replaceNode creates one namespace binding on the $target element corresponding to the
	//    implied namespace binding of the name of each attribute node in $replacement.
	pul.filter(
		pu => pu.type === 'replaceNode' && pu.target.nodeType === NODE_TYPES.ATTRIBUTE_NODE
	).forEach((pu: ReplaceNodePendingUpdate) => {
		const element = domFacade.getParentNode(pu.target);
		const qNames = newQNamesByElement.get(element);
		if (qNames) {
			qNames.push(...pu.replacement.map(getAttributeName));
		} else {
			newQNamesByElement.set(element, pu.replacement.map(getAttributeName));
		}
	});
	// c. upd:rename creates a namespace binding on $target, or on the parent (if any) of $target if
	//    $target is an attribute node, corresponding to the implied namespace binding of $newName.
	pul.filter(
		pu => pu.type === 'rename' && pu.target.nodeType === NODE_TYPES.ATTRIBUTE_NODE
	).forEach((pu: RenamePendingUpdate) => {
		const element = domFacade.getParentNode(pu.target);
		if (!element) {
			return;
		}
		const qNames = newQNamesByElement.get(element);
		if (qNames) {
			qNames.push(pu.newName);
		} else {
			newQNamesByElement.set(element, [pu.newName]);
		}
	});

	newQNamesByElement.forEach((qNames, _element) => {
		const prefixes = {};
		qNames.forEach(qName => {
			if (!prefixes[qName.prefix]) {
				prefixes[qName.prefix] = qName.namespaceURI;
			}
			if (prefixes[qName.prefix] !== qName.namespaceURI) {
				throw errXUDY0024(qName.namespaceURI);
			}
		});
	});
};

export const mergeUpdates = (pul1: IPendingUpdate[], ...puls: IPendingUpdate[][]) => {
	return pul1.concat(...puls.filter(Boolean));
};
