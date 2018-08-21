import React from 'react'
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import Modal from 'material-ui/Modal';
import { withStyles } from 'material-ui/styles';
import MomentUtils from 'material-ui-pickers/utils/moment-utils';
import MuiPickersUtilsProvider from 'material-ui-pickers/utils/MuiPickersUtilsProvider';
import Input from '@material-ui/core/Input';
import { TextValidator,  ValidatorForm } from 'react-material-ui-form-validator';
import CircularProgress from '@material-ui/core/CircularProgress';
import InputLabel from '@material-ui/core/InputLabel';
import Typography from 'material-ui/Typography';
import Table, {
  TableHead,
  TableBody,
  TableCell,
  TablePagination,
  TableRow,
} from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import moment from 'moment';

const actionsStyles = theme => ({
  root: {
    flexShrink: 0,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing.unit * 2.5,
  },
  activeRow: {
    color: "black",
  },
  inactiveRow: {
    color: "grey",    
  },
  button: {
    margin: theme.spacing.unit,
  }
});

const CustomTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    fontSize: 17
  },
  body: {
    fontSize: 15,
  },
}))(TableCell);

function rand() {
  return Math.round(Math.random() * 20) - 10;
}

function getModalStyle() {
  const top = 50 + rand();
  const left = 50 + rand();

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

class MyTableHead extends React.Component {
  render() {
    const { headData, headWidth } = this.props;
    var headers = [];
    var ind = 0;
    for (var head in headData) {
      headers.push(<CustomTableCell key={head} style={{textAlign: 'center', width: headWidth[ind], minWidth: headWidth[ind], padding: '4px 5px 4px 5px'}}>{headData[head]}</CustomTableCell>);
      ind++;
    }
    return (
      <TableHead>
        <TableRow>
          {headers}
        </TableRow>
      </TableHead>
    )
  }
}

MyTableHead.propTypes = {
  headData: PropTypes.array.isRequired,
};

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
  },
  table: {
    minWidth: 500,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  row: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.background.default,
    },
  },
  activeRow: {
    margin: theme.spacing.unit,
    fontSize: '12pt',
    color: 'blue',
    padding: '0px 0px 0px 0px'
  },
  inactiveRow: {
    color: 'grey',
    fontSize: '12pt',
    padding: '0px 0px 0px 0px'
  },
  canceledCell: {
    color: 'grey',
    fontSize: '12pt',
    textDecoration: "line-through",
    padding: '0px 0px 0px 0px'
  },
  activeButton: {
    margin: theme.spacing.unit,
    color: 'black',
    fontSize: '11pt'
  },
  deactiveButton: {
    margin: theme.spacing.unit,
    color: 'grey',
    fontSize: '11pt'
  },
  deleteLine: {
    textDecoration: "line-through"
  },
  input3: {
    width: 250,
    marginLeft: theme.spacing.unit * 4,
    marginRight: theme.spacing.unit * 4
    },
  paper: {
    position: 'relative',
    width: "40vw",
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    margin: "auto",
    textAlign: "center"
  },
  button: {
    margin: "auto",
    left: 0,
    marginLeft: 10,
    marginRight:10
  }
});

