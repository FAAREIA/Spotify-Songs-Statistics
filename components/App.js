import React, {createContext, useEffect, useReducer} from 'react';
import Error from './error/Error';
import Login from './login/Login';
import Player from './player/Player';

const DeviceContext = createContext();

const initialDevice = {
	error: null,
	id: null,
	isActive: null,
	name: null,
	player: null,
	state: null,
	status: 'loading',
	webApiToken: null
}

const getAlbumLink = album => 'el album link';

const getArtistsLinks = artists => artists.map(e => e.name).join(', ');

const getArtistsNames = artists => artists.map(e => e.name).join(', ');

const getBiggestImage = images => images.sort((a, b) => b.height - a.height)[0];

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
	const payload = action.payload;
	const type = action.type;

	switch (type) {
		case 'is_active':
			return (device.isActive === payload) ? device : {...device, isActive: payload};
		case 'ready':
			return {...initialDevice, ...action.payload, status: 'ready'};
		case 'request_credentials':
			return {...initialDevice, status: 'credentials'};
		case 'response_401':
			sessionStorage.removeItem('deviceToken');
			return {...initialDevice, error: 'Authorization has been refused for those credentials.', status: 'credentials'};
		case 'response_404':
			return {...device, error: 'Seems that there is no active device...'};
		case 'response_408':
			return {...device, error: 'Request timeout. Trying again...'};
		case 'response_429':
			return {...device, error: 'Too Many Requests. Rate limiting has been applied.'};
		case 'revoke_credentials':
			sessionStorage.removeItem('deviceToken');
			return {...initialDevice, error: action.error, status: 'credentials'};
		case 'show_error':
			return {...device, error: action.error};
		default:
			return {...device, error: 'Unknown error...'};
	}
}

const Device = () => {
	const [device, dispatch] = useReducer(reducer, initialDevice);

	const isError = (device.error) ? <Error error={device.error} /> : null;

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

	if (device.status === 'loading') return <p>Loading...</p>;
	if (device.status === 'credentials') return (<>{isError} <Login /></>);
	if (device.status === 'ready') {
		return (
			<>
			{isError}
			<DeviceContext.Provider value={{...device, catchRequest, getAlbumLink, getArtistsLinks, getArtistsNames, getBiggestImage, setIsActive}}>
				<Player />
			</DeviceContext.Provider>
			</>
		);
	}
}

export {DeviceContext};
export default Device;