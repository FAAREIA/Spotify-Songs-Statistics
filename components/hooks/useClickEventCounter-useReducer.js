import {useEffect, useReducer} from 'react';

const initialState = {
	counter: 0,
	timeout: null,
	uri: null
}

const reducer = (state, action) => {
	const payload = action.payload;
	const type = action.type;

	switch (type) {
		case 'reset':
		default:
			return initialState;
		case 'set_timeout':
			return {...state, timeout: setTimeout(payload, 500, state.uri)};
		case 'set_uri':
			clearTimeout(state.timeout);

			if (state.uri === payload) return {...state, counter: state.counter + 1};
			return {...initialState, counter: 1, uri: payload};
	}
}

const useClickEventCounter = (handleClick, handleDoubleClick) => {
	const [state, dispatch] = useReducer(reducer, initialState);

	const dispatchClick = uri => {
		dispatch({type: 'reset'});
		return handleClick(uri);
	};

	const dispatchDoubleClick = uri => {
		dispatch({type: 'reset'});
		return handleDoubleClick(uri);
	};

	const listener = e => {
		const target = e.target;
		const uri = (target.nodeName === 'LI') ? target.children[0].dataset.uri : target.dataset.uri;

		dispatch({payload: uri, type: 'set_uri'});
	}

	useEffect(() => {
		if (state.counter === 1) dispatch({payload: dispatchClick, type: 'set_timeout'});
		else if (state.counter === 2) dispatchDoubleClick(state.uri);
	}, [state.counter]);

	return listener;
}

export default useClickEventCounter;