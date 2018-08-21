import React, { PureComponent, Component } from 'react'
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
import { RadioGroup } from 'material-ui/Radio';
import { FormControl, FormLabel } from 'material-ui/Form';

import Typography from 'material-ui/Typography';
import Toolbar from 'material-ui/Toolbar';
import Divider from 'material-ui/Divider';
//import TextField from 'material-ui/TextField';
import TextField from '@material-ui/core/TextField';
import { TextValidator, ValidatorForm, TimeValidator } from 'react-material-ui-form-validator';

import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import ImageIcon from '@material-ui/icons/Image';
import DraftsIcon from '@material-ui/icons/Drafts';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import RateReview from '@material-ui/icons/RateReview';
import StarIcon from '@material-ui/icons/Star';
import TimerIcon from '@material-ui/icons/Timer';
import DateRangeIcon from '@material-ui/icons/DateRange';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import Save from '@material-ui/icons/Save';
import WebIcon from '@material-ui/icons/Web';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { FormGroup, FormControlLabel } from 'material-ui/Form';
import Switch from 'material-ui/Switch';
import Radio from 'material-ui/Radio';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import Fade from 'material-ui/transitions/Fade';
import { LinearProgress } from 'material-ui/Progress';
import ExpansionPanel, { ExpansionPanelDetails, ExpansionPanelSummary , ExpansionPanelActions  } from 'material-ui/ExpansionPanel';
import Checkbox from 'material-ui/Checkbox';


import Select from 'react-select';

import { EditorState, convertToRaw, convertFromRaw, ContentState, Modifier, convertFromHTML } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import DefaultLogo from '../../assets/favicon.png';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import configuration from '../../configuration';

import MomentUtils from 'material-ui-pickers/utils/moment-utils';
import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider';
import TimePicker from 'material-ui-pickers/TimePicker';
import DatePicker from 'material-ui-pickers/DatePicker';
import DateTimePicker from 'material-ui-pickers/DateTimePicker';
import Snackbar from '@material-ui/core/Snackbar';

import {	
	getPromos,
	getPromo,	
	connectPromo,
	addPromo,
	updatePromo,
	getUsedOutletsOnPromo
} from '../redux/promos';

import {	
	getAdvertiser,
	getAdvertisers,
	connectAdvertiser	
} from '../redux/advertisers';

import {	
	getOutlet,
	getSpecialOutlets,
	connectOutlet,
	updateOutlet,
} from '../redux/outlets';

import {	
	getServices,
	getService,
	connectService,
	getSpecialServices,
	addService,
	updateService,
	getDashboardServices
} from '../redux/services';

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
	  paddingLeft: 10,
	  paddingRight: 10,
	  paddingTop: 5,
	  paddingBottom: 5
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
  column: {
    flexBasis: '33.33%',
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
	  borderBottom: "2px solid red",
	  fontSize: 12
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
  },
  label: {
	  marginTop: theme.spacing.unit,
	  fontSize: 14
  }
});

class CustomGridItem extends Component {
	render() {
		const { classes } = this.props;
		return (
			<Grid container cols={12} className={classes.row} alignItems="flex-end">
				<Grid item xs={3} md={3} className={classes.col}>
					<Typography className={classes.label}>{this.props.title}</Typography>
				</Grid>
				<Grid item xs={9} md={9} className={classes.col}>
					{ this.props.children }
				</Grid>
			</Grid>
		)
	}
}

const StyledGridItem = withStyles(styles, { withTheme: true })(
	CustomGridItem	
);

