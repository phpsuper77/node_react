import React, { Component } from 'react'
import { Link, IndexLink, goto, redirect, preload, meta, Loading } from 'react-website'
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
import { RadioGroup } from 'material-ui/Radio';
import { FormControl, FormLabel } from 'material-ui/Form';

import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';
import { TextValidator, ValidatorForm, TimeValidator } from 'react-material-ui-form-validator';

import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Save from '@material-ui/icons/Save';
import { FormGroup, FormControlLabel } from 'material-ui/Form';
import Switch from 'material-ui/Switch';
import Radio from 'material-ui/Radio';
import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';
import Checkbox from 'material-ui/Checkbox';
import Snackbar from '@material-ui/core/Snackbar';

import Select from 'react-select';

import { EditorState, convertToRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import DefaultLogo from '../../assets/favicon.png';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';


import {	
	getServices,
	getService,	
	addService,
	updateService,
} from '../redux/services';

import {	
	getAdvertiser,
	getAdvertisers,	
} from '../redux/advertisers';

import {	
	getOutlet,
	getSpecialOutlets,	
	updateOutlet,
} from '../redux/outlets';

import {
	uploadLogo
} from '../redux/logos'

import './logo.scss'
import 'react-website/components/Loading.css'
import 'react-website/components/LoadingIndicator.css'
import { TextField } from '@material-ui/core';

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
  listItem: {
	  paddingTop: 0,
	  paddingBottom: 0
  },
  group: {
	  flexDirection: "row",
	  marginLeft: theme.spacing.unit *3
  }
});

const selectStyle = {
	option: ()=> ({
		backgroundColor: 'white !important',
		padding: 10,
		paddingLeft: 15		
	})
}

@withRouter
@preload(async ({ dispatch, parameters, location }) => {	
	var aid = location.query.aid	
	if (parameters.id) {
		await dispatch(getService(parameters.id));		
	}
	
	if (aid) {		
		await dispatch(getSpecialOutlets(aid));
		await dispatch(getAdvertiser(aid));
	}	
	await dispatch(getAdvertisers());		
})
@meta(({ state }) => ({ title: 'Service' }))
class MyModal extends Component
{	
	constructor(props) {
		super(props);	
		
		this.state = {
			advertiser: {id: 0, label: ""},
			openFlag: true,
			editorState: EditorState.createEmpty(),
			termEditorState: EditorState.createEmpty(),
			saveFlag: true,
			statusMsg: "InActive",
			service: {},
			//database fields
			id: null,			
			name: '',
			descr: '',
			price: 0,
			type: "",
			subtype: '',
			terms: '',
			status: true,
			duration: '',			
			s_images: '',
			errorForAd: true,
			checked: [],
			checkedOutlet: [],			
			selTypes: [],
			selectedType: {id: '', label: ''},
			errorForOutlet: false,
			errorResponse: { flag: false, msg: ""},
			formdatas: null,
			customduration: '',

		};		
		
		this.handleChange = this.handleChange.bind(this);
		this.handleSave = this.handleSave.bind(this);
		this.handleToggle = this.handleToggle.bind(this);		
	}	

	titleArr = [{
			key: "Facial", subtitle: ["Anti-Ageing/Lifting", "Hydration", "Brightening/Whitening", "Acne/Purifying", "Organic"]
		}, {
			key: "Massage", subtitle: ["Full Body", "Foot", "Pregnancy", "Couples", "Back & Shoulder", "Aromatherapy", "Swedish", "Thai", "Javanese", "Deep Tissue",
				"Lymphatic Drainage", "Detox", "Hot Stone"]
		}, {
			key: "Hair", subtitle: ["Colouring", "Highlights", "Women’s Haircut", "Men’s Haircut", "Styling", "Rebonding", "Curls", "Growth/Loss Treatment",
			"Treatment", "Extension"]
		}, {
			key: "Brows/Lashes", subtitle: ["Brows Embroidery", "Brows Trimming", "Brows Tinting", "Eyeliner Embroidery", "Eyelash Extension"]
		}, {
			key: "Hair Removal", subtitle: ["Threading", "Brazilian", "IPL", "Arm", "Leg", "Back", "Lips"]
		}, {
			key: "Aesthetics Treatment", subtitle: ["Laser", "Lifting", "Botox", "Fillers", "Semi-permanent foundation", "Thread", "Scar Removal", "Tattoo Removal",
			"Pigmentation", "IPL"]
		}, {
			key: "Aesthetics Surgery", subtitle: ["Double Eyelid", "Breast Enhancement/Reduction", "Liposuction"]
		}, {
			key: "Weight Management", subtitle: ["Full Body", "Fat Freeze", "Contouring"]
		}, {
			key: "Nail", subtitle: ["Manicure", "Pedicure", "Express Manicure", "Nail Art", "Nail Extension"]
		}, {
			key: "Makeup", subtitle: ["Bridal", "D&D", "Professional"]
		}
	];	

