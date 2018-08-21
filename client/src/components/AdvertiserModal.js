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
import AppBar from 'material-ui/AppBar';
import Grid from 'material-ui/Grid';

import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';
import TextField from 'material-ui/TextField';
import Snackbar from '@material-ui/core/Snackbar';

import { TextValidator, ValidatorForm, TimeValidator } from 'react-material-ui-form-validator';

import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import EmailIcon from '@material-ui/icons/Email';
import StarIcon from '@material-ui/icons/Star';
import WebIcon from '@material-ui/icons/Web';
import AccountCircle from '@material-ui/icons/AccountCircle';
import Switch from 'material-ui/Switch';
import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';
import Save from '@material-ui/icons/Save';


import { EditorState, convertToRaw, convertFromRaw, ContentState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import DefaultLogo from '../../assets/images/favicon.png';

import {	
	getAdvertisers,
	getAdvertiser,
	connectAdvertiser,
	addAdvertiser,
	updateAdvertiser,
	uploadAdvertiserLogo
} from '../redux/advertisers';

import './logo.scss'
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
	  width: 350
  },
  input3: {
	width: 250
  },
  gridDiv: {
	  padding: 35,
	  height: '60vh',
	  overflowY: 'auto'
  },
  row: {
	  padding: 10
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
  avatar: {
    margin: 10,
  },
  bigAvatar: {
    width: 100,
	height: 100,
	borderRadius: 0,
	marginBottom: '-20px',
	objectFit: 'contain',
	img: {
		objectFit: 'contain'
	}
  },
  progress: {
    margin: theme.spacing.unit * 2,
  },
});

withRouter
preload(async (preparams) => {			
	const { parameters, dispatch } = preparams;	
	if (parameters.id!="undefined")
		await dispatch(getAdvertiser(parameters.id));	
})
meta(({ state }) => ({ title: 'Home' }))
class MyModal extends Component
{
	constructor(props) {
		super(props);	
		
		this.state = {
			openFlag: true,
			editorState: EditorState.createEmpty(),
			termEditorState: EditorState.createEmpty(),
			saveFlag: false,
			statusMsg: "Active",
			advertiser: {},
			status: true,
			name: '',
			email: '',
			description: '',
			terms: '',
			commission: '',
			s_images: '',
			hostUrl: '',
			userId: 0,
			error: { flag: false, msg: "Welcome to Adding advertiser"}			
		};				
	}

	componentDidMount = async () => {
		//wysiwyg init
		if (!this.props.advertiser && this.props.params.id)
			await this.props.getAdvertiser(this.props.params.id);

		if (this.props.params.id) {
			const { advertiser, params } = this.props;
			var hostUrl = advertiser && advertiser.host_url? advertiser.host_url: "";
			var descr = advertiser && advertiser.descr? advertiser.descr: ""; 
			var terms = advertiser && advertiser.terms? advertiser.terms: "";
			this.setState({	
				userId: params.id,		
				name: advertiser && advertiser.name?advertiser.name: "",
				email: advertiser && advertiser.email? advertiser.email: "",
				descr: advertiser && advertiser.descr? advertiser.descr: "",
				terms: advertiser && advertiser.terms? advertiser.terms: "",
				status: (advertiser && advertiser.status==0? false: true),
				commission: advertiser && advertiser.commission? advertiser.commission: '',
				s_images: advertiser?advertiser.s_images: '',
				hostUrl: hostUrl,
				statusMsg: (advertiser && advertiser.status ==0? "InActive": "Active")
			});

			// if (params.id) {
			// 	if ( advertiser && advertiser.descr) descr = advertiser.descr;
			// 	if ( advertiser && advertiser.terms) terms = advertiser.terms;
			// }
			
			if (descr) {		
				const contentBlock = htmlToDraft(descr);
				if (contentBlock) {
				const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
				const editorState = EditorState.createWithContent(contentState);
				this.state.editorState = editorState;
				}
			}

			if (terms) {
				const contentBlock = htmlToDraft(terms);
				if (contentBlock) {
					const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
					const termEditorState = EditorState.createWithContent(contentState);				
					this.setState({
						termEditorState,				
					});
				}			
			}		
		}		
	}

	handleCloseSanckbar = () => {
		this.setState({
			error: { flag: false, msg: this.state.error.msg }
		});
	}

	handleSave = async (e) => {
		e.preventDefault();
		const {userId, name, descr, email, terms, status, commission, s_images, hostUrl} = this.state;

		if (s_images == "" || !s_images) {
			this.setState({
				error: { flag: true, msg: "Please upload logo image of the advertiser!" }
			});
			return;
		}

		if (descr.length<=8 || descr=="" || !descr) {
			this.setState({
				error: { flag: true, msg: "Please type description of the advertiser!" }
			});
			return;
		}

		// if (terms.length<=8 || terms == "" || !terms) {
		// 	this.setState({
		// 		error: { flag: true, msg: "Please type terms of the advertiser!" }
		// 	});
		// 	return;
		// }

		if (!commission || parseInt(commission) <=0 ) {
			this.setState({
				error: { flag: true, msg: "Please set Commission of the advertiser!" }
			});
			return;
		}
		
		var saveData = {
			id: userId,
			name: name,
			descr: descr,
			email: email,
			terms: terms,
			status: (status? 1: 0),
			commission: commission,
			s_images: s_images,
			host_url: hostUrl
		}	
		
		const { updateAdvertiser, addAdvertiser, goto } = this.props
		
		if (userId) {
			await updateAdvertiser(saveData);
		} else {
			await addAdvertiser(saveData);
		}
		getAdvertisers();
		this.setState({saveFlag: true});
		const { apiResponse } = this.props;
		
		if (apiResponse.data.status == "pending" || apiResponse.data.status == "success" ) {
			await this.props.getAdvertisers();
			goto("/");
		} else {
			this.setState({
				error: { flag: true, msg: apiResponse.data.message }
			})
		}		
	}

	handleClose = () => {		
		if (!this.state.saveFlag) {
			if (window.confirm("You don't save data yet! Do you leave this page really?")) {
				this.setState({openFlag: false});				
				const {router} = this.props;
				router.goBack();				
			}
		} else {
			this.props.goto("/");
		}		
	}

	handleChange = name => event => {
		if (name == "status") {
			this.setState({ [name]: event.target.checked });
			if (event.target.checked) this.setState({statusMsg: "Active"});
			else this.setState({statusMsg: "InActive"});
		} else {
			this.setState({ [name]: event.target.value });
		}

		this.setState({saveFlag: false});			
	};

	handleUpload = async (event, option) => {
		var form = new FormData();
		var adName = this.state.name;
		
		if (adName == "") {
			this.setState({
				error: {flag: true, msg: "Please input Advertiser name!"}
			});
			return;
		}

		if (event.target.files.length > 0) {
			for (var i=0; i < event.target.files.length; i ++) {
				form.append("pretitle", this.state.name);
				form.append("nexttitle", '');
				form.append("logoFile[]", event.target.files[i]);
			}			
		};
		
		await this.props.uploadAdvertiserLogo(form);		
		this.setState({s_images: this.props.imagepath[0]});		
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

	onTermEditorStateChange = (termEditorState) => {
		var ss = draftToHtml(convertToRaw(termEditorState.getCurrentContent()));		
		this.setState({
			terms: ss
		});

		this.setState({
		  termEditorState,
		});
	}
	
	render() {		
		const { classes, advertisers, addAdvertiserPending, getAdvertiserPending, getAdvertisersPending, updateAdvertiserPending, uploadAdvertiserLogoPending} = this.props;	
		var {editorState, termEditorState, s_images, name, email } = this.state;
		var logoPath = s_images? s_images: DefaultLogo;		
		var loading = addAdvertiserPending || getAdvertiserPending || getAdvertisersPending || updateAdvertiserPending || uploadAdvertiserLogoPending;
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
								Advertiser
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
							<Grid cols={1} item className={classes.col}>
								<AccountCircle />
							</Grid>
							<Grid item cols={5} className={classes.col}>
								<TextValidator
									onChange={this.handleChange('name')}
									name="name"
									value={this.state.name}
									validators={["required"]}
									errorMessages={['this field is required']}
									className={classes.input}
									label="Advertiser Name"
								/>								
							</Grid>
							<Grid item cols={3} className={classes.col}>
								<input
									accept="image/*"
									className={classes.fileInput}
									id="raised-button-file"
									multiple
									type="file"
									onChange={this.handleUpload}
								/>
								<label htmlFor="raised-button-file">
									<Button disabled={loading} variant="raised" component="span" className={classes.button}>
										Upload Logo
									</Button>
								</label>
							</Grid>
							<Grid item cols={3} className={classes.col}>
							<Avatar
								alt="Logo"
								src={logoPath}
								className={classNames(classes.avatar, classes.bigAvatar, "avatar-logo")}
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
							<Grid item cols={1} className={classes.col}>
								<EmailIcon />
							</Grid>
							<Grid item cols={5} className={classes.col}>
								<TextValidator
									onChange={this.handleChange('email')}
									name="email"
									value={email}
									validators={["required", "isEmail"]}
									errorMessages={['this field is required', "Wrong Email format"]}
									label="Email"
									className={classes.input}
								/>								
							</Grid>
							<Grid item cols={1} className={classes.col}>
								<StarIcon />
							</Grid>
							<Grid item cols={5} className={classes.col}>
								<TextValidator id="commissionRate" validators={["matchRegexp:^[1-9][0-9]?$|^100$"]} errorMessages={['please check, commission rate should be less than 100']} onChange={this.handleChange('commission')} className={classes.input} name="Commission Rate" label="Commission Rate" value={this.state.commission} />
							</Grid>							
						</Grid>
						<Grid container className={classes.row}  alignItems="flex-end">
							<Grid item className={classes.col}>
								<WebIcon />
							</Grid>
							<Grid item cols={4} className={classes.col}>
								<TextField
									onChange={this.handleChange('hostUrl')}
									name="hostUrl"
									value={this.state.hostUrl}
									label="Web Url"
									className={classes.input}
								/>								
							</Grid>
							<Grid item className={classes.col}>
								Status
							</Grid>
							<Grid item cols={4} className={classes.col}>
							<Switch
								checked={this.state.status}
								onChange={this.handleChange('status')}
								value="status"								
								color="primary"
							/>
							{this.state.statusMsg}							
							</Grid>
						</Grid>
						<Grid item className={classes.subtitle}>
							Company’s standard T&C 
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
						<Grid container className={classes.row} alignItems="flex-end">
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
						open={this.state.error.flag}
						onClose={this.handleCloseSanckbar}
						ContentProps={{
							'aria-describedby': 'message-id',
						}}
						message={<span id="message-id">{ this.state.error.msg }</span>}
					/>
				
				</Paper>				
			</Modal>
		)
	}
}

MyModal.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ advertisers }) => (
			connectAdvertiser(advertisers)		
		),
		{
			getAdvertisers,
			getAdvertiser,
			addAdvertiser,
			updateAdvertiser,
			uploadAdvertiserLogo,
			redirect,
			goto				
		}
	)(MyModal));