import React, { Component } from 'react'
import { meta, preload, goto} from 'react-website'
import { connect } from 'react-redux'
import OutletCodeTable from '../components/OutletCodeTable'
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
import Button from 'material-ui/Button';

import CsvCreator from 'react-csv-creator';

import
{
	connectOutlet,
	getOutlets,
	getOutlet,
	updateOutlet,
	activeOutlet,
	addOutlet
}
from '../redux/outlets'

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
	},
	csvButton: {
		right: 0,
		justifySelf: 'right',		
		marginLeft: 'auto'
	}
  });




@withRouter
@preload(async (preloadArguments) => {
	const {
		parameters,
		dispatch
	} = preloadArguments	
	await dispatch(getOutlet(parameters.userId));
	await dispatch(getAdvertisers());	
})
@meta(({ state }) => ({ title: 'Home' }))
class OutletCodePage extends Component
{
	state = {
		showOutletModal: false,
		userId: null,
		outlets: [],
		advertiser: {id: 0, label: ''},
		advertisers: [],
		csvData: []		
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
		if (this.state.outlets.length <= 0) {
			await this.props.getOutlets();
			debugger
			const { outlets } = this.props;

			if (outlets.outlets && outlets.outlets.length > 0)
				this.setState({
					outlets: outlets.outlets
				});

		}
	}

	selectAdvertiser = async (selectedOption) => {
		this.setState({ advertiser: selectedOption });
		const { outlets } = this.props;	
		
		if (outlets.outlets	) {
			const tempServices = outlets.outlets.filter(sr => sr.advertiser_id == (selectedOption.id));
			this.setState({outlets: tempServices});
		}
	}

	render()
	{
		const {
			advertisers, location, router, updateOutlet, parameters, classes, outlets
		} = this.props;			
		
		const {
			showOutletModal,
			userId			
		} = this.state;

		var selOptions = [];
		const headers = [{id: 'name', display: 'Outlet Name'}, 
			{id: 'outlet_code',	display: 'Outlet Code' },
			{id: 'address',	display: 'Outlet Address' },
		];
		
		if (advertisers && advertisers.advertisers && advertisers.advertisers.length >0) {
			advertisers.advertisers.forEach(ad => {
				if (ad.status == 1)
					selOptions.push({id: ad.id, label: ad.name});
			});
		}		
		var loading = outlets.getOutletPending || outlets.getOutletsPending || outlets.updateOutletPending;		
		selOptions.sort((a,b) => a.id-b.id);

		var csvData = [];
		this.state.outlets.forEach(oo => {
			csvData.push({
				name: oo.name,
				outlet_code: oo.outlet_code,
				address: oo.address
			});
		})

		return (
			<div>
			<Grid container spacing={8}>
				<Grid container className={classes.row}  alignItems="flex-end">
					Advertiser: 
					<Select
						name="advertiser"
						value={this.state.advertiser}
						onChange={this.selectAdvertiser}
						options={selOptions}
						styles={selectStyle}
						className={classes.input}
					/>
					<CsvCreator
						filename='outlet_code'
						headers={headers}
						rows={csvData}
						><Button variant="raised" className={classes.csvButton}>Export csv</Button></CsvCreator>					
				</Grid> 
				<OutletCodeTable outlets={this.state.outlets} loading={loading}/>				
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

OutletCodePage.propTypes = {
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
			activeOutlet,
			goto			
		}
	)(OutletCodePage));