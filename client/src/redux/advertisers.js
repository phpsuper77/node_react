import { reduxModule, eventName } from 'react-website'
import configuration from '../../configuration'
import axios from 'axios'

const redux = reduxModule('ADVERTISERS');
//const api_host = "http://localhost:8055/api/v1";
const api_host = configuration.api_host;
export const getAdvertisers = redux.action
(
	'GET_ADVERTISERS',
	async () =>
	{
		const result = await axios.get(`${api_host}/dashboard/advertisers`);		
		if (result.data.status == "success") return result.data.advertisers;
		else return [];			
	},
	'advertisers'
)

export const getAdvertiser = redux.action
(
	'GET_ADVERTISER',
	async (state, id) =>
	{
		const result = await axios.get(`${api_host}/advertiser/${id}`);
		if (result.data.status == "success") return result.data.advertiser
		else return null;
	},
	'advertiser'	
)

export const addAdvertiser = redux.action
(
	'ADD_ADVERTISER',
	async ({ http }, advertiser) =>
	{
		const result = await axios.post(`${api_host}/advertisers`, advertiser);
		return result;		
	},
	'apiResponse'
)

export const updateAdvertiser = redux.action
(
	'UPDATE_ADVERTISER',
	async ({ http }, advertiser) =>
	{
		return await axios.put(`${api_host}/advertisers`, advertiser);
	},
	'apiResponse'
)

export const activeAdvertiser = redux.action
(
	'ACTIVE_ADVERTISER',
	async ({ http }, advertiser) =>
	{
		return await axios.post(`${api_host}/advertiser/${advertiser.id}`, advertiser);
	},
	'apiResponse'
)

export const uploadAdvertiserLogo = redux.action
(
	'UPLOAD_ADVERTISER_LOGO',
	async ({ http }, file) =>
	{
		var config = {
			headers: { 'Content-Type': 'multipart/form-data' }
		}
		const result = await axios.post(`${api_host}/upload`, file, config);
		if (result.data.status == "success") return result.data.imagepath;
		else return "";
	},
	'imagepath'
)


// A little helper for Redux `@connect()`
export const connectAdvertiser = redux.getProperties

const initialState = { advertisers: [], advertiser: null, openAdvertiserModalFlag: false }

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default redux.reducer(initialState)

// "Sleep" using `Promise`
function delay(delay)
{
	return new Promise(resolve => setTimeout(resolve, delay))
}