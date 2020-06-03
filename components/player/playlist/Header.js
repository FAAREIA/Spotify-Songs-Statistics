import React, {useContext} from 'react';
import {DeviceContext} from '../../App';
import Button from '../../buttons/Button';
import useCreateRequest from '../../hooks/useCreateRequest';

const Header = props => {
	const {collaborative, description, images, isPlaybackIntervalRenew, name, playlistUri, publicPrivate, tracksTotal} = props;

	const device = useContext(DeviceContext);

	const image = device.getBiggestImage(images);
	const isCollaborative = (collaborative) ? ' & Collaborative' : '';
	const isDescription = (description) ? <><dt className="hide">Description:</dt><dd className="description">{description}</dd></> : null;
	const isPublicPrivate = (publicPrivate) ? 'Public' : 'Private';

	const requests = {
		play: useCreateRequest('PUT', 'me/player/play')
	}

	const handlePlay = e => {
		const offset = (e.currentTarget.dataset.shuffle) ? Math.floor(Math.random() * (tracksTotal - 1)) : 0;

		const dynamicBodyContent = {'context_uri': playlistUri, 'offset': {'position': offset}};
		const dynamicParameters = (device.isActive === undefined) ? `?device_id=${device.id}` : '';
console.log(offset);
		return requests.play({dynamicBodyContent, dynamicParameters})
			.then(response => {
				const code = response.status;

				if (code === 204) return isPlaybackIntervalRenew();
				throw new Error(code);
			})
			.catch(error => device.catchRequest(error));
	}

						console.log('- - - - - - Se renderizó: HEADER');
	return (
		<header className="playlist-header">
			<h2>{name}</h2>
			<dl>
				{isDescription}
				<dt className="hide">Playlist type:</dt>
				<dd className="type">{isPublicPrivate + isCollaborative}</dd>
				<dt className="hide">Total of songs:</dt>
				<dd className="tracksTotal">{tracksTotal} songs</dd>
			</dl>
			<div className="image">
				<img alt={name} className="img-cover" height={image.height} src={image.url} width={image.width} />
			</div>
			<div className="actions">
				<Button handleOnClick={handlePlay}>Play</Button>
				<Button attributes={{'data-shuffle': true}} handleOnClick={handlePlay}>Shuffle</Button>
			</div>
		</header>
	);
}

export default Header;