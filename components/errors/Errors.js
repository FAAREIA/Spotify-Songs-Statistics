import React, {useEffect, useReducer} from 'react';
import ReactDOM from 'react-dom';
import ButtonClose from '../buttons/Close.js';

const initialErrors = {
	isDom: false,
	messages: [],
	status: []
}

let portal;

const reducer = (errors, action) => {
	const payload = action.payload;
	const type = action.type;

	switch (type) {
		case 'add_message':
			const messages = errors.messages.slice();
			const status = errors.status.slice();

			messages.push(payload);
			status.push(true);

			return {...errors, messages, status};
		case 'dom_ready':
			return {...errors, isDom: true};
		case 'hide_message':
		case 'show_last_message':
			const updatedStatus = errors.status.slice();

			updatedStatus.splice(payload, 1, (payload === -1));

			return {...errors, status: updatedStatus};
		default:
			return errors;
	}
}

const Errors = props => {
	const [errors, dispatch] = useReducer(reducer, initialErrors);

	const {id, message} = props;

	const createMessages = () => {
		const items = [];
		const messages = errors.messages.filter((e, index) => errors.status[index]);

		messages.forEach((e, index) => {
			const hideMessage = () => dispatch({payload: index, type: 'hide_message'});

			items.push(
				<li key={e}>
					{e}
					<ButtonClose handleOnClick={hideMessage}>Close</ButtonClose>
				</li>
			);
		});

		return (items.length > 0) ? items : null;
	}

	useEffect(() => {
		portal = document.createElement('div');

		portal.setAttribute('id', 'error');
		document.body.appendChild(portal);

		dispatch({type: 'dom_ready'});

		return () => portal.remove();
	}, []);

	useEffect(() => {
		const lastMessage = errors.messages.slice().pop();
		const lastStatus = errors.status.slice().pop();

		if (lastMessage === message && lastStatus === false) dispatch({payload: -1, type: 'show_last_message'});
		else if (lastMessage !== message) dispatch({payload: message, type: 'add_message'});
	}, [id, message]);

	const messages = createMessages();

	if (!errors.isDom || !messages) return null;
	return ReactDOM.createPortal(<ul>{messages}</ul>, portal);
};

export default Errors;