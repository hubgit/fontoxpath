import Specificity from '../Specificity';
import TestAbstractExpression from './TestAbstractExpression';

class KindTest extends TestAbstractExpression {
	private _nodeType: number;
	constructor(nodeType: number) {
		super(
			new Specificity({
				[Specificity.NODETYPE_KIND]: 1
			})
		);

		this._nodeType = nodeType;
	}

	public evaluateToBoolean(_dynamicContext, node, executionParameters) {
		const nodeType = executionParameters.domFacade.getNodeType(node.value);
		if (this._nodeType === 3 && nodeType === 4) {
			// CDATA_SECTION_NODES should be regarded as text nodes, and CDATA does not exist in the XPath Data Model
			return true;
		}
		return this._nodeType === nodeType;
	}

	public getBucket() {
		return 'type-' + this._nodeType;
	}
}
export default KindTest;
