function areGraftAncestorsSame(graftAncestor1, graftAncestor2) {
	if (graftAncestor1 === graftAncestor2) {
		return true;
	}

	if (
		graftAncestor1.offset === graftAncestor2.offset &&
		graftAncestor1.parent === graftAncestor2.parent
	) {
		return areGraftAncestorsSame(graftAncestor1.graftAncestor, graftAncestor2.graftAncestor);
	}

	return false;
}

function arePointersEqual(pointer1, pointer2) {
	if (
		pointer1 === pointer2 ||
		(pointer1.node === pointer2.node &&
			areGraftAncestorsSame(pointer1.graftAncestor, pointer2.graftAncestor))
	) {
		return true;
	}

	return false;
}

export default arePointersEqual;
