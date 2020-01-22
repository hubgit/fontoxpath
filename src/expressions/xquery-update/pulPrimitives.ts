import { ConcreteDocumentNode, ConcreteTextNode } from '../../domFacade/ConcreteNode';
import QName from '../dataTypes/valueTypes/QName';
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

export const deletePu = (target: any | any) => {
	return new DeletePendingUpdate(target);
};

export const insertAfter = (target: any, content: any[]) => {
	return new InsertAfterPendingUpdate(target, content);
};

export const insertBefore = (target: any | any, content: any[]) => {
	return new InsertBeforePendingUpdate(target, content);
};

export const insertInto = (target: any, content: any[]) => {
	return new InsertIntoPendingUpdate(target, content);
};

export const insertIntoAsFirst = (target: any | any, content: any[]) => {
	return new InsertIntoAsFirstPendingUpdate(target, content);
};

export const insertIntoAsLast = (target: any | ConcreteDocumentNode, content: any[]) => {
	return new InsertIntoAsLastPendingUpdate(target, content);
};

export const insertAttributes = (target: any, content: any[]) => {
	return new InsertAttributesPendingUpdate(target, content);
};

export const rename = (target, newName: QName) => {
	return new RenamePendingUpdate(target, newName);
};

export const replaceElementContent = (target: any, text: ConcreteTextNode | null) => {
	return new ReplaceElementContentPendingUpdate(target, text);
};

export const replaceNode = (target: any | any, replacement: (any | any)[]) => {
	return new ReplaceNodePendingUpdate(target, replacement);
};

export const replaceValue = (target: any | any, stringValue: string) => {
	return new ReplaceValuePendingUpdate(target, stringValue);
};
