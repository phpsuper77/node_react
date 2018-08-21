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
import CsvCreator from 'react-csv-creator';
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
      headers.push(<CustomTableCell key={head} style={{width: headWidth[ind], textAlign: 'center', margin: 0}}>{headData[head]}</CustomTableCell>);
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
    textAlign: 'center'
  },
  inactiveRow: {
    color: 'grey',
    fontSize: '12pt',
    textAlign: 'center'
  },
  activeButton: {
    marginLeft: 0,
    marginRight: 0,
    padding: 0,
    color: 'black',
    fontSize: '8pt',
    width: 60
  },
  deactiveButton: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    fontSize: '8pt',
    color: 'black',
    width: 60
  },
  decorationLine: {
    textDecoration: 'line-through'
  },
  normal: {
    textDecoration: 'none'
  },
  csvPara: {
    textDecoration: 'under-line'
  },
  pendingStyle: {
    margin: theme.spacing.unit,
    color: 'green',
    fontSize: '12pt',
    textAlign: 'center'
  }
});

class CustomPaginationActionsTable extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {      
      page: 0,
      rowsPerPage: 10,
      service: {},      
    };        
  }  

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  }; 

  render() {
    const { classes, services, doDeactive } = this.props;        
    const { data, rowsPerPage, page } = this.state;    
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, services.length - page * rowsPerPage);
    var csvHeader = [
      {display: 'Name', id: 'name'},
      {display: 'Email', id: 'email'},
      {display: 'Purchase Date and Time', id: 'pDate'},
      {display: 'Redeemption status/Date', id: 'rStatus'}
    ];
    return (
      <Paper className={classes.root}>
        <div className={classes.tableWrapper}>
          <Table>
						<MyTableHead headData={["       Name       ", "Type & Subtype", "Price", "Existing Promo?", "Status","Purchased", "      Action     "]} 
             headWidth={['25%', '20%', '5%', '5%', '5%', '5%', '25vw']}/>
            <TableBody>
              {services.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {                
                var rowStyle = n.status? classes.activeRow: classes.inactiveRow;
                var buttonStyle = n.status? classes.activeButton: classes.deactiveButton;
                var type = n.type + ":" + n.subtype + "<br> Duration: " + n.duration;
                var priceStyle = n.new_price? classes.decorationLine: classes.normal;
                var data = [];

                var buttonTitle = "Activate";
                if (n.status == 1) {
                  buttonTitle = "Deactivate";
                  rowStyle = classes.activeRow;
                } else if (n.status == 2) {
                  buttonTitle = "Pending";
                  rowStyle = classes.pendingStyle
                }
                return (
                  <TableRow key={n.id}>        
                    <TableCell className={rowStyle} >
                      <p>{n.name}</p>
                      <p>Outlets: {n.outletNum>0? n.outletNum: ''}</p>
                    </TableCell>
                    <TableCell className={rowStyle}>
                      <p>{n.type + " : " + n.subtype}</p>
                      <p>Duration: {n.duration}</p>
                    </TableCell>
                    <TableCell className={rowStyle}>
                      <p className={priceStyle}>${parseFloat(n.price).toLocaleString('en')}</p>
                      <p>{n.new_price? `$${n.new_price.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`: ''}</p>
                    </TableCell>
                    <TableCell className={rowStyle} style={{padding: '4px 56px 4px 24px'}}>
                      {n.promoNum? "Yes Ends: " + moment(n.deadline).format("DD/MM/YYYY"): "No"}               
                    </TableCell>
                    <TableCell className={rowStyle}>
                      {n.status? "Active": "Inactive"}
                    </TableCell>
                    <TableCell className={rowStyle}>
                    <CsvCreator
                      filename={n.name}
                      headers={csvHeader}
                      rows={n.csvData}
                      ><p className={classes.csvPara}> {n.pNum}</p></CsvCreator>
                      <p>{n.rNum? n.rNum + " redeemed": ""}</p>                      
                    </TableCell>
                    <TableCell style={{textAlign: 'center', width: '30%', padding:0}}>
                      { n.status < 2 &&
                      <Button className={buttonStyle} disabled={this.props.loading || n.status!=1} style={{width: 60, minWidth: 60}}
                        onClick={() => {this.props.doEdit(n.id)}}                        
                      >Edit</Button>   
                      }
                      <Button className={buttonStyle} disabled={this.props.loading || n.status>1} style={{width: 60, minWidth: 60}}
                        onClick={() => {this.props.doDeactive(n);}}                        
                      >{buttonTitle}</Button>
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
                  count={services.length}
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