	componentDidMount = async () => {
		
		var id = this.props.params.id;
		var aid = this.props.location.query.aid;
		
		await this.props.getAdvertiser(aid);		
		if (id && !this.props.services.service)
			await this.props.getService(id);	
			
		if (!this.props.outlets)
			await this.props.getSpecialOutlets(this.props.advertisers.advertiser.id);
		
		const { advertisers, services } = this.props;
		var service = services.service;
		var advertiser = advertisers.advertiser;
		var allCheckedOutlet = [];
		
		if (advertiser) {
			this.setState({
				advertiser: {id: advertiser.id, label: advertiser.name},
				errorForAd: false,
				s_images: advertiser.s_images
			})

			if(!aid) await this.props.getSpecialOutlets(advertiser.id);
			const outArr = this.props.outlets.outlets;
			
			if (outArr.length > 0 ) {
				outArr.forEach(out => {					
					allCheckedOutlet.push(out.id);
				});				
			}			
		}
		
		var selTypes = [];

		this.titleArr.forEach(title => {
			selTypes.push({id: title.key, label: title.key});
			if (service && title.key == service.type) this.setState({selectedType: {id: title.key, label: title.key}});
		});

		this.setState({selTypes: selTypes});
		
		var descr = ""; 
		var terms = (service && service.terms)? service.terms: (advertiser && advertiser.terms)? advertiser.terms: "";

		if (id && id != "null") {
				
			// var hostUrl = service.host_url? service.host_url: "";
			if (service && service.descr)			
				descr = service.descr;
			if (service && service.terms) 
				terms = service.terms;

			var type = service && service.type? service.type: 'Facial'; 
			
			
			this.titleArr.forEach(title => {
				if (title.key == type) this.setState({ subTypes: title.subtitle});
			});	
			
			const durations = ["15 mins", "30 mins", "45 mins", "1 hr", "1.5 hrs", "2 hrs", "2.5 hrs", "3 hrs"];
			var duration = service.duration;
			if (duration && durations.indexOf(duration) < 0) {
				this.setState({customduration: duration});
				duration = 'custom';
			}			
			
			if (service)
				this.setState({	
					id: service.id,			
					name: service.name? service.name: '',
					descr: descr,				
					price: service.price? service.price: 0,
					type: type,
					subtype: service.subtype,
					terms: terms,
					status: true,
					duration: duration,			
					s_images: service.s_images,			
					status: (service.status? true: false),
					woo_id: advertiser.woo_id
				});

			if (service && service.subtype) {
				var subTypeArr = service.subtype.split(",");
				this.setState({
					checked: subTypeArr
				});
			}			
			
			if (service && service.outlets) {
				var tempCheckout = service.outlets.split(",");
				var tempArr = [];
				tempCheckout.forEach(ii => {
					tempArr.push(parseInt(ii));
				});
				this.setState({
					checkedOutlet: tempArr
				});			
			}
			
		} else {
			this.setState({
				checkedOutlet: allCheckedOutlet
			});			
		}

		
		this.setState({
			descr: descr,
			terms: terms
		});		
		const contentBlock = htmlToDraft(descr);
		if (contentBlock) {
		  const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
		  const editorState = EditorState.createWithContent(contentState);
		  this.setState({
			editorState: editorState
		  });
		}
		
		const termContentBlock = htmlToDraft(terms);
		if (termContentBlock) {
		  const contentState = ContentState.createFromBlockArray(termContentBlock.contentBlocks);
		  const termEditorState = EditorState.createWithContent(contentState);
		  this.setState({
			termEditorState: termEditorState
		  });
		}
		
		
	}

	makeChangeEditor = () => {
		// One possible fix...		
		const html = '<p>Hey this <strong>editor</strong> rocks 😀</p>';
		const contentBlock = htmlToDraft(html);
		if (contentBlock) {
			console.log("component updated");
			const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
			const editorState = EditorState.createWithContent(contentState);
			this.state = {
				editorState,
			};
		}
	}
	
