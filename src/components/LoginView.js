'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group";
import NetworkStore from 'stores/NetworkStore';
import NetworkActions from 'actions/NetworkActions';
import UserActions from 'actions/UserActions';
import AppActions from 'actions/AppActions';
import BackgroundAnimation from 'components/BackgroundAnimation';
import Themes from 'app/Themes';
import Package from '../../package.json'
import 'styles/LoginView.scss';

const version = Package.version

var maxNicknameLength = 32;
var maxLogoSize = 480;

class LoginView extends React.Component{
  constructor(props) {
    super(props);
    this.state = this._getInitialState(props);
  }

  _getInitialState(props) {
    return {
      error: props ? props.meta : null,
      connecting: false,
      connected: false,
      username: null,
      displayPasswordField: false,
      currentLength: 0,
      theme: Themes.Default,
      logoSize: Math.min(window.innerWidth, maxLogoSize)
    };
  }

  componentDidMount() {
    // AppActions.setLocation('Connect')

    // window.addEventListener('resize', this.onResize.bind(this));

    if(this.refs.username) this.refs.username.focus();

    this.unsubscribeFromNetworkStore = NetworkStore.listen(this.onNetworkUpdated.bind(this));

    NetworkActions.registerError.listen((err) => {
      if(err.toString().replace(/\"/g, "") === "Invalid username or password")
        this.setState({ error: err.toString().replace(/\"/g, ""), connecting: false, displayPasswordField: true });
      else
      this.setState({ error: err.toString().replace(/\"/g, ""), connecting: false });
    });
  }

  onNetworkUpdated(network) {
    if(network) {
      this.setState({ error: null, connecting: false, connected: true });
    } else {
      this.setState(this._getInitialState());
    }
  }

  componentWillUnmount() {
    // window.removeEventListener('resize', this.onResize.bind(this));
    this.unsubscribeFromNetworkStore();
  }

  // onResize() {
  //   var size = Math.min(window.innerWidth, maxLogoSize);
  //   this.setState({ logoSize: size });
  // }

  focusUsername(e) {
    this.refs.username.focus()
  }

  configureIpfs(e) {
    AppActions.setLocation('IpfsSettings')
  }

  register(e) {
    if(e) e.preventDefault();

    var username = this.refs.username.value.trim();

    if(username !== '') {
      this.setState({ error: null, connecting: true, username: username });
      AppActions.setLocation('Loading')
      AppActions.login(username);
    }

    return;
  }

  calculateNicknameLength() {
    this.setState({ currentLength: this.refs.username.value ? this.refs.username.value.length : 0});
  }

  render() {
    if(this.state.connected)
      return (<div></div>);

    // var color = "rgba(100, 48, 128, 0.5)";
    var color = "rgba(180, 180, 180, 0.5)";
    var errorMsg   = this.state.error ? <div className="error">{this.state.error}</div> : "";
    var passwordFieldStyle = this.state.displayPasswordField ? "row" : "hidden";

    var form =
      <TransitionGroup transitionName="loginScreenAnimation" transitionAppear={true} component="div" className="inputs" transitionAppearTimeout={5000} transitionEnterTimeout={5000} transitionLeaveTimeout={5000}>
        <div className="usernameRow" onClick={this.focusUsername.bind(this)}>
          <input
            type="text"
            ref="username"
            placeholder="Nickname"
            defaultValue={this.state.username ? this.state.username : ""}
            maxLength="32"
            autoFocus
            style={this.state.theme}
            onChange={this.calculateNicknameLength.bind(this)}/>
        </div>
        <div className="connectButtonRow">
          <span className="hint">{this.state.currentLength > 0 ? 'Press ENTER to login' : ''}</span>
          <input type="submit" value="Connect" style={{ display: "none" }}/>
        </div>
      </TransitionGroup>

    return (
      <div className="LoginView">
        <TransitionGroup className="header" transitionName="loginHeaderAnimation" transitionAppear={true} component="div" transitionAppearTimeout={5000} transitionEnterTimeout={5000} transitionLeaveTimeout={5000}>
          <h1>BitTube</h1>
        </TransitionGroup>
        <form onSubmit={this.register.bind(this)}>
          {form}
        </form>
        <div className='Version'>
          Version: {version}
        </div>
        <BackgroundAnimation 
          size={this.state.logoSize} 
          circleSize={2} 
          theme={this.state.theme}
          onClick={this.focusUsername.bind(this)}
        />
      </div>
    );
  }

}

export default LoginView;
