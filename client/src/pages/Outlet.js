import React, { Component } from 'react'
import { meta, preload, goto} from 'react-website'
import { connect } from 'react-redux'
import OutletTable from '../components/OutletTable'
import { withRouter } from 'react-router'
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import Grid from 'material-ui/Grid';
import GridList, { GridListTile, GridListTileBar } from 'material-ui/GridList';
import Select from 'react-select';
import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';
import configuration from '../../configuration';
import socketIOClient from 'socket.io-client';

import
{
	connectOutlet,
	getOutlets,
	getOutlet,
	updateOutlet,
	activeOutlet,
	getSpecialOutlets,
	addOutlet
}
from '../redux/outlets'

import {	
	getAdvertiser,
	getAdvertisers,
	connectAdvertiser	
} from '../redux/advertisers';

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
@preload(async (preloadArguments) => {
	const {
		parameters,
		dispatch
	} = preloadArguments	
	await dispatch(getSpecialOutlets(parameters.userId));	
})
@meta(({ state }) => ({ title: 'Home' }))
class OutletPage extends Component
{
	state = {
		showOutletModal: false,
		userId: null,
		outlets: []		
	}
	constructor()
	{
		super()		
	}

	componentWillMount = () => {
		const { outlets } = this.props;
		this.setState({
			outlets: outlets.outlets
		});		
	}

	componentDidMount = async () => {
		const { params } = this.props;		
		if (this.state.outlets.length <= 0 && params.userId) {			
			this.getData();
		}

		const socket = socketIOClient(configuration.socket_endpoint);
		
		socket.on('activatingOutlet', (response)=> {						
			this.getData();
		})
	}

	getData = async () => {
		const { params } = this.props;		
		var userId = params.userId;
		await this.props.getSpecialOutlets(userId);		
		if (this.props.outlets.outlets.length > 0) {
			this.setState({
				outlets: this.props.outlets.outlets
			})
		}
	}

	handleModalClose = () => {
		this.setState({showOutletModal: false});
	}

	doDeactive = async (value) => {
		const { outlets, params } = this.props;		
		var userId = params.userId;
		
		var outlet = {id: value.id, name: value.name, status: value.status? 0: 1, option: "activation"};		
		await this.props.activeOutlet(outlet);
		if (this.props.outlets.apiResponse.data.status == "success") {
			await this.props.getOutlet(userId);		
			
			this.setState({
				outlets: this.props.outlets.outlets
			})
		} else if (this.props.outlets.apiResponse.data.status == "pending") {
			var olds = this.state.outlets;
			var news = [];
			olds.forEach(oo => {
				if (oo.id == value.id) oo.status=2;
				news.push(oo);
			});
			this.setState({outlets: news});
		}
		
	}

	doEdit = (id) => {
		const { outlets, params } = this.props;
		var userId = params.userId;
		this.props.goto(`/outlet/${id}?aid=${userId}`);
	}

	selectOutlet = async (selectedOption) => {
		this.setState({ outlet: selectedOption });
		const { outlets } = this.props;	
		
		if (outlets.outlets	) {
			const tempServices = outlets.outlets.filter(sr => sr.name.indexOf(selectedOption.label)>=0);
			this.setState({outlets: tempServices});
		}
	}

	render()
	{
		const {
			outlets, location, router, updateOutlet, parameters, classes
		} = this.props;			
		
		const {
			showOutletModal,
			userId
		} = this.state;

		var selOptions = [];
		
		if (outlets && outlets.outlets && outlets.outlets.length >0) {
			outlets.outlets.forEach(ad => {
				selOptions.push({id: ad.id, label: ad.name});
			});
		}		
		var loading = outlets.getOutletPending || outlets.getSpecialOutletsPending || outlets.updateOutletPending;		
		selOptions.sort((a,b) => a.id-b.id);

		return (
			<div>
			<Grid container spacing={8}>
				<Grid container className={classes.row}  alignItems="flex-end">
					<Select
						name="outlet"
						value={this.state.outlet}
						onChange={this.selectOutlet}
						options={selOptions}
						className={classes.input}
					/>					
				</Grid> 
				<OutletTable outlets={this.state.outlets} doEdit={this.doEdit} doDeactive={this.doDeactive} loading={loading}/>				
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

OutletPage.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ outlets, advertisers }) => ({
			outlets, advertisers
		}),
		{
			getOutlets,
			getOutlet,
			getAdvertiser,
			updateOutlet,
			getSpecialOutlets,
			activeOutlet,
			goto			
		}
	)(OutletPage));