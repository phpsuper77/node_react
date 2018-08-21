import { reduxModule, eventName } from 'react-website'
import configuration from '../../configuration'
import axios from 'axios'

const redux = reduxModule('LOGOS');
const api_host = configuration.api_host;

export const uploadLogo = redux.action
(
	'UPLOAD_LOGO',
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
export const connectlogo = redux.getProperties

const initialState = { imagepath: "" }

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default redux.reducer(initialState)

// "Sleep" using `Promise`
function delay(delay)
{
	return new Promise(resolve => setTimeout(resolve, delay))
}