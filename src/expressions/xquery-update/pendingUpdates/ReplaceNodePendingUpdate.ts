import { AttributeNodePointer, ChildNodePointer } from '../../../domClone/Pointer';
import { IPendingUpdate } from '../IPendingUpdate';
export class ReplaceNodePendingUpdate extends IPendingUpdate {
	constructor(
		readonly target: AttributeNodePointer | ChildNodePointer,
		readonly replacement: (AttributeNodePointer | ChildNodePointer)[]
	) {
		super('replaceNode');
	}
	public toTransferable() {
		return {
			['type']: this.type,
			['target']: this.target.unwrap(),
			['replacement']: this.replacement.map(pointer => pointer.unwrap())
		};
	}
}
