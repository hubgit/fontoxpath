import DomFacade from '../../domFacade/DomFacade';
import nodeValueCache from './nodeValueCache';

function getNodeSubType(pointer, domFacade: DomFacade) {
	switch (domFacade.getNodeType(pointer)) {
		case 2:
			return 'attribute()';
		case 1:
			return 'element()';
		case 3:
		case 4: // CDATA nodes are text too
			return 'text()';
		case 7:
			return 'processing-instruction()';
		case 8:
			return 'comment()';
		case 9:
			return 'document()';
		default:
			return 'node()';
	}
}

export default function createPointerValue(pointer, domFacade: DomFacade) {
	if (nodeValueCache.has(pointer)) {
		return nodeValueCache.get(pointer);
	}
	const nodeValue = { type: getNodeSubType(pointer, domFacade), value: pointer };
	nodeValueCache.set(pointer, nodeValue);
	return nodeValue;
}
