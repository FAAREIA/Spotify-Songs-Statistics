import React, {useEffect, useState} from 'react';

const PlaylistButton = props => {
	const [state, setState] = useState(null);

	const {context, name, uri} = props;

	useEffect(() => {
		if (context === uri) setState('active');
		else setState(null);
	}, [context, uri]);

	return <li><button className={state} data-uri={uri} type="button">{name}</button></li>;
}

export default PlaylistButton;