@withRouter
@preload(async (preloadArguments) => {
	const {	dispatch, location,	parameters } = preloadArguments		
	var aid = location.query.aid
	//var id = this.props.params.id;
	if (parameters.id)
		await dispatch(getPromo(parameters.id));
	
	if (aid) {		
		await dispatch(getSpecialServices({advertiser_id: aid}));
		await dispatch(getSpecialOutlets(aid));		
		await dispatch(getAdvertiser(aid));
	}	
	await dispatch(getAdvertisers());	
})
@meta(({ state }) => ({ title: 'PROMO' }))
class MyModal extends PureComponent
{	
	constructor(props) {
		super(props);			
		
		this.state = {
			usedOutlets: [],
			//objects for selection
			advertiser: {id: 0, label: ''},
			service: {id: 0, label: ''},
			openFlag: true,
			editorState: EditorState.createEmpty(),
			termEditorState: EditorState.createEmpty(),
			saveFlag: false,
			statusMsg: "InActive",
			promo: {},
			//database fields
			id: null,			
			serviceExisted: "yes",
			name: '',
			s_images: '',
			descr: '',
			deadline: 60,
			featurePerk: 'no',
			oirginalPrice: 0,
			promoPrice: 0,
			startDate: moment(),
			endDate: moment(),
			outlet: null,
			terms: '',
			type: "Facial",
			subtype: '',
			terms: '',			
			status: "yes",
			duration: '30 mins',			
			errorForAd: false,
			checked: [],
			checkedOutlet: [],			
			selTypes: [],
			selectedType: {id: 'Facial', label: 'Facial'},
			selAds: [],
			original_price: 0,
			errEndState: false,
			errOutelt: false,
			soutlets: [],
			errorResponse: { flag: false, msg: ""}
		};		
		
		this.handleChange = this.handleChange.bind(this);
		this.handleSave = this.handleSave.bind(this);		
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

		if (!this.props.advertisers.advertisers || this.props.advertisers.advertisers.length <= 0)
			await this.props.getAdvertisers();
		if (id && !this.props.promos.promo)
			await this.props.getPromo(id);

		if (aid && !this.props.services.services) {
			await this.props.getSpecialServices(aid);
			await this.props.getSpecialOutlets(aid);
		}

		if (!this.props.advertisers.advertiser)
			await this.props.getAdvertiser(aid);

		const {advertisers, promos, services} = this.props;		
		const advertiser = advertisers.advertiser;
		//debugger
		//advertiser seleect options
		var selAds = [];
		if (advertisers.advertisers.length >0) {
			advertisers.advertisers.forEach(ad => {
				if (ad.status)
					selAds.push({id: ad.id, label: ad.name});
			});
			selAds.sort((a,b) => a.id-b.id);
		}
		this.setState({selAds: selAds});
		
		if (aid && advertiser) {
			this.setState({
				advertiser: {id: advertiser.id, label: advertiser.name},
				errorForAd: false
			});
			if (!aid) {
				await getSpecialServices({advertiser_id: advertiser.id});
				await getSpecialOutlets(advertiser.id);
			}			
		}
		
		const promo = promos.promo;		
		if (id && promo && promo.service_id) {

			var ser = services.services.filter(sr=> sr.id == promo.service_id)
			this.setState({
				service: {id: ser[0].id, label: ser[0].name},
				original_price: ser[0].price
			});			
			
			var tempOutlets = ser[0].outlets.split(",");
			var outlets = [];
			tempOutlets.forEach(ii => {
				outlets.push(parseInt(ii));
			})
			this.setState({soutlets: outlets});		
			
			
			var strUsedOutlets = promo.outlets.split(",");
			var tempUsedOutlets = [];
			
			strUsedOutlets.forEach(ii => {
				tempUsedOutlets.push(parseInt(ii));
			});			
			this.setState({checkedOutlet: tempUsedOutlets});			

			await this.props.getUsedOutletsOnPromo(promo.service_id);
			
			
			if (this.props.promos && this.props.promos.outlets) {				
				var tempUOutlets = [];
				 
				this.props.promos.outlets.forEach(oo => {
					if (tempUsedOutlets.indexOf(parseInt(oo)) < 0)
						tempUOutlets.push(parseInt(oo));					
				});
				this.setState({ usedOutlets: tempUOutlets});
			}
		}		
		
		var selTypes = [];

		this.titleArr.forEach(title => {
			selTypes.push({id: title.key, label: title.key});
			if (promo && title.key == promo.type) this.setState({selectedType: {id: title.key, label: title.key}});
		});

		this.setState({selTypes: selTypes});

		if (id && id != "null") {
				
			// var hostUrl = promo.host_url? promo.host_url: "";
			var terms = promo && promo.terms?promo.terms:(advertiser.terms? advertiser.terms: "");	
			var type = promo && promo.type? promo.type: 'Facial'; 
			
			this.titleArr.forEach(title => {
				if (title.key == type) this.setState({ subTypes: title.subtitle});
			});			
			

			this.setState({	
				id: id,			
				name: promo.name? promo.name: '',
				promoPrice: promo.price? promo.price: 0,
				type: type,
				subtype: promo.subtype,
				terms: terms,
				duration: promo.duration? promo.duration: '30 mins',			
				s_images: promo.s_images,			
				status: (promo.status? "yes": "no"),
				woo_id: advertiser.woo_id,
				startDate: promo.startdate? moment(promo.startdate): moment(),
				endDate: promo.enddate? moment(promo.enddate): moment(),
				//serviceExisted: promo.hasService? "yes": "no"
			});
		}

		
		var terms = "";
		if (promos && promos.promo && promos.promo.terms) terms = promos.promo.terms;
		else if (advertisers && advertisers.advertiser && advertisers.advertiser.terms) terms = advertisers.advertiser.terms;
		const contentBlock = htmlToDraft(terms);
		if (contentBlock) {
		  const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
		  const editorState = EditorState.createWithContent(contentState);
		  this.setState({
			termEditorState: editorState,
			terms: terms
		  });		  
		}

		if (advertisers.advertisers && advertisers.advertisers.length <=0) {
			await this.props.getAdvertisers();
			var selAds = [];						
			if (this.props.advertisers.advertisers.length >0) {
				this.props.advertisers.advertisers.forEach(ad => {
					if (ad.status)
						selAds.push({id: ad.id, label: ad.name});
				});
				selAds.sort((a,b) => a.id-b.id);
			}
			this.setState({selAds: selAds});
		}
	}

