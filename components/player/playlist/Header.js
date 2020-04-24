import React, {useContext} from 'react';
import {DeviceContext} from '../../App';

const Header = props => {
	const {collaborative, description, images, name, publicPrivate, tracksTotal} = props;

	const device = useContext(DeviceContext);

	const image = device.getBiggestImage(images);
	const isCollaborative = (collaborative) ? ' & Collaborative' : '';
	const isDescription = (description) ? <><dt className="hide">Description:</dt><dd className="description">{description}</dd></> : null;
	const isPublicPrivate = (publicPrivate) ? 'Public' : 'Private';

	return (
		<header>
			<h2>{name}</h2>
			<dl>
				{isDescription}
				<dt className="hide">Playlist type:</dt>
				<dd className="type">{isPublicPrivate + isCollaborative}</dd>
				<dt className="hide">Total of songs:</dt>
				<dd className="tracksTotal">{tracksTotal}</dd>
			</dl>
			<div className="image">
				<img alt={name} height={image.height} src={image.url} width={image.width} />
			</div>
		</header>
	);
}

export default Header;