import React from 'react';

const PlaylistHeader = props => {
	const {description, images, name, tracksTotal} = props;

	return (
		<header>
			<h2>{name}</h2>
			<p>{description}</p>
			{images[0].height}
			<small>{tracksTotal} songs</small>
		</header>
	);
}

export default PlaylistHeader;