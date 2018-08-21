import { reduxModule, eventName } from 'react-website'
import configuration from '../../configuration'
import axios from 'axios'

const redux = reduxModule('USERS');
//const api_host = "http://localhost:8055/api/v1";
const api_host = configuration.api_host;
export const authenticatedUser = redux.action
(
	'AUTHENTICATED_USER',
	async (state, user) =>
	{
		var response = await axios.post(`${api_host}/register`, {params: user});		
		return response.data;
	},
	'response'
)

export const getAuthenticatedUser = redux.action
(
	'GET_AUTHENTICATED_USER',
	async (state, user) =>
	{
		var response = await axios.post(`${api_host}/authenticate`, {params: user});		
		return response.data;		
	},
	'response'
)

export const savePermission = redux.action
(
	'GET_AUTHENTICATED_USER',
	async (state, user) =>
	{
		var response = await axios.post(`${api_host}/permission`, {params: user});		
		return response.data;		
	},
	'response'
)

export const getAllUsers = redux.action
(
	'GET_ALL_USERS',
	async (state, user) =>
	{
		var response = await axios.get(`${api_host}/users`);
		if (response.data.status == "success") return response.data.users;
		else return [];
	},
	'alldatas'
)

export const destoryUser = redux.action
(
	'DESTROY_USER',
	(state) => {
		console.log(state);
		return null;
	},
	'user'
)

// A little helper for Redux `@connect()`
export const connectUser = redux.getProperties

const initialState = { user: null }

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default redux.reducer(initialState)

// "Sleep" using `Promise`
function delay(delay)
{
	return new Promise(resolve => setTimeout(resolve, delay))
}