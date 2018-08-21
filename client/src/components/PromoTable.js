import React from 'react'
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import { withStyles } from 'material-ui/styles';
import Table, {
	TableHead,
  TableBody,
  TableCell,
  TablePagination,
  TableRow,
} from 'material-ui/Table';
//import TablePagination from '@material-ui/core/TablePagination';
import Paper from 'material-ui/Paper';
import moment from 'moment';

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

class MyTableHead extends React.Component {
  render() {
    const { headData, headWidth } = this.props;
    var headers = [];
    var ind = 0;
    for (var head in headData) {
      headers.push(<CustomTableCell key={head} style={{width: headWidth[ind], textAlign:'center', padding: '0px 0px'}}>{headData[head]}</CustomTableCell>);
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
    marginLeft: 0,
    marginRight: 0,
    fontSize: '12pt',
    color: 'blue',
    textAlign: 'center',
    padding: '0px 0px'
  },
  inactiveRow: {
    marginLeft: 0,
    marginRight: 0,
    color: 'grey',
    fontSize: '12pt',
    textAlign: 'center',
    padding: '0px 0px'
  },
  activeButton: {
    margin: 0,
    color: 'black',
    fontSize: '8pt'
  },
  deleteLine: {
    textDecoration: "line-through"
  },
  pendingStyle: {
    margin: theme.spacing.unit,
    color: 'green',
    fontSize: '12pt',
    textAlign: 'center',
    padding: 0
  }
});

class CustomPaginationActionsTable extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {      
      page: 0,
      rowsPerPage: 10,
      promo: {},      
    };        
  } 

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  }; 

  render() {
    const { classes, promos, doDeactive } = this.props;    
    const { data, rowsPerPage, page } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, promos.length - page * rowsPerPage);
    
    return (
      <Paper className={classes.root}>
        <div className={classes.tableWrapper}>
          <Table>
						<MyTableHead headData={["Perk Name", "Price", "Duration", "Purchases", "Action"]} headWidth={['30%', '10%', '20%', '15%', '25%']}/>
            <TableBody>
              {promos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {                
                
                var startDate = moment(n.startdate).format("DD MMM hh:mm a");
                var endDate = moment(n.enddate).format("DD MMM hh:mm a");                
                var expiredFlag = moment().isAfter(n.enddate);
                if (n.status<3 && expiredFlag) n.status = 3;
                             
                var rowStyle = n.status == 1? classes.activeRow: classes.inactiveRow;
                var buttonStyle = n.status == 1? classes.activeButton: classes.deactiveButton;
                
                var status = "Inactive";
                var buttonTitle = "Activate"
                if (n.status == 1) {
                  status = "Active";
                  buttonTitle = "Deactivate"
                } else if (n.status == 2) {
                  status = "Ended";                  
                }
                else if (n.status == 3) status = "Expired";
                else if (n.status > 3) {
                  status = "Pending";
                  rowStyle = classes.pendingStyle;
                  buttonTitle = "Pending";
                }

                var outNum = (n.outlets && n.outlets.split(",").length>0)? n.outlets.split(",").length: 0;
                return (
                  <TableRow key={n.id}>        
                    <TableCell className={rowStyle} >
                      <p>{n.name}</p>
                      <p> Outlets: {outNum}</p>
                      <p> {status}</p>
                    </TableCell>                    
                    <TableCell className={rowStyle}>
                      <p className={classes.deleteLine}>${n.oprice.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                      <p>${n.price.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
                    </TableCell>
                    <TableCell className={rowStyle}>
                      <p>{startDate}</p>
                      <p>{" To "}</p>
                      <p>{endDate}</p>                      
                    </TableCell>
                    <TableCell className={rowStyle}>
                      <p>{n.vcount}</p>
                      <p>{n.rcount? n.rcount + " redeemed": ""}</p>                      
                    </TableCell>
                    <TableCell style={{textAlign: 'center'}}>
                      { n.status < 2 &&
                      <Button className={classes.activeButton} disabled={this.props.loading || n.status != 1}
                        onClick={() => {this.props.doEdit(n.id)}}                        
                      >Edit</Button>   
                      } 
                      { n.status < 2 && 
                      <Button className={classes.activeButton} disabled={this.props.loading}
                        onClick={() => {this.props.doDeactive(n);}}                        
                      >{buttonTitle}</Button>
                      }
                      { n.status >3 &&
                        'Pending'
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
                  colSpan={4}
                  count={promos.length}
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

CustomPaginationActionsTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(CustomPaginationActionsTable);