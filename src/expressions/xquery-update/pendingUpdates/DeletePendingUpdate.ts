import { AttributeNodePointer, ChildNodePointer } from '../../../domClone/Pointer';
import { IPendingUpdate } from '../IPendingUpdate';
export class DeletePendingUpdate extends IPendingUpdate {
	public readonly type: 'delete';
	constructor(readonly target: AttributeNodePointer | ChildNodePointer) {
		super('delete');
	}
	public toTransferable() {
		return {
			['type']: this.type,
			['target']: this.target.unwrap()
		};
	}
}
