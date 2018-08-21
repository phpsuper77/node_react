import { reduxModule, eventName } from 'react-website'
import configuration from '../../configuration'
import axios from 'axios'

const redux = reduxModule('OUTLETS');
const api_host = configuration.api_host;
export const getOutlets = redux.action
(
	'GET_OUTLETS',
	async () =>
	{
		await delay(1000)		
		const result = await axios.get(`${api_host}/outlets`);
		if (result.data.status == "success") return result.data.outlets;
		else return [];			
	},
	'outlets'
)

export const getOutlet = redux.action
(
	'GET_OUTLET',
	async (state, id) =>
	{
		await delay(1000)		
		const result = await axios.get(`${api_host}/outlet/${id}`, {params: {oid: id}});		
		if (result.data.status == "success") return result.data.outlet
		else return [];
	},
	'outlet'	
)

export const getSpecialOutlets = redux.action
(
	'GET_SPECIAL_OUTLET',
	async (state, id) =>
	{
		const result = await axios.get(`${api_host}/outlets/search`, {params: {advertiser_id: id}});		
		if (result.data.status == "success") return result.data.outlets
		else return [];
	},
	'outlets'	
)

export const addOutlet = redux.action
(
	'ADD_OUTLET',
	async ({ http }, outlet) =>
	{
		return await axios.post(`${api_host}/outlets`, outlet);		
	},
	'apiResponse'
)

export const updateOutlet = redux.action
(
	'UPDATE_OUTLET',
	async ({ http }, outlet) =>
	{
		return await axios.put(`${api_host}/outlets`, outlet);		
	},
	'apiResponse'
)

export const activeOutlet = redux.action
(
	'UPDATE_OUTLET',
	async ({ http }, outlet) =>
	{
		return await axios.post(`${api_host}/outlet/${outlet.id}`, outlet);		
	},
	'apiResponse'
)

// A little helper for Redux `@connect()`
export const connectOutlet = redux.getProperties

const initialState = { outlets: [], outlet: null}

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default redux.reducer(initialState)

// "Sleep" using `Promise`
function delay(delay)
{
	return new Promise(resolve => setTimeout(resolve, delay))
}