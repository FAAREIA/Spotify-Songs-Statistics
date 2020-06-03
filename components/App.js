import React, {createContext, useEffect, useReducer} from 'react';
import Errors from './errors/Errors';
import Login from './login/Login';
import Player from './player/Player';

const DeviceContext = createContext();

const initialDevice = {
	error: {
		id: null,
		message: null
	},
	id: null,
	isActive: null,
	name: null,
	player: null,
	state: null,
	status: 'loading',
	webApiToken: null
}

const convertMsToMmSs = ms => {
	const minutes = Math.floor(ms / 60000);
	const seconds = ((ms % 60000) / 1000).toFixed(0);

	return `${minutes}:${seconds.padStart(2, '0')}`;
}

const getAlbumLink = album => {
	const id = getIdFromUri(album.uri);
	const name = album.name;

	return <button data-url={`album/${id}/`} type="button">{name}</button>;
};

const getArtistsLinks = (artists, uniqueKey) => {
	const items = [];

	artists.forEach((e, index) => {
		const id = e.id;
		const key = `${id}:${uniqueKey}`;
		const name = e.name;

		items.push(<button data-url={`artist/${id}/`} key={key} type="button">{name}</button>);
	});

	return items;
};

const getArtistsNames = artists => artists.map(e => e.name).join(', ');

const getBiggestImage = images => {
	if (images.length > 0) return images.sort((a, b) => b.height - a.height)[0];

	const noImage = {height: 0, url: '/img/no-image.svg', width: 0};
	return noImage;
};

const getIdFromUri = uri => uri.split(':').pop();

const getTypeFromUri = uri => uri.split(':').splice(-2, 1).pop();

const initiateDevice = dispatch => {
	return new Promise(resolve => {
		const name = sessionStorage.getItem('deviceName');
		const state = sessionStorage.getItem('deviceState');
		const token = sessionStorage.getItem('deviceToken');
		const webApiToken = window.location.hash.substring(14);

		const player = new window.Spotify.Player({
			getOAuthToken: f => f(token),
			name
		});

		player.on('account_error', e => dispatch({error: e.message, type: 'revoke_credentials'}));
		player.on('authentication_error', e => dispatch({error: e.message, type: 'revoke_credentials'}));
		player.on('initialization_error', e => dispatch({error: e.message, type: 'revoke_credentials'}));
		player.on('playback_error', e => dispatch({error: e.message, type: 'show_error'}));

		player.on('not_ready', e => dispatch({error: 'Device is not ready for playback', type: 'show_error'}));
		player.on('ready', e => {
			const id = e.device_id;
			const newDevice = {id, name, player, state, webApiToken};

			dispatch({payload: newDevice, type: 'ready'});
			resolve();
		});

		player.connect();
	});
}

const isSpotifyLoaded = () => {
	return new Promise(resolve => {
		if (window.Spotify) resolve();
		window.onSpotifyWebPlaybackSDKReady = () => resolve();
	});
}

const reducer = (device, action) => {
	const error = {
		id: Math.random(),
		message: null
	};
	const payload = action.payload;
	const type = action.type;

	switch (type) {
		case 'is_active':
			return (device.isActive === payload) ? device : {...device, isActive: payload};
		case 'ready':
			return {...initialDevice, ...payload, status: 'ready'};
		case 'request_credentials':
			return {...initialDevice, status: 'credentials'};
		case 'response_401':
		case 'revoke_credentials':
			error.message = (type === 'response_401') ? 'Authorization has been refused for those credentials.' : action.error;

			sessionStorage.removeItem('deviceToken');
			return {...initialDevice, error, status: 'credentials'};
		case 'response_404':
		case 'response_408':
		case 'response_429':
		case 'show_error':
		default:
			if (type === 'response_404') error.message = 'Seems that there is no active device...';
			else if (type === 'response_408') error.message = 'Request timeout. Trying again...';
			else if (type === 'response_429') error.message = 'Too Many Requests. Rate limiting has been applied.';
			else if (type === 'show_error') error.message = action.error;
			else error.message = 'Unknown error...';

			return {...device, error};
	}
}

const standarizeUri = uri => {
	const id = getIdFromUri(uri);
	const type = getTypeFromUri(uri);

	return `spotify:${type}:${id}`;
}

const Device = () => {
	const [device, dispatch] = useReducer(reducer, initialDevice);

	const catchRequest = error => {
		const code = (error.name === 'AbortError') ? 408 : error.message;

		if (code) return dispatch({type: `response_${code}`});
		return dispatch({error, type: 'show_error'});
	}

	const setIsActive = payload => dispatch({payload, type: 'is_active'});

	useEffect(() => {
		isSpotifyLoaded()
			.then(() => (sessionStorage.getItem('deviceToken')) ? initiateDevice(dispatch) : dispatch({type: 'request_credentials'}))
			.catch(error => dispatch({error, type: 'show_error'}));
	}, []);

	useEffect(() => () => device.player && device.player.disconnect(), [device.player]);

	const areErrors = (device.error.id) ? <Errors id={device.error.id} message={device.error.message} /> : null;

	const contextProviderValue = {
		...device,
		catchRequest,
		convertMsToMmSs,
		getAlbumLink,
		getArtistsLinks,
		getArtistsNames,
		getBiggestImage,
		getIdFromUri,
		getTypeFromUri,
		setIsActive,
		standarizeUri
	}

	if (device.status === 'loading') return <p>Loading...</p>;
	if (device.status === 'credentials') return (<><Login /> {areErrors}</>);
	if (device.status === 'ready') {
		return (
			<>
			<DeviceContext.Provider value={contextProviderValue}>
				<Player />
			</DeviceContext.Provider>
			{areErrors}
			</>
		);
	}
}

export {DeviceContext};
export default Device;