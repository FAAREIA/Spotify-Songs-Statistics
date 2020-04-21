import React, {useContext} from 'react';
import {DeviceContext} from '../../App';

const Album = props => {
	const {artists, images, name, trackName} = props;

	const device = useContext(DeviceContext);

	const artistsNames = device.getArtistsNames(artists);
	const artistsLinks = device.getArtistsLinks(artists);
	const image = device.getBiggestImage(images);

	return (
		<>
{console.log('album no cachado')}
		<img alt={`${name} - ${artistsNames}`} height={image.height} src={image.url} width={image.width} />
		<div>{name}</div>
		<div>{artistsLinks}</div>
		<div>{trackName}</div>
		</>
	);
}

const areEqual = (prevProps, props) => (prevProps.trackUri === props.trackUri) ? true : false;

export default React.memo(Album, areEqual);