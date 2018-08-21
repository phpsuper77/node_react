import React from 'react'
import { Link, IndexLink } from 'react-website'
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import classNames from 'classnames';
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
import IconButton from 'material-ui/IconButton';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import Checkbox from 'material-ui/Checkbox';

import CsvCreator from 'react-csv-creator';

import moment from 'moment';

import LastPageIcon from '@material-ui/icons/LastPage';

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
  },
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


class MyTableHead extends React.Component {
  render() {
    const { headData } = this.props;
    var headers = [];
    for (var head in headData) {
      headers.push(<CustomTableCell key={head}>{headData[head]}</CustomTableCell>);
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
    color: 'blue'
  },
  inactiveRow: {
    color: 'grey',
    fontSize: '12pt'
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
  decorationLine: {
    textDecoration: 'line-through'
  },
  normal: {
    textDecoration: 'none'
  },
  csvPara: {
    textDecoration: 'under-line'
  }
});

class CustomPaginationActionsTable extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {      
      page: 0,
      rowsPerPage: 10,
      service: {},
      checkedSelect: []      
    };        
  }  

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

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
  }; 

  render() {
    const { classes, users } = this.props;        
    const { data, rowsPerPage, page } = this.state;    
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, users.length - page * rowsPerPage);
    var csvHeader = [
      {display: 'Name', id: 'name'},
      {display: 'Email', id: 'email'},
      {display: 'Purchase Date and Time', id: 'pDate'},
      {display: 'Redeemption status/Date', id: 'rStatus'}
    ];
    var index = 0;
    return (
      <Paper className={classes.root}>
        <div className={classes.tableWrapper}>
          <Table>
						<MyTableHead headData={["  No   ", "User Email Address", "Permission", "Last Active"]}/>
            <TableBody>
              {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {                
                var rowStyle = n.status? classes.activeRow: classes.inactiveRow;
                var buttonStyle = n.status? classes.activeButton: classes.inactiveButton;
                var type = n.type + ":" + n.subtype + "<br> Duration: " + n.duration;
                var priceStyle = n.new_price? classes.decorationLine: classes.normal;
                var data = [];
                return (
                  <TableRow key={n.id}>        
                    <TableCell className={rowStyle} >
                      <p>{++index}</p>                      
                    </TableCell>
                    <TableCell className={rowStyle}>
                      <p>{n.email}</p>                      
                    </TableCell>
                    <TableCell className={rowStyle}>                      
                      <Checkbox
                        checked={this.props.checkedSelect.indexOf(n.id) !== -1}                        
                        tabIndex={-1}                        
                        disableRipple
                        onClick={this.props.handleToggle(n.id)}
                      />
                    </TableCell>
                    <TableCell className={rowStyle}>
                      {n.createDate}               
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
                  count={users.length}
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