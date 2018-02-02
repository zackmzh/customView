import PropTypes from 'prop-types';
import React from 'react';
import {
  Image,
  Easing,
  Animated,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ViewPropTypes,
  View,
  Text,
  DeviceEventEmitter
} from 'react-native';
import Sound from 'react-native-sound';
import MapView from 'react-native-maps';

import Icon from "../components/Icon";

import color from "../src/style/color";
import commonStyles from "../src/style/common";
import fontStyles from "../src/style/font";

import Storage from "../api/hiveel-Storage";
import UploadService from "../api/hiveel-UploadService";

var sound;

export default class CustomView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selfUserId: '',
      voicePlaying: false,
      // uploadFail: false,
    }
    this.play = this
      .play
      .bind(this);
  }

  componentDidMount() {
    this.handleUserId();
    this.subscription = DeviceEventEmitter.addListener('voicePlayFromOtherView', () => {
      if (this.state.voicePlaying) {
        this.setState({
          voicePlaying: false
        }, () => {
          sound.stop();
        })
      }
    })
    // this.failedMessageSubscription = DeviceEventEmitter.addListener("Uploadfailmessage", (res) =>{
    //   if(res.localUrl === this.props.currentMessage.audio){
    //     this.setState({uploadFail: true})
    //   }
    // })
  }

  componentWillUnmount() {
    this
      .subscription
      .remove();
  }

  async play() {
    setTimeout(() => {
      if(this.props.currentMessage.audioBase64){
        sound = new Sound(this.props.currentMessage.audio, '', (error) => {
          if (error) {
            console.log('failed to load the sound', error);
          }
        });
      }else{
        sound = new Sound(UploadService.site + this.props.currentMessage.audio, '', (error) => {
          if (error) {
            console.log('failed to load the sound', error);
          }
        });
      }


      setTimeout(() => {
        sound.play((success) => {
          if (success) {
            console.log('successfully finished playing');
            this.setState({voicePlaying: false});
          } else {
            console.log('playback failed due to audio decoding errors');
          }
        });
      }, 100);
    }, 100);
  }

  async stop() {
    sound.stop();
  }

  render() {
    if (this.props.currentMessage.location) {
      return (
        <TouchableOpacity
          style={[styles.container, this.props.containerStyle]}
          onPress={() => {
          const url = Platform.select({ios: `http://maps.apple.com/?ll=${this.props.currentMessage.location.latitude},${this.props.currentMessage.location.longitude}`, android: `http://maps.google.com/?q=${this.props.currentMessage.location.latitude},${this.props.currentMessage.location.longitude}`});
          Linking
            .canOpenURL(url)
            .then(supported => {
              if (supported) {
                return Linking.openURL(url);
              }
            })
            .catch(err => {
              console.error('An error occurred', err);
            });
        }}>
          <View style={{
            borderRadius: 10,
            flex: 10
          }}>
            <Text numberOfLines={1} style={{
              flex: 2
            }}>{this.props.currentMessage.location.latitude}, {this.props.currentMessage.location.longitude}</Text>
            <MapView
              style={[styles.mapView, this.props.mapViewStyle]}
              region={{
              latitude: this.props.currentMessage.location.latitude,
              longitude: this.props.currentMessage.location.longitude,
              latitudeDelta: 0.0111111,
              longitudeDelta: 0.0111111
            }}>
              <MapView.Marker
                coordinate={{
                latitude: this.props.currentMessage.location.latitude,
                longitude: this.props.currentMessage.location.longitude
              }}
                title={"title"}
                description={"description"}/>
            </MapView>
          </View>

        </TouchableOpacity>

      );
    } else if (this.props.currentMessage.audio) {
      if (this.props.currentMessage.user._id === this.state.selfUserId) {
        return (
          <View>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
              DeviceEventEmitter.emit('voicePlayFromOtherView', '');
              if (!this.state.voicePlaying) {
                this.setState({
                  voicePlaying: true
                }, () => {
                  this.play();
                })
              } else {
                this.setState({
                  voicePlaying: false
                }, () => {
                  this.stop();
                });
              }
            }}
              style={{
              flexDirection: "row",
              paddingTop: 5,
              paddingBottom: 5,
              paddingLeft: 10,
              paddingRight: 10
            }}>
              <Text style={{
                color: color.WHITE
              }}>{this.props.currentMessage.audioDuration}''
              </Text>
              <View
                style={{
                flexDirection: "row",
                alignSelf: 'flex-end'
              }}>
                {!this.state.voicePlaying
                  ? <Icon
                      name={"volume-large"}
                      color={color.WHITE}
                      size={17}
                      style={{
                      transform: [
                        {
                          rotate: '180deg'
                        }
                      ]
                    }}/>
                  : <Image
                    source={require('../src/voicePlay.gif')}
                    style={{
                    transform: [
                      {
                        rotate: '180deg'
                      }
                    ],
                    width: 17,
                    height: 17
                  }}/>
}

              </View>
            </TouchableOpacity>
          </View>
        )
      } else {
        return (
          <View>
            <TouchableOpacity
              onPress={() => {
              if (!this.state.voicePlaying) {
                this.setState({
                  voicePlaying: true
                }, () => {
                  this.play();
                })
              } else {
                this.setState({
                  voicePlaying: false
                }, () => {
                  this.stop();
                });
              }
            }}
              style={{
              flexDirection: "row",
              paddingTop: 5,
              paddingBottom: 5,
              paddingLeft: 10,
              paddingRight: 10
            }}>

              <View
                style={{
                flexDirection: "row",
                alignSelf: 'flex-start'
              }}>
                {!this.state.voicePlaying
                  ? <Icon name={"volume-large"} color={color.WHITE} size={17}/>
                  : <Image
                    source={require('../src/voicePlay.gif')}
                    style={{
                    width: 17,
                    height: 17
                  }}/>
}

              </View>
              <Text style={{
                color: color.WHITE
              }}>
                {this.props.currentMessage.audioDuration}''</Text>
            </TouchableOpacity>
          </View>
        )
      }
    }
    return null;
  }

  async handleUserId() {
    this.setState({
      selfUserId: 'MEMBER' + await Storage.get('userId')
    }, () => {});
  }
}

const styles = StyleSheet.create({
  mapView: {
    flex: 8,
    width: 160,
    height: 100,
    borderRadius: 6
  }
});

CustomView.defaultProps = {
  currentMessage: {},
  containerStyle: {},
  mapViewStyle: {}
};

CustomView.propTypes = {
  currentMessage: PropTypes.object,
  containerStyle: ViewPropTypes.style,
  mapViewStyle: ViewPropTypes.style
};