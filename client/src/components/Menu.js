import React from 'react'
import { Link, IndexLink } from 'react-website'
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import classNames from 'classnames';
import { withStyles } from 'material-ui/styles';

import './Menu.scss';
const styles = theme => ({
	button: {
	  margin: theme.spacing.unit,
	  width: 150,	  
	},
	input: {
	  display: 'none',
	},
	menu: {
		textAlign: 'center'
	},
	menu_item: {
		display : 'inline-flex',
		alignItems : 'baseline',
		paddingBottom : 0,
		borderBottomWidth : '0.12em',
		borderBottomColor : 'transparent',
		borderBottomStyle : 'solid',
		textDecoration : 'none'
	}
  });

function Menu(props)
{
	const {classes} = props;	
	return (
		<div className={classes.menu}>
			<Link
				to="/advertiser"
				activeClassName="menu-item--selected"
				className={classes.menu_item}>
				<Button variant="raised" color="primary" className={classes.button}>
					Add Advertiser
				</Button>			
			</Link>
			<Link
				to="/outlet"
				activeClassName="menu-item--selected"
				className={classes.menu_item}>
				<Button variant="raised" color="primary" className={classes.button}>
					Add Outlets
				</Button>			
			</Link>
			<Link
				to="/service/null"
				activeClassName="menu-item--selected"
				className={classes.menu_item}>
				<Button variant="raised" color="primary" className={classes.button}>
					Add Services
				</Button>			
			</Link>
			<Link
				to="/promo"
				activeClassName="menu-item--selected"
				className={classes.menu_item}>
				<Button variant="raised" color="primary" className={classes.button}>
					Add Promo
				</Button>			
			</Link>
			<Link
				to="/finances"
				activeClassName="menu-item--selected"
				className={classes.menu_item}>
				<Button variant="raised" color="primary" className={classes.button}>
					Finance
				</Button>			
			</Link>
		</div>
	)
}

Menu.propTypes = {
	classes: PropTypes.object.isRequired,
  };
  
export default withStyles(styles)(Menu);