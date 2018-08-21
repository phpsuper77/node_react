import React, { Component } from 'react'
import { meta, preload, goto} from 'react-website'
import { connect } from 'react-redux'
import ServiceTable from '../components/ServiceTable'
import { withRouter } from 'react-router'
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';

import Grid from 'material-ui/Grid';
import GridList, { GridListTile, GridListTileBar } from 'material-ui/GridList';
import Select from 'react-select';
import Snackbar from '@material-ui/core/Snackbar';
import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';

import configuration from '../../configuration';

import socketIOClient from 'socket.io-client';

import {	
	getServices,
	getService,
	connectService,
	addService,
	updateService,
	activateService,
	getDashboardServices
} from '../redux/services';

import {	
	getAdvertiser,
	getAdvertisers,
	connectAdvertiser	
} from '../redux/advertisers';

const selectStyle = {
	option: ()=> ({
		backgroundColor: 'white !important',
		padding: 10,
		paddingLeft: 15		
	})
}

const styles = theme => ({
	paper: {
	  position: 'relative',
	  width: "80vw",
	  backgroundColor: theme.palette.background.paper,
	  boxShadow: theme.shadows[5],
	  padding: theme.spacing.unit * 4,
	  margin: "auto"
	},
	flex: {
	  flex: 1,
	},
	root: {
	  flexGrow: 1,
	},
	flex: {
	  flex: 1,
	},
	menuButton: {
	  marginLeft: -12,
	  marginRight: 20,
	},
	input: {
		width: 350,
		marginLeft: theme.spacing.unit * 4,
		marginRight: theme.spacing.unit * 4
	},
	input3: {
	  width: 250,
	  marginLeft: theme.spacing.unit * 4,
	  marginRight: theme.spacing.unit * 4
	},
	gridDiv: {
		padding: 35,
		height: '60vh',
		overflowY: 'auto'
	},
	row: {
		padding: 10
	},
	rowImage: {
	  padding: 10,
	  display: 'flex',
	  flexWrap: 'wrap',
	  justifyContent: 'space-around',
	  overflow: 'hidden',
	  backgroundColor: theme.palette.background.paper,
	},
	col: {
		paddingLeft: theme.spacing.unit*3,
		paddingRigth: theme.spacing.unit*3
	},
	button: {
	  margin: "auto",
	},
	fileInput: {
	  display: 'none',
	},
	textWrapper: {
		width: '75vw',	  
	},
	demoEditor: {
		height: 100,
		border: '1px solid #d4d2d2'
	},
	subtitle: {
		marginLeft: 25,
		fontSize: 15,
		color: 'grey'
	},
	gridList: {
	  flexWrap: 'nowrap',
	  // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
	  transform: 'translateZ(0)',
	},
	logo : {
		width: "10vw"
	},
	nav : {
		padding: 0
	},
	timepart: {
		marginLeft: '10%'
	},
	error: {
		color: "red",
		borderBottom: "2px solid red"
	},
	avatar: {
	  margin: 10,
	},
	bigAvatar: {
	  width: 60,
	  height: 60,
	  borderRadius: 0
	},
	shopImage: {
		width: 200,
		height: 100
	}
  });


@withRouter
@preload(async ({ dispatch, parameters, location }) => {	
	var aid = parameters.userId
	
	if (aid) {
		await dispatch(getDashboardServices(aid));
		await dispatch(getAdvertiser(aid));		
	}	else {		
		await dispatch(getDashboardServices());
	}
	
	await dispatch(getAdvertisers());	
})
@meta(({ state }) => ({ title: 'Service' }))
class ServicePage extends Component
{
	state = {
		showServiceModal: false,
		userId: null,		
	}
	constructor()
	{
		super()
		this.state = {
			service: {id: 0, label: ""},
			services:[],
			errorResponse: {
				flag: false, msg: "Response is failed"
			},
		}		
	}	

	componentWillMount = () => {
		const { services } = this.props;
		const tempservices = services.services;		
		if (tempservices) this.setState({services: tempservices});
	}

