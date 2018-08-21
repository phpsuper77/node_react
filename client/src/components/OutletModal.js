import React, { Component } from 'react'
import moment from 'moment';
import { goto, redirect, preload, meta } from 'react-website'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import classNames from 'classnames';
import { withStyles } from 'material-ui/styles';
import Modal from 'material-ui/Modal';
import Paper from 'material-ui/Paper';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import AppBar from 'material-ui/AppBar';
import Grid from 'material-ui/Grid';
import GridList, { GridListTile, GridListTileBar } from 'material-ui/GridList';

import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';
import { TextValidator, ValidatorForm, TimeValidator } from 'react-material-ui-form-validator';
import Snackbar from '@material-ui/core/Snackbar';
import Checkbox from 'material-ui/Checkbox';

import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Save from '@material-ui/icons/Save';
import Switch from 'material-ui/Switch';
import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';

import TimeInput from 'material-ui-time-picker'
import Select from 'react-select';

import { EditorState, convertToRaw, convertFromRaw, ContentState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import DefaultLogo from '../../assets/favicon.png';
import Badge from '@material-ui/core/Badge';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import voucher_codes from 'voucher-code-generator';

import {	
	getOutlets,
	getOutlet,
	addOutlet,
	updateOutlet,
} from '../redux/outlets';

import {	
	getAdvertiser,
	getAdvertisers,	
} from '../redux/advertisers';

import {
	uploadLogo
} from '../redux/logos'

import './logo.scss'
import 'react-website/components/Loading.css'
import 'react-website/components/LoadingIndicator.css'


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
	  width: '70vw',	  
  },
  demoEditor: {
	  height: 250,
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
    width: 100,
	height: 100,
	borderRadius: 0,
	marginBottom: '-20px'
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
  },
  blank: {
	  
  },
  margin: {
    margin: theme.spacing.unit * 2,
  },
  badgeButton: {
	top: 0,
    width: 24,
    right: 0,
    height: 24,
    display: 'flex',
    zIndex: 1,
    position: 'absolute',
    flexWrap: 'wrap',
    fontSize: '0.75rem',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    alignItems: 'center',
    borderRadius: '50%',
    alignContent: 'center',
    flexDirection: 'row',
	justifyContent: 'center',
	boxShadow: '0 0 3px rgba(0, 0, 0, 0.3)',
	backgroundColor: 'white',
	color: 'grey'
  }
});

@withRouter
@preload(async ({ dispatch, parameters, location }) => {	
	var aid = location.query.aid
	if (parameters && parameters.id) {
		await dispatch(getOutlet(parameters.id));		
	}	
	await dispatch(getAdvertiser(aid));
	await dispatch(getAdvertisers());	
})
@meta(({ state }) => ({ title: 'Outlet' }))
class MyModal extends Component
{	
	constructor(props) {
		super(props);	
		
		this.state = {
			advertiser: {id: 0, label: ''},
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
			view_images_path: [],			
			status: true,
			error: {
				"Mon": false, "Tue": false, "Wed": false, "Thu": false, "Fri": false, "Sat": false, "Sun": false
			},
			errorResponse: {
				flag: false, msg: "Response is failed"
			},
			outletCrAd: false,
			checkedSelect: [],
			formdatas: null,
			logoFlag: false,
			imagenames: []			
		}
	}

