import { reduxModule, eventName } from 'react-website'
import configuration from '../../configuration'
import axios from 'axios'

const redux = reduxModule('FINANCES');
const api_host = configuration.api_host;
export const getFinances = redux.action
(
	'GET_FINANCES',
	async () =>
	{
		const result = await axios.get(`${api_host}/finances`);
		if (result.data.status == "success") return result.data.finances;
		else return [];			
	},
	'financeData'
)

export const cancelFinance = redux.action
(
	'GET_FINANCES',
	async (state, id) =>
	{
		const result = await axios.delete(`${api_host}/finance/${id}`);
		if (result.data.status == "success") return result.data.finances;
		else return [];			
	},
	'financeData'
)

export const saveFinance = redux.action
(
	'SAVE_FINANCES',
	async (state, finance) =>
	{
		const result = await axios.put(`${api_host}/finances`, {params: finance});
		return result.data;
	},
	'response'
)

export const getSpecialFinances = redux.action
(
	'GET_SPECIAL_FINANCES',
	async (state, param) =>
	{
		const result = await axios.get(`${api_host}/finances/search`, {params: param});
		if (result.data.status == "success") return result.data.finances;
		else return [];			
	},
	'financeData'
)

export const getFinance = redux.action
(
	'GET_FINANCE',
	async (state, id) =>
	{
		const result = await axios.get(`${api_host}/finance/${id}`);				
		if (result.data.status == "success") return result.data.finances
		else return [];
	},
	'financeData'	
)

// A little helper for Redux `@connect()`
export const connectfinance = redux.getProperties

const initialState = { financeData: [], finance: null}

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default redux.reducer(initialState)

// "Sleep" using `Promise`
function delay(delay)
{
	return new Promise(resolve => setTimeout(resolve, delay))
}