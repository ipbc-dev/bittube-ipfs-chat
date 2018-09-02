'use strict';

import React, {PropTypes} from 'react'
import without from 'lodash.without'

class ListForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  }

  initialState() {
    return {
      inputValue: '',
    };
  }

  onValueChange(e) {
    const value = e.target.value
    this.setState({
      inputValue: value
    });
  }

  add(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault()
    e.stopPropagation()
    let list = [].concat(this.props.list);
    list.push(this.state.inputValue);
    this.setState(this.initialState());
    this.props.onListChange(list, this.props.name);
  }

  remove(value) {
    let list = [].concat(this.props.list);
    list = without(list, value);
    this.props.onListChange(list, this.props.name);
  }

  render() {
    const list = this.props.list.map((element, i) => {
      return (
        <li key={element+i} onClick={() => {this.remove(element)} }>
          {element}
        </li>
      )
    })
    const name = this.props.name;
    const label = this.props.label;
    return (
      <div className="listForm">
        <div className="row">
          <label>{label}</label>
          <ul className="list">
          {list}
          </ul>
        </div>
        <div className="row">
          <input name={name}
                 type="text"
                 placeholder={this.props.placeholder}
                 value={this.state.inputValue}
                 onChange={this.onValueChange}
                 onKeyPress={this.add}
          />
        </div>
      </div>
    );
  }
}

ListForm.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  list: PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  onListChange: PropTypes.func.isRequired
};

export default ListForm;
