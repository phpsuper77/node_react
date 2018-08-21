import React, { Component } from 'react'
import { goto } from 'react-website'
import { connect } from 'react-redux'
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Modal from 'material-ui/Modal';
import Paper from 'material-ui/Paper';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';

import Snackbar from '@material-ui/core/Snackbar';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
//import DefaultLogo from '../../assets/images/favicon.png';

import 'react-website/components/Loading.css'
import 'react-website/components/LoadingIndicator.css'

import GoogleLogin from 'react-google-login';
import configuration from '../../configuration'

const styles = theme => ({
  paper: {
    top: '-7vh',
    position: 'relative',
    width: "20vw",
    height: "15vh",
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
	padding: theme.spacing.unit * 4,
  margin: "auto",
  paddingTop: '7vh',
  paddingBottom: '7vh'
  },
  backgroundPaper: {
    top: '25vh',    
    position: 'relative',
    width: "22vw",
    height: "15vh",
    backgroundColor: '#0075edc9',
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    margin: "auto",
    paddingTop: '10vh'
  },
  flex: {
    flex: 1,
  },
  whiteModal: {
    backgroundColor: 'white'
  },
  root: {
    flexGrow: 1,
  },  
  col: {
		paddingLeft: theme.spacing.unit*3,
    paddingRigth: theme.spacing.unit*3,
    justifyContent: 'space-around',
    textAlign: "center"
  },
  typo: {
    fontSize: '27pt',
    textAlign: "center",
    color: '#0075edc9',
    paddingBottom: '3vh',
    fontWeight: 'bold'    
  },
  backgroundDib: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white'
  },
  googleBtn: {
    backgroundColor: '#11b5bd',
    display: 'inline-block',    
    color: 'white',
    width: 190,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 2,
    border: '1px solid transparent',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto'
  }
});

import { 
	authenticatedUser
} from '../redux/user'

class LoginModal extends Component
{
	constructor(props) {
		super(props);			
		this.state = {
            openFlag: true,
            error: { 
                flag: false,
                msg: "hello"
            }
        }			
	}

	handleClose = () => {	        
		return;		
  }
    
  handleCloseSanckbar = () => {    
		this.setState({
			error: { flag: false, msg: this.state.error.msg }
    });    
  }
  
  responseGoogle = async (response) => {
    
    if (response.error) {
      this.setState({
        error: {flag: true, msg: response.details}
      })
    } else {
      const { goto, authenticatedUser } = this.props;
      var user = response.profileObj;
      user.accessToken = response.accessToken;
      await authenticatedUser(user);
      const { users } = this.props;
      if (users.response.status == "success") {
        localStorage.setItem("dashboard_user", users.response.user.id);        
        goto("/");              
      } else if (users.response.status == "pending") {
        this.setState({
          error: { flag: true, msg: "Your account is pending now! Please contact with us for permission!"}
        });
      } else {
        this.setState({
          error: { flag: true, msg: users.response.message}
        });
      }      
    }    
  }

	render() {		
		const { classes } = this.props;
    console.log(configuration.google_auth.clientId);
		return (
			<Modal
				aria-labelledby="simple-modal-title"
				aria-describedby="simple-modal-description"
				open={this.state.openFlag}
				onClose={this.handleClose}
                className= { classes.whiteModal }
			>
      <div className={classes.backgroundDib}>
        <Paper className={classes.backgroundPaper}>
        </Paper>
				<Paper className={classes.paper}>
          <Grid container spacing={8}>            						
						<Grid cols={1} xs={12} md={12} item className={classes.col}>
              <Typography className={classes.typo} >
                Login
              </Typography>
						</Grid>
            <Grid item cols={1} xs={12} md={12} className={classes.col}>
              <GoogleLogin
                clientId={configuration.google_auth.clientId}
                buttonText="LOGIN VIA GOOGLE"
                onSuccess={this.responseGoogle}
                onFailure={this.responseGoogle}  
                className={classes.googleBtn}              
              />								
						</Grid>
            <Snackbar
              anchorOrigin={{vertical: 'center', horizontal: 'center'}}
              open={this.state.error.flag}
              onClose={this.handleCloseSanckbar}
              ContentProps={{
                'aria-describedby': 'message-id',
              }}
              message={<span id="message-id">{ this.state.error.msg }</span>}
            />
          </Grid>
				</Paper>        				
        </div>
			</Modal>
		)
	}
}

LoginModal.propTypes = {
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
			authenticatedUser,
			goto				
		}
	)(LoginModal));