	makeChangeEditor = () => {
		// One possible fix...		
		const html = '<p>Hey this <strong>editor</strong> rocks 😀</p>';
		const contentBlock = htmlToDraft(html);
		if (contentBlock) {
			const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
			const editorState = EditorState.createWithContent(contentState);
			this.state = {
				editorState,
			};
		}
	}
	
	selectAdvertiser = async (selectedOption) => {
		this.setState({ advertiser: selectedOption });
		this.setState({service: {id: 0, label: '', price: '0'}});
		this.setState({errorForAd: false});		
		await this.props.getSpecialServices({advertiser_id: selectedOption.id});		
		await this.props.getSpecialOutlets(selectedOption.id);
		const { outlets } = this.props;
		if (outlets.outlets && this.state.serviceExisted=="no") {
			var temps = [];
			outlets.outlets.forEach(outlet => {
				temps.push(outlet.id);
			});
			this.setState({soutlets: temps});
		}
	}
	
	selectService = async (selectedOption) => {
		this.setState({service: selectedOption});
		this.setState({original_price: selectedOption.price});

		//if (this.state.name.length<=0) {
			this.setState({name: selectedOption.label});
		//}
				
		await this.props.getUsedOutletsOnPromo(selectedOption.id);
		
		const {promos, services} = this.props;		
		const selservices = services.services.filter(sr => sr.id == selectedOption.id);
		const service = selservices[0];
		var tempOutlets = service.outlets.split(",");
		var relOutelts = [];
		var checkedOutlets = [];
		tempOutlets.forEach(ii => {
			relOutelts.push(parseInt(ii));			
		});

		promos.outlets.forEach(oo => {
			checkedOutlets.push(parseInt(oo));
		})
		
		this.setState({soutlets: relOutelts});
		this.setState({usedOutlets: checkedOutlets});
		
		var terms = service && service.terms? service.terms: '';
		const contentBlock = htmlToDraft(terms);
		if (contentBlock) {
		  const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
		  const editorState = EditorState.createWithContent(contentState);
		  this.setState({
			termEditorState: editorState,
			terms: terms
		  });		  
		}
	}
	
