import {useContext} from 'react';
import {DeviceContext} from '../App';

const useCreateRequest = (method, endpointFragment, parameters = '', bodyContent) => {
	const device = useContext(DeviceContext);

	const controller = new AbortController();
	const headers = new Headers({'Authorization': `Bearer ${device.webApiToken}`});
	const signal = controller.signal;

	const request = async ({
		dynamicBodyContent = bodyContent,
		dynamicEndpointFragment = endpointFragment,
		dynamicParameters = parameters
	} = {}) => {
		const body = (dynamicBodyContent) ? JSON.stringify(dynamicBodyContent) : null;
		const endpoint = `https://api.spotify.com/v1/${dynamicEndpointFragment}`;
		const properties = {body, headers, method, signal};

		const abort = setTimeout(() => controller.abort(), 800);
		const response = await fetch(endpoint + dynamicParameters, properties);

		clearTimeout(abort);
		return response;
	}

	return request;
}

export default useCreateRequest;