	componentDidMount = async () => {
		const socket = socketIOClient(configuration.socket_endpoint);		
		socket.on('activatingService', (response)=> {
			if (response.status == "success") {
				this.setState({errorResponse: {flag: false, msg: ''}});
				this.getData();
			} else {
				this.setState({errorResponse: {flag: true, msg: response.message}});
			}
			
		});

		if (this.state.services.length <= 0 && this.props.params.userId) {
			await this.props.getDashboardServices(this.props.params.userId);
			
			const { services } = this.props;
			
			if (services.services) {			
				var tempServices = services.services;
				if(this.state.service.label != "") tempServices = services.services.filter(sr => sr.name.indexOf(this.state.service.label)>=0);
				this.setState({services: tempServices});
			}
		}
	}

	getData = async () => {
		const { advertisers } = this.props;
		const advertiser = advertisers.advertiser;

		await this.props.getDashboardServices(advertiser.id);
		
		const { services } = this.props;
		
		if (services.services) {			
			var tempServices = services.services;
			if(this.state.service.label != "") tempServices = services.services.filter(sr => sr.name.indexOf(this.state.service.label)>=0);
			this.setState({services: tempServices});
		}
	}

	handleModalClose = () => {
		this.setState({showServiceModal: false});
	}

	handleCloseSanckbar = () => {
		this.setState({
			errorResponse: { flag: false, msg: "closed" }
		});
	}

	doDeactive = async (sr) => {
		const { advertisers } = this.props;
		const advertiser = advertisers.advertiser;		
		var service = {id: sr.id, status: sr.status? 0: 1, option: "activation"};	
		await this.props.activateService(service);		
		const { services } = this.props;
		
		if (services.response.status != "success" && services.response.status != "pending") {
			this.setState({
				errorResponse: {flag: true, msg: services.response.message}
			})
		}

		await this.props.getDashboardServices(advertiser.id);
		if (this.props.services.services) {			
			const tempServices = this.props.services.services.filter(sr => sr.name.indexOf(this.state.service.label)>=0);
			this.setState({services: tempServices});
		}				
	}

	selectAdvertiser = async (selectedOption) => {
		this.setState({ service: selectedOption });
		const { services } = this.props;
		
		if (services.services	) {
			const tempServices = services.services.filter(sr => sr.name.indexOf(selectedOption.label)>=0);
			this.setState({services: tempServices});
		}
	}

	doEdit = (id) => {
		const {services } = this.props;
		var service = services.services.filter(sr => sr.id == id);		
		this.props.goto(`/service/${id}?aid=${service[0].advertiser_id}`);
	}

	render()
	{
		const {
			services,
			parameters, classes, advertisers
		} = this.props;					
		
		const {
			showServiceModal,
			userId,
			advertiser			
		} = this.state;		
		
		var selAds = [];
		
		if (services && services.services && services.services.length >0) {
			services.services.forEach(ad => {
				selAds.push({id: ad.id, label: ad.name});
			});
		}

		selAds.sort((a,b) => a.id-b.id);

		var loading = services.getDashboardServicesPending || services.updateServicePending || services.activateServicePending;
		return (
			<div>
			<Grid container spacing={8}>
				<Grid container className={classes.row}  alignItems="flex-end">
					<Select
						name="advertiser"
						value={this.state.service}
						onChange={this.selectAdvertiser}
						options={selAds}
						styles={selectStyle}
						className={classes.input}
					/>
					{ this.state.errorForAd &&
					<div className={classes.error}> Please Select Advertiser</div>
					}
				</Grid> 
				<ServiceTable services={this.state.services} doEdit={this.doEdit} doDeactive={this.doDeactive} loading={loading}/>
				<Snackbar
						open={this.state.errorResponse.flag}
						onClose={this.handleCloseSanckbar}
						ContentProps={{
							'aria-describedby': 'message-id',
						}}
						message={<span id="message-id">{ this.state.errorResponse.msg }</span>}
					/>				
			</Grid>
			<Fade
					in={loading}
					style={{transitionDelay: loading ? '800ms' : '0ms',}}
					unmountOnExit
					>
						<LinearProgress color="secondary" />
				</Fade>
			</div>
		)
	}
}

ServicePage.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ services, advertisers, logos }) => ({
			services, advertisers, logos
		}),
		{
			getServices,
			getService,
			addService,
			updateService,
			getDashboardServices,
			getAdvertiser,
			activateService,
			goto			
		}
	)(ServicePage));