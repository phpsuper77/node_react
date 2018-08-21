import React, { Component } from 'react'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import {green, blue} from 'material-ui/colors/green';

import PropTypes from 'prop-types'
import { meta, Loading, goto } from 'react-website'
import { connect } from 'react-redux'

// Not importing `Tooltip.css` because
// it's already loaded as part of `react-responsive-ui`.
// import 'react-time-ago/Tooltip.css'
import 'react-website/components/Loading.css'
// Not importing `LoadingIndicator.css` because
// it's already loaded as part of `react-responsive-ui`.
// import 'react-website/components/LoadingIndicator.css'

// `react-time-ago` English language.
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
TimeAgo.locale(en)

import Menu from '../components/Menu'
import MenuAppBar from './AppMenuBar';

import Home  from '../../assets/images/home.svg'
import Users from '../../assets/images/users.svg'

import '../components/Loading.scss'
import './Application.scss'

const theme = createMuiTheme({
	palette: {
		primary: blue
	},
	status: {
		color: blue,
	},
});

@meta(({ state }) =>
({
	site_name   : 'Salon Finder App',
	title       : 'Salon Finder App',
	description : 'Salon Finder App',
	image       : 'https://www.google.ru/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
	locale      : 'en'
}))
export default class App extends Component
{
	static propTypes =
	{
		children : PropTypes.node.isRequired
	}

	render()
	{
		const { children, store } = this.props
		
		return (
			<div>
				<div className="webpage">				
				<Loading/>
				<MuiThemeProvider theme={theme}>
					<MenuAppBar/>
					<Menu />
					<div className="webpage__content">
						{ children }
					</div>										
				</MuiThemeProvider>				
				</div>				
			</div>
		)
	}
}