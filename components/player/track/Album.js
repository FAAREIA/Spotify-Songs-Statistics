import React, {useContext} from 'react';
import {DeviceContext} from '../../App';

const Album = props => {
	const {artists, images, name, trackName} = props;

	const device = useContext(DeviceContext);

	const artistsLinks = device.getArtistsLinks(artists, 'album');
	const artistsNames = device.getArtistsNames(artists);
	const image = device.getBiggestImage(images);

							console.log('- - - - - - Se renderizó: ALBUM');
	return (
		<header className="album">
			<h2 className="hide">{name}</h2>
			<dl key={name}>
				<dt className="hide">Track:</dt>
				<dd className="track">{trackName}</dd>
				<dt className="hide">Artists:</dt>
				<dd className="artist">{artistsLinks}</dd>
			</dl>
			<div className="image">
				<img alt={`${name} - ${artistsNames}`} className="img-cover" height={image.height} src={image.url} width={image.width} />
			</div>
		</header>
	);
}

const areEqual = (prevProps, props) => (prevProps.trackUri === props.trackUri);

export default React.memo(Album, areEqual);