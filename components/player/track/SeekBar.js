import React, {useContext} from 'react';
import {DeviceContext} from '../../App';
import useCreateRequest from '../../hooks/useCreateRequest';

const SeekBar = props => {
	const {duration, isPlaybackIntervalRenew, progress} = props;

	const device = useContext(DeviceContext);

	const durationMmSs = device.convertMsToMmSs(duration);
	const progressMmSs = device.convertMsToMmSs(progress);

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
		<div className="seek-bar">
			<dl>
				<dt className="hide">Progress:</dt>
				<dd className="progress">{progressMmSs}</dd>
				<dt className="hide">Duration:</dt>
				<dd className="duration">{durationMmSs}</dd>
			</dl>
			<form>
				<input max={duration} min="0" onChange={handleSeek} step="250" type="range" value={progress} />
			</form>
		</div>
	);
}

export default SeekBar;