	selectAdvertiser = async (selectedOption) => {
		this.setState({ advertiser: selectedOption });		
		this.setState({errorForAd: false});	
		
		await this.props.getSpecialOutlets(selectedOption.id);
		var ads = this.props.advertisers.advertisers.filter(ii=>ii.id==selectedOption.id);
		var ad = ads[0];
		
		if (ad) {
			var terms = (ad && ad.terms)? ad.terms: "";		
			const termContentBlock = htmlToDraft(terms);
			if (termContentBlock) {
			const contentState = ContentState.createFromBlockArray(termContentBlock.contentBlocks);
			const termEditorState = EditorState.createWithContent(contentState);
			this.setState({
				termEditorState: termEditorState
			});
			}
		}
		const { outlets } = this.props;
		const obs = outlets.outlets;
		if (obs && obs.length > 0) {
			var tempCheckout = [];
			obs.forEach(ob => {
				tempCheckout.push(ob.id);
			});
			this.setState({
				checkedOutlet: tempCheckout,
				s_images: ad.s_images
			})
		} else {
			this.setState({ checkedOutlet: [], s_images: ad.s_images});
		}
	}

	handleToggle = value => () => {		
		const { checked } = this.state;
		const currentIndex = checked.indexOf(value);
		const newChecked = [...checked];
	
		if (currentIndex === -1) {
		  newChecked.push(value);
		} else {
		  newChecked.splice(currentIndex, 1);
		}
	
		this.setState({
		  checked: newChecked,
		  saveFlag: false
		});			
	};

	handleToggleOutlet = value => async () => {		
		const { checkedOutlet } = this.state;
		const currentIndex = checkedOutlet.indexOf(value);
		const newChecked = [...checkedOutlet];
	
		if (currentIndex === -1) {
		  newChecked.push(value);
		} else {
		  newChecked.splice(currentIndex, 1);
		}
	
		this.setState({
		  checkedOutlet: newChecked,
		  saveFlag: false
		});
	};

	handleCloseSanckbar = () => {
		this.setState({
			errorResponse: { flag: false, msg: '' }
		});
	}

	handleSave = async () => {		
		
		if (this.state.saveFlag) {
			this.setState({
				errorResponse: {flag: true, msg: "There isn't any changed fields!"}
			});
			return;
		}
		const {id, name, advertiser, price, descr,	s_images, woo_id, terms, status, duration, checkedOutlet, checked, selectedType} = this.state;		
		if (!advertiser.id || advertiser.id <= 0) {
			this.setState({errorForAd: true});
			return;
		}
		
		const { outlets } = this.props;
		const soutlets = outlets.outlets;
		var oIds = [];
		if (soutlets.length>0) 
			soutlets.forEach(oo => { oIds.push(oo.id) });		
		
		if (checkedOutlet.length <= 0) {
			this.setState({
				errorResponse: {flag: true, msg: "You have to select one outlet for service at least!"}
			});
			return;
		}

		if (checked.length <= 0 || selectedType.id == 0) {
			this.setState({
				errorResponse: {flag: true, msg: "You have to select one type for service at least!"}
			});
			return;
		}

		var convertCheck = [];
		checked.forEach(kk => {
			var temp = kk.replace("&", "&amp;");
			convertCheck.push(temp);
		});
		
		if (s_images == "") {
			this.setState({
				errorResponse: {flag: true, msg: "You have to upload image of the service!"}
			});
			return;
		}

		if (!descr || descr == "" || descr.length <= 8) {
			this.setState({
				errorResponse: {flag: true, msg: "Please type descrition of the service!"}
			});
			return;
		}

		var newDuration = duration		
		if (duration == "custom")	
			newDuration = this.state.customduration;
		if (newDuration.length <= 0) {
			this.setState({
				errorResponse: { flag: true, msg: "Please select Duration of the service"}
			});
			return;
		}

		if (parseFloat(price) <= 0) {
			this.setState({
				errorResponse: { flag: true, msg: "The price is more than Zero"}
			});
			return;			
		}

		if (!terms || terms == "" || terms.length <= 8) {
			this.setState({
				errorResponse: {flag: true, msg: "Please type terms of the service!"}
			});
			return;
		}
				
		const { updateService, addService, uploadLogo } = this.props
		
		var imagepath = s_images;
		if (this.state.formdatas) {			
			var form = this.state.formdatas;
			form.append("pretitle", this.state.advertiser.label);
			form.append("nexttitle", this.state.name);
			await this.props.uploadLogo(form);
			imagepath = this.props.logos.imagepath[0];
			this.setState({s_images: this.props.logos.imagepath[0]});
		}
		
		var saveData = {
			id: id,
			name: name,
			s_images: imagepath,
			descr: descr,
			type: selectedType.id,
			subtype: convertCheck.join(","),
			woo_id: woo_id,
			terms: terms,
			duration: newDuration,
			outlets: checkedOutlet.join(","),
			origin_outlets: oIds,
			status: status?1:0,
			advertiser_id: advertiser.id,
			price: parseFloat(price)
		}
		
		if (id) {
			await updateService(saveData);
		} else {
			await addService(saveData);
		}
		
		this.setState({saveFlag: true});
		const { services, goto } = this.props
		
		if (services.response.status == "success") {
			//await getServices();
			goto('/services/' + advertiser.id);
		} else if (services.response.status == "pending") {			
			goto('/services/' + advertiser.id);			
		} else {
			this.setState({
				errorResponse: {flag: true, msg: services.response.message}
			});
		}		
	}	

