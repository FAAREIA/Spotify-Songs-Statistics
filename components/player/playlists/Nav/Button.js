import React, {useEffect, useState} from 'react';

const Button = props => {
	const [state, setState] = useState(null);

	const {context, id, name, uri, visible} = props;

	useEffect(() => {
		if (context === uri && visible === id) setState('active visible');
		else if (context === uri) setState('active');
		else if (visible === id) setState('visible');
		else setState(null);
	}, [context, uri, visible]);

	return <li><button className={state} data-uri={uri} data-id={id} type="button">{name}</button></li>;
}

export default Button;