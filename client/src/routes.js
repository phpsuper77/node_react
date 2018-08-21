import React from 'react'
import { Route, IndexRoute } from 'react-router'
import * as reducer from './redux'

import Application     from './pages/Application'

import Home            from './pages/Home'
import LoginModal            from './pages/Login'
import AdvertiserModal from './components/AdvertiserModal'
import Outlet            from './pages/Outlet'
import OutletModal from './components/OutletModal'

import Service            from './pages/Service'
import ServiceModal from './components/ServiceModal'

import Promos            from './pages/Promos'
import PromoModal from './components/PromoModal'

import Finance           from './pages/Finance'
import FinanceDetail            from './pages/FinanceDetail'

import roleModal from './components/roleModal'
import OutletCode from './pages/OutletCode'

//import GenericError    from './pages/Error'
import Unauthenticated from './pages/Unauthenticated'
import Unauthorized    from './pages/Unauthorized'
import NotFound        from './pages/NotFound'

export default
(	
	<Route
		path="/"
		component={ Application }>

		<IndexRoute
			component={ Home } />

		<Route 
			path="login"
			component={ LoginModal }/>

		<Route
			path="advertiser/:id"
			component={ AdvertiserModal }/>	

		<Route
			path="advertiser"
			component={ AdvertiserModal }/>	
		
		<Route
			path="outlets/:userId"
			component={ Outlet }/>	
		<Route
			path="outlets"
			component={ Outlet }/>	

		<Route
			path="outlet/:id"
			component={ OutletModal }/>
		<Route
			path="outlet"
			component={ OutletModal }/>

		<Route
			path="services/:userId"
			component={ Service }/>	
		
		<Route
			path="services"
			component={ Service }/>

		<Route
			path="service/:id"
			component={ ServiceModal }/>

		<Route
			path="promos/:userId"
			component={ Promos }/>
		<Route
			path="promos"
			component={ Promos }/>
		<Route
			path="promo"
			component={ PromoModal }/>

		<Route
			path="promo/:id"
			component={ PromoModal }/>

		<Route
			path="finances"
			component={ Finance }/>

		<Route
			path="finance/:aid"
			component={ FinanceDetail }/>

		<Route
			path="role"
			component={ roleModal }/>	

		<Route
			path="outletcode"
			component={ OutletCode }/>		

		<Route
			path="unauthenticated"
			component={ Unauthenticated }
			status={ 401 }/>

		<Route
			path="unauthorized"
			component={ Unauthorized }
			status={ 403 }/>

		<Route
			path="not-found"
			component={ NotFound }
			status={ 404 }/>

		{/* <Route
			path="error"
			component={ GenericError }
			status={ 500 }/> */}

		<Route
			path="*"
			component={ NotFound }
			status={ 404 }/>
	</Route>	
)