'use strict'

import React from 'react'
import { render } from 'react-dom'
import { Router, Route, hashHistory } from 'react-router'
import Logger from 'logplease'

import AppActions from 'actions/AppActions'
import UIActions from "actions/UIActions"
import NetworkActions from 'actions/NetworkActions'
import NotificationActions from 'actions/NotificationActions'
import IpfsDaemonActions from 'actions/IpfsDaemonActions'
import ChannelActions from 'actions/ChannelActions'

import OrbitStore from 'stores/OrbitStore'
import IpfsDaemonStore from 'stores/IpfsDaemonStore'
import AppStateStore from 'stores/AppStateStore'
import UserStore from 'stores/UserStore'
import UserActions from 'actions/UserActions'
import NetworkStore from 'stores/NetworkStore'
import ChannelStore from 'stores/ChannelStore'
import MessageStore from 'stores/MessageStore'
import UsersStore from 'stores/UsersStore'
import SettingsStore from 'stores/SettingsStore'
import SwarmStore from 'stores/SwarmStore'

import ChannelsPanel from 'components/ChannelsPanel'
import ChannelView from 'components/ChannelView'
import SettingsView from 'components/SettingsView'
import IpfsSettingsView from 'components/IpfsSettingsView'
import SwarmView from 'components/SwarmView'
import LoginView from 'components/LoginView'
import LoadingView from 'components/LoadingView'
import Header from 'components/Header'
import Themes from 'app/Themes'

import 'normalize.css'
import 'styles/Main.scss'
import 'styles/App.scss'
import 'styles/Scrollbars.scss'
import 'highlight.js/styles/atom-one-dark.css'
// Agate, Atom One Dark, Github, Monokai, Monokai Sublime, Vs, Xcode

Logger.setLogLevel(window.DEV ? 'DEBUG' : 'ERROR')

const logger = Logger.create('App', { color: Logger.Colors.Red })

const views = {
  "Index": "/",
  "Settings": "/settings",
  "IpfsSettings": "/ipfs-settings",
  "Swarm": "/swarm",
  "Connect": "/connect",
  "Channel": "/channel/",
  "Loading": "/loading",
}

const ipcRenderer = window.ipcRenderer

