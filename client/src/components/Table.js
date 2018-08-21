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
// import Table from '@material-ui/core/Table';
// import TableHead from '@material-ui/core/TableHead';
// import TableBody from '@material-ui/core/TableBody';
// import TableCell from '@material-ui/core/TableCell';
// import TableFooter from '@material-ui/core/TableFooter';
//import TablePagination from '@material-ui/core/TablePagination';
//import TableRow from '@material-ui/core/TableRow';
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

import LastPageIcon from '@material-ui/icons/LastPage';
import AdvertiserModal from '../components/AdvertiserModal';

const actionsStyles = theme => ({
  root: {
    flexShrink: 0,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing.unit * 2.5,
    position: 'relative'
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

class TablePaginationActions extends React.Component {
  handleFirstPageButtonClick = event => {
    this.props.onChangePage(event, 0);
  };

  handleBackButtonClick = event => {
    this.props.onChangePage(event, this.props.page - 1);
  };

  handleNextButtonClick = event => {
    this.props.onChangePage(event, this.props.page + 1);
  };

  handleLastPageButtonClick = event => {
    this.props.onChangePage(
      event,
      Math.max(0, Math.ceil(this.props.count / this.props.rowsPerPage) - 1),
    );
  };

  render() {
    const { classes, count, page, rowsPerPage, theme } = this.props;

    return (
      <div className={classes.root}>
        <IconButton
          onClick={this.handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="First Page"
        >
          {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
        </IconButton>
        <IconButton
          onClick={this.handleBackButtonClick}
          disabled={page === 0}
          aria-label="Previous Page"
        >
          {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
        </IconButton>
        <IconButton
          onClick={this.handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Next Page"
        >
          {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
        </IconButton>
        <IconButton
          onClick={this.handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Last Page"
        >
          {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
        </IconButton>
      </div>
    );
  }
}

TablePaginationActions.propTypes = {
  classes: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  theme: PropTypes.object.isRequired,
};

class MyTableHead extends React.Component {
  render() {
    const { headData, headWidth } = this.props;
    var headers = [];
    var ind = 0;
    for (var head in headData) {
      headers.push(<CustomTableCell key={head} style={{width: headWidth[ind], textAlign:'center'}}>{headData[head]}</CustomTableCell>);
      ind ++;
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

const TablePaginationActionsWrapped = withStyles(actionsStyles, { withTheme: true })(
  TablePaginationActions,
);

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
  button: {
    margin: theme.spacing.unit,
    textDecoration: "underline",
    fontSize: '13pt',
    color: 'blue'
  },
  activeButton: {
    margin: theme.spacing.unit,
    color: 'black',
    fontSize: '8pt'
  },
  deactiveButton: {
    margin: theme.spacing.unit,
    color: 'black',
    fontSize: '8pt'
  },
  deactiveRow: {
    margin: theme.spacing.unit,
    color: 'grey',
    fontSize: '13pt'
  },
  pendingStyle: {
    margin: theme.spacing.unit,
    color: 'green',
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

  onModalRendered= () => {
    console.log("modal rendered");
  }

  render() {
    const { classes, advertisers, handleClick, returnTo } = this.props;    
    const { data, rowsPerPage, page } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, advertisers.length - page * rowsPerPage);
    
    return (
      <Paper className={classes.root}>
        <div className={classes.tableWrapper}>
          <Table>
						<MyTableHead headData={["Advertiser", "Outlets", "Services", "Promos", "Action"]} headWidth={['30%', '20%', '10%', '20%', '20%']}/>
            <TableBody>
              {advertisers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => {                                
                var link_service = 0;
                if (n.linked_services) 
                  link_service = n.linked_services.split(',').length;

                n.nooutlets = n.nooutlets? n.nooutlets: 0;
                var rowStyle = classes.deactiveRow;
                var buttonStyle = n.status==1? classes.activeButton: classes.deactiveButton;
                var buttonTitle = "Activate";

                if (n.status == 1) {
                  buttonTitle = "Deactivate";
                  rowStyle = classes.button;
                } else if (n.status == 2) {
                  buttonTitle = "Pending";
                  rowStyle = classes.pendingStyle
                }

                return (
                  <TableRow key={n.id}>        
                    <TableCell style={{textAlign: 'center'}}>
                      { n.status < 2 &&
                      <Link className={rowStyle} 
                        to={"/advertiser/" + n.id} 
                      >{n.name}</Link>
                      }
                      { n.status > 1 &&
                        n.name
                      }                      
                    </TableCell>
                    <TableCell  style={{textAlign: 'center'}}>
                      <Link className={rowStyle} 
                        to={"/outlets/" + n.id} 
                      >{n.nooutlets}</Link>                                            
                    </TableCell>
                    <TableCell  style={{textAlign: 'center'}}>
                      <Link className={rowStyle} 
                        to={"/services/" + n.id} 
                      >{n.scount}</Link>                      
                    </TableCell>
                    <TableCell style={{textAlign: 'center'}}>
                      <Link className={rowStyle} 
                        to={"/promos/" + n.id} 
                      >{n.pcount}</Link>    
                    </TableCell>
                    <TableCell style={{textAlign: 'center'}}>
                      <Button className={buttonStyle} disabled={this.props.loading || n.status > 1}
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
                  colSpan={3}
                  count={advertisers.length}
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