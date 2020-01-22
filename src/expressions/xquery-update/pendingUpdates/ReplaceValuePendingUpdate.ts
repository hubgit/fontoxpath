import { AttributeNodePointer, ElementNodePointer } from '../../../domClone/Pointer';
import { IPendingUpdate } from '../IPendingUpdate';
export class ReplaceValuePendingUpdate extends IPendingUpdate {
	public readonly type: 'replaceValue';
	constructor(
		readonly target: ElementNodePointer | AttributeNodePointer,
		readonly stringValue: string
	) {
		super('replaceValue');
	}
	public toTransferable() {
		return {
			['type']: this.type,
			['target']: this.target.unwrap(),
			['string-value']: this.stringValue
		};
	}
}
