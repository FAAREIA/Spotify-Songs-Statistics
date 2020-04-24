const useClickEventCounter = (handleClick, handleDoubleClick) => {
	const event = {
		timeout: null,
		uri: null
	}

	const listener = e => {
		const target = e.target;
		const uri = (target.nodeName === 'LI') ? target.children[0].dataset.uri : target.dataset.uri;

		clearTimeout(event.timeout);

		if (event.uri === uri) {
			reset();
			return handleDoubleClick(uri);
		}

		event.timeout = setTimeout(() => {
			reset();
			return handleClick(uri);
		}, 500);
		event.uri = uri;
	}

	const reset = () => [event.timeout, event.uri] = [null, null];

	return listener;
}

export default useClickEventCounter;