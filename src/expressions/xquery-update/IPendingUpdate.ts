import { NodePointer } from '../../domClone/Pointer';

export abstract class IPendingUpdate {
	public readonly target: NodePointer;
	constructor(public type: string) {}

	public abstract toTransferable(): { type: string };
}
