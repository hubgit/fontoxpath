import { ChildNodePointer, NodePointer } from '../../../domClone/Pointer';
import { IPendingUpdate } from '../IPendingUpdate';
export class InsertPendingUpdate extends IPendingUpdate {
	constructor(readonly target: NodePointer, readonly content: ChildNodePointer[], type: string) {
		super(type);
	}
	public toTransferable() {
		return {
			['type']: this.type,
			['target']: this.target.unwrap(),
			['content']: this.content.map(pointer => pointer.unwrap())
		};
	}
}
