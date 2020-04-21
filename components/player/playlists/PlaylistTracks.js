import React, {useContext, useEffect, useReducer, useRef} from 'react';
import {DeviceContext} from '../../App';
import useCreateRequest from '../../hooks/useCreateRequest';

const initialState = {
	attemps: 0,
	error: null,
	fields: 'items(track(album(name, uri), artists(name, uri), duration_ms, name, track_number, uri)), next',
	limit: 100,
	loaded: false,
	offset: 0,
	tracks: []
}

const reducer = (state, action) => {
	const payload = action.payload;
	const type = action.type;

	let attemps;
	let offset;
	let tracks;

	switch (type) {
		case 'error':
			return {...state, error: 'Playlist could not be loaded...'};
		case 'fetch_failed':
			attemps = state.attemps + 1;

			return {...state, attemps}
		case 'no_tracks':
			return {...state, loaded: undefined};
		case 'reset':
			return initialState;
		case 'set_loaded':
			tracks = state.tracks.concat(payload);

			return {...state, loaded: true, tracks};
		case 'set_next':
			attemps = initialState.attemps;
			offset = state.offset + state.limit;
			tracks = state.tracks.concat(payload);

			return {...state, attemps, offset, tracks};
		default:
			return state;
	}
}

const PlaylistTracks = props => {
	const [state, dispatch] = useReducer(reducer, initialState);

	const device = useContext(DeviceContext);

	const requests = {
		playlistTracks: useCreateRequest('GET', `playlists/${props.id}/tracks`)
	}

	const createTrackList = payload => {
		const items = [];

		for (const track of payload) {
			items.push(
				<li data-uri={track.uri} key={track.uri}>
					<dl>
						<dt>Track name:</dt>
						<dd>{track.name}</dd>
						<dt>Artists name:</dt>
						<dd>{device.getArtistsLinks(track.artists)}</dd>
						<dt>Album name:</dt>
						<dd>{device.getAlbumLink(track.album)}</dd>
						<dt>Track duration:</dt>
						<dd>{track.duration_ms}</dd>
					</dl>
				</li>
			);
		}

		return items;
	}

	const fetchPlaylistTracks = () => {
		const dynamicParameters = `?fields=${state.fields}&limit=${state.limit}&offset=${state.offset}`;

		return requests.playlistTracks({dynamicParameters})
			.then(response => {
				const code = response.status;

				if (code === 200) return response.json();
				throw new Error(code);
			})
			.then(payload => {
				const tracks = payload.items.map(e => e.track);

				if (tracks.length === 0) return dispatch({type: 'no_tracks'});
				if (payload.next) return dispatch({payload: tracks, type: 'set_next'});
				return dispatch({payload: tracks, type: 'set_loaded'});
			})
			.catch(error => {
				dispatch({type: 'fetch_failed'});
				return device.catchRequest(error);
			});
	}

	const resetState = () => dispatch({type: 'reset'});

	useEffect(() => {
		if (state.attemps < 3) fetchPlaylistTracks();
		else dispatch({type: 'error'});
	}, [state.attemps, state.offset]);

	const trackList = (state.loaded) ? createTrackList(state.tracks) : null;

	if (state.error) {
		return (
			<>
			<p>{state.error}</p>
			<button onClick={resetState} type="button">Click here to try again...</button>
			</>
		);
	}
	if (state.loaded === false) return <p>Loading playlist tracks...</p>;
	if (state.loaded === undefined) return <p>Empty playlist...</p>;
	if (state.loaded) return <ul>{trackList}</ul>;
}

export default PlaylistTracks;