class FinanceDetailTable extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {      
      page: 0,
      rowsPerPage: 10,
      promo: {}, 
      checkedSelect: [],
      open: false,
      textdelete: '',
      disable: true
      
    }; 
    
    this.handleDeactive = this.handleDeactive.bind(this);
    this.handleDeletion = this.handleDeletion.bind(this);
    this.handleChangeDelete = this.handleChangeDelete.bind(this);
    this.handleModalSubmit = this.handleModalSubmit.bind(this);
  } 

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };


  handleChangeDelete(e) {
  
      const textdelete = e.target.value;

      if ( textdelete !== "CANCEL") {
        this.setState({ disable: true });
        this.setState({ textdelete });
    } else if ( textdelete == "CANCEL" ) {
        this.setState({ disable: false });
        this.setState({ textdelete });
      }

  }

  handleDeletion() {
      this.setState({ open: true })
  }

  handleClose = async () => {
    console.log('onclose')
  }
  
  handleModalSubmit() {
    console.log('Modal closed');
  }
  
  handleCancel = () => {
    this.setState({ open: false});
  }
  
  handleDeactive = (id) => {
    setTimeout(() => {
      this.setState({ open: false });
    }, 3200);
    this.setState({checkedSelect: []});
    this.props.doDeactive(id);
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
    this.props.handleToggle(newChecked);  
  };
  
  

  render() {
    const { classes, finances, doDeactive } = this.props;    
    const { data, rowsPerPage, page } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, finances.length - page * rowsPerPage);
    var kIndex = 0;
    return (
      <Paper className={classes.root}>
        <div className={classes.tableWrapper}>
          <Table>
            <MyTableHead headData={[" ", "Service/Perk Name","Commission", "Customer Name & Email", "Qty", "Price", "Purchased Date", "Expiry Date", "Redemption Status", "Payment to Merchant", "Action"]}
              headWidth={['5vw', '20vw', '5vw', '20vw', '5vw', '10vw', '15vw', '15vw', '5vw', '15vw', '20vw']}/>
            <TableBody>
              {finances.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {                
                var rowStyle = classes.activeRow;
                var buttonStyle = n.status? classes.activeButton: classes.inactiveButton; 
                var pDate = n.pDate;
                var redeemStatus = "Not redeemed";
                var canceledCell = classes.activeRow;
                var canceledRedeemtion = '';
                
                if (moment().isAfter(moment(n.expireyDate))) {
                  redeemStatus = "Expired";                  
                }
                else if (n.state == 1) {
                  redeemStatus = "Redeemed on " + moment(n.redeemption).format("D MMM YYYY hh:mm:a") + "   at " + `${n.outletname}`; 

                }
                else if (n.state == 2) { redeemStatus = "Redeemed on " + moment(n.redeemption).format("D MMM YYYY hh:mm:a") + "  at " + `${n.outletname}`;
                }else if (n.state == 3) {
                  redeemStatus = "Cancelled/Refunded on " + `${n.cDate}`;
                  canceledCell = classes.canceledCell;
                  rowStyle = classes.inactiveRow;
                }
                
                
                return (
                  <TableRow key={n.id}>        
                    <TableCell className={rowStyle} style={{textAlign: 'center'}}>
                      <Checkbox
                        checked={this.state.checkedSelect.indexOf(n.id) !== -1}
                        disabled={n.state!=1}
                        tabIndex={-1}
                        disableRipple
                        onClick={this.handleToggle(n.id)}
                      />
                    </TableCell>
                    <TableCell className={rowStyle} style={{textAlign: 'center'}}>
                      <p>{n.name}</p>
                    </TableCell>                    
                    <TableCell className={rowStyle} style={{textAlign: 'center'}}>
                      <p>{n.commission}%</p>
                    </TableCell>
                    <TableCell className={rowStyle} style={{textAlign: 'center'}}>
                      <p>{`${n.customer? n.customer: ""}`}</p>                      
                      <p>{n.email}</p>                      
                      <p>{n.vcode}</p>                      
                    </TableCell>
                    <TableCell className={rowStyle} style={{textAlign: 'center'}}>
                      <p>{n.quantity}</p>                      
                    </TableCell>
                    <TableCell className={rowStyle} style={{textAlign: 'center'}}>
                      <p>${parseInt(n.price).toLocaleString('en')}</p>
                      <p>Payable</p>                                            
                      <p>${`${Math.ceil((100 - parseInt(n.commission)) *n.price)/100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                    </TableCell>
                    <TableCell className={canceledCell} style={{textAlign: 'center'}}>
                      <p>{n.pDate}</p>                      
                    </TableCell>
                    <TableCell className={canceledCell} style={{textAlign: 'center'}}>
                      <p>{n.expireyDate? moment(n.expireyDate).format("D MMM YYYY"): ""}</p>                      
                    </TableCell>
                    <TableCell className={rowStyle} style={{textAlign: 'center'}}>
                      <p>{redeemStatus}</p>
                      <p>{canceledRedeemtion}</p>
                    </TableCell>
                    <TableCell className={rowStyle} style={{textAlign: 'center'}}>
                      <p>{parseInt(n.state)==2? `Paid on ${moment(n.paidDate).format("D MMM YYYY")}`: ""}</p>                                   
                    </TableCell>
                    <TableCell style={{textAlign: 'center', padding: '0px 0px 0px 0px'}}>
                      { n.state == 0 &&
                      <p><Button className={buttonStyle} 
                        onClick={() => {this.props.doEdit(n.id)}}                        
                      >Extend date</Button></p>
                      }
                      { n.state < 2 &&  
                      <div>                       
                      <Button className={buttonStyle} disabled={parseInt(n.status) == 0? true: false}
                        onClick={this.handleDeletion}                        
                      >Cancel/Refund</Button>
                      <Modal
                      aria-labelledby="simple-modal-title"
                      aria-describedby="simple-modal-description"
                      open={this.state.open}          
                    >
                      <Paper className={classes.paper}>
                        <ValidatorForm
                        ref="form"
                        onSubmit={this.handleModalSubmit}
                        onError={errors => console.log(errors)}
                        > 
                        <TextValidator
                        onChange={this.handleChangeDelete}
                        name="text"
                        value={this.state.textdelete}
                        validators={["required"]}
                        className={classes.input3}
                        label="Please type CANCEL to confirm"
                        />  
                        <Button variant="raised" color="primary" disabled={this.state.disable} className={classes.button} onClick={() => {this.handleDeactive(n.id);}} >confirm</Button>
                        <Button variant="raised" color="primary" onClick={this.handleCancel}>Cancel</Button>
                        </ValidatorForm>        
                      </Paper>
                    </Modal>
                    </div>
                      }
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 48 * emptyRows }}>
                  <TableCell colSpan={5} />
                </TableRow>
              )}
              <TableRow>
                <TablePagination
                  colSpan={6}
                  count={finances.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onChangePage={this.handleChangePage}
                  onChangeRowsPerPage={this.handleChangeRowsPerPage} 
                  rowsPerPageOptions={[10, 25, 50]}                 
                />
              </TableRow>
            </TableBody>            
          </Table>
        </div> 
      </Paper>
    );
  }
}

FinanceDetailTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(FinanceDetailTable);