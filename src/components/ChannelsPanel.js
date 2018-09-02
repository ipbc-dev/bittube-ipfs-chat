'use strict';

import React from 'react';
import TransitionGroup from "react-addons-css-transition-group"; //eslint-disable-line
import UIActions from "actions/UIActions";
import JoinChannel from 'components/JoinChannel'; //eslint-disable-line
import ChannelStore from 'stores/ChannelStore';
import AppStateStore from 'stores/AppStateStore';
import NetworkActions from 'actions/NetworkActions';
import BackgroundAnimation from 'components/BackgroundAnimation'; //eslint-disable-line
import Spinner from 'components/Spinner';
import 'styles/ChannelsPanel.scss';
import 'styles/RecentChannels.scss';

const channelsToArray = (channels) => {
  return Object.keys(channels).map((f) => channels[f]);
};

class ChannelsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentChannel: props.currentChannel,
      openChannels: {},
      leftSide: props.left,
      joiningToChannel: props.joiningToChannel,
      username: props.username,
      requirePassword: props.requirePassword || false,
      loading: false,
      theme: props.theme,
      appState: AppStateStore.state,
      networkName: props.networkName
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return Object.keys(this.state.openChannels).length !== Object.keys(nextState.openChannels).length
      || nextProps.currentChannel !== this.props.currentChannel
      || nextState.appState.unreadMessages[this.props.currentChannel] !== this.state.appState.unreadMessages[this.props.currentChannel]
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentChannel: nextProps.currentChannel,
      leftSide: nextProps.left,
      joiningToChannel: nextProps.joiningToChannel || this.state.joiningToChannel,
      requirePassword: nextProps.requirePassword,
      loading: false,
      theme: nextProps.theme,
      networkName: nextProps.networkName
    });
  }

  componentDidMount() {
    this.unsubscribeFromChannelStore = ChannelStore.listen((channels) => {
      this.setState({ openChannels: channels });
    });

    this.stopListeningAppState = AppStateStore.listen((appState) => {
      this.setState({ appState: appState });
    });

    this.setState({ openChannels: ChannelStore.all() });
  }

  componentWillUnmount() {
    this.stopListeningAppState();
    this.unsubscribeFromChannelStore();
  }

  onClose() {
    if(this.state.currentChannel !== null)
      this.props.onClose();
  }

  handleJoinChannel(channelName, password) {
    this.setState({ joiningToChannel: channelName, requirePassword: password !== '', loading: true });
    UIActions.joinChannel(channelName);
  }

  clearRecentChannels() {
    localStorage.setItem("channels", null);
    this.setState({recentChannels: []});
  }

  _renderChannel(e) {
    const name = e.name;
    const unreadMessagesCount = this.state.appState.unreadMessages[name] ? this.state.appState.unreadMessages[name] : 0;
    const hasUnreadMessages = unreadMessagesCount > 0;
    const mentionsCount = this.state.appState.mentions[name] ? this.state.appState.mentions[name] : 0;
    const className = "unreadMessages " + (mentionsCount > 0 ? "hasMentions" : "");
    return (
      <div className="row link" key={Math.random().toString()}>
        <span className='channelName' onClick={this.handleJoinChannel.bind(this, name, "")} key={Math.random().toString()}>#{name}</span>
        {hasUnreadMessages ? <span className={className} style={this.state.theme}>{hasUnreadMessages ? unreadMessagesCount : ""}</span> : ""}
        <span className='closeChannelButton' onClick={NetworkActions.leaveChannel.bind(this, name)} key={Math.random().toString()}>Close</span>
      </div>
    );
  }

  render() {
    const headerClass = this.state.currentChannel ? "header" : "header no-close";
    const channelsHeaderClass = Object.keys(this.state.openChannels).length > 0 ? "panelHeader" : "hidden";
    const channelJoinInputClass = !this.state.loading ? "joinChannelInput" : "joinChannelInput invisible";

    const openChannels = Object.keys(this.state.openChannels)
      .map((e) => this.state.openChannels[e])
      .map((channel) => this._renderChannel(channel));

    const transitionProps = {
      component: 'div',
      transitionAppear: true,
      transitionAppearTimeout: 5000,
      transitionEnterTimeout: 5000,
      transitionLeaveTimeout: 5000,
    };

    const align = this.state.leftSide ? { right: 0, borderRight: '0px' } : { borderLeft: '0px' }

    return (
      <div>
        <TransitionGroup {...transitionProps} transitionName={this.state.leftSide ? "openPanelAnimationRight" : "openPanelAnimationLeft"}>
          <div className="ChannelsPanel" style={align}>

            <div style={{ opacity: 0.8, zIndex: -1 }}>
              <BackgroundAnimation size="320" startY="58" theme={this.state.theme} style={{ alignItems: 'flex-start' }}/>
            </div>

            <TransitionGroup {...transitionProps} transitionName={this.state.leftSide ? "panelHeaderAnimationRight" : "panelHeaderAnimationLeft"}>
              <div className={headerClass} onClick={this.onClose.bind(this)}>
                <div className="logo">BitTube</div>
              </div>
            </TransitionGroup>

            <TransitionGroup {...transitionProps} transitionName="networkNameAnimation">
              <div className="networkName">
                <div className="text">{this.state.networkName}</div>
              </div>
            </TransitionGroup>

            <div className="username">{this.state.username}</div>

            <Spinner isLoading={this.state.loading} color="rgba(140, 80, 220, 1)" size="32px" />

            <TransitionGroup {...transitionProps} transitionName="joinChannelAnimation" className={channelJoinInputClass}>
              <JoinChannel
                onJoinChannel={this.handleJoinChannel.bind(this)}
                requirePassword={this.state.requirePassword}
                channelNamePlaceholder={this.state.joiningToChannel}
                theme={this.state.theme}
              />
            </TransitionGroup>

            <div className={channelsHeaderClass}>Channels</div>

            <TransitionGroup {...transitionProps} transitionName="joinChannelAnimation" className="openChannels">
              <div className="RecentChannelsView">
                <div className="RecentChannels">{openChannels}</div>
              </div>
            </TransitionGroup>

          </div>
        </TransitionGroup>

        <TransitionGroup {...transitionProps} transitionName="darkenerAnimation" className="darkener" onClick={this.onClose.bind(this)} />
      </div>
    );
  }

}

export default ChannelsPanel;
