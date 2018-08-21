import React, { Component } from 'react'
import moment from 'moment';
import { Link, IndexLink, goto, redirect, preload, meta, Loading } from 'react-website'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import classNames from 'classnames';
import { withStyles } from 'material-ui/styles';
import Zoom from 'material-ui/transitions/Zoom';
import Modal from 'material-ui/Modal';
import Paper from 'material-ui/Paper';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import AppBar from 'material-ui/AppBar';
import Grid from 'material-ui/Grid';
import GridList, { GridListTile, GridListTileBar } from 'material-ui/GridList';

import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';
import Divider from 'material-ui/Divider';
import TextField from 'material-ui/TextField';
import { TextValidator, ValidatorForm, TimeValidator } from 'react-material-ui-form-validator';
import Snackbar from '@material-ui/core/Snackbar';
import Checkbox from 'material-ui/Checkbox';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import Table, {
	TableHead,
  TableBody,
  TableCell,
  TableFooter,
  TablePagination,
  TableRow,
} from 'material-ui/Table';

import UserTable from './userTable';

import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';

import TimeInput from 'material-ui-time-picker'
import Select from 'react-select';
import configuration from '../../configuration';
import Save from '@material-ui/icons/Save';

import {	
	getOutlets,
	getOutlet,
	connectOutlet,
	addOutlet,
	updateOutlet,
} from '../redux/outlets';

import {	
	getAdvertiser,
	getAdvertisers,
	connectAdvertiser	
} from '../redux/advertisers';

import {
	getAllUsers,
	savePermission
} from '../redux/user'

//import './Loading.scss'
import 'react-website/components/Loading.css'
import 'react-website/components/LoadingIndicator.css'

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
  day: {
	  width: 100
  },
  wrapListDiv: {
	padding: 2,
	display: 'inherit',
	marginTop: 5
  }
});

@withRouter
@preload(async ({ dispatch, parameters, location }) => {	
	await dispatch(getAllUsers());	
})
@meta(({ state }) => ({ title: 'Outlet' }))
class MyModal extends Component
{	
	constructor(props) {
		super(props);	
		
		this.state = {
			advertiser: '',
			openFlag: true,
			saveFlag: false,
			statusMsg: "Active",
			outlet: {},
			//database fields
			checkedSelect: [],
			mKeys: [],
			errorResponse: {flag: false, msg: ''},
			users: [],
			useremail: ''
		}
	}

	componentWillMount = async () => {
		var mKeys = ["advertiser", "outlet", "service", "promo", "finance"];
		this.setState({ mKeys: mKeys});
		// const { users } = this.props;		
		// if (users.alldatas && users.alldatas.length > 0) {
		// 	this.setState( { users: users.alldatas});
		// }		
	}

	componentDidMount = async () => {
		//console.log(this.state.user.length);
		if (!this.state.users || this.state.users.length <= 0) {
			await this.props.getAllUsers();
			const { users } = this.props;		
			if (users.alldatas && users.alldatas.length > 0) {
				this.setState( { users: users.alldatas});
				var temp = [];
				users.alldatas.forEach(user => {
					if (user.role < 2) temp.push(user.id);
				});
				this.setState({checkedSelect: temp});
			}

		}		
	}

	selectAdvertiser = (selectedOption) => {
		this.setState({ advertiser: selectedOption });
		this.setState({saveFlag: false});
		this.setState({errorForAd: false});	
	}

	handleSave = async () => {
		
		var permissions = this.state.checkedSelect;
		var email = this.state.useremail;

		var newUsers = [];
		this.state.users.forEach(user => {
			if (permissions.indexOf(user.id) >= 0) newUsers.push({id: user.id, role: 1});
			else newUsers.push({id: user.id, role: 2});
		})
		var data = {
			email: email,
			permissions: newUsers
		}
		
		await this.props.savePermission(data);
		const {users} = this.props;
		if (users.response.status == "success") {
			await this.props.getAllUsers();
			const { users } = this.props;		
			if (users.alldatas && users.alldatas.length > 0) {
				this.setState( { users: users.alldatas});
				var temp = [];
				users.alldatas.forEach(user => {
					if (user.role < 2) temp.push(user.id);
				});
				this.setState({checkedSelect: temp});
			}
		} else {
			this.setState({
				errorResponse: {
					flag: true, msg: users.response.message
				}
			})
		}
				
	}

	handleChange = name => event => {		
		if (name == "status") {
			this.setState({ [name]: event.target.checked });
			if (event.target.checked) this.setState({statusMsg: "Active"});
			else this.setState({statusMsg: "InActive"});
		} else if (name == "creditcard") {
			this.setState({ [name]: event.target.checked });			
		} else {
			var value = event.target.value
			this.setState({ [name]:  value});
			if (name == "name") {
				const { advertiser } = this.state;
				//debugger
				if (advertiser && value.length>2) {					
					this.setState({
						outletCode: advertiser.label.substr(0,2) + '-' + value.substr(0, 2) + this.state.vcode
					});
				}
			}
		}

		this.setState({saveFlag: false});			
	};

