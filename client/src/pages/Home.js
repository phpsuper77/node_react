import React, { Component } from 'react'
import { meta, preload, goto} from 'react-website'
import { connect } from 'react-redux'
import Table from '../components/Table'

import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import Grid from 'material-ui/Grid';
import Snackbar from '@material-ui/core/Snackbar';
import Select from 'react-select';

import socketIOClient from 'socket.io-client';

import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';
import configuration from '../../configuration';

import './Application.scss';

import
{
	connectAdvertiser,
	getAdvertisers,
	getAdvertiser,
	activeAdvertiser
}
from '../redux/advertisers'

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
	selectRow: {
		padding: 10,
		div: {
			backgroundColor: 'white !important'
		}
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
	selectBox: {
		backgroundColor: 'white',
		width: 350,
		marginLeft: theme.spacing.unit * 4,
		marginRight: theme.spacing.unit * 4,
		div: {
			backgroundColor: 'white',
		}
	}
  });


@meta(({ state }) => ({ title: 'Home' }))
@preload(async (preparams) => {			
	const { parameters, dispatch } = preparams;
	await dispatch(getAdvertisers());	
})
class HomePage extends Component
{
	state = {
		showAdvertiserModal: false,
		userId: null,
		advertiser: {id: 0, label: ''},
		advertisers: [],
		errorResponse: {
			flag: false,
			msg: ''
		}		
	}
	constructor()
	{
		super()		
	}

	componentDidMount = async () => {
		const { advertisers, goto, getAdvertisers } = this.props;		
		if (advertisers.advertisers && advertisers.advertisers.length <=0 ) {
			await getAdvertisers();
			this.setState({advertisers: this.props.advertisers.advertisers});			
		} else {
			this.setState({advertisers: advertisers.advertisers});			
		}

		const socket = socketIOClient(configuration.socket_endpoint);
		
		socket.on('activatingAdvertiser', (response)=> {			
			if (response && response.status != "success") {
				this.setState({
					errorResponse: { flag: true, msg: response.message}
				})
			}			
			this.getData();
		})
		
	}

	handleCloseSanckbar = () => {
		this.setState({
			errorResponse: { flag: false, msg: ''}
		});
	}
	
	handleModalClose = () => {
		this.setState({showAdvertiserModal: false});
	}

	selectAdvertiser = (selectedOption) => {
		this.setState({advertiser: selectedOption});
		const { advertisers } = this.props;

		if (advertisers.advertisers && advertisers.advertisers.length > 0) {
			var tempArr = advertisers.advertisers.filter(ad => ad.name == selectedOption.label);
			this.setState({ advertisers: tempArr });
		}
	}	

	getData = async () => {
		await this.props.getAdvertisers();
		debugger		
		if (this.props.advertisers.advertisers.length > 0) {
			this.setState({
				advertisers: this.props.advertisers.advertisers
			})
		}
	}

	doDeactive = async (item) => {
		var status = item.status? 0: 1;		
		await this.props.activeAdvertiser({id: item.id, status: status, awId: item.wId});
		
		if(this.props.advertisers.apiResponse.data.status == "success") {
			await this.props.getAdvertisers();
			
			if (this.props.advertisers.advertisers.length > 0) {
				this.setState({
					advertisers: this.props.advertisers.advertisers
				})
			}
		} else if(this.props.advertisers.apiResponse.data.status == "pending"){
			var olds = this.state.advertisers;
			var news = [];
			olds.forEach(ii => {
				if (ii.id == item.id) ii.status = 2;
				news.push(ii);
			});
			this.setState({advertisers: news});
		}				
	}

	render()
	{
		const {
			advertisers, location, router, classes
		} = this.props;		
		
		const {
			showAdvertiserModal,
			userId
		} = this.state;
		
		var selAds = [];		
		if (advertisers && advertisers.advertisers && advertisers.advertisers.length >0) {
			advertisers.advertisers.forEach(ad => {
				selAds.push({id: ad.id, label: ad.name});
			});
		}
		selAds.sort((a,b) => a.id-b.id);

		var loading = advertisers.activeAdvertiserPending || advertisers.getAdvertisersPending;
		
		return (
			<div>
				<Grid container spacing={8}>
					<Grid container className="selectRow"  alignItems="flex-end">
						<Select
							name="advertiser"
							value={this.state.advertiser}
							onChange={this.selectAdvertiser}
							options={selAds}
							styles={selectStyle}
							className={classes.selectBox}
						/>					
					</Grid> 
					<Table advertisers={this.state.advertisers} loading={loading} returnTo={location.pathname} handleClick={this.handleClickRow} doDeactive={this.doDeactive}/>
					<Snackbar
							open={this.state.errorResponse.flag}
							onClose={this.handleCloseSanckbar}
							ContentProps={{
								'aria-describedby': 'message-id',
							}}
							message={<span id="message-id">{ this.state.errorResponse.msg }</span>}
						/>								
					<Fade
							in={loading}
							style={{transitionDelay: loading ? '800ms' : '0ms',}}
							unmountOnExit
						>
							<LinearProgress color="secondary" />
					</Fade>
				</Grid>
			</div>
		)
	}
}

HomePage.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ advertisers }) => ({
			advertisers
		}		
		),
		{
			getAdvertisers,
			getAdvertiser,
			activeAdvertiser,
			goto				
		}
	)(HomePage));