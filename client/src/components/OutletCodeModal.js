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

import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import ImageIcon from '@material-ui/icons/Image';
import DraftsIcon from '@material-ui/icons/Drafts';
import CloseIcon from '@material-ui/icons/Close';
import EmailIcon from '@material-ui/icons/Email';
import RateReview from '@material-ui/icons/RateReview';
import StarIcon from '@material-ui/icons/Star';
import Save from '@material-ui/icons/Save';
import WebIcon from '@material-ui/icons/Web';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { FormGroup, FormControlLabel } from 'material-ui/Form';
import Switch from 'material-ui/Switch';
import Radio from 'material-ui/Radio';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';

import TimeInput from 'material-ui-time-picker'
import Select from 'react-select';

import { EditorState, convertToRaw, convertFromRaw, ContentState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import DefaultLogo from '../../assets/images/favicon.png';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import configuration from '../../configuration';
import voucher_codes from 'voucher-code-generator';

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
	uploadLogo
} from '../redux/logos'

//import './Loading.scss'
import 'react-website/components/Loading.css'
import 'react-website/components/LoadingIndicator.css'

import Huskey from '../../assets/images/husky.jpg';

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
	var aid = location.query.aid
	await dispatch(getOutlet(aid));
	await dispatch(getAdvertiser(aid));
	await dispatch(getAdvertisers());	
})
@meta(({ state }) => ({ title: 'Outlet' }))
class MyModal extends Component
{	
	constructor(props) {
		super(props);	
		
		this.state = {
			advertiser: '',
			openFlag: true,
			editorState: EditorState.createEmpty(),
			saveFlag: false,
			statusMsg: "Active",
			outlet: {},
			//database fields
			id: null,
			outletCode: '',			
			name: '',
			logo: '',
			address: '',
			postalcode: '',
			descr: '',
			ophours: [],
			creditcard: false,
			email: '',
			phone: '',			
			s_images: '',
			s_images_path: [],			
			status: true,
			error: {
				"Mon": false, "Tue": false, "Wed": false, "Thu": false, "Fri": false, "Sat": false, "Sun": false
			},
			errorResponse: {
				flag: false, msg: "Response is failed"
			},
			outletCrAd: false,
			checkedSelect: [],			
		}
	}

	componentWillMount = async () => {
		var id = this.props.params.id;
		var aid = this.props.location.query.aid;

		const {advertisers, outlets} = this.props;
		
		// var ads = advertisers.advertisers;		
		// var adds = ads.filter(ad=> ad.id==aid)
		
		var outletArr = outlets.outlets;
		var advertiser = advertisers.advertiser;
		if (advertiser) {
			this.setState({
				advertiser: {id: advertiser.id, label: advertiser.name}
			})
		}
		
		var vcodes = voucher_codes.generate({
			length: 4,
			count: 1,
			charset: voucher_codes.charset("numbers")
		});
		var vcode = vcodes[0];
		this.setState({vcode: vcode});

		if (id && id != "null") {			
			var outletFArr = outletArr.filter((ad)=> ad.id == id);
			var outlet = outletFArr[0];
			// var hostUrl = outlet.host_url? outlet.host_url: "";
			var descr = (outlet && outlet.descr)?outlet.descr:( (advertiser && advertiser.descr)? advertiser.descr: ""); 
			var timearr = (outlet && outlet.ophours)? outlet.ophours: "";			
			
			if (timearr) {
				timearr = timearr.split(";");
				var tempTimeArr = [];
				var closed = [];
				timearr.forEach(tt=> {
					var ophour = JSON.parse(tt);
					tempTimeArr.push({
						key: ophour.key,
						starthr: new Date(moment.unix(ophour.starthr)),
						endhr: new Date(moment.unix(ophour.endhr))
					});
					if (ophour.closed == "Closed") closed.push(ophour.key);					
				})
				timearr = tempTimeArr;
				this.setState({checkedSelect: closed});
			} else {
				timearr = this.makeOpArr();
			}
			
			//if (outlet.outlet_code) outlet_code = outlet.outlet_code;
			
			this.setState({	
				id: outlet.id,			
				name: outlet.name,
				logo: outlet.logo,
				address: outlet.address,
				postalcode: outlet.postalcode,
				outletCode: outlet.outlet_code,
				descr: descr,
				ophours: timearr,
				creditcard: (outlet.creditcard? true: false),
				statusMsg: (outlet.creditcard? "Active": "Inactive"),
				email: outlet.email,
				phone: outlet.phone,			
				s_images: outlet.s_images,
				s_images_path: outlet.s_images_path.split(","),			
				status: (outlet.status? true: false),				
			});
			
		} else {
			this.setState({ophours: this.makeOpArr()});	
			var descr = advertiser && advertiser.descr? advertiser.descr: ""; 		
			this.setState({descr: descr});
		}
	}

