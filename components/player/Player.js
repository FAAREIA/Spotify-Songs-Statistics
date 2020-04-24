import React, {useContext, useEffect, useReducer, useRef} from 'react';
import {DeviceContext} from '../App';
import Album from './track/Album';
import Controls from './track/Controls';
import Playlists from './playlists/Playlists';
import SeekBar from './track/SeekBar';
import useCreateRequest from '../hooks/useCreateRequest';

const initialPlayer = {
	controls: {
		isPlaying: null,
		repeat: null,
		shuffle: null,
		volume: null
	},
	track: {
		album: {
			images: null,
			name: null,
			uri: null
		},
		artists: null,
		context: null,
		duration: null,
		name: null,
		progress: null,
		uri: null
	}
}

let interval;

const reducer = (player, action) => {
	const payload = action.payload;
	const type = action.type;

	switch (type) {
		case 'current_playback':
		case 'last_played_track':
		case 'local_playback':
			let controls;
			let track;

			if (type === 'current_playback') {
				controls = [payload.is_playing, payload.repeat_state, payload.shuffle_state, null];
				track = payload.item;
			} else if (type === 'last_played_track') {
				controls = [false, 'off', true, null];
				track = payload.items[0].track;
			} else if (type === 'local_playback') {
				controls = [!payload.paused, ['off', 'context', 'track'][payload.repeat_mode], payload.shuffle, null];
				track = payload.track_window.current_track;
			}

			const [isPlaying, repeat, shuffle, volume] = controls;
			const context = payload.context || track.context;
			const newPlayer = {
				controls: {isPlaying, repeat, shuffle, volume},
				track: {
					album: {
						images: track.album.images,
						name: track.album.name,
						uri: track.album.uri
					},
					artists: track.artists,
					context: (context && context.uri) || track.album.uri,
					duration: track.duration_ms,
					name: track.name,
					progress: payload.progress_ms || payload.position || 0,
					uri: track.uri
				}
			}

			return newPlayer;
		case 'no_content':
		default:
			return player;
	}
}

const Player = () => {
	const [player, dispatch] = useReducer(reducer, initialPlayer);

	const controls = player.controls;
	const track = player.track;

	const device = useContext(DeviceContext);

	const hasTrackStartedRef = useRef(0);
	const isDeviceActiveRef = useRef(null);

	const requests = {
		currentPlayback: useCreateRequest('GET', 'me/player'),
		lastPlayedTrack: useCreateRequest('GET', 'me/player/recently-played', '?limit=1')
	}

	const getCurrentPlayback = async () => {
		const response = await requests.currentPlayback();
		const code = response.status;

		switch (code) {
			case 200:
				const payload = await response.json();

				dispatch({payload, type: 'current_playback'});
				return device.setIsActive(false);
			case 204:
				return getLastPlayedTrack();
			default:
				throw new Error(code);
		}
	}

	const getLastPlayedTrack = async () => {
		const response = await requests.lastPlayedTrack();
		const code = response.status;

		switch (code) {
			case 200:
				const payload = await response.json();

				dispatch({payload, type: 'last_played_track'});
				return device.setIsActive(undefined);
			case 204:
				return dispatch({type: 'no_content'});
			default:
				throw new Error(code);
		}
	}

	const getLocalPlayback = async () => {
		const payload = await device.player.getCurrentState();

		if (payload === null) return getCurrentPlayback();

		dispatch({payload, type: 'local_playback'});
		return device.setIsActive(true);
	}

	const getPlayback = () => getLocalPlayback().catch(error => device.catchRequest(error));

	const isPlaybackIntervalRenew = (timeout = 800) => (isDeviceActiveRef.current) ? false : setTimeout(playbackIntervalRenew, timeout);

	const playbackIntervalRenew = () => {
		const delay = (isDeviceActiveRef.current && !document.hidden) ? 1000 : 75000;

		clearInterval(interval);
		interval = setInterval(getPlayback, delay);

		getPlayback();
	}

	useEffect(() => {
		isDeviceActiveRef.current = device.isActive;

		playbackIntervalRenew();

		document.addEventListener('visibilitychange', playbackIntervalRenew);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', playbackIntervalRenew);
		};
	}, [device.isActive]);

	useEffect(() => {
		const hasTrackStarted = hasTrackStartedRef.current;

		if (hasTrackStarted === 0 && track.progress > 6000) hasTrackStartedRef.current = 1;
		else if (hasTrackStarted === 1 && track.progress < 6000) hasTrackStartedRef.current = 0;
	}, [track.progress]);

	useEffect(() => {
		if (track.uri) document.title = `${device.getArtistsNames(track.artists)} - ${track.name}`;
	}, [track.uri]);

	if (device.isActive === null) return <p>Loading...</p>;
	return (
		<>
		<section id="track">
			<Album artists={track.artists} images={track.album.images} name={track.album.name} trackName={track.name} trackUri={track.uri} />
			<Controls context={track.context} hasTrackStarted={hasTrackStartedRef.current} isPlaybackIntervalRenew={isPlaybackIntervalRenew} isPlaying={controls.isPlaying} repeat={controls.repeat} shuffle={controls.shuffle} trackUri={track.uri} volume={controls.volume} />
			<SeekBar duration={track.duration} isPlaybackIntervalRenew={isPlaybackIntervalRenew} progress={track.progress} />
		</section>
		<Playlists context={track.context} isPlaybackIntervalRenew={isPlaybackIntervalRenew} track={track.uri} />
		</>
	);
}

export default Player;