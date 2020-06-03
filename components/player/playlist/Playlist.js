import React, {useEffect, useState} from 'react';
import Header from './Header';
import SearchForm from '../../search/Form';
import Tracks from './Tracks';

const initialState = 'playlist';

const Playlist = props => {
	const [state, setState] = useState(initialState);

	const {context, id, isPlaybackIntervalRenew, playlist, visible} = props;

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

				console.log('- - - - - - Se renderizó: ONE PLAYLIST:');
	return (
		<article className={state} data-id={id}>
			<Header collaborative={collaborative} description={description} images={images} isPlaybackIntervalRenew={isPlaybackIntervalRenew} name={name} playlistUri={uri} publicPrivate={publicPrivate} tracksTotal={tracksTotal} />
			<SearchForm placeholder="Search artists, albums and tracks" />
			<Tracks isPlaybackIntervalRenew={isPlaybackIntervalRenew} playlistUri={uri} />
		</article>
	);
}

export default Playlist;