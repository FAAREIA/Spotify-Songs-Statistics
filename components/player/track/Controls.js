import React, {useContext} from 'react';
import {DeviceContext} from '../../App';
import useCreateRequest from '../../hooks/useCreateRequest';

const repeatStatesLoop = {
	off: 'context',
	context: 'track',
	track: 'off'
}

const Controls = props => {
	const {context, hasTrackStarted, isPlaybackIntervalRenew, isPlaying, repeat, shuffle, trackUri, volume} = props;

	const device = useContext(DeviceContext);

	const requests = {
		next: useCreateRequest('POST', 'me/player/next'),
		pause: useCreateRequest('PUT', 'me/player/pause'),
		play: useCreateRequest('PUT', 'me/player/play', `?device_id=${device.id}`, {'context_uri': context, 'offset': {'uri': trackUri}}),
		previous: useCreateRequest('POST', 'me/player/previous'),
		repeat: useCreateRequest('PUT', 'me/player/repeat', `?state=${repeatStatesLoop[repeat]}`),
		resume: useCreateRequest('PUT', 'me/player/play'),
		seek: useCreateRequest('PUT', 'me/player/seek', '?position_ms=0'),
		shuffle: useCreateRequest('PUT', 'me/player/shuffle', `?state=${!shuffle}`)
	}

	const fetchEndpoint = request => {
		return request()
			.then(response => {
				const code = response.status;

				if (code === 204) return isPlaybackIntervalRenew();
				throw new Error(code);
			})
			.catch(error => device.catchRequest(error));
	}

	const handleNext = () => fetchEndpoint(requests.next);
	const handlePause = () => fetchEndpoint(requests.pause);
	const handlePlay = () => fetchEndpoint(requests.play);
	const handlePrevious = () => (hasTrackStarted) ? fetchEndpoint(requests.seek) : fetchEndpoint(requests.previous);
	const handleRepeat = () => fetchEndpoint(requests.repeat);
	const handleResume = () => fetchEndpoint(requests.resume);
	const handleShuffle = () => fetchEndpoint(requests.shuffle);

									console.log('- - - - - - Se renderizó: CONTROLS');
	return (
		<ul className="controls">
			<li><button className="shuffle" onClick={handleShuffle} type="button">Shuffle</button></li>
			<li><button className="previous" onClick={handlePrevious} type="button">Prev</button></li>
			{
			(device.isActive === undefined)
			? <li><button className="play" onClick={handlePlay} type="button">play</button></li>
			: (isPlaying)
			? <li><button className="pause" onClick={handlePause} type="button">Pause</button></li>
			: <li><button className="resume" onClick={handleResume} type="button">Resume</button></li>
			}
			<li><button className="next" onClick={handleNext} type="button">Next</button></li>
			<li><button className="repeat" onClick={handleRepeat} type="button">Repeat</button></li>
		</ul>
	);
};

const areEqual = (prevProps, props) => {
	if (prevProps.hasTrackStarted !== props.hasTrackStarted) return false;
	if (prevProps.isPlaying !== props.isPlaying) return false;
	if (prevProps.repeat !== props.repeat) return false;
	if (prevProps.shuffle !== props.shuffle) return false;
	if (prevProps.volume !== props.volume) return false;
	return true;
};

export default React.memo(Controls, areEqual);