	handleClose = () => {		
		const {router} = this.props;
		if (!this.state.saveFlag) {
			if (window.confirm("You don't save data yet! Do you leave this page really?")) {
				this.setState({openFlag: false});								
				router.goBack();				
			}
		} else {
			router.goBack();
		}
	}

	handleChange = name => event => {
		event.preventDefault();
		if (name == "status") {
			this.setState({ [name]: event.target.checked });
			if (event.target.checked) this.setState({statusMsg: "Active"});
			else this.setState({statusMsg: "InActive"});
		} else if(name == "price") {
			var value = event.target.value;
			if (value.indexOf(".")>=0) {
				var ind = value.indexOf(".");
				var dec = value.substr(ind + 1);
				if (dec.length > 2) dec = dec.substr(0, 2);			
				this.setState({[name]: value.substr(0, ind+1) + dec});	
			} else {
				this.setState({[name]: value});
			}
			
		} else {			
			this.setState({ [name]: event.target.value });
		}

		this.setState({saveFlag: false});			
	};

	handleDuration = event => {
		if (event.target.value != "custom") this.setState({customduration: ''})
		this.setState({ duration: event.target.value, saveFlag: false});
	};

	handleUpload = async (event, option) => {
		var form = new FormData();
		
		var reader = new FileReader();
		if (event.target.files.length > 1) {
			for (var i=0; i < event.target.files.length; i ++) {				
				// form.append("pretitle", this.state.advertiser.label);
				// form.append("nexttitle", this.state.name);
				form.append("logoFile[]", event.target.files[i]);
			}			
		} else if (event.target.files.length == 1) {			
			form.append("logoFile[]", event.target.files[0]);
			var that = this;
			reader.onload = function(e) {
				that.setState({s_images: e.target.result});
			}
			reader.readAsDataURL(event.target.files[0]);
		}
		this.setState({formdatas: form, saveFlag: false});
					
	}

	selectType = (selectedOption) => {
		this.setState({selectedType: selectedOption, checked: [], saveFlag: false});		
	}

	onEditorStateChange = (editorState) => {

		var ss = draftToHtml(convertToRaw(editorState.getCurrentContent()));		
		this.setState({
			descr: ss,
			saveFlag: false
		});

		this.setState({
		  editorState,
		});
	};

