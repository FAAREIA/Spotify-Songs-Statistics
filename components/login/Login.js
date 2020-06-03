import React from 'react';

const credentials = {
	client_id: '7d6783d767b44021be7cf5b1679eb872',
	redirect_uri: 'http://localhost:3000/',
	response_type: 'token',
	scopes: [
		'playlist-read-collaborative',
		'playlist-read-private',
		'streaming',
		'user-modify-playback-state',
		'user-read-currently-playing',
		'user-read-email',
		'user-read-playback-state',
		'user-read-private',
		'user-read-recently-played'
	],
	state: Math.random(),
	url: 'https://accounts.spotify.com/authorize'
};

const Login = () => {
	const setStorageItems = e => {
		const inputs = e.currentTarget.querySelectorAll('[data-storage]');

		inputs.forEach(input => sessionStorage.setItem(input.dataset.storage, input.value));
	};

	return (
		<section className="grid" id="login">
			<h2>Sign in</h2>
			<form action={credentials.url} onSubmit={setStorageItems}>
				<input name="client_id" type="hidden" value={credentials.client_id}/>
				<input name="redirect_uri" type="hidden" value={credentials.redirect_uri}/>
				<input name="response_type" type="hidden" value={credentials.response_type}/>
				<input name="scopes" type="hidden" value={credentials.scopes.join(' ')}/>
				<input data-storage="deviceState" name="state" type="hidden" value={credentials.state}/>

				<div className="form-group">
					<label className="hide">Device name</label>
					<input className="form-control" data-storage="deviceName" defaultValue={sessionStorage.getItem('deviceName')} placeholder="Device name" required type="text"/>
				</div>
				<div className="form-group">
					<label className="hide">Spotify Web Playback SDK token</label>
					<input className="form-control" data-storage="deviceToken" placeholder="Spotify Web Playback SDK token" required type="text"/>
				</div>
				<div className="form-group">
					<button className="big button">Log in</button>
				</div>
				<p className="form-description">To get your Spotify Web Playback SDK token <a href="https://developer.spotify.com/documentation/web-playback-sdk/quick-start/" rel="noopener" target="_blank">click here</a>.</p>
			</form>
		</section>
	);
}

export default Login;