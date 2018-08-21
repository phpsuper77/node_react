import { reduxModule, eventName } from 'react-website'
import configuration from '../../configuration'
import axios from 'axios'

const redux = reduxModule('PROMOS');
const api_host = configuration.api_host;
export const getPromos = redux.action
(
	'GET_PROMOS',
	async (state, id) =>
	{
		
		const result = await axios.get(`${api_host}/promos/${id}`, {params: {aid: id}});		
		
		if (result.data.status == "success") return result.data.promos;
		else return [];			
	},
	'promos'
)

export const getPromo = redux.action
(
	'GET_PROMO',
	async (state, id) =>
	{
		const result = await axios.get(`${api_host}/promo/${id}`);		
		if (result.data.status == "success") return result.data.promo
		else return null;
	},
	'promo'	
)

export const addPromo = redux.action
(
	'ADD_PROMO',
	async ({ http }, promo) =>
	{
		var result = await axios.post(`${api_host}/promos`, promo);
		return result.data;
	},
	'response'
)

export const updatePromo = redux.action
(
	'UPDATE_PROMO',
	async ({ http }, promo) =>
	{
		var result = await axios.put(`${api_host}/promos`, promo);
		return result.data;
	},
	'response'
)

export const activePromo = redux.action
(
	'ACTIVE_PROMO',
	async ({ http }, promo) =>	{		
		var result = await axios.post(`${api_host}/promo/${promo.id}`, promo);
		return result.data;
	},
	'response'
)

export const getUsedOutletsOnPromo = redux.action
(
	'USED_OUTLETS_ON_PROMO',
	async ({ http }, id) =>
	{
		var result = await axios.get(`${api_host}/promos/usedoutlets/` + id);
		if (result.data.status == "success") return result.data.outlets;
		return [];
	},
	'outlets'
)

// A little helper for Redux `@connect()`
export const connectPromo = redux.getProperties

const initialState = { promos: [], promo: null }

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default redux.reducer(initialState)

// "Sleep" using `Promise`
function delay(delay)
{
	return new Promise(resolve => setTimeout(resolve, delay))
}