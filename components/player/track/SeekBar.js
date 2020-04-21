import React, {useContext} from 'react';
import {DeviceContext} from '../../App';
import useCreateRequest from '../../hooks/useCreateRequest';

const msToMmSs = ms => {
	const minutes = Math.floor(ms / 60000);
	const seconds = ((ms % 60000) / 1000).toFixed(0);

	return `${minutes}:${seconds.padStart(2, '0')}`;
}

const SeekBar = props => {
	const {duration, isPlaybackIntervalRenew, progress} = props;

	const device = useContext(DeviceContext);

	const durationMmSs = msToMmSs(duration);
	const progressMmSs = msToMmSs(progress);

	const request = useCreateRequest('PUT', 'me/player/seek');

	const handleSeek = e => {
		const seekValue = e.currentTarget.value;

		return request({dynamicParameters: `?position_ms=${seekValue}`})
			.then(response => {
				const code = response.status;

				if (code === 204) return isPlaybackIntervalRenew();
				throw new Error(code);
			})
			.catch(error => device.catchRequest(error));
	}

	return (
		<>
		{progressMmSs}
		<form>
			<input max={duration} min="0" onChange={handleSeek} step="200" type="range" value={progress} />
		</form>
		{durationMmSs}
		</>
	);
}

export default SeekBar;