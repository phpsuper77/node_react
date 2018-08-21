import React, { Component } from 'react'
import { meta, preload, goto} from 'react-website'
import { connect } from 'react-redux'
import PromoTable from '../components/PromoTable'
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

import Snackbar from '@material-ui/core/Snackbar';

import {	
	getPromos,
	getPromo,
	connectPromo,
	addPromo,
	updatePromo,
	activePromo	
} from '../redux/promos';

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
		await dispatch(getAdvertiser(aid));		
		await dispatch(getPromos(aid));
	}		
	await dispatch(getAdvertisers());	
})
@meta(({ state }) => ({ title: 'promo' }))
class PromoPage extends Component
{
	state = {
		showpromoModal: false,
		userId: null,		
	}
	constructor()
	{
		super()
		this.state = {
			promo: {id: 0, label: ""},
			promos:[],
			errorResponse: { flag: false, msg: ''}
		}		
	}

	componentDidMount = async () => {		
		const { promos } = this.props;
		const temppromos = promos.promos;			
		if (temppromos) this.setState({promos: temppromos});
		
		const socket = socketIOClient(configuration.socket_endpoint);
		socket.on('activatingPromo', (response)=> {			
			if (response.status != "success") {
				this.setState({errorResponse: {flag: true, msg: response.message}});
			} else {
				this.getData();
			}			
		})

		if (this.state.promos.length <= 0 && this.props.params.userId) {
			await this.props.getPromos(this.props.params.userId);		
			const { promos } = this.props;			
			if (promos.promos) {
				var tempPromos = promos.promos;
				if (this.state.promo.label != "" ) tempPromos = promos.promos.filter(ii => ii.name.indexOf(this.state.promo.label) >=0);			
				this.setState({promos: tempPromos});
			} else{
				this.setState({promos: []});
			}
		}
		
	}

	getData = async () => {
		const { advertisers, params } = this.props;
		const advertiser = advertisers.advertiser;

		await this.props.getPromos(params.userId);		
		const { promos } = this.props;			
		if (promos.promos) {
			var tempPromos = promos.promos;
			if (this.state.promo.label != "" ) tempPromos = promos.promos.filter(ii => ii.name.indexOf(this.state.promo.label) >=0);			
			this.setState({promos: tempPromos});
		} else{
			this.setState({promos: []});
		}
	}

	handleCloseSanckbar = () => {
		this.setState({errorResponse: {flag: false, msg: ''}});
	}

	handleModalClose = () => {
		this.setState({showpromoModal: false});
	}

	doDeactive = async (sr) => {		
		var promo = { id: sr.id, status: sr.status? 0: 1, option: "activation", isexisting: true};
		await this.props.activePromo(promo);		
		//await this.props.getPromos(this.props.params.aid);
		
		
		const { promos } = this.props;
					
		if (promos.response.status == "success") {
			const tempPormos = promos.promos.filter(ii => ii.name.indexOf(this.state.promo.label) >=0);			
			this.setState({promos: tempPormos});
		} else if (promos.response.status == "pending") {
			var tempPromos = [];
			promos.promos.forEach(ii => {
				if (ii.id == sr.id) ii.status=4;
				tempPromos.push(ii);
			});
			this.setState({promos: tempPromos});
		} else if (promos.response.status == "issue") {
			this.setState({
				errorResponse: {flag: true, msg: promos.response.message}
			});	
			
		}		
	}

	selectPromo = async (selectedOption) => {
		this.setState({ promo: selectedOption });
		const { promos } = this.props;
		
		if (promos.promos) {
			const temppromos = promos.promos.filter(sr => sr.name.indexOf(selectedOption.label)>=0);
			this.setState({promos: temppromos});
		}
	}

	doEdit = (id) => {
		const { promos } = this.props;
		var promo = promos.promos.filter(sr => sr.id == id);			
		this.props.goto(`/promo/${id}?aid=${promo[0].advertiser_id}`);
	}

	render()
	{
		const {
			promos,
			parameters, classes, advertisers
		} = this.props;					
		
		const {
			showpromoModal,
			userId,
			promo
		} = this.state;		
		
		var selAds = [];
		
		if (promos.promos.length >0) {
			promos.promos.forEach(ad => {
				selAds.push({id: ad.id, label: ad.name});
			});
		}

		selAds.sort((a,b) => a.id-b.id);
		var loading = promos.getPromoPending || promos.getPromosPending || promos.updatePromoPending || promos.activePromoPending;		

		return (
			<div>
			<Grid container spacing={8}>
				<Grid container className={classes.row}  alignItems="flex-end">
					<Select
						name="advertiser"
						value={promo}
						onChange={this.selectPromo}
						options={selAds}
						styles={selectStyle}
						className={classes.input}
					/>
					{ this.state.errorForAd &&
					<div className={classes.error}> Please Select Advertiser</div>
					}
				</Grid> 
				<PromoTable promos={this.state.promos} doEdit={this.doEdit} doDeactive={this.doDeactive} loading={loading}/>
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

PromoPage.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ promos, advertisers, logos }) => ({
			promos, advertisers, logos
		}),
		{
			getPromos,
			getPromo,
			addPromo,
			updatePromo,
			activePromo,
			getAdvertiser,
			goto			
		}
	)(PromoPage));