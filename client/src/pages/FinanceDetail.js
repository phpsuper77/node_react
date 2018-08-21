import React, { Component } from 'react'
import { meta, preload, goto} from 'react-website'
import { connect } from 'react-redux'
import FinanceDetailTable from '../components/FinanceDetailTable'
import { withRouter } from 'react-router'
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import Modal from 'material-ui/Modal';

import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import Grid from 'material-ui/Grid';
import GridList, { GridListTile, GridListTileBar } from 'material-ui/GridList';

import MomentUtils from 'material-ui-pickers/utils/moment-utils';
import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider';
import TimePicker from 'material-ui-pickers/TimePicker';
import DatePicker from 'material-ui-pickers/DatePicker';
import DateTimePicker from 'material-ui-pickers/DateTimePicker';
import Paper from 'material-ui/Paper';

import DateRangeIcon from '@material-ui/icons/DateRange';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import moment from 'moment';

import Snackbar from '@material-ui/core/Snackbar';
import configuration from '../../configuration';
import socketIOClient from 'socket.io-client';

import {	
	getFinance,
	getFinances,
	cancelFinance,
	saveFinance
} from '../redux/finance';

import {	
	getAdvertiser	
} from '../redux/advertisers';

const styles = theme => ({
	paper: {
	  position: 'relative',
	  width: "40vw",
	  backgroundColor: theme.palette.background.paper,
	  boxShadow: theme.shadows[5],
	  padding: theme.spacing.unit * 4,
	  margin: "auto",
	  textAlign: "center"
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
		width: 250,
		marginLeft: theme.spacing.unit * 4,
		marginRight: theme.spacing.unit * 4
	},
	input3: {
	  width: 150,
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
	  left: 0,
	  marginLeft: 10,
	  marginRight:10
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
	var aid = parameters.aid			
	if (aid) {
		await dispatch(getAdvertiser(aid));		
		await dispatch(getFinance(aid));
	}
})
@meta(({ state }) => ({ title: 'promo' }))
class FinanceDetailPage extends Component
{
	constructor()
	{
		super()
		this.state = {
			userId: null,					
			finances:[],
			openFlag: false,
			paidDate: moment(),
			checkedIds: [],
			errorResponse: { flag: false, msg: ""},
			option: ''     
		}		
	}	

	componentWillMount = () => {
		const { finances } = this.props;
		const financeData = finances.financeData;
		if (financeData && financeData.length>0) this.setState({finances: financeData});
	}

	componentDidMount = async () => {
		if (!this.props.advertisers.advertiser && this.props.params.aid) {
			var aid = this.props.params.aid;
			await this.props.getAdvertiser(aid);		
			await this.props.getFinance(aid);

			const { finances } = this.props;
			const financeData = finances.financeData;
			if (financeData && financeData.length>0) this.setState({finances: financeData});
		}

		const socket = socketIOClient(configuration.socket_endpoint);		
		socket.on('updatingFinance', async (response)=> {			
			var aid = this.props.params.aid;
			await this.props.getFinance(aid);

			const { finances } = this.props;
			const financeData = finances.financeData;
			if (financeData && financeData.length>0) this.setState({finances: financeData});
		})		
	}

	doDeactive = async (id) => {
		const { cancelFinance, getFinance, params } = this.props;
		await cancelFinance(id);
		await getFinance(params.aid);
		const { finances } = this.props;
		const financeData = finances.financeData;			
		if (financeData) this.setState({finances: financeData});
	}

	handleCloseSanckbar = () => {
    this.setState({errorResponse: { flag: false, msg: ''}});
  }

	doEdit = (id) => {
		this.setState({option: "expirey_date", checkedIds: [id]});
		this.setState({openFlag: true});
	}

	handleDate = (value) => {
		this.setState({paidDate: value});
	}

	handleClose = async () => {
		this.setState({openFlag: false});
		var value = this.state.paidDate;
		var paidDate = value.format();		
		var ids = this.state.checkedIds;
		if (ids.length > 0) {
			const { finances } = this.props;
			var tempIds = [];
			if (finances && finances.financeData) {
				var flag = false;
				finances.financeData.forEach(ff => {
					if (ids.indexOf(ff.id) >= 0 && value.isBefore(moment(ff.pDate))) {
						flag=true;
					}
				});
				if (flag) {
					this.setState({
						errorResponse: {flag: true, msg: 'Please select Date after purchase date!'}
					});
					return;
				}
			}			
			await this.props.saveFinance({paidDate: paidDate, ids: ids.join(","), option: this.state.option});
			const { params, getFinance } = this.props;
			if (this.props.finances.response.status == "success") {
				await getFinance(params.aid);				
				const financeData = this.props.finances.financeData;					
				if (financeData) this.setState({finances: financeData});
			} else {
				this.setState({errorResponse: { flag: true, msg: finances.response.message}});
			}
			this.setState({checkedIds: []});
		}
	}

	handleToggle = (ids) => {
		this.setState({checkedIds: ids});
	}

	handleOpen = () => {
		this.setState({option: "paid_date"})
		var ids = this.state.checkedIds;
		if (ids.length > 0) {
			this.setState({openFlag: true});
		} else {
			this.setState({errorResponse: {flag: true, msg: "Please select Transactions for paid"}});
		}
	}

	handleCancel = () => {
		this.setState({openFlag: false});
	}

	handleMsg = (msg) => {
		this.setState({
			errorResponse: { flag: true, msg: msg}
		})
	} 

	render()
	{
		const {
			parameters, classes, advertisers
		} = this.props;					
		const advertiser = advertisers.advertiser;
		
		const {
			userId,
			finances,
			paidDate
		} = this.state;	
		
		var advertiserName=  advertiser? advertiser.name: '';

		return (
			<Grid container spacing={8}>
				<Grid container className={classes.row}  alignItems="flex-end">
					<Grid item xs={8} md={8}>
						<Typography>Finance - {advertiserName} </Typography>
					</Grid>
					<Grid item xs={4} md={4}>
						<Button variant="raised" onClick={this.handleOpen}>Make Payment</Button>
					</Grid>
				</Grid> 
				<FinanceDetailTable finances={finances} doEdit={this.doEdit} doDeactive={this.doDeactive} handleToggle={this.handleToggle} handleMsg={this.handleMsg}/>
				<Modal
					aria-labelledby="simple-modal-title"
					aria-describedby="simple-modal-description"
					open={this.state.openFlag}					
				>
					<Paper className={classes.paper}>
					<MuiPickersUtilsProvider utils={MomentUtils}>
						<DatePicker
							value={paidDate}
							onChange={(date) => {this.handleDate(date)}}
							format="DD/MM/YYYY"
							className={classes.input3}
							label="Paid Date"														
							leftArrowIcon={<ArrowBackIcon/>}
							rightArrowIcon={<ArrowForwardIcon/>}
						/>
						<Button variant="raised" color="primary" className={classes.button} onClick={this.handleClose}>Ok</Button>
						<Button variant="raised" color="primary" onClick={this.handleCancel}>Cancel</Button>
					</MuiPickersUtilsProvider>					
					</Paper>
				</Modal>
				<Snackbar
						open={this.state.errorResponse.flag}
						onClose={this.handleCloseSanckbar}
						ContentProps={{
							'aria-describedby': 'message-id',
						}}
						message={<span id="message-id">{ this.state.errorResponse.msg }</span>}
					/>
			</Grid>
		)
	}
}

FinanceDetailPage.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ finances, advertisers }) => ({
			finances, advertisers
		}),
		{
			getFinance,
			getFinances,
			getAdvertiser,
			cancelFinance,
			saveFinance,
			goto			
		}
	)(FinanceDetailPage));