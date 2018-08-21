import { reduxModule } from 'react-website'

const redux = reduxModule('MODALS');

export const getAdvertiserModal = redux.action
(
	'GET_ADVERTISER_MODAL',
	() =>
	{
		return redux.getState()
	},
	'modals'
)


// A little helper for Redux `@connect()`
export const connectModal = redux.getProperties

const initialState = { modals: null }

// This is the Redux reducer which now
// handles the asynchronous actions defined above.
export default redux.reducer(initialState)

// "Sleep" using `Promise`
function delay(delay)
{
	return new Promise(resolve => setTimeout(resolve, delay))
}