import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import Avatar from 'material-ui/Avatar';
import Menu, { MenuItem } from 'material-ui/Menu';
import { Link, goto } from 'react-website'
import { connect } from 'react-redux'

import { withRouter } from 'react-router'

import husky from '../../assets/images/husky.jpg';
import configuration from '../../configuration'
import './AppMenuBar.scss';

import { 	
	destoryUser,
	getAuthenticatedUser
} from '../redux/user'

const styles = {
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
  avatar: {
    margin: 5,
  },
  bigAvatar: {
    width: 60,
    height: 60,
  },
};



@withRouter
class MenuAppBar extends React.Component {
  state = {
    auth: true,
    anchorEl: null,
    title: 'Admin',
    imageUrl: husky,
    isAdmin: false
  };

  componentDidMount = async () => {
    var userId = localStorage.getItem("dashboard_user");    
    await this.props.getAuthenticatedUser({id: userId});
    
    const { users, goto } = this.props;  
      
    if (configuration.authtesting) {      
      console.log(users.response);
      if (users.response.status != "success") goto("/login");
      else {
        this.setState({
          imageUrl: users.response.user.imageUrl
        })
        this.setState({isAdmin: users.response.user.role==0});
        //goto("/")
      }
      
    }  
      
  }

  handleMenu = event => {
    this.setState({ anchorEl: event.currentTarget });    
  };

  handleClose = (path) => {
    this.setState({ anchorEl: null });    
  };

  render() {
    const { classes, users } = this.props;
    const { auth, anchorEl, imageUrl, isAdmin } = this.state;
    const open = Boolean(anchorEl);
    //const imageUrl = users.response.user.imageUrl;   

    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            
            <Typography variant="title" color="inherit" className={classes.flex}>
              <Link to="/" className="homeurl">{this.state.title}'s Dashboard</Link>
            </Typography>            
            {auth && (
              <div>
                <IconButton
                  aria-owns={open ? 'menu-appbar' : null}
                  aria-haspopup="true"                  
                  color="inherit"
                  onClick={this.handleMenu}
                >
                
                  <Avatar
                      src={imageUrl}
                      className={classes.avatar}
                  />
                  
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={open}
                  onClose={this.handleClose}
                >
                  <MenuItem onClick={this.handleClose}><Link to="/">Main Dashboard</Link></MenuItem>
                  {isAdmin &&
                 
                  <MenuItem onClick={this.handleClose}><Link to="/role">User Role</Link></MenuItem>

                  }
                  <MenuItem onClick={this.handleClose}><Link to="/outletcode">Outlet Code</Link></MenuItem>
                </Menu>
              </div>
            )}
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

MenuAppBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(
  connect
  (
    ({ users }) => ({
      users
    }		
    ),
    {
      getAuthenticatedUser,
      goto				
    }
  )(MenuAppBar));