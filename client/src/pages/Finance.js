import React, { Component } from 'react'
import { meta, preload, goto} from 'react-website'
import { connect } from 'react-redux'
import FinanceTable from '../components/FinanceTable'

import { withRouter } from 'react-router'
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import Grid from 'material-ui/Grid';
import GridList, { GridListTile, GridListTileBar } from 'material-ui/GridList';
import Select from 'react-select';

import
{
	connectAdvertiser,
	getAdvertisers,
	getAdvertiser
}
from '../redux/advertisers'

import { 
	getFinance,
	getFinances,
	getSpecialFinances
} from '../redux/finance'

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


@meta(({ state }) => ({ title: 'Finance' }))
@preload(async (preparams) => {			
	const { parameters, dispatch } = preparams;
	//await dispatch(getAuthenticatedUser());
	await dispatch(getFinances());
	await dispatch(getAdvertisers());	
})
class FinancePage extends Component
{
	state = {
		userId: null,
		advertiser: {id: 0, label: ''},
		finances: []		
	}
	constructor()
	{
		super()		
	}

	componentWillMount = () => {
		const { advertisers, users, goto, finances } = this.props;
		// if (!users.user) goto("/login");		
		this.setState({advertisers: advertisers.advertisers});

		if (finances && finances.financeData && finances.financeData.length>0)
			this.setState({finances: finances.financeData});
	}
	
	componentDidMount = async () => {
		await this.props.getFinances();
		const { finances } = this.props;
		if (finances && finances.financeData && finances.financeData.length>0)
			this.setState({finances: finances.financeData});
	}
	selectAdvertiser = (selectedOption) => {
		this.setState({advertiser: selectedOption});
		const { finances } = this.props;

		if (finances.financeData && finances.financeData.length > 0) {
			var tempArr = finances.financeData.filter(ad => ad.name == selectedOption.label);
			debugger
			this.setState({ finances: tempArr });
		}
	}	

	render()
	{
		const {
			advertisers, location, router, classes
		} = this.props;		
		
		const {			
			userId
		} = this.state;
		
		var selAds = [];		
		if (advertisers && advertisers.advertisers && advertisers.advertisers.length >0) {
			advertisers.advertisers.forEach(ad => {
				selAds.push({id: ad.id, label: ad.name});
			});
		}
		selAds.sort((a,b) => a.id-b.id);

		return (
			<Grid container spacing={8}>
				<Grid container className={classes.row}  alignItems="flex-end">
					<Select
						name="outlet"
						value={this.state.advertiser}
						onChange={this.selectAdvertiser}
						options={selAds}
						styles={selectStyle}
						className={classes.input}
					/>					
				</Grid> 
				<FinanceTable finances={this.state.finances} handleClick={this.handleClickRow}/>
			</Grid>
		)
	}
}

FinancePage.propTypes = {
	classes: PropTypes.object.isRequired,
};
 
export default withStyles(styles)(
	connect
	(
		({ advertisers, finances }) => ({
			advertisers, finances
		}		
		),
		{
			getAdvertisers,
			getAdvertiser,			
			goto,
			getFinance,
			getFinances,
			getSpecialFinances				
		}
	)(FinancePage));