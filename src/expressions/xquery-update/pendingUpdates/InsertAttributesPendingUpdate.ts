import { AttributeNodePointer, ElementNodePointer } from '../../../domClone/Pointer';
import { IPendingUpdate } from '../IPendingUpdate';

export class InsertAttributesPendingUpdate extends IPendingUpdate {
	public readonly type: 'insertAttributes';
	constructor(readonly target: ElementNodePointer, readonly content: AttributeNodePointer[]) {
		super('insertAttributes');
	}
	public toTransferable() {
		return {
			['type']: this.type,
			['target']: this.target.unwrap(),
			content: this.content.map(pointer => pointer.unwrap())
		};
	}
}
