import React, {useContext} from 'react';
import {DeviceContext} from '../../../App';
import Button from './Button';
import useClickEventCounter from '../../../hooks/useClickEventCounter';
import useCreateRequest from '../../../hooks/useCreateRequest';

const Nav = props => {
	const {checkSnapshot, context, isPlaybackIntervalRenew, playlists, visible} = props;

	const device = useContext(DeviceContext);

	const requests = {
		play: useCreateRequest('PUT', 'me/player/play')
	}

	const createButtons = () => {
		const items = [];

		for (const id in playlists) {
			const name = playlists[id].name;
			const snapshot = playlists[id].snapshot;
			const uri = playlists[id].uri;

			items.push(<Button context={context} id={id} key={snapshot} name={name} uri={uri} visible={visible} />);
		};

		return items;
	}

	const handleClick = uri => {
		const id = device.getIdFromUri(uri);

		if (visible === id) return;
		return checkSnapshot(id);
	}

	const handleDoubleClick = uri => {
											console.log('device de double click:', device.isActive);
		const dynamicBodyContent = {'context_uri': uri};
		const dynamicParameters = (device.isActive === undefined) ? `?device_id=${device.id}` : '';

		return requests.play({dynamicBodyContent, dynamicParameters})
			.then(response => {
				const code = response.status;

				if (code === 204) {
					handleClick(uri);
					return isPlaybackIntervalRenew();
				}
				throw new Error(code);
			})
			.catch(error => device.catchRequest(error));
	}

	const handleClickEvents = useClickEventCounter(handleClick, handleDoubleClick);

								console.log('- - - - - - Se renderizó: NAV');
	return (
		<nav className="nav">
			<ul onClick={handleClickEvents}>
				{createButtons()}
			</ul>
		</nav>
	);
}

const areEqual = (prevProps, props) => {
	if (prevProps.context !== props.context) return false;
	if (prevProps.playlists !== props.playlists) return false;
	if (prevProps.visible !== props.visible) return false;
	return true;
};

export default React.memo(Nav, areEqual);