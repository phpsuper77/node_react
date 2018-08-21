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
      headers.push(<CustomTableCell key={head} style={{width: headWidth[ind], textAlign: 'center', padding: 0}}>{headData[head]}</CustomTableCell>);
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
    textAlign: 'center',
    padding: 0
  },
  inactiveRow: {
    color: 'grey',
    fontSize: '12pt',
    textAlign: 'center',
    padding: 0
  },
  pendingRow: {
    margin: theme.spacing.unit,
    color: 'green',
    fontSize: '12pt',
    textAlign: 'center',
    padding: 0
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
  
});

class CustomPaginationActionsTable extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {      
      page: 0,
      rowsPerPage: 10,
      outlet: {},      
    };        
  }  

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  }; 

  render() {
    const { classes, outlets, doDeactive } = this.props;    
    const { data, rowsPerPage, page } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, outlets.length - page * rowsPerPage);
    
    return (
      <Paper className={classes.root}>
        <div className={classes.tableWrapper}>
          <Table>
						<MyTableHead headData={["Outlet", "Address", "Postal Code", "Status", "Action"]} headWidth={['30%', '15%', '15%', '15%', '25%']}/>
            <TableBody>
              {outlets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {                
                var rowStyle = classes.inactiveRow;
                var buttonStyle = classes.deactiveButton;
                var buttonTitle = "Activate";
                if (n.status == 1) {
                  rowStyle = classes.activeRow;
                  buttonStyle = classes.activeButton;
                  buttonTitle = "Deactivate";
                } else if (n.status > 1) {
                  rowStyle = classes.pendingRow;                  
                  buttonTitle = "Pending";
                }
                return (
                  <TableRow key={n.id}>        
                    <TableCell className={rowStyle} >
                      {n.name}
                    </TableCell>
                    <TableCell className={rowStyle}>
                      {n.address}
                    </TableCell>
                    <TableCell className={rowStyle}>
                      {n.postalcode}               
                    </TableCell>
                    <TableCell className={rowStyle}>
                      {n.status? "Active": "Inactive"}
                    </TableCell>
                    <TableCell className={rowStyle} style={{margin: 0, padding: 0}}>
                      { n.status < 2 &&
                      <Button className={classes.activeButton} disabled={this.props.loading || n.status != 1} style={{minWidth: 60}}
                        onClick={() => {this.props.doEdit(n.id)}}                        
                      >Edit</Button>                          
                      }
                      <Button className={classes.activeButton} disabled={this.props.loading || n.status > 1}
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
                  count={outlets.length}
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