	onTermEditorStateChange = (termEditorState) => {
		this.setState({
			terms: draftToHtml(convertToRaw(termEditorState.getCurrentContent())),
			saveFlag: false
		});

		this.setState({
		  termEditorState,
		});
	}
	
	
	render() {
		const { classes, services, logos, advertisers } = this.props;			
		const {editorState, price, name, termEditorState, advertiser, s_images, type, subTypes, checked, selTypes } = this.state;
		const durations = ["15 mins", "30 mins", "45 mins", "1 hr", "1.5 hrs", "2 hrs", "2.5 hrs", "3 hrs", "custom"];

		var logoPath = s_images? s_images: DefaultLogo;	

		var loading = services.addServicePending || services.getServicePending || services.getServicesPending || services.updateServicePending || logos.uploadLogoPending;
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
								Service
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
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item cols={6} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('name')}
											name="name"
											value={name}
											validators={["required"]}
											errorMessages={['this field is required']}
											className={classes.input}
											label="Service Name"
										/>										
									</Grid>
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item cols={4} className={classes.col}>
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
												Upload Image
											</Button>
										</label>
									</Grid>	
									<Grid item cols={4} className={classes.col}>
										<Avatar
											alt="Logo"
											src={logoPath}
											className={classNames(classes.avatar, classes.bigAvatar, 'avatar-logo')}
										/>
									</Grid>
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end" style={{ marginTop: 20}}>
									<Grid item className={classes.col}>Type</Grid>
									<Select
										name="type"
										value={this.state.selectedType}
										onChange={this.selectType}
										options={selTypes}
										styles={selectStyle}
										className={classes.input}
										label="Type"
									/>
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item xs={1} md={1} className={classes.col}>{"  "}</Grid>
									<List>
										{ this.makeOptions() }									
									</List>
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
									<Grid item cols={4} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('price')}
											name="price"
											value={price}
											validators={["required", "matchRegexp:^[+]?([0-9]+(\.[0-9]+)?|\.[0-9]+)$"]}
											errorMessages={['this field is required', "Price should be a Positive number"]}
											className={classes.input}
											label="Price"
										/>										
									</Grid>									
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">	
									<FormControl component="fieldset" required error className={classes.formControl}>
										<FormLabel component="legend">Duration</FormLabel>
										<RadioGroup
											aria-label="duration"
											name="Duration"
											className={classes.group}
											value={this.state.duration}
											onChange={this.handleDuration}											
										>	
											{ durations.map(dd=> {
												if (dd != "custom")
												  return (												
													<FormControlLabel key={dd} value={dd} control={<Radio />} label={dd} />
													)
												else 
													return (
														<FormControlLabel key={dd} value={dd} control={<Radio />} label={
															<TextField value={this.state.customduration}
																onChange={this.handleChange('customduration')}
																name="customduration"
																label="Custom"
															/>
														}/>											
													)
											}
											)}																																
										</RadioGroup>									
									</FormControl>																		
								</Grid>
								<Grid item className={classes.subtitle}>
									Terms & Conditions 
								</Grid>
								<Grid container className={classes.row} alignItems="flex-end">
									<Grid item className={classes.textWrapper}>
										<Editor
										editorState={termEditorState}
										wrapperClassName="home-wrapper rdw-editor-wrapper"
										editorClassName={classes.demoEditor}        
										onEditorStateChange={this.onTermEditorStateChange}
									/>
									</Grid>							
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item xs={3} md={3} className={classes.col}>Outlets</Grid>
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item xs={1} md={1} className={classes.col}>{'  '}</Grid>
									<Grid item xs={10} md={10} className={classes.col}>
										<List>
											{ this.makeOutlets() }									
										</List>
									</Grid>
								</Grid>								
								<Grid container cols={4} className={classes.col}>
									<Grid item className={classes.col}>
										Status
									</Grid>
									<Grid item cols={2} className={classes.col}>
										<Switch
											checked={this.state.status}
											onChange={this.handleChange('status')}											
											value="status"
											color="primary"
										/>
										{this.state.status? "Active": "Inactive"}							
									</Grid>
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
	
	makeOptions = () => {
		var options = [];
		const { selectedType } = this.state
		this.titleArr.forEach(title => {			
			if (title.key == selectedType.id) options = title.subtitle;
		});

		const {classes} = this.props;		

		var objs = [];		
		options.map(value => {
			objs.push(
				<ListItem
				key={value}
				role={undefined}
				dense
				button
				onClick={this.handleToggle(value)}
				className={classes.listItem}
				>
					<Checkbox
						checked={this.state.checked.indexOf(value) !== -1}
						tabIndex={-1}
						disableRipple
					/>
					<ListItemText primary={value} />												
				</ListItem>				
			)
		});		
		return objs;
	}

	makeOutlets = () => {		

		const {classes, outlets} = this.props;		
		const obs = outlets.outlets;
		
		var objs = [];
		if (this.state.advertiser.id == 0) return objs;			
		obs.map(value => {			
			objs.push(
				<ListItem
				key={value.id}
				role={undefined}
				dense
				button
				onClick={this.handleToggleOutlet(value.id)}
				className={classes.listItem}
				>
					<Checkbox
						checked={this.state.checkedOutlet.indexOf(value.id) !== -1}
						tabIndex={-1}
						disableRipple
					/>
					<ListItemText primary={value.name} />												
				</ListItem>				
			)			
		});		
		return objs;
	}
}

MyModal.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ services, advertisers, logos, outlets }) => ({
			services, advertisers, logos, outlets
		}),
		{
			getServices,
			getService,
			addService,
			updateService,
			getAdvertiser,
			redirect,
			goto,
			getOutlet,
			updateOutlet,
			getSpecialOutlets,
			uploadLogo			
		}
	)(MyModal));