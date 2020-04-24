import React, {useEffect, useState} from 'react';
import Header from './Header';
import Tracks from './Tracks';

const initialState = 'playlist';

const Playlist = props => {
	const [state, setState] = useState(initialState);

	const {context, id, playlist, visible} = props;

	const collaborative = playlist.collaborative;
	const description = playlist.description;
	const images = playlist.images;
	const name = playlist.name;
	const publicPrivate = playlist.public;
	const snapshot = playlist.snapshot;
	const tracksTotal = playlist.tracksTotal;
	const uri = playlist.uri;

	useEffect(() => {
		if (context === uri && visible == id) setState('playlist active visible');
		else if (context === uri) setState('playlist active');
		else if (visible === id) setState('playlist visible');
		else setState(initialState);
	}, [context, uri, visible]);

	return (
		<article className={state} data-id={id} key={snapshot}>
			<Header collaborative={collaborative} description={description} images={images} name={name} publicPrivate={publicPrivate} tracksTotal={tracksTotal} />
			<Tracks id={id} />
		</article>
	);
}

export default Playlist;