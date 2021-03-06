import React, { Component } from 'react';
import './App.css';

import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine-dark.css';


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      columnDefs: [
        {headerName: "Timestamp (UTC)", field: "timestamp", width: 300},
        {headerName: "Total Volume", field: "volume", flex: 1},
        {headerName: "Minimum Price", field: "low", flex: 1},
        {headerName: "Maximum Price", field: "high", flex: 1},
        {headerName: "Opening Price", field: "open", flex: 1},
        {headerName: "Closing Price", field: "close", flex: 1}
      ],
      rowData: [],

      startDate: "",
      endDate: "",
      input: "",
      suggestions: []
    }

    this.requestData = this.requestData.bind(this);
    this.handleEndDateClick = this.handleEndDateClick.bind(this);
    this.handleStartDateClick = this.handleStartDateClick.bind(this);
    this.handleAutoComplete = this.handleAutoComplete.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
  }

  handleStartDateClick(e) {
    e.preventDefault();
    this.setState(({startDate: e.target.value}));
  }
  handleEndDateClick(e) {
    e.preventDefault();
    this.setState(({endDate: e.target.value}));
  }

  handleAutoComplete(e){
    e.preventDefault();
    this.setState(({input: e.target.value}));
    fetch("http://localhost:8080/search/"+ e.target.value)
    .then(res => res.json())
    .then(result => {
      this.setState(({suggestions: result}))
    })
  }

  renderSuggestion() {
    const {suggestions} = this.state;

    if(suggestions.length === 0 ){
      return null
    }
    return (
    <ul className='suggestion'>
      {this.state.suggestions.map(item => <li onClick={this.handleSelection(item)}>{item}</li>)}
    </ul>
    )
  }

  handleSelection = value => () => {
    this.setState({input: value, suggestions: []}, this.requestData);
  };

  requestData() {
    if (this.state.startDate && this.state.endDate === ""){
      fetch("http://localhost:8080/stock/"+this.state.input+"?startDate="+this.state.startDate)
      .then(res => res.json())
      .then(result => {
        this.setState(() =>({
          rowData: result
        }))
      })
    } 
    if (this.state.startDate && this.state.endDate){
      fetch("http://localhost:8080/stock/range/"+this.state.input+"?startDate="+this.state.startDate+"& ="+this.state.endDate)
      .then(res => res.json())
      .then(result => {
        this.setState(() =>({
          rowData: result
        }))
      })
    }
  }

render() {
  return (
      <div
          className="ag-theme-alpine-dark"
          style={{ height: '80vh', width: '80vw', margin: 'auto' }}
      >

        <input type="date" id="start" name="trip-start" value={this.state.startDate} onChange={ this.handleStartDateClick }></input>
        <input type="date" id="end" name="trip-end" value={this.state.endDate} onChange={ this.handleEndDateClick }></input>
        <button onClick={this.requestData}>Search</button>
        <div className="inline">
        <input type="text" id="ticker" name="ticker-symbol" value={this.state.input} onChange={ this.handleAutoComplete }></input>
        {this.renderSuggestion()}
        </div>
          <AgGridReact
              columnDefs={this.state.columnDefs}
              rowData={this.state.rowData}>
          </AgGridReact>
      </div>
  );
}
}

export default App;