var App = React.createClass({
  getInitialState: function() {
    return {
      panelOpen: false,
      leftSidePanel: false,
      user: null,
      location: null,
      joiningToChannel: null,
      requirePassword: false,
      theme: null,
      networkName: "Unknown Network"
    }
  },
  componentDidMount: function() {
    if (!this.state.user) {
      this._reset()
      AppActions.setLocation("Connect")
    }

    document.title = 'BitTube'

    UIActions.joinChannel.listen(this.joinChannel)
    NetworkActions.joinedChannel.listen(this.onJoinedChannel)
    NetworkActions.joinChannelError.listen(this.onJoinChannelError)
    NetworkActions.leaveChannel.listen(this.onLeaveChannel)
    AppActions.login.listen(this.onLogin)

    this.unsubscribeFromNetworkStore = NetworkStore.listen(this.onNetworkUpdated)
    this.unsubscribeFromUserStore = UserStore.listen(this.onUserUpdated)
    this.stopListeningAppState = AppStateStore.listen(this._handleAppStateChange)
    this.unsubscribeFromSettingsStore = SettingsStore.listen((settings) => {
      this.setState({ theme: Themes[settings.theme] || null, leftSidePanel: settings.leftSidePanel })
    })

    // window.onblur = () => AppActions.windowLostFocus()
    // window.onfocus = () => AppActions.windowOnFocus()
  },
  _handleAppStateChange: function(state) {
    let prefix = '', suffix = ''

    if(!AppStateStore.state.hasFocus && AppStateStore.state.unreadMessages[AppStateStore.state.currentChannel] > 0)
      suffix = `(${AppStateStore.state.unreadMessages[AppStateStore.state.currentChannel]})`

    if(Object.keys(state.unreadMessages).length > 1 || (Object.keys(state.unreadMessages).length === 1 && !Object.keys(state.unreadMessages).includes(AppStateStore.state.currentChannel)))
      prefix = '*'

    if(Object.keys(state.mentions).length > 0)
      prefix = '!'

    if(state.currentChannel) {
      document.title = prefix + ' ' + AppStateStore.state.location + ' ' + suffix
      this.goToLocation(state.currentChannel, views.Channel + encodeURIComponent(state.currentChannel))
    } else {
      document.title = prefix + ' Orbit'
      this.goToLocation(state.location, views[state.location])
    }
  },
  _reset: function() {
    if(ipcRenderer) ipcRenderer.send('disconnected')
    this.setState(this.getInitialState())
  },
  onLogin: function(username) {
    IpfsDaemonActions.start(username)
    OrbitStore.listen((orbit) => {
      logger.debug("Connect as " + username)
      orbit.connect(username)
    })
  },
  onNetworkUpdated: function(network) {
    logger.debug("Network updated")
    if (!network) {
      this._reset()
      AppActions.setLocation("Connect")
    } else {
      this.setState({ networkName: network.name })
      const channels = this._getSavedChannels(this.state.networkName, this.state.user.name)
      channels.forEach((channel) => NetworkActions.joinChannel(channel.name, ''))
    }
  },
  _makeChannelsKey: function(username, networkName) {
    return "orbit.app." + username + "." + networkName + ".channels"
  },
  _getSavedChannels: function(networkName, username) {
    const channelsKey = this._makeChannelsKey(username, networkName)
    let channels = JSON.parse(localStorage.getItem(channelsKey))

    // If we have a first time user (nothing saved in local storage),
    // add #ipfs to their saved channel list in order to join it
    // automatically on first login
    if (!channels) {
      channels = [{ name: 'tuberoom' }]
    }

    return channels
  },
  _saveChannels: function(networkName, username, channels) {
    const channelsKey = this._makeChannelsKey(username, networkName)
    localStorage.setItem(channelsKey, JSON.stringify(channels))
  },
  _showConnectView: function() {
    this.setState({ user: null })
    AppActions.setLocation("Connect")
  },
  onUserUpdated: function(user) {
    logger.debug("User updated", user)

    if (!user) {
      AppActions.setLocation("Connect")
      return
    }

    if (user === this.state.user)
      return

    this.setState({ user: user })

    if (!this.state.panelOpen) this.openPanel()
    AppActions.setLocation(null)
  },
  joinChannel: function(channelName, password) {
    if (channelName === AppStateStore.state.currentChannel) {
      this.closePanel()
      return
    }
    logger.debug("Join channel #" + channelName)
    NetworkActions.joinChannel(channelName, password)
  },
  onJoinChannelError: function(channel, err) {
    if(!this.state.panelOpen) this.setState({ panelOpen: true })
    this.setState({ joiningToChannel: channel, requirePassword: true} )
  },
  onJoinedChannel: function(channel) {
    logger.debug("Joined channel #" + channel)
    this.closePanel()
    document.title = `#${channel}`
    logger.debug("Set title: " + document.title)
    AppActions.setCurrentChannel(channel)
    let channels = this._getSavedChannels(this.state.networkName, this.state.user.name)
    if (!channels.find(e => e.name === channel)) {
      channels.push({ name: channel })
      this._saveChannels(this.state.networkName, this.state.user.name, channels)
    }
  },
  onLeaveChannel: function(channel) {
    const { user, networkName } = this.state
    const channelsKey = this._makeChannelsKey(user.name, networkName)
    const channels = this._getSavedChannels(networkName, user.name).filter((c) => c.name !== channel)
    if (channels.length === 0)
      localStorage.removeItem(channelsKey)
    else
      this._saveChannels(this.state.networkName, this.state.user.name, channels)
  },
  openSettings: function() {
    this.closePanel()
    AppActions.setLocation("Settings")
  },
  openSwarmView: function() {
    this.closePanel()
    AppActions.setLocation("Swarm")
  },
  closePanel: function() {
    this.setState({ panelOpen: false })
    UIActions.onPanelClosed()
  },
  openPanel: function() {
    this.setState({ panelOpen: true })
  },
  disconnect: function() {
    logger.debug('app disconnect')
    this.closePanel()
    AppActions.disconnect()
    NetworkActions.disconnect()
    this.setState({ user: null })
    AppActions.setLocation("Connect")
  },
  onDaemonDisconnected: function() {
    AppActions.setLocation("Connect")
  },
  goToLocation: function(name, url) {
    hashHistory.replace(url ? url : '/')
  },
  render: function() {
    const location = AppStateStore.state.location
    const noHeader = ["Connect", "IpfsSettings", "Loading"]
    const header = location && noHeader.indexOf(location) < 0 ? (
      <Header
        onClick={this.openPanel}
        title={location}
        channels={ChannelStore.all()}
        theme={this.state.theme}>
      </Header>
    ) : null

    const panel = this.state.panelOpen ? (
      <ChannelsPanel
        onClose={this.closePanel}
        onOpenSwarmView={this.openSwarmView}
        onOpenSettings={this.openSettings}
        onDisconnect={this.disconnect}
        currentChannel={location}
        username={this.state.user ? this.state.user.name : ""}
        requirePassword={this.state.requirePassword}
        theme={this.state.theme}
        left={this.state.leftSidePanel}
        networkName={this.state.networkName}
        joiningToChannel={this.state.joiningToChannel}
      />
    ) : ""

    return (
      <div className="App view">
        {panel}
        {header}
        {this.props.children}
      </div>
    )
  }
})

/* MAIN */
render(
  <Router history={hashHistory}>
    <Route path="/" component={App}>
      <Route path="channel/:channel" component={ChannelView}/>
      <Route path="settings" component={SettingsView}/>
      <Route path="ipfs-settings" component={IpfsSettingsView}/>
      <Route path="swarm" component={SwarmView}/>
      <Route path="connect" component={LoginView}/>
      <Route path="loading" component={LoadingView}/>
    </Route>
  </Router>
  , document.getElementById('content')
)

export default ChannelView
