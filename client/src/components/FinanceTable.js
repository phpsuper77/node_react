import React from 'react'
import { Link } from 'react-website'
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Table, {
	TableHead,
  TableBody,
  TableCell,
  TableFooter,
  TablePagination,
  TableRow,
} from 'material-ui/Table';
//import TablePagination from '@material-ui/core/TablePagination';
import Paper from 'material-ui/Paper';

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
    const { headData } = this.props;
    var headers = [];
    for (var head in headData) {
      headers.push(<CustomTableCell key={head} style={{textAlign: 'center'}}>{headData[head]}</CustomTableCell>);
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
    textAlign: 'center'
  },
  button: {
    margin: theme.spacing.unit,
    textDecoration: "underline",
    fontSize: '12pt',
    color: 'blue'
  },
  inactiveButton: {
    color: 'grey',
    textDecoration: "underline",    
    fontSize: '12pt'
  }
});

class CustomPaginationActionsTable extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {      
      page: 0,
      rowsPerPage: 10,
      advertiser: {},
      showAdDialog: false,
      showOutDialog: false,
      showSvcDialog: false,
      showedDialog: 'advertiser'
    };        
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };  

  handleSave = () => {
		console.log("save");
	}  
  
  render() {
    const { classes, finances, handleClick, returnTo } = this.props;    
    const { data, rowsPerPage, page } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, finances.length - page * rowsPerPage);
    
    return (
      <Paper className={classes.root}>
        <div className={classes.tableWrapper}>
          <Table>
						<MyTableHead headData={["Advertiser", "Total Purchases", "Redeemed", "Paid", "Action"]}/>
            <TableBody>
              {finances.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {                                
                var link_service = 0;
                if (n.linked_services) 
                  link_service = n.linked_services.split(',').length;

                n.nooutlets = n.nooutlets? n.nooutlets: 0;
                var rowStyle = n.status? classes.button: classes.inactiveButton;
                return (
                  <TableRow key={n.id}>        
                    <TableCell style={{textAlign: 'center'}}>
                      {n.name}
                      <p>{n.status? "Active": "Inactive"}</p>
                    </TableCell>
                    <TableCell style={{textAlign: 'center'}}>                      
                      {n.total? `$${n.total.toLocaleString('en')}`: ''}
                      <p>{n.pNum}</p>
                    </TableCell>
                    <TableCell style={{textAlign: 'center'}}>
                      {n.rTotal? `$${Math.ceil(parseFloat(n.rTotal)*100)/100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","): ''}                    
                      <p>{n.rNum}</p>            
                    </TableCell>
                    <TableCell style={{textAlign: 'center'}}>
                      {n.paid? `$${n.paid.toLocaleString('en')}`: ''} {n.paid && n.rTotal? `of $${Math.ceil(parseFloat(n.rTotal)*100)/100}`.replace(/\B(?=(\d{3})+(?!\d))/g, ","): ''}
                    </TableCell>
                    <TableCell style={{textAlign: 'center'}}>
                      <Link className={rowStyle} 
                        to={"/finance/" + n.id} 
                      >View Transactions</Link>    
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

CustomPaginationActionsTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(CustomPaginationActionsTable);