	componentDidMount = async () => {
		var id = this.props.params.id;
		var aid = this.props.location.query.aid;
		
		//if (id && !this.props.outlets.outlet) {
			await this.props.getOutlet(id);			
		//}
			
		if (!this.props.advertisers.advertiser)
			await this.props.getAdvertiser(aid);
		
		const { outlets, advertisers } = this.props;
		
		var outlet = outlets.outlet;
		var advertiser = advertisers.advertiser;

		var vcodes = voucher_codes.generate({
			length: 4,
			count: 1,
			charset: voucher_codes.charset("numbers")
		});
		var vcode = vcodes[0];
		this.setState({vcode: vcode});

		if (advertiser) {
			this.setState({
				advertiser: {id: advertiser.id, label: advertiser.name},
				s_images: advertiser.s_images
			})
		}
		var descr = (outlet && outlet.descr)?outlet.descr:( (advertiser && advertiser.descr)? advertiser.descr: ""); 
		var timearr = (outlets.outlet && outlets.outlet.ophours)? outlets.outlet.ophours: "";
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
		
		if (outlet) {
			
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
				statusMsg: (outlet.status? "Active": "Inactive"),
				email: outlet.email,
				phone: outlet.phone,			
				s_images: outlet.s_images,
				s_images_path: outlet.s_images_path.split(","),
				view_images_path: outlet.s_images_path.split(","),
				status: (outlet.status? true: false),
				outlet_code: outlet.outlet_code				
			});
		} else {
			this.setState({
				ophours: timearr
			})
		}
		
		//const { descr } = this.state;		
		const contentBlock = htmlToDraft(descr);
		if (contentBlock) {
		  const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
		  const editorState = EditorState.createWithContent(contentState);
		  this.setState({
			editorState: editorState,
			descr: descr
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
					starthr: new Date(moment().hours(11).minutes(0).seconds(0).format()),
					endhr: new Date(moment().hours(20).minutes(0).seconds(0).format())
				}
			);
		});
		return resArr;
	}

	selectAdvertiser = (selectedOption) => {
		this.setState({ advertiser: selectedOption });
		var selAdvertisers = this.props.advertisers.advertisers.filter(ii=> ii.id==selectedOption.id);
		var advertiser = selAdvertisers[0];
		
		if (advertiser) {
			this.setState({s_images: advertiser.s_images});			
			this.setState({ descr: advertiser.descr});

			const contentBlock = htmlToDraft(advertiser.descr);
			if (contentBlock) {
			const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
			const editorState = EditorState.createWithContent(contentState);
			this.setState({
				editorState: editorState
			});
			}
		}
		this.setState({saveFlag: false});
		this.setState({errorForAd: false});	
	}

	handleSave = async () => {
		
		const {id, name, logo, address,	postalcode,	descr,	ophours, creditcard,
			email, phone, s_images, s_images_path, view_images_path, status, advertiser, error, outletCode, checkedSelect} = this.state;
		if (!advertiser.id || advertiser.id <= 0) {
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

		if (view_images_path.length <= 0 || !view_images_path || view_images_path[0] == "") {
			this.setState({	errorResponse:{ flag: true, msg: "Please upload shop images of the outlet"}});
			return;
		}

		if (outletCode.length != 8) {
			this.setState({
				errorResponse: {flag: true, msg: "Outlet code is needed to be original format!"}
			});
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
		
		var logopath = s_images;
		var outletImages = s_images_path;
		if (this.state.formdatas) {
			var form = this.state.formdatas;
			form.set("pretitle", this.state.advertiser.label);
			form.set("nexttitle", this.state.name);			
			await this.props.uploadLogo(form);
			var logoind = 0;
			if (this.state.logoFlag) {
				logoind=1;
				logopath = this.props.logos.imagepath[0];
				outletImages = this.props.logos.imagepath.splice(logoind);
				this.setState({logoFlag: false});
			} else {
				outletImages = this.props.logos.imagepath.splice(logoind);
				outletImages = outletImages.concat(this.state.s_images_path);
			}	
		}
		
		var saveData = {
			id: id,
			name: name,
			s_images: logopath,
			address: address,
			postalcode: postalcode,
			descr: descr,
			alt_text: advertiser.label + " " + name,
			ophours: strHours.join(";"),
			creditcard: creditcard?1:0,
			outlet_code: outletCode,
			email: email,
			phone: phone,						
			s_images_path: outletImages.join(","),			
			status: status?1:0,
			advertiser_id: advertiser.id
		}		
		const { updateOutlet, addOutlet } = this.props
		debugger
		if (this.props.params.id) {
			await updateOutlet(saveData);
		} else {
			await addOutlet(saveData);
		}		
		this.setState({saveFlag: true});
		const { outlets, goto } = this.props
		const apiResponse = outlets.apiResponse;
		await getOutlets();
		
		if (apiResponse.data.status == "success") {
			goto("/outlets/" + advertiser.id);
		} else if (apiResponse.data.status == "pending") {			
			setTimeout(() => {
				goto("/outlets/" + advertiser.id);
			}, 500);			
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
			//debugger;
			this.setState({ [name]: event.target.checked });
			if (event.target.checked) this.setState({statusMsg: "Active"});
			else this.setState({statusMsg: "InActive"});
		} else if (name == "creditcard") {
			this.setState({ [name]: event.target.checked });			
		} else {
			var value = event.target.value			
			const { advertiser } = this.state;
			if (name == "name") {				
				if (advertiser && value.length>2) {
					this.setState({
						outletCode: advertiser.label.substr(0,2).toLowerCase() + value.substr(0, 2).toLowerCase() + this.state.vcode
					});
				}
				this.setState({ [name]:  value});
			} else if (name == "outletCode") {
				var seed = advertiser.label.substr(0,2).toLowerCase() + this.state.name.substr(0, 2).toLowerCase();
				
				if (value.length > 8 || value.indexOf(seed) != 0) {
					this.setState({
						outletCode: seed + value.substr(4, 4),
						errorResponse: {flag: true, msg: "You can change only number parts and have to follow the original format"}
					});
					setTimeout(()=>{
						this.setState({
							errorResponse: {flag: false, msg: ''}
						});
					}, 3000);
				} else {
					this.setState({ [name]:  value});	
					this.setState({
						errorResponse: { flag: false, msg: ''}
					});
				}
			} else {
				this.setState({ [name]:  value});
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
		} 
		// else if (key == "Monday"){
		// 	var sameTimes = [];
		// 	var tempind = 0;			
		// 	tempstate.forEach(tt => {
		// 		if (tempind > ind) {
		// 			tt.starthr = daystate.starthr;
		// 			tt.endhr = daystate.endhr;
		// 		}
		// 		sameTimes.push(tt);
		// 		tempind++;
		// 	})
		// 	this.setState({
		// 		ophours: sameTimes
		// 	});
		// }

		this.setState({saveFlag: false});		
	}

	handleUpload = async (event, option) => {
		var form = new FormData();
		if (this.state.formdatas && option!= "logo")
			form = this.state.formdatas;				
		
		if (event.target.files.length > 10) {
			this.setState({
				errorResponse: { flag: true, msg: "You can upload max 10 images"}
			});
			return;
		}
		
		var old = this.state.view_images_path;
		var imagenames = [];
		if (event.target.files.length > 0) {
			for (var i=0; i<event.target.files.length ; i++) {
				form.append("logoFile[]", event.target.files[i]);
				if (option != "logo")
					imagenames.push(event.target.files[i].name);
				var that = this;
				var reader = new FileReader();
				reader.onload = function(e) {
					if (option == "logo") {
						that.setState({s_images: e.target.result, logoFlag: true});
					} else {
						old.push(e.target.result);
						that.setState({view_images_path: old});
					}
				}
				reader.readAsDataURL(event.target.files[i]);
			}
			this.setState({ imagenames: imagenames});
		}
		this.setState({formdatas: form, saveFlag: false});
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
										className={classes.input}
										styles={selectStyle}
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
											label="Outlet Name"
										/>										
									</Grid>
								</Grid>
								<Grid container cols={4} className={classes.row}  alignItems="flex-end">
								<Grid item xs={6} md={4} className={classes.col}>
									<TextValidator
										onChange={this.handleChange('outletCode')}
										name="outletCode"
										value={this.state.outletCode.toUpperCase()}
										validators={["required"]}
										errorMessages={['this field is required']}
										className={classes.input3}
										label="Outlet Code"
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
											className={classes.input3}
											label="Address"
										/>										
									</Grid>						
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">
								<Grid item cols={4} className={classes.col}>
									<TextValidator
										onChange={this.handleChange('postalcode')}
										name="postalcode"
										value={this.state.postalcode}
										validators={["required", "minStringLength:6", "maxStringLength:6"]}
										errorMessages={['this field is required','Postal Code should be 6 digits and a positive number', 'Postal Code should be 6 digits and a positive number']}
										className={classes.input3}
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
									<Grid item style={{marginLeft: 30, marginRight: 30}}>
									<TextValidator
										onChange={this.handleChange('email')}
										name="email"
										value={this.state.email}
										validators={["required", "isEmail"]}
										errorMessages={['this field is required', "Wrong email format"]}
										className={classes.input3}
										label="Email"
									/>
									</Grid>					
								</Grid>
								<Grid container className={classes.row} alignItems="flex-end">
								<Grid item style={{marginLeft: 30, marginRight: 30}}>							
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
							</Grid>
								<Grid container cols={4} className={classes.col}>
									<Grid item className={classes.col} style={{paddingTop: 10, marginLeft: -10}}>
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
								</Grid>
								<Grid container cols={4} className={classes.col}>
								<Grid item className={classes.col} style={{paddingTop: 10, marginLeft: -10}}>
									Status
								</Grid>
								<Grid item cols={2} className={classes.col}>
									<Switch
										checked={this.state.status}
										onChange={this.handleChange('status')}
										value="status"											
										color="primary"
									/>
									{this.state.statusMsg}							
								</Grid>
							</Grid>
								<Grid container cols={4} className={classes.col}>
									<Grid item xs={3} md={2} className={classes.col} style={{marginLeft: -10}}>
									<input
										accept="image/*"
										className={classes.fileInput}
										id="raised-button-file"
										multiple
										type="file"
										onChange={(event) => this.handleUpload(event, "logo")}
									/>
									<label htmlFor="raised-button-file">
										Outlet Featured Image
										<Button disabled={loading} variant="raised" component="span" className={classes.button}>
										Upload
									 	</Button>
										</label>
									<Grid item xs={9} md={2} className={classes.col} style={{marginLeft: -30}}>
									<Avatar
										alt="Logo"
										src={logoPath}
										className={classNames(classes.avatar, classes.bigAvatar, 'avatar-logo')}
									/>
								</Grid>
									</Grid>	
									<Grid item cols={2} className={classes.textWrapper} style={{ marginLeft: 10, marginTop: 20}}>
										<input
											accept="image/*"
											className={classes.fileInput}
											id="shop_images"
											multiple
											type="file"
											onChange={(event) => this.handleUpload(event, "shop")}
											requried={false}

										/>
										<label htmlFor="shop_images">
											Outlet Shop Images
											<br />	
											<Button disabled={loading} variant="raised" component="span" className={classes.button}>
												Upload
											</Button>	
										</label>							
									</Grid>
								</Grid>
									<GridList style={{ marginLeft: 30 }} className={classes.gridList} cols={2.5}>
										<div className={classes.wrapListDiv}>
										{ this.makeTilePart() }
										</div>
									</GridList>			
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

	removeImage = (filename, tile) =>{
		var temps = [];
		
		this.state.view_images_path.forEach(ii => {
			if (ii != tile) temps.push(ii);
		});
		var temppaths = this.state.s_images_path.filter(ii => ii!=tile);
		this.setState({s_images_path: temppaths});
		if (this.state.formdatas && this.state.imagenames.length>0) {
			var newformdata = new FormData();
			this.state.formdatas.forEach(ff => {
				if (ff.name != filename) newformdata.append("logoFile[]", ff);				
			})
			this.setState({ formdatas: newformdata});
		}					
		this.setState({
			view_images_path: temps
		});		
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
		timearr.push(
			<ListItem key={'label'} style={{paddingRight: 0}}>
				<ListItemText className={classes.blank} primary={''}/>
				<ListItemText className={classes.blank} primary={''}/>
				<ListItemText className={classes.blank} primary={''}/>
				<ListItemText className={classes.day} primary={'Closed?'} style={{ marginRight: '-15px', textAlign: 'right'}}/>				
			</ListItem>

		)
		ophours.forEach((ophour) => {
			timearr.push (			
				<ListItem key={ophour.key} style={{paddingRight: 0}}>
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
		const { view_images_path, imagenames } = this.state;
		const { classes } = this.props;
		var key = 0;		
		view_images_path.forEach(tile => {
			var filename = imagenames[key];
			key++;
			arr.push(
			<GridListTile key={tile} style={{marginLeft: 5, marginRight: 5, paddingTop: 12, paddingRight: 12, height: '90%'}}>
				<img src={tile} className={classes.shopImage} alt="logo"/>			
				<IconButton className={classes.badgeButton} onClick={() => this.removeImage(filename, tile)} type="button" color="inherit" aria-label="Close">
					<CloseIcon />
				</IconButton>
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