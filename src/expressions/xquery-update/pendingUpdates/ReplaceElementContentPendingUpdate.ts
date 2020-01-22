import { ElementNodePointer } from '../../../domClone/Pointer';
import { Text } from '../../../types/Types';
import { IPendingUpdate } from '../IPendingUpdate';

export class ReplaceElementContentPendingUpdate extends IPendingUpdate {
	public readonly type: 'replaceElementContent';
	constructor(readonly target: ElementNodePointer, readonly text: Text) {
		super('replaceElementContent');
	}
	public toTransferable() {
		return {
			['type']: this.type,
			['target']: this.target.unwrap(),
			['text']: this.text
		};
	}
}
