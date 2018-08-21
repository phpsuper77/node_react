import { reduxModule, eventName } from 'react-website'
import configuration from '../../configuration'
import axios from 'axios'

const redux = reduxModule('SERVICES');
const api_host = configuration.api_host;
export const getServices = redux.action
(
	'GET_SERVICES',
	async () =>
	{
		const result = await axios.get(`${api_host}/services`);
		if (result.data.status == "success") return result.data.services;
		else return [];			
	},
	'services'
)

export const getDashboardServices = redux.action
(
	'GET_DASHBOARD_SERVICES',
	async (state, id) =>
	{
		const result = await axios.get(`${api_host}/dashboard/services`, {params: {aid: id}});
		if (result.data.status == "success") return result.data.services;
		else return [];			
	},
	'services'
)

export const getSpecialServices = redux.action
(
	'GET_SPECIAL_SERVICES',
	async (state, param) =>
	{
		const result = await axios.get(`${api_host}/services/search`, {params: param});
		if (result.data.status == "success") return result.data.services;
		else return [];			
	},
	'services'
)

export const getService = redux.action
(
	'GET_SERVICE',
	async (state, id) =>
	{
		const result = await axios.get(`${api_host}/service/${id}`);				
		if (result.data.status == "success") return result.data.service
		else return [];
	},
	'service'	
)

export const addService = redux.action
(
	'ADD_SERVICE',
	async ({ http }, service) =>
	{
		const result = await axios.post(`${api_host}/services`, service);
		return result.data;
	},
	'response'
)

export const updateService = redux.action
(
	'UPDATE_SERVICE',
	async ({ http }, service) =>
	{
		const result = await axios.put(`${api_host}/services`, service);
		return result.data;
	},
	'response'
)

export const activateService = redux.action
(
	'ACTIVATE_SERVICE',
	async ({ http }, service) =>
	{
		const result = await axios.post(`${api_host}/service/${service.id}`, service);
		return result.data;
	},
	'response'
)

// A little helper for Redux `@connect()`
export const connectService = redux.getProperties

const initialState = { services: [], serviceid: null}

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default redux.reducer(initialState)

// "Sleep" using `Promise`
function delay(delay)
{
	return new Promise(resolve => setTimeout(resolve, delay))
}