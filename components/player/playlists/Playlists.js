import React, {useContext, useEffect, useReducer} from 'react';
import {DeviceContext} from '../../App';
import PlaylistButton from './PlaylistButton';
import PlaylistHeader from './PlaylistHeader';
import PlaylistTracks from './PlaylistTracks';
import useCreateRequest from '../../hooks/useCreateRequest';

const clickEvent = {
	counter: 0,
	timeout: null
}

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

			for (const key in list[id]) {
				if (key === 'snapshot') list[id][key] = payload.snapshot_id;
				else if (key === 'tracksTotal') list[id][key] = payload.snapshot_id;
				else list[id][key] = payload[key];
			}

			if (loaded.includes(id) === false) loaded.push(payload);

			return {...playlists, list, loaded, visible: id};
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
		play: useCreateRequest('PUT', 'me/player/play'),
		playlist: useCreateRequest('GET', undefined, '?fields=collaborative, description, id, images, name, snapshot_id, tracks.total, uri'),
		playlists: useCreateRequest('GET', 'me/playlists', '?limit=50')
	}

	const checkPlaylistSnapshot = id => {
		const dynamicEndpointFragment = `playlists/${id}`;
		const snapshot = playlists.list[id].snapshot;

		requests.playlist({dynamicEndpointFragment})
			.then(response => {
				const code = response.status;

				if (code === 200) return response.json();
				throw new Error(code);
			})
			.then(payload => {
				const lastSnapshot = payload.snapshot_id;

				if (lastSnapshot === snapshot) return dispatch({payload: id, type: 'set_visible'});
				return dispatch({payload, type: 'update_playlist'});
			})
			.catch(error => device.catchRequest(error));
	}

	const createPlaylistButtons = () => {
		const items = [];
		const list = playlists.list;

		for (const id in list) {
			const name = list[id].name;
			const snapshot = list[id].snapshot;
			const uri = list[id].uri;

			items.push(<PlaylistButton context={context} key={snapshot} name={name} uri={uri} />)
		};

		return items;
	}

	const createPlaylistsData = () => {
		const items = [];

		playlists.loaded.forEach(id => {
			const playlist = playlists.list[id];

			const description = playlist.description;
			const images = playlist.images;
			const name = playlist.name;
			const snapshot = playlist.snapshot;
			const tracksTotal = playlist.tracksTotal;
			const uri = playlist.uri;

			const header = <PlaylistHeader description={description} images={images} name={name} tracksTotal={tracksTotal} />;
			const tracks = <PlaylistTracks id={id} />;

			items.push(<div data-id={id} key={snapshot}>{header}{tracks}</div>);
		});

		return items;
	}

	const handlePlaylistClick = uri => {
		const id = uri.split(':').pop();
		const visible = playlists.visible;

		if (id === visible) return;
		return checkPlaylistSnapshot(id);
	}

	const handlePlaylistClickEvents = e => {
		const target = e.target;
		const uri = (target.nodeName === 'LI') ? target.children[0].dataset.uri : target.dataset.uri;

		++clickEvent.counter;

		clearTimeout(clickEvent.timeout);

		if (clickEvent.counter === 1) {
			return clickEvent.timeout = setTimeout(() => {
				clickEvent.counter = 0;
				return handlePlaylistClick(uri);
			}, 500);
		} else if (clickEvent.counter === 2) {
			clickEvent.counter = 0;
			return handlePlaylistDoubleClick(uri);
		}
	}

	const handlePlaylistDoubleClick = uri => {
											console.log('device de double click:', device.isActive);
		const dynamicBodyContent = {'context_uri': uri};
		const dynamicParameters = (device.isActive === undefined) ? `?device_id=${device.id}` : '';

		return requests.play({dynamicBodyContent, dynamicParameters})
			.then(response => {
				const code = response.status;

				if (code === 204) {
					handlePlaylistClick(uri);
					return isPlaybackIntervalRenew();
				}
				throw new Error(code);
			})
			.catch(error => device.catchRequest(error));
	};

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

	const playlistButtons = (playlists.list) ? createPlaylistButtons() : null;
	const playlistsData = (playlists.loaded.length > 0) ? createPlaylistsData() : null;

	if (playlists.list === null) return <p>Loading playlists...</p>;
	return (
		<div id="playlists" data-context={context} data-visible={playlists.visible}>
			<ul onClick={handlePlaylistClickEvents}>
				{playlistButtons}
			</ul>
			<div>
				{playlistsData}
			</div>
		</div>
	);
}

export default Playlists;