	componentDidMount = () => {
		const { descr } = this.state;		
		const contentBlock = htmlToDraft(descr);
		if (contentBlock) {
		  const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
		  const editorState = EditorState.createWithContent(contentState);
		  this.setState({
			editorState: editorState
		  });
		}		
	}

	makeOpArr = () => {
		var dayArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];		
		var resArr = [];
		dayArr.forEach(day => {
			resArr.push(
				{
					key: day,
					starthr: new Date(moment()),
					endhr: new Date(moment().add(6, 'hrs'))
				}
			);
		});
		return resArr;
	}

	selectAdvertiser = (selectedOption) => {
		this.setState({ advertiser: selectedOption });
		this.setState({saveFlag: false});
		this.setState({errorForAd: false});	
	}

	handleSave = async () => {
		
		const {id, name, logo, address,	postalcode,	descr,	ophours, creditcard,
			email, phone, s_images, s_images_path, status, advertiser, error, outletCode, checkedSelect} = this.state;
		if (!advertiser.id) {
			this.setState({ errorForAd: true });
			return;
		}
		// time validation
		var eflag = error["Mon"] || error["Tue"] || error["Wed"] || error["Thu"];
		eflag = eflag || error["Fri"] || error["Sat"] || error["Sun"];
		if (eflag) return;

		if (descr.length <= 8 || descr == "" || !descr) {
			this.setState({
				errorResponse:{
					flag: true, msg: "You have to type description of the outlet"
				}
			});
			return;
		}

		if (s_images == "" || !s_images) {
			this.setState({	errorResponse:{ flag: true, msg: "Please upload logo image of the outlet"}});
			return;
		}

		if (s_images_path.length <= 0 || !s_images_path || s_images_path[0] == "") {
			this.setState({	errorResponse:{ flag: true, msg: "Please upload shop images of the outlet"}});
			return;
		}
		
		var strHours = [];
		ophours.forEach(ophour=> {
			var tempHr = {
				key: ophour.key,
				starthr: moment(ophour.starthr).format('X'),
				endhr: moment(ophour.endhr).format('X'),
				closed:  checkedSelect.indexOf(ophour.key) >=0? "Closed": "Open"
			};
			strHours.push(JSON.stringify(tempHr));
		});
		
		var saveData = {
			id: id,
			name: name,
			s_images: s_images,
			address: address,
			postalcode: postalcode,
			descr: descr,
			ophours: strHours.join(";"),
			creditcard: creditcard?1:0,
			outlet_code: outletCode,
			email: email,
			phone: phone,						
			s_images_path: s_images_path.join(","),			
			status: status?1:0,
			advertiser_id: advertiser.id
		}		
		
		const { updateOutlet, addOutlet } = this.props
		
		if (id) {
			await updateOutlet(saveData);
		} else {
			await addOutlet(saveData);
		}		
		this.setState({saveFlag: true});
		const { outlets, goto } = this.props
		const apiResponse = outlets.apiResponse;
		await getOutlets();
		
		if (apiResponse.data.status == "success") {
			this.setState({id: apiResponse.data.id});
			goto("/outlets/" + advertiser.id);
		} else {
			this.setState({
				errorResponse: {flag: true, msg: apiResponse.data.message}
			});
		}		
	}

	handleClose = () => {		
		const {router, goto} = this.props;
		const {advertiser} = this.state;
		
		if (!this.state.saveFlag) {
			if (window.confirm("You don't save data yet! Do you leave this page really?")) {
				this.setState({openFlag: false});
				router.goBack();
			}
		} else {
			if (advertiser && advertiser.id)								
				goto("/outlets/" + advertiser.id);
			else
				router.goBack();			
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

	handleTimeChange = (name, key) => time => {
		var flag = false;
		var daystates = this.state.ophours.filter(ophour=> ophour.key == key);
		var daystate = daystates[0];
		var ind = this.state.ophours.indexOf(daystate);
		var tempstate = this.state.ophours;
		var temperror = this.state.error;		
		
		if ( name == "endhr") {			
			var start = moment(daystate.starthr);
			var end = moment(time);
			if (start.isAfter(end)) flag = true;
			else daystate.endhr = time;
		} else {			
			var end = moment(daystate.endhr);
			var start = moment(time);
			if (start.isAfter(end)) flag = true;
			else daystate.starthr = time;
		}

		tempstate.splice(ind, 1, daystate);
		temperror[key] = flag;
		if (flag) {
			this.setState({
				error: temperror
			});
		} else {
			this.setState({
				ophours: tempstate
			});
		}

		this.setState({saveFlag: false});		
	}

	handleUpload = async (event, option) => {
		var form = new FormData();
		if (event.target.files.length > 10) {
			this.setState({
				errorResponse: { flag: true, msg: "You can upload max 10 images"}
			});
			return;
		}

		if (event.target.files.length > 0) {
			for (var i=0; i < event.target.files.length; i ++) {
				form.append("logoFile[]", event.target.files[i]);
			}			
		};
		
		await this.props.uploadLogo(form);
		if (option == "logo") {
			this.setState({s_images: this.props.logos.imagepath[0]});
		} else {
			this.setState({s_images_path: this.props.logos.imagepath});
		}		
		this.setState({saveFlag: false});			
	}

	onEditorStateChange = (editorState) => {
		var ss = draftToHtml(convertToRaw(editorState.getCurrentContent()));		
		this.setState({
			descr: ss
		});

		this.setState({
			editorState,
		});
	};

	handleCloseSanckbar = () => {
		this.setState({
			errorResponse: { flag: false, msg: this.state.error.msg }
		});
	}

	render() {
		const { classes, outlets, logos, advertisers } = this.props;			
		const {editorState, termEditorState, advertiser, s_images, s_images_path, ophours } = this.state;		
		var logoPath = s_images? s_images: DefaultLogo;	
		var tileData = s_images_path;
		var loading = outlets.addOutletPending || outlets.getOutletPending || outlets.getOutletsPending || outlets.updateOutletPending || logos.uploadLogoPending;
		var selAds = [];		
		
		if (advertisers.advertisers.length >0) {
			advertisers.advertisers.forEach(ad => {
				if (ad.status)
					selAds.push({id: ad.id, label: ad.name});
			});
		}

		selAds.sort((a,b) => a.id-b.id);

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
								Outlets
							</Typography>
							<IconButton onClick={this.handleClose} color="inherit" aria-label="Close">
								<CloseIcon />
							</IconButton>
						</Toolbar>
					</AppBar>
					
					<div className={classes.gridDiv}>
						<ValidatorForm
							ref="form"
							onSubmit={this.handleSave}						
						>							
							<Grid container spacing={8}>							
								<Grid container className={classes.row}  alignItems="flex-end">
									<Select
										name="advertiser"
										value={advertiser}
										onChange={this.selectAdvertiser}
										options={selAds}
										styles={selectStyle}
										className={classes.input}
									/>
									{ this.state.errorForAd &&
									<div className={classes.error}> Please Select Advertiser</div>
									}
								</Grid>
								<Grid container cols={4} className={classes.row}  alignItems="flex-end">
									<Grid item xs={6} md={4} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('name')}
											name="name"
											value={this.state.name}
											validators={["required"]}
											errorMessages={['this field is required']}
											className={classes.input3}
											label="Brand Name"
										/>										
									</Grid>
									<Grid item xs={6} md={4} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('outletCode')}
											name="outletCode"
											value={this.state.outletCode}
											validators={["required"]}
											errorMessages={['this field is required']}
											className={classes.input3}
											label="Outlet Code"
										/>										
									</Grid>
									<Grid item xs={3} md={2}className={classes.col}>
										<input
											accept="image/*"
											className={classes.fileInput}
											id="raised-button-file"
											multiple
											type="file"
											onChange={(event) => this.handleUpload(event, "logo")}
										/>
										<label htmlFor="raised-button-file">
											<Button disabled={loading} variant="raised" component="span" className={classes.button}>
												Upload Logo
											</Button>
										</label>
									</Grid>	
									<Grid item xs={9} md={2} className={classes.col}>
										<Avatar
											alt="Logo"
											src={logoPath}
											className={classNames(classes.avatar, classes.bigAvatar)}
										/>
									</Grid>
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item cols={4} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('address')}
											name="address"
											value={this.state.address}
											validators={["required"]}
											errorMessages={['this field is required']}
											className={classes.input}
											label="Address"
										/>										
									</Grid>
									<Grid item cols={4} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('postalcode')}
											name="postalcode"
											value={this.state.postalcode}
											validators={["required", "minNumber:0"]}
											errorMessages={['this field is required', 'Code number is positive number']}
											className={classes.input}
											label="Postal Code"
										/>										
									</Grid>							
								</Grid>
								<Grid item className={classes.subtitle}>
									Description: 
								</Grid>
								<Grid container className={classes.row} alignItems="flex-end">
									<Grid item className={classes.textWrapper}>
										<Editor
											editorState={editorState}
											wrapperClassName="home-wrapper rdw-editor-wrapper"
											editorClassName={classes.demoEditor}        
											onEditorStateChange={this.onEditorStateChange}
										/>						  
									</Grid>							
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item cols={2} className={classes.col}>
										Operation Hours
									</Grid>
								</Grid>
								<Grid container className={classes.row} className={classes.timepart}  alignItems="flex-end">
									<List component="nav" className={classes.nav}>
										{ this.makeTimePart() }
									</List>									
								</Grid>
								<Grid container className={classes.row} alignItems="flex-end">
									<TextValidator
										onChange={this.handleChange('email')}
										name="email"
										value={this.state.email}
										validators={["required", "isEmail"]}
										errorMessages={['this field is required', "Wrong email format"]}
										className={classes.input3}
										label="Email"
									/>							
									<TextValidator
										onChange={this.handleChange('phone')}
										name="phone"
										value={this.state.phone}
										validators={["required", "minNumber:0"]}
										errorMessages={['this field is required', "Phone number is positive"]}
										className={classes.input3}
										label="Phone"
									/>									
								</Grid>
								<Grid container cols={4} className={classes.col}>
									<Grid item className={classes.col}>
										Accepts Credit Card?
									</Grid>
									<Grid item cols={2} className={classes.col}>
										<Switch
											checked={this.state.creditcard}
											onChange={this.handleChange('creditcard')}
											value="creditcard"
											color="primary"
										/>										
									</Grid>
									<Grid item className={classes.col}>
										Status
									</Grid>
									<Grid item cols={2} className={classes.col}>
										<Switch
											checked={this.state.status}
											onChange={this.handleChange('status')}
											value="status"
											disabled={true}
											color="primary"
										/>
										{this.state.statusMsg}							
									</Grid>
								</Grid>
								<Grid container cols={4} className={classes.col}>
									<Grid item cols={2} className={classes.textWrapper}>
										<input
											accept="image/*"
											className={classes.fileInput}
											id="shop_images"
											multiple
											type="file"
											onChange={(event) => this.handleUpload(event, "shop")}
										/>
										<label htmlFor="shop_images">
											<Button disabled={loading} variant="raised" component="span" className={classes.button}>
												Upload Shop Images
											</Button>
										</label>									
									</Grid>
								</Grid>
								<Grid container className={classes.rowImage}>
									<GridList className={classes.gridList} cols={2.5}>
										<div className={classes.wrapListDiv}>
										{ this.makeTilePart() }
										</div>
									</GridList>							
								</Grid>
								<Grid container className={classes.rowImage} alignItems="flex-end">
									<Button disabled={loading} type="submit" color="primary" className={classes.button} variant="raised" size="small">
										<Save className={classNames(classes.leftIcon, classes.iconSmall)} />
										Save
									</Button>							
								</Grid>
							</Grid>
						</ValidatorForm>
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
		const { ophours, error } = this.state;
		const { classes } = this.props;

		var timearr = [];
		ophours.forEach((ophour) => {
			timearr.push (			
				<ListItem key={ophour.key}>
					<ListItemText className={classes.day} primary={ophour.key}/>
					<TimeInput
						mode="12h"
						onChange={this.handleTimeChange('starthr', ophour.key)}
						value={ophour.starthr}																																	
					/>
					<ListItemText primary=" - "/>
					<TimeInput
						mode="12h"
						onChange={this.handleTimeChange('endhr', ophour.key)}
						value={ophour.endhr}	
						className={ error[ophour.key]? classes.error: ""}
					/>
					<Checkbox
                        checked={this.state.checkedSelect.indexOf(ophour.key) !== -1}                        
                        tabIndex={-1}                        
                        disableRipple
                        onClick={this.handleToggle(ophour.key)}
                      />
				</ListItem>			
			)							
		});
		return timearr;
	}

	makeTilePart = () => {
		var arr = [];
		const { s_images_path } = this.state;
		const { classes } = this.props;		
		s_images_path.forEach(tile => {
			arr.push(
			<GridListTile key={tile}>
				<img src={tile} className={classes.shopImage} alt="logo" />										
			</GridListTile>
		)});
		return arr;
	}
}

MyModal.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ outlets, advertisers, logos }) => ({
			outlets, advertisers, logos
		}),
		{
			getOutlets,
			getOutlet,
			addOutlet,
			updateOutlet,
			getAdvertiser,
			redirect,
			goto,
			uploadLogo				
		}
	)(MyModal));