	handleCloseSanckbar = () => {
		this.setState({
			errorResponse: { flag: false, msg: this.state.error.msg }
		});
	}

	handleClose = () => {
		this.setState({openFlag: false});
		this.props.goto('/');
	}

	render() {
		const { classes, advertisers } = this.props;					
		
		var loading = false
		var selAds = [];
		
		const { advertiser, users } = this.state;

		return (
			<Modal
				aria-labelledby="simple-modal-title"
				aria-describedby="simple-modal-description"
				open={this.state.openFlag}
				onClose={this.handleClose}
			>				
				<Paper className={classes.paper}>				
				<div className={classes.root}>
					<AppBar position="static">
						<Toolbar>							
							<Typography variant="title" color="inherit" className={classes.flex}>
								User Management
							</Typography>
							<IconButton onClick={this.handleClose} color="inherit" aria-label="Close">
								<CloseIcon />
							</IconButton>

						</Toolbar>
					</AppBar>
					
					<div className={classes.gridDiv}>
						<Button disabled={loading} type="button" onClick={this.handleSave} color="primary" className={classes.button} variant="raised" size="small">
							<Save className={classNames(classes.leftIcon, classes.iconSmall)} />
							Save
						</Button>
						<ValidatorForm
							ref="form"
							onSubmit={this.handleSave}						
						>							
							<Grid container spacing={8}>
								
								<Grid container cols={4} className={classes.row}  alignItems="flex-end">
									<Grid item className={classes.col} xs={4} md={4}>
										Invite User:
									</Grid>
									<Grid item xs={6} md={4} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('useremail')}
											name="useremail"
											value={this.state.useremail}
											validators={["required", "isEmail"]}
											errorMessages={['this field is required', 'Wrong email format']}
											className={classes.input3}
											label="User Email"
										/>										
									</Grid>									
								</Grid>
								{/*
								<Grid container className={classes.row} className={classes.timepart}  alignItems="flex-end">
									<Grid item className={classes.col} xs={4} md={4}>
										Permissions:
									</Grid>
									<Grid item className={classes.col} xs={6} md={6}>
										<ExpansionPanel>
											<ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
											<Typography className={classes.heading}>Accessable Modules</Typography>
											</ExpansionPanelSummary>
											<ExpansionPanelDetails>
											<List component="nav" className={classes.nav}>
												{ this.makeTimePart() }
											</List>
											</ExpansionPanelDetails>
										</ExpansionPanel>
									</Grid>							
								</Grid>	
								*/}							
							</Grid>
						
						</ValidatorForm>
						<UserTable users={users} loading={loading} checkedSelect={this.state.checkedSelect} handleToggle={this.handleToggle}/>
					</div>					
				</div>
				<Fade
						in={loading}
						style={{transitionDelay: loading ? '800ms' : '0ms',}}
						unmountOnExit
					>
						<LinearProgress color="secondary" />
				</Fade>
				<Snackbar
						open={this.state.errorResponse.flag}
						onClose={this.handleCloseSanckbar}
						ContentProps={{
							'aria-describedby': 'message-id',
						}}
						message={<span id="message-id">{ this.state.errorResponse.msg }</span>}
					/>
				</Paper>				
			</Modal>
		)
	}

	handleToggle = value => async () => {   
		const { checkedSelect } = this.state;    
			const currentIndex = checkedSelect.indexOf(value);
			const newChecked = [...checkedSelect];
		
			if (currentIndex === -1) {
			  newChecked.push(value);
			} else {
			  newChecked.splice(currentIndex, 1);
			}


		
			this.setState({
			  checkedSelect: newChecked,
		});		
	};

	makeTimePart = () => {
		const { mKeys, error } = this.state;
		const { classes } = this.props;

		var timearr = [];
		mKeys.forEach((option) => {
			timearr.push (			
				<ListItem key={option}>
					<ListItemText className={classes.day} primary={option}/>
					<Checkbox
                        checked={this.state.checkedSelect.indexOf(option) !== -1}                        
                        tabIndex={-1}                        
                        disableRipple
                        onClick={this.handleToggle(option)}
                      />
				</ListItem>			
			)							
		});
		return timearr;
	}
}

MyModal.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ outlets, advertisers, users }) => ({
			outlets, advertisers, users
		}),
		{
			getOutlets,
			getOutlet,
			addOutlet,
			updateOutlet,
			getAdvertiser,
			redirect,
			goto,
			getAllUsers,
			savePermission				
		}
	)(MyModal));