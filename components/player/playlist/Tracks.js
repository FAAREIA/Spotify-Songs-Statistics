import React, {useContext, useEffect, useReducer} from 'react';
import {DeviceContext} from '../../App';
import useCreateRequest from '../../hooks/useCreateRequest';

const initialState = {
	attemps: 0,
	error: false,
	fields: 'items(track(album(name, uri), artists(name, uri), duration_ms, id, name, track_number, uri)), next',
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
			return {...state, error: true};
		case 'fetch_failed':
			attemps = state.attemps + 1;

			return {...state, attemps};
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

const Tracks = props => {
	const [state, dispatch] = useReducer(reducer, initialState);

	const {isPlaybackIntervalRenew, playlistUri} = props;

	const device = useContext(DeviceContext);

	const playlistId = device.getIdFromUri(playlistUri);

	const requests = {
		play: useCreateRequest('PUT', 'me/player/play'),
		playlistTracks: useCreateRequest('GET', `playlists/${playlistId}/tracks`, `?fields=${state.fields}&limit=${state.limit}&offset=${state.offset}`)
	}

	const createTracksList = payload => {
		const items = [];

		for (const track of payload) {
			items.push(
				<li data-uri={track.uri} key={`${playlistUri}:${track.id}`}>
					<dl>
						<dt className="hide">Name:</dt>
						<dd>{track.name}</dd>
						<dt className="hide">Artists:</dt>
						<dd className="artists">{device.getArtistsLinks(track.artists, track.id)}</dd>
						<dt className="hide">Album:</dt>
						<dd className="album">{device.getAlbumLink(track.album)}</dd>
						<dt className="hide">Duration:</dt>
						<dd>{device.convertMsToMmSs(track.duration_ms)}</dd>
					</dl>
				</li>
			);
		}

		return items;
	}

	const fetchPlaylistTracks = () => {
		return requests.playlistTracks()
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

	const handlePlayTrack = e => {
		const target = e.target;
		const trackUri = (target.nodeName === 'LI') ? target.dataset.uri : target.closest('li').dataset.uri;

		const dynamicBodyContent = {'context_uri': playlistUri, 'offset': {'uri': trackUri}};
		const dynamicParameters = (device.isActive === undefined) ? `?device_id=${device.id}` : '';

		return requests.play({dynamicBodyContent, dynamicParameters})
			.then(response => {
				const code = response.status;

				if (code === 204) return isPlaybackIntervalRenew();
				throw new Error(code);
			})
			.catch(error => device.catchRequest(error));
	}

	const resetState = () => dispatch({type: 'reset'});

	useEffect(() => {
		if (state.attemps < 3) fetchPlaylistTracks();
		else dispatch({type: 'error'});
	}, [state.attemps, state.offset]);

	const tracksList = (state.loaded) ? createTracksList(state.tracks) : null;

					console.log('- - - - - - Se renderizó: TRACKS');
	if (state.error) {
		return (
			<div className="tracks not-loaded">
				<p>Playlist could not be loaded...</p>
				<button onClick={resetState} type="button">Click here to try again...</button>
			</div>
		);
	}
	if (state.loaded === false) return <div className="tracks loading"><p>Loading playlist tracks...</p></div>;
	if (state.loaded === undefined) return <div className="tracks empty"><p>Empty playlist...</p></div>;
	if (state.loaded) return <div className="tracks"><ol onDoubleClick={handlePlayTrack}>{tracksList}</ol></div>;
}

export default Tracks;