	handleToggleOutlet = value => async () => {	
		
		if (this.state.usedOutlets.indexOf(value) >= 0) {
			this.showErrorMessage("This outlet is used already for other promo!");			
			return;
		}	
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
		});
		this.setState({errOutelt: false});
	};

	handleSave = async () => {		
		const {id, name, advertiser, service, promoPrice, original_price, s_images, type, subtype, startDate, endDate, terms, status,
			 redeemed, featurePerk, checkedOutlet, serviceExisted, duration} = this.state;
			 
		const { services } = this.props;
		if (!advertiser.id) {
			this.setState({errorForAd: true});
			return;
		}

		if (!service.id && serviceExisted=="yes") {
			this.setState({errorForService: true});
			return;
		}

		if (startDate.isAfter(endDate)) {
			this.setState({errEndState: true});
			return;
		}
		
		if (checkedOutlet.length < 1) {
			this.setState({errOutelt: true});
			return;
		}

		if (parseFloat(promoPrice) <= 0 ) {
			this.showErrorMessage("Promo price is more than Zero!");
			return;
		}
		
		if (terms && terms.length<8 && terms=="") {
			this.showErrorMessage("Please type description of promo!");
			return;
		}

		if (serviceExisted=="no" && this.state.checked.length <= 0) {
			this.showErrorMessage("Please select type of promo!");
			return;
		}

		var saveData = {
			id: id,
			name: name,
			s_images: s_images,
			startdate: startDate.format(),
			enddate: endDate.format(),
			isexisting: (services && services.services.length > 0),
			terms: terms,
			duration: duration,
			outlets: checkedOutlet.join(","),
			status: status == "yes"?1:0,
			advertiser_id: advertiser.id,
			service_id: service? service.id: null,
			price: parseFloat(promoPrice),
			originalPrice: parseFloat(original_price),
			featured: featurePerk=="yes"?1:0,
			redeemed: redeemed,
			hasService: serviceExisted=="yes"?1: 0,
			subtypes: this.state.checked.join(",")
		}		
				
		const { updatePromo, addPromo } = this.props
		
		if (id) {
			await updatePromo(saveData);
		} else {
			await addPromo(saveData);
		}
		await getPromos();

		this.setState({saveFlag: true});
		const { promos, goto } = this.props
		
		if (promos.response.status == "error") {
			this.showErrorMessage(promos.response.message);			
		} else {
			goto("/promos/" + advertiser.id);
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
		if(name == "promoPrice" || name=='original_price') {
			var value = event.target.value;
			if (value.indexOf(".") >= 0) {
				var ind = value.indexOf(".") >=0 ? value.indexOf("."): 0;
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

	handleDateChange = (option, selection) => {
		if ((option == "endDate" && selection.isBefore(this.state.startDate)) || (option =="startDate") && selection.isAfter(this.state.endDate)) {
			this.setState({ errEndState: true});
			return true;
		}
		this.setState({ [option] : selection});
		this.setState({ errEndState: false});
	}

	handleExisted = event => {
		this.setState({ serviceExisted: event.target.value });
	};

	handleCheck = name => event => {
		if (name == "status")
			this.setState({ status: event.target.checked });
		else if (name == "perkFeature")
			this.setState({ featurePerk: event.target.value});		
	};

	handleCloseSanckbar = () => {
		this.setState({
			errorResponse: {flag: false, msg: ""}
		})
	}

	showErrorMessage = (msg) => {
		this.setState({errorResponse: {flag: true, msg: msg}});
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
		this.setState({
			terms: draftToHtml(convertToRaw(termEditorState.getCurrentContent()))
		});

		this.setState({
		  termEditorState,
		});
	}
	render() {
		const { classes, promos, logos, advertisers, services, promo } = this.props;			
		const {editorState, serviceExisted, startDate, endDate, promoPrice, name, termEditorState, advertiser, s_images, type, subTypes, checked, selTypes } = this.state;
		
		const { selAds, service, original_price, deadline, featurePerk, status } = this.state;
		
		var logoPath = s_images? s_images: DefaultLogo;	

		var loading = promos.addPromoPending || promos.getPromoPending || promos.getPromosPending || promos.updatePromoPending || logos.uploadLogoPending;

		//var serviceExisted = "no";
		var serArrs = [];
		if (services && services.services && services.services.length > 0) {
			//serviceExisted = "yes";
			services.services.forEach(ser => {
				serArrs.push({id: ser.id, label: ser.name, price: ser.price});
			});
		}
		
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
								Promo
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
								<StyledGridItem title="Advertiser">
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
								</StyledGridItem>															
								<StyledGridItem title="Existing Service">
									<FormControl component="fieldset" className={classes.formControl}>											
										<RadioGroup
											aria-label="duration"
											name="Duration"
											className={classes.group}
											value={this.state.serviceExisted}
											onChange={this.handleExisted}											
										>	
											<FormControlLabel disabled={serviceExisted=="yes"} value="yes" control={<Radio />} label="Yes" />											
											<FormControlLabel disabled={serviceExisted=="yes"} value="no" control={<Radio />} label="No" />											
										</RadioGroup>									
									</FormControl>
								</StyledGridItem>									
								
								{ this.state.serviceExisted=="yes" &&								
								<StyledGridItem title="Service">
									<Select
										name="service"
										value={service}
										onChange={this.selectService}
										options={serArrs}
										className={classes.input}
									/>
									{ this.state.errorForService &&
									<div className={classes.error}> Please Select Service</div>
									}
								</StyledGridItem>									
								}
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item cols={6} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('name')}
											name="name"
											value={name}
											validators={["required"]}
											errorMessages={['this field is required']}
											className={classes.input3}
											label="Promo Name"
										/>										
									</Grid>
									{/* <Grid item cols={4} className={classes.col}>
										<input
											accept="image/*"
											className={classes.fileInput}
											id="raised-button-file"
											multiple
											type="file"
											onChange={(event) => this.handleUpload(event, "logo")}
										/>
										<label htmlFor="raised-button-file">
											<Button variant="raised" disabled={this.props.logos.uploadLogoPending} component="span" className={classes.button}>
												Upload Image
											</Button>
										</label>
									</Grid>	
									<Grid item cols={4} className={classes.col}>
										<Avatar
											alt="Logo"
											src={logoPath}
											className={classNames(classes.avatar, classes.bigAvatar)}
										/>
									</Grid> */}
								</Grid>
								{ this.state.serviceExisted=="no" &&								
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item xs={2} md={2} className={classes.col}>
										<div className={classes.column}>
											<Typography className={classes.heading}>Types</Typography>
										</div>
									</Grid>
									<Grid item cols={6} xs={10} md={10} className={classes.col}>										
										{ this.makeTypes() }																											
									</Grid>									
								</Grid>
								}      
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item cols={6} xs={6} md={6} className={classes.col}>
										<TextValidator											
											name="original_price"
											value={original_price}
											validators={["required", "matchRegexp:^[+]?([0-9]+(\.[0-9]+)?|\.[0-9]+)$"]}
											errorMessages={['this field is required', "Pirce is Positive number"]}
											className={classes.input3}
											label="Original Price"
											disabled={serviceExisted=="yes"}
											onChange={this.handleChange('original_price')}
										/>										
									</Grid>								
								</Grid>
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item cols={6} xs={6} md={6} className={classes.col}>
										<TextValidator
											onChange={this.handleChange('promoPrice')}
											name="promoPrice"
											value={promoPrice}
											validators={["required", "matchRegexp:^[+]?([0-9]+(\.[0-9]+)?|\.[0-9]+)$", `maxNumber:${original_price}`]}
											errorMessages={['this field is required', "Price is Positive number", "This value is less than original value"]}
											className={classes.input3}
											label="Promo Price"
										/>										
									</Grid>									
								</Grid>
								<Grid container className={classes.row} cols={2} alignItems="flex-end">
									<Grid item xs={12} md={5} className={classes.col}>
										<MuiPickersUtilsProvider utils={MomentUtils}>
											<DatePicker
												value={startDate}
												onChange={(date) => {this.handleDateChange('startDate', date)}}
												format="DD/MM/YYYY"
												className={classes.input3}
												label="Start Date"
												leftArrowIcon={<ArrowBackIcon/>}
												rightArrowIcon={<ArrowForwardIcon/>}
											/>
										</MuiPickersUtilsProvider>										
									</Grid>
								</Grid>	
								<Grid container className={classes.row} cols={2} alignItems="flex-end">
								<Grid item xs={12} md={5} className={classes.col}>
									<MuiPickersUtilsProvider utils={MomentUtils}>
										<DatePicker
											value={endDate}
											onChange={(date) => {this.handleDateChange('endDate', date)}}
											format="DD/MM/YYYY"
											className={classes.input3}
											label="End Date"
											leftArrowIcon={<ArrowBackIcon/>}
											rightArrowIcon={<ArrowForwardIcon/>}
										/>
									</MuiPickersUtilsProvider>											
								</Grid>
								<Grid item xs={12} md={2} className={classes.col}>
									{ this.state.errEndState &&
										<div className={classes.error}> Date error</div>
									}
								</Grid>
							</Grid>	
								<Grid container className={classes.row} >
									<Grid item className={classes.col} xs={2} md={2}>
										<Typography className={classes.label}>Outlets</Typography>
									</Grid>
								</Grid>							
								<Grid container className={classes.row}  alignItems="flex-end">
									{ this.state.errOutelt &&
									<Grid item xs={2} md={2} className={classes.col}>
										<div className={classes.error}> Please check</div>										
									</Grid>
									}
									{ !this.state.errOutelt &&
									<Grid item xs={2} md={2} className={classes.col}>{'  '}</Grid>
									}
									<Grid item xs={10} md={10} className={classes.col}>
										<List>
											{ this.makeOutlets() }									
										</List>
									</Grid>									
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
								{/* <StyledGridItem title="Redeem By Date">
									<TextField
										name="advertiser"
										value={deadline}
										onChange={this.handleChange('deadline')}
										options={selAds}
										className={classes.input}
									/>
									{ this.state.errorForAd &&
									<div className={classes.error}> Please Select Advertiser</div>
									}
								</StyledGridItem> */}
								<Grid container className={classes.row}  alignItems="flex-end">
									<Grid item className={classes.col} style={{top: -15, position: 'relative'}}>
										Status
									</Grid>
									<Grid item cols={4} className={classes.col}>
									<Switch
										checked={this.state.status}
										onChange={this.handleCheck('status')}
										value="status"										
										color="primary"
									/>
									{this.state.status? "Active": "Inactive"}							
									</Grid>									
								</Grid>
								<Grid container className={classes.rowImage} alignItems="flex-end">									
									<div>{ '  ' }</div>
								</Grid>
								<Grid container className={classes.rowImage} alignItems="flex-end">									
									<Button disabled={ loading } type="submit" color="primary" className={classes.button} variant="raised" size="small">
										<Save  className={classNames(classes.leftIcon, classes.iconSmall)} />
										Save
									</Button>													
								</Grid>
							</Grid>
						</ValidatorForm>
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
					
				</div>
				</Paper>				
			</Modal>
		)
	}
	
	makeOutlets = () => {		

		const {classes, promos, outlets } = this.props;		
		const obs = outlets.outlets;
		const { soutlets, usedOutlets } = this.state;
		var objs = [];		
		obs.map(value => {			
			if (soutlets.indexOf(value.id) >=0 ) {
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
							disabled={usedOutlets.indexOf(value.id) >=0}
						/>
						<ListItemText primary={value.name} />												
					</ListItem>				
				)
			}
		});		
		return objs;
	}

	makeTypes = () => {
		const {classes} = this.props;	
		var objs = [];
		this.titleArr.map(title => {
			objs.push(
				<ExpansionPanel key={title.key}>
					<ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
						<div className={classes.column}>
							<Typography className={classes.heading}>{title.key}</Typography>
						</div>
					</ExpansionPanelSummary>
					<ExpansionPanelDetails>
						<div>
							{ this.makeSubTypes(title) }
						</div>												
					</ExpansionPanelDetails>
				</ExpansionPanel>
			)
		});
		return objs;
	}

	handleToggle = value => async () => {   
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
		});		
	};

	makeSubTypes = (title) => {
		var options = [];
		const { checked } = this.state
		
		const {classes} = this.props;		

		var objs = [];		
		title.subtitle.map(value => {
			objs.push(
				<ListItem
				key={value}
				role={undefined}
				dense
				button
				onClick={this.handleToggle(`${title.key}-${value}`)}
				className={classes.listItem}
				>
					<Checkbox
						checked={this.state.checked.indexOf(`${title.key}-${value}`) !== -1}
						tabIndex={-1}
						disableRipple
					/>
					<ListItemText primary={`${title.key}-${value}`} />												
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
		({ promos, advertisers, logos, outlets, services }) => ({
			promos, advertisers, logos, outlets, services
		}),
		{
			getPromos,
			getPromo,
			addPromo,
			updatePromo,
			getAdvertiser,
			getAdvertisers,
			redirect,
			goto,
			getOutlet,
			getSpecialOutlets,
			updateOutlet,
			uploadLogo,
			getSpecialServices,
			getUsedOutletsOnPromo,
			getService			
		}
	)(MyModal));