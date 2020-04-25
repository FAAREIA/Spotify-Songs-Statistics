import React, {useContext, useEffect, useReducer} from 'react';
import {DeviceContext} from '../../App';
import Nav from './Nav/Nav';
import Playlist from './../playlist/Playlist';
import useCreateRequest from '../../hooks/useCreateRequest';

const initialPlaylists = {
	list: null,
	loaded: [],
	visible: null
}

const reducer = (playlists, action) => {
	const payload = action.payload;
	const type = action.type;

	switch (type) {
		case 'set_list': {
			const list = {};

			for (const e of payload.items) {
				const playlist = {
					collaborative: e.collaborative,
					description: e.description,
					images: e.images,
					name: e.name,
					public: e.public,
					snapshot: e.snapshot_id,
					tracksTotal: e.tracks.total,
					uri: e.uri
				}

				list[e.id] = playlist;
			}

			return {...playlists, list};
		}
		case 'set_visible': {
			const loaded = playlists.loaded.slice();

			if (loaded.includes(payload) === false) loaded.push(payload);

			return {...playlists, loaded, visible: payload};
		}
		case 'update_playlist': {
			const id = payload.id;
			const list = JSON.parse(JSON.stringify(playlists.list));
			const loaded = playlists.loaded.slice();
			const playlist = list[id];

			for (const key in playlist) {
				if (key === 'snapshot') playlist[key] = payload.snapshot_id;
				else if (key === 'tracksTotal') playlist[key] = payload.tracks.total;
				else playlist[key] = payload[key];
			}

			if (loaded.includes(id) === false) loaded.push(payload);

			return {list, loaded, visible: id};
		}
		default: {
			return playlists;
		}
	}
}

const Playlists = props => {
	const [playlists, dispatch] = useReducer(reducer, initialPlaylists);

	const {context, isPlaybackIntervalRenew, track} = props;

	const device = useContext(DeviceContext);

	const requests = {
		playlist: useCreateRequest('GET', undefined, '?fields=collaborative, description, id, images, name, public, snapshot_id, tracks.total, uri'),
		playlists: useCreateRequest('GET', 'me/playlists', '?limit=50')
	}

	const standarizedContext = device.standarizeUri(context);

	const checkSnapshot = id => {
		const dynamicEndpointFragment = `playlists/${id}`;

		requests.playlist({dynamicEndpointFragment})
			.then(response => {
				const code = response.status;

				if (code === 200) return response.json();
				throw new Error(code);
			})
			.then(payload => {
				const lastSnapshot = payload.snapshot_id;
				const snapshot = playlists.list[id].snapshot;

				if (lastSnapshot === snapshot) return dispatch({payload: id, type: 'set_visible'});
				return dispatch({payload, type: 'update_playlist'});
			})
			.catch(error => device.catchRequest(error));
	}

	useEffect(() => {
		requests.playlists()
			.then(response => {
				const code = response.status;

				if (code === 200) return response.json();
				throw new Error(code);
			})
			.then(payload => dispatch({payload, type: 'set_list'}))
			.catch(error => device.catchRequest(error));
	}, []);

	useEffect(() => {
		const contextId = device.getIdFromUri(context);
		const contextType = device.getTypeFromUri(context);

		const prevTrack = document.querySelector('.playlist.active li.active');
		if (prevTrack) prevTrack.classList.remove('active');

		if (contextType === 'playlist') {
			const activeTrack = document.querySelector(`.playlist[data-id="${contextId}"] li[data-uri="${track}"]`);
			if (activeTrack) activeTrack.classList.add('active');
		}
	}, [track]);

	const createPlaylists = () => {
		const items = [];

		for (const id of playlists.loaded) {
			const playlist = playlists.list[id];
			const snapshot = playlist.snapshot;
			const visible = playlists.visible;

			items.push(<Playlist context={standarizedContext} id={id} isPlaybackIntervalRenew={isPlaybackIntervalRenew} key={snapshot} playlist={playlist} visible={visible} />);
		}

		return items;
	}

	const loadedPlaylists = (playlists.loaded.length > 0) ? createPlaylists() : null;

							console.log('- - - - - - Se renderizó: PLAYLISTS');
	if (playlists.list === null) return <p>Loading playlists...</p>;
	return (
		<section data-context={standarizedContext} data-track={track} data-visible={playlists.visible} id="playlists">
			<Nav checkSnapshot={checkSnapshot} context={standarizedContext} isPlaybackIntervalRenew={isPlaybackIntervalRenew} playlists={playlists.list} visible={playlists.visible} />
			{loadedPlaylists}
		</section>
	);
}

const areEqual = (prevProps, props) => {
	if (prevProps.context !== props.context) return false;
	if (prevProps.isPlaybackIntervalRenew !== props.isPlaybackIntervalRenew) return false;
	if (prevProps.track !== props.track) return false;
	return true;
};

export default React.memo(Playlists, areEqual);