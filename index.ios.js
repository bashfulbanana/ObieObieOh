/////////////////////// DEPENDENCIES //////////////////////////

'use strict';
import React, {
  DatePickerIOS,
  AsyncStorage,
  Modal,
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  Image,
  Fetch,
  View,
  Picker,
  ListView,
  TextInput,
  ScrollView,
  TouchableHighlight,
  NavigatorIOS,
  TouchableOpacity,
  LayoutAnimation
} from 'react-native';

// import Modal from 'react-native-modal';

import DropDown, {
  Select,
  Option,
  OptionList,
  updatePosition
} from 'react-native-dropdown';


import {createStore} from 'redux';

////////////////// DUMMY GLOBAL VARS //////////////////////////

var ScrollableTabView = require('react-native-scrollable-tab-view');

var messages = []
// var messages = [];
var chores = [
  //{category: 'kitchen', name: 'Joey', choreName: 'eat the cheese'},
  //{category: 'Bathroom', name: 'Justin', choreName: 'buy new stall for HR'}
]

var users = ['Joey', 'Lyly', 'Justin', 'Nick'];

var finance = [{bill: "Rent", total: "$200.00"}, {bill: "Electric", total: "$50.00"}];

var bills = [{total: 200, name: 'rent', date: '2016-03-03'}, {total: 200, name: 'water', date: '2016-03-04'} ];

var billHistory = [{username: 'lyly', payer: 'Nick',total: 200, name: 'rent', date: '2016-03-03', datepaid: 'completed'}, {username: 'Justin', payer: 'Nick', total: 200, name: 'water', date: '2016-03-04', datepaid: 'completed'}];

var payments = [{username: 'lyly', payee: 'Nick',total: 200, name: 'rent', date: '2016-03-03', datepaid: null}, {username: 'Justin', payee: 'Nick', total: 200, name: 'water', date: '2016-03-04', datepaid: null}];

var billSplit = [];


var gDate;
var gUser;
var gCategory;

var border = function(color) {
  return {
    borderWidth: 4,
    borderColor: color
  }
}

////////////////////// APP (main.js) /////////////////////////

/* NOTES
need to be able to have a place where we can toggle
house code to show, func from web app below:

toggleHouseCode: function () {
  $('.toggle-house-code').toggle('slow');
},

mobile not really set up to render house name / roster
anywhere so can consider adding this in maybe above the nav?

need to consider the side bar as a whole, where will house
roster/landlord views/user image/house code appear?
*/

var App = React.createClass({
  testConnection: function() {
    fetch('http://localhost:8080/api/mobile', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        //'token': AsyncStorage.getItem('obie')
      }
    })
    .then(function(data) {
      //update state users array with response
      console.log('got data', data);
    })
    .then(function(responseData){
      console.log(responseData)
    })
    .catch(function(err) {
      console.log(err);
    })
  },

  getInitialState: function() {
    this.testConnection();
    return {
      //eventually should all be replaced by empty arrs,
      //they will be overwritten by fetch calls
      chores: chores,
      messages: messages,
      users: users,
      //below brough in from web App component
      view: 'Finances',
      houseCode: '',
      houseName: '',
      isLandlord: false,
      initialLoad: true,
      landlordHouses: []
    }
  },

  //call to get the session
  componentDidMount: function() {
    this.getSession();
  },

  getUsers: function() {
    fetch(process.env.Base_URL + '/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': AsyncStorage.getItem('obie')
      }
    })
    .then(function(users) {
      //update state users array with response
      this.setState({users: users});
    })
  },

  getUserImage: function() {
    fetch(process.env.Base_URL + '/users/images', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': AsyncStorage.getItem('obie')
      }
    })
    .then(function(url) {
      this.state.imageUrl = url[0].userImageUrl || "https://s-media-cache-ak0.pinimg.com/736x/fb/e1/cd/fbe1cdbc1b728fbb5e157375905d576f.jpg";
      this.state.name = url[0].name;
      this.setState({imageUrl: this.state.imageUrl, name: this.state.name});
    })
  },

  getSession: function() {
    AsyncStorage.removeItem('obie')
    fetch(process.env.Base_URL + '/obie/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    .then(function(session) {
      //asyncstorage is promisified
      AsyncStorage.setItem('obie', session)
        .then(function() {
          this.getUserImage();
          this.getHouseCode();
          this.getUsers();
        })
    })
  },

  getHouseCode: function() {
    fetch(process.env.Base_URL + '/housez/code', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': AsyncStorage.getItem('obie')
      }
    })
    .then(function(code) {
      this.setState({houseCode: code[0].token});
      this.setState({houseName: code[0].name});
    })
  },

  leaveHouse: function() {
    fetch(process.env.Base_URL + '/users/leave', {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': AsyncStorage.getItem('obie')
      }
    })
    .then(function(code) {
      AsyncStorage.removeItem('obie')
      .then(function() {
        //may need to be adjusted, not sure exactly what
        //this does.
        window.location.href="/registration";
      });
    })
  },

  updateTokenAfterLeaveHouse: function() {
     fetch(process.env.Base_URL + '/obie/updateLeaveHouse', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'token': AsyncStorage.getItem('obie')
      }
    })
    .then(function(token) {
      AsyncStorage.setItem('obie', token);
    })
  },

  render: function() {
    return (
      <View style={[styles.container]}>
        {/*<Navbar />
        <MessageContainer messages={this.state.messages} />*/}
        <ScrollableTabView>
          <MessageContainer messages={this.state.messages} tabLabel="Messages" />
          <FinanceContainer tabLabel="Finance"/>
          <ChoreContainer chores={this.state.chores} tabLabel="Chores" />
        </ScrollableTabView>
      </View>
    )
  }
});

/////////////////// NAVBAR /////////////////////////////////

var Navbar = React.createClass({
  render: function() {
    return (
      <View style={[styles.navbar]}>
        <Text>Navbar</Text>
      </View>
    )
  }
});


////////////////////// LOGIN ///////////////////////////

var Login = React.createClass({
  render: function() {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text onPress={this.navToApp}>Login with Venmo</Text>
      </View>
    )
  },

  navToApp: function() {
    this.props.navigator.push(App);
  },
})

//////////////////// MESSAGES //////////////////////////

/*NOTES

messages dummy data will be replaced with actual db mess.
when hooked up to the back end. Have messages array abv,
and the state will be overwritten below upon loadmessages
in getInitialState

think about adding date to message entries

when a user submits a message, the user right now is hard
coded in to be "justin" but it should be the userId pulled
from the token

clear user input text field on message submission
*/

var MessageContainer = React.createClass({
  getInitialState: function() {
    //load messages upon loading
    //var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      email: '',
      messages: messages,
      showKeyboard: false,
      userId: '',
      houseId: ''
    };
  },

  componentDidMount: function () {
    var context = this;
    AsyncStorage.getItem('email')
      .then(function(email) {
        context.setState({email: email})
        context.getHouseId(context.state.email);
      });
    //loads messages, taken from web app message container
    //socket.on('message', context.loadMessages);
  },

  getHouseId: function(email) {
    var context = this;
    fetch('http://localhost:8080/api/mobile/users/' + email, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(function(response) {
       response.json().then(function(data) {
        context.setState({houseId: data[0].HouseId, userId: data[0].id})
        context.loadMessages(context.state.houseId);
      })
    })
  },

  loadMessages: function(houseId) {
    var context = this;
    fetch('http://localhost:8080/api/mobile/messages/' + houseId, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        //'token': AsyncStorage.getItem('obie')
      }
    })
    .then(function(response) {
      response.json().then(function(data) {
        context.setState({messages: data})
      })
    })
  },

  submitMessage: function(message) {
    var context = this;
    fetch(process.env.Base_URL + '/messages', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        //'token': AsyncStorage.getItem('obie')
      },
      body: JSON.stringify(message)
    })
    .then(function(response) {
      // context.
    })
  },

  //need to remove when back end is hooked up. this is just
  //to update the dummy array.
  sendMessage: function(messageObj) {
    this.state.messages.push(messageObj);
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(this.state.messages),
      messages: this.state.messages
    })
    this.setState({
      choreName: ''
    })
  },

  //consider adding date to the message entry
  renderMessageEntry: function(rowData) {
    return (
      <View style={[styles.messageEntry]}>
        <View style={{flexDirection:'row', flex: 1}}>
          <Text style={{flex: 5, fontStyle: 'italic'}}>
            {rowData.name}
          </Text>
          <Text style={{fontStyle: 'italic'}}>
            {rowData.date}
          </Text>
        </View>
        <Text style={{fontWeight: 'bold'}}>
          {rowData.text}
        </Text>
      </View>
    )
  },

  render: function() {
    var messageList = this.state.messages.map(function(message) {
      return (
        <View style={[styles.messageEntry]}>
          <View style={{flexDirection:'row', flex: 1}}>
            <Text style={{flex: 5, fontStyle: 'italic'}}>
              {message.userId}
            </Text>
            <Text style={{fontStyle: 'italic'}}>
              {message.time}
            </Text>
          </View>
          <Text style={{fontWeight: 'bold'}}>
            {message.text}
          </Text>
        </View>
      )
    })
    return (
      <View style={[styles.messageContainer]}>
        <Text style={styles.viewTitle}>Messages</Text>
        <View style={[styles.messageContainer]}>
          {messageList}
        </View>
        <MessageForm sendMessage={this.sendMessage} />
      </View>
    )
  }
});

var MessageForm = React.createClass({
  getInitialState: function() {
    return {
      text: '',
      showKeyboard: false
    }
  },

  addMessage: function() {
    this.toggleKeyboardFalse();
    var messageObject = {
      //eventually need to replace with userId from token
      name: 'Joey Holland',
      //this is good, updated by user input
      text: this.state.text,
      date: new Date().toString().split(' ').slice(0, 4).join(' ')
    }
    this.setState({text: ''});
    this.props.sendMessage(messageObject);
    //need to consider how to clear user input field text
    //after submission
  },

  // sendMessageButton: function() {
  //   return <TouchableHighlight
  //     underlayColor="gray"
  //     onPress={this.addMessage}
  //     style={[styles.sendMessageButton]}
  //     >
  //     <Text style={{padding: 2, color: 'white'}}>
  //       Send Message
  //     </Text>
  //   </TouchableHighlight>
  // },

    sendMessageButton: function() {
      return (<Text style={{padding: 2, color: 'black', fontSize: 18, marginRight: 30}}
        onPress={this.addMessage}>
        Send
      </Text>)
    },

    renderKeyboard: function() {
      if(this.state.showKeyboard) {
        return (<View style={{height: 250}}>
        </View>)
      }
    },

  toggleKeyboardTrue: function() {
    this.setState({showKeyboard: true})
  },

  toggleKeyboardFalse: function() {
    this.setState({showKeyboard: false})
  },

  render: function() {
    return (
      <View style={[styles.formTest]}>
        <View style={{flexDirection: 'row', paddingBottom: 25}}>
          <View style={{flex: 5}}>
            <TextInput
              placeholder='Enter message...'
              onFocus={this.toggleKeyboardTrue}
              onChangeText={(text) => this.setState({text})}
              value={this.state.text}
              rejectResponderTermination={false}
              style={[styles.messageInput]}/>
          </View>
          <View style={{flex: 1, alignSelf: 'center', alignItems: 'center', marginTop: 7, marginRight: 3}}>
            {this.sendMessageButton()}
          </View>
        </View>
        {this.renderKeyboard()}
      </View>
    )
  }
});

///////////////////////// CHORES ///////////////////////////

/* NOTES

DatePickerExample, UserDrop, and CategoryDrop are the 3
components that render conditionally in our form's makeshift
navbar. need to make sure of a few things:
  -are they styled properly? right now they're rendering
  in a way so that they take over the page when clicked.
  will this translate to all phone layouts and does this
  look ok?

  -instead of normal input fields that can be set as refs,
  we have distinct components that are providing us with
  our choreform data. therefore we can't set simple refs
  like we usually would for the user input. the data is set
  in the individual dropdown/datepicker components, and
  would need to somehow be passed back up to the choreform.
  right now i have global variables that update the dropdown/
  date selection upon user interaction, and the submit chore
  method object and the choreform state reference these. need
  to determine if this is ok/best practice and if not how to
  resolve it

  -rowdata listview set up is distincly different from dealin
  with mapped li elements. need to figure out how our done status
  can be updated. have the updatestatus call hooked up to that
  button but need to figure out how to delete that particular
  row from the listview properly and how to pass the request the
  proper chore id.
*/
var DatePickerExample = React.createClass({
  getDefaultProps: function () {
    return {
      date: new Date(),
      timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60,
    };
  },

  getInitialState: function() {
    return {
      date: this.props.date,
      timeZoneOffsetInHours: this.props.timeZoneOffsetInHours,
    };
  },


  onDateChange: function(date) {
    this.setState({date: date});
    gDate = this.state.date;
  },
  onTimezoneChange: function(event) {
    var offset = parseInt(event.nativeEvent.text, 10);
    if (isNaN(offset)) {
      return;
    }
    this.setState({timeZoneOffsetInHours: offset});
  },

  render: function() {
    return (
      <View>
        <View>
          <DatePickerIOS
            date={this.state.date}
            mode="datetime"
            timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
            onDateChange={this.onDateChange}
            minuteInterval={30}
            style={[{height: 500}]}
          />
        </View>
        <View
          style={{justifyContent: 'flex-end', alignItems: 'center', marginBottom: 30}}
          >
          <Text onPress={this.props.toggleClose}>Close</Text>
        </View>
      </View>
    );
  },
});

var UserDrop = React.createClass({
  getInitialState: function() {
    return {
      user: ''
    };
  },

  componentDidMount: function() {
    updatePosition(this.refs['SELECT1']);
    updatePosition(this.refs['OPTIONLIST']);
  },

  _getOptionList: function() {
    return this.refs['OPTIONLIST'];
  },

  user: function(user) {
    this.setState({
      user: user
    });
    gUser = user;
  },

  render: function() {
    var names = users.map(function(user) {
      return user;
    })
    var userList = names.map(function(user) {
      return <Option>{user}</Option>
    })
    return (
      <View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 500}}>
          <Select
            width={250}
            ref="SELECT1"
            optionListRef={this._getOptionList}
            defaultValue="Select a User"
            onSelect={this.user}>
            {userList}
          </Select>
          <View style={{ height: 10 }}/>
          <Text>Selected User: {this.state.user}</Text>
          <OptionList ref="OPTIONLIST"/>
        </View>
        <View
          style={{justifyContent: 'flex-end', alignItems: 'center', marginBottom: 30}}
          >
          <Text onPress={this.props.toggleClose}>Close</Text>
        </View>
      </View>
    )
  }

});

var CategoryDrop = React.createClass({
  getInitialState: function() {
    return {
      category: ''
    };
  },

  componentDidMount: function() {
    updatePosition(this.refs['SELECT2']);
    updatePosition(this.refs['OPTIONLIST']);
  },

  _getOptionList: function() {
    return this.refs['OPTIONLIST'];
  },

  category: function(category) {
    this.setState({
      category: category
    });
    gCategory = category
  },

  render: function() {
    return (
      <View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: 500 }}>
          <Select
            width={250}
            ref="SELECT2"
            optionListRef={this._getOptionList}
            defaultValue="Select a Category"
            onSelect={this.category}>
            <option>Kitchen</option>
            <option>Bathroom</option>
            <option>Livingroom</option>
            <option>Bedroom</option>
            <option>Laundry</option>
            <option>Yard</option>
          </Select>
          <View style={{ height: 20 }}></View>
          <Text>Selected Category: {this.state.category}</Text>
          <OptionList ref="OPTIONLIST"/>
        </View>
        <View
          style={{justifyContent: 'flex-end', alignItems: 'center', marginBottom: 30}}
          >
          <Text onPress={this.props.toggleClose}>Close</Text>
        </View>
      </View>
    );
  }
});


var ChoreForm = React.createClass({
  getInitialState: function() {
    return {
      //need the text that the user inputs for choreName
      choreName: '',
      //need the user who will perform the chore
      user: '',
      category: '',
      date: '',
      chores: chores,
      showStatus: false,
      showDate: false,
      showUser: false,
      showCategory: false,
      showClose: false,
      showKeyboard: false
    }
  },

  renderDate: function() {
    if(this.state.showDate) {
      return <DatePickerExample toggleClose={this.toggleClose}/>
    }
  },

  renderUser: function() {
    if(this.state.showUser) {
      return <UserDrop toggleClose={this.toggleClose}/>
    }
  },

  renderCategory: function() {
    if(this.state.showCategory) {
      return <CategoryDrop toggleClose={this.toggleClose}/>
    }
  },

  toggleDate: function () {
    // this.setState({showClose: true})
    this.setState({showDate: !this.state.showDate})
    // LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  },

   toggleUser: function () {
    this.setState({showUser: !this.state.showUser})
  },

   toggleCategory: function () {
    this.setState({showCategory: !this.state.showCategory})
  },

  toggleClose: function() {
    if(this.state.showUser) {
      this.setState({showUser: !this.state.showUser})
    } else if (this.state.showCategory) {
      this.setState({showCategory: !this.state.showCategory})
    } else if (this.state.showDate) {
      this.setState({showDate: !this.state.showDate})
    }
  },

  setDateButton: function() {
    return <TouchableHighlight
      underlayColor="gray"
      onPress={this.toggleDate}
      style={[styles.setDateButton, styles.dropdown]}
      >
      <Text style={{color: 'white'}}>
        Set Date
      </Text>
    </TouchableHighlight>
  },

  setUserButton: function() {
    return <TouchableHighlight
      underlayColor="gray"
      onPress={this.toggleUser}
      style={[styles.setDateButton, styles.dropdown]}
      >
      <Text style={{color: 'white'}}>
        User
      </Text>
    </TouchableHighlight>
  },

  setCategoryButton: function() {
    return <TouchableHighlight
      underlayColor="gray"
      onPress={this.toggleCategory}
      style={[styles.setDateButton, styles.dropdown]}
      >
      <Text style={{color: 'white'}}>
        Category
      </Text>
    </TouchableHighlight>
  },

  renderKeyboard: function() {
      if(this.state.showKeyboard) {
        return (<View style={{height: 250}}>
        </View>)
      }
    },

  toggleKeyboard: function() {
    this.setState({showKeyboard: !this.state.showKeyboard})
  },


  addChore: function(houseId) {
    var choreObject = {
      name: gUser,
      category: gCategory,
      choreName: this.state.choreName,
      date: gDate.toString().split(' ').slice(0, 4).join(' '),
      completed: false
    };

    this.props.sendChore(choreObject);
  },

  sendChoreButton: function() {
    return <Text style={{padding: 2, color: 'black', fontSize: 18, marginRight: 30}}
        onPress={this.addChore}>
        Post
      </Text>
  },

  render: function() {
    return (
      <View style={{paddingTop: 10}}>
        {this.renderUser()}
        {this.renderCategory()}
        {this.renderDate()}
        <View style={styles.dropdown}>
          {this.setUserButton()}
          {this.setCategoryButton()}
          {this.setDateButton()}
        </View>
        <View style={[styles.formTest]}>
          <View style={{flexDirection: 'row', paddingBottom: 25}}>
            <View style={{flex: 5}}>
              <TextInput
              //updates state text, which will be used to submit
              //this message
              placeholder='Enter chore name...'
              onFocus={this.toggleKeyboard}
              onChangeText={(choreName) => this.setState({choreName})}
              value={this.state.choreName}
              rejectResponderTermination={false}
              style={styles.messageInput}/>
            </View>
            <View style={{flex: 1, alignSelf: 'center', alignItems: 'center', marginTop: 7, marginRight: 3}}>
              {this.sendChoreButton()}
            </View>
          </View>
        </View>
      {this.renderKeyboard()}
    </View>
    )

    // return (
    //   <View style={[styles.formTest]}>
    //     <View style={{flexDirection: 'row', paddingBottom: 25, paddingLeft: 15}}>
    //       <View style={{flex: 5}}>
    //         <TextInput
    //           onFocus={this.toggleKeyboard}
    //           onChangeText={(text) => this.setState({text})}
    //           value={this.state.text}
    //           rejectResponderTermination={false}
    //           style={[styles.messageInput]}/>
    //       </View>
    //       <View style={{flex: 1, alignSelf: 'center', alignItems: 'center', marginTop: 7, marginRight: 3}}>
    //         {this.sendMessageButton()}
    //       </View>
    //     </View>
    //     {this.renderKeyboard()}
    //   </View>
    // )
  }
});

var ChoreContainer = React.createClass({
  getInitialState: function() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      chores: chores,
      // dataSource: ds.cloneWithRows(chores),
      //will be replaced by getUsers() called on compdidmount
      users: users,
      userId: '',
      houseId: '',
      showAddButton: true
    };
  },

  componentDidMount: function () {
  var context = this;
    AsyncStorage.getItem('email')
      .then(function(email) {
        context.setState({email: email})
        context.getHouseId(context.state.email);
      });
  },

  getHouseId: function(email) {
  var context = this;
    fetch('http://localhost:8080/api/mobile/users/' + email, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(function(response) {
        response.json().then(function(data) {
        context.setState({houseId: data[0].HouseId, userId: data[0].id})
        context.loadChores(context.state.houseId);
        context.getUsers(context.state.houseId);
      })
    })
  },

  // WORKING INTERACTION WITH THE DATABASE, NOTE HOW TO
  // HANDLE PROMISE OBJECT BELOW

  loadChores: function(houseId) {
    var context = this;
    //verified that this was triggered on comp mount
    fetch('http://localhost:8080/api/mobile/chores/' + houseId, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    .then(function(response) {
        response.json().then(function(data) {
        context.setState({chores: data});
      });
    })
    .catch(function() {
      console.log('loadChores too bad');
    })
  },

    getUsers: function(houseId) {
    var context = this;
    fetch('http://localhost:8080/api/mobile/users/' + houseId, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(function(response) {
      console.log('getUsers response', response)
      response.json()
    .then(function(responseData) {
       console.log('json here?', responseData)
        context.setState({users: responseData});
      });
    })
     .catch(function() {
      console.log('getUsers too bad');
    })
  },

  //used only to update chore dummy data locally
  //REMOVE WHEN DB CONNECTION HOOKED UP
  // sendChore: function(choreObj) {
  //   this.state.chores.push(choreObj);
  //   this.setState({
  //     dataSource: this.state.dataSource.cloneWithRows(this.state.chores),
  //     chores: this.state.chores
  //   })
  //   this.toggleForm();
  //   this.setState({showAddButton: true});
  // },

  toggleForm: function() {
    this.toggleAddButton();
    this.setState({showForm: !this.state.showForm});
  },

  renderForm: function() {
    if(this.state.showForm) {
      return <ChoreForm users={this.state.users} sendChore={this.submitChore}/>
    }
  },

  toggleAddButton: function() {
    this.setState({showAddButton: !this.state.showAddButton})
  },

  renderShowAddButton: function() {
    if(this.state.showAddButton) {
      return (
        <View style={{alignItems: 'center', paddingBottom: 25, paddingTop: 10}} >
          <TouchableHighlight
            onPress={this.toggleForm}
            style={[styles.setDateButton]}>
            <Text style={{color: 'white'}}>Add Chore</Text>
          </TouchableHighlight>
        </View>
      )
    }
  },

  submitChore: function(chore) {
    //verified, receiving correct choreobj and arriving here properly
    console.log("inside submit chore", chore);
    fetch('http://localhost:8080/api/mobile/chores', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        //'token': AsyncStorage.getItem('obie')
      },
      body: JSON.stringify(chore)
    })
    .then(function(data) {
      //socket.emit('chore', chore);
    })
  },

  updateChoreStatus: function() {
    //gets to the function properly on press
    //need to get the right chore id to pass in, may not be props
    //we want to call this when an item in the chore list is completed
    //big issue is understanding listview better and being able to access
    //proper chore.
    fetch('http://localhost:8080/chores/' + this.props.chore.id, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        //'token': AsyncStorage.getItem('obie')
      }
    })
    .then(function(data) {
      //want to load the chores again, props may not be right
      this.props.loadChores();
    })
  },

  render: function() {
    var context = this;
    var choreList = this.state.chores.map(function(chore) {
      return (
        <View key={chore} style={[styles.choreEntry]}>
          <View style={[styles.choreData]}>
            <Text style={{fontStyle: 'italic', fontWeight: 'bold'}}>
              {chore.userId} ~ {chore.category}
            </Text>
            <Text>
              {chore.name}
            </Text>
            <Text>
              Complete by: {chore.dueDate}
            </Text>
          </View>
          <View style={[styles.doneButtonCont]}>
            <View style={[styles.doneButton]}>
              <Text
              style={{color: 'white'}}
              onPress={context.updateChoreStatus}>
                Done?
              </Text>
            </View>
          </View>
        </View>)
    })
    return (
      <View style={[styles.messageContainer]}>
        <Text style={styles.viewTitle}>Chores</Text>
        <View style={[styles.messageContainer]}>
          {choreList}
        </View>
        {this.renderShowAddButton()}
        {this.renderForm()}
      </View>
    )
  }
});

var Login = React.createClass({
  getInitialState: function() {
    return {
      email: '',
      password: ''
    }
  },

  navToApp: function() {
    AsyncStorage.setItem('email', this.state.email);
    //AsyncStorage.setItem('password', this.state.password);
    this.props.navigator.push({
      component: App
    });
  },

  render: function(){
    return (
        <View style={styles.navWrapper}>
          <Image
          style={{height: 80, width: 200, marginTop: 25}}
          source={require('./obie_logo_copy.png')} />
          <View style={{marginTop: 15, marginBottom: 15}}>
            <Text style={{fontSize: 24, fontStyle: 'italic'}}>Welcome Home</Text>
          </View>
          <View style={{marginTop: 10}}>
            <Text style={{justifyContent: 'center', marginBottom: 7}}>Email: </Text>
            <TextInput
            autoCapitalize='none'
            onChangeText={(email) => this.setState({email})}
            style={[styles.textInput]} />
          </View>
          <View style={{marginTop: 10}}>
            <Text style={{justifyContent: 'center', marginBottom: 7}}>Password: </Text>
            <TextInput onChangeText={(password) => this.setState({password})} secureTextEntry={true} style={[styles.textInput]} />
          </View>
          <TouchableHighlight onPress={this.navToApp} style={[styles.loginButton]}>
            <Text style={{color: 'white'}}>
              Login
            </Text>
          </TouchableHighlight>
      </View>
    );
  }
});

///////////////////// NAVIGATOR ///////////////////////

var Navigator = React.createClass ({
  render: function() {
    return (
      <NavigatorIOS
        navigationBarHidden={true}
        style={styles.navContainer}
        initialRoute={{
          component: Login,
          title: 'Obie | Welcome Home',
          passProps: { myProp: 'foo' },
      }}/>
    );
  },
});

////////////////////////////////// FINANCE CONTAINER ///////////////////////////////

var BillContainer = React.createClass({
  getInitialState: function(){
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      bills: bills,
      dataSource: ds.cloneWithRows(bills)
    }
  },

  renderBillEntry: function(rowData){
    return (
      <View style={[styles.choreEntry]}>
        <View style={[styles.choreData]}>
          <Text style={{padding: 2, fontWeight: 'bold'}}>
            Due {rowData.date}
          </Text>
        <Text style={{padding: 2, fontStyle: 'italic'}}>
          {rowData.name}: ${rowData.total}
        </Text>
        </View>
        <View style={[styles.doneButtonCont]}>
          <View style={[styles.doneButton]}>
            <Text style={{color: 'white', marginTop: 0}} >
              Pay
            </Text>
          </View>
        </View>
      </View>


    )
  },

  render: function() {
    return (
      <View style={[styles.paymentContainer]}>
        <Text style={styles.viewTitle}>Bills</Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderBillEntry}
        />
      </View>
    )
  }
})


var PaymentContainer = React.createClass({
  getInitialState: function() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    return {
      payments: payments,
      dataSource: ds.cloneWithRows(payments)
    }
  },

  renderPaymentEntry: function(rowData){
    return (
      <View style={[styles.messageEntry]}>
        <Text style={{padding: 2, fontWeight: 'bold'}}>
          {rowData.username} owes you ${rowData.total}
        </Text>
        <Text style={{padding: 2}}>
          Due {rowData.date}
        </Text>
      </View>
    )
  },

  render: function(){
    return (
      <View style={[styles.paymentContainer]}>
        <Text style={styles.viewTitle}>Payments</Text>
        <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderPaymentEntry}
        />
      </View>
    )
  }
});

var FinanceContainer = React.createClass({
  getInitialState: function() {
    return {
      bills: bills,
      payments: payments,
      showBills: true,
      showPayments: false,
      showCreateBill: false
    }
  },
  toggleBills: function() {
    this.state.showPayments ? this.setState({showPayments: false}) : this.setState({showCreateBill: false})
    this.setState({showBills: !this.state.showBills})
  },

  togglePayments: function() {
    this.state.showBills ?  this.setState({showBills: false}) : this.setState({showCreateBill: false})
    this.setState({showPayments: !this.state.showPayments})
  },
  toggleCreateBills: function() {
    this.state.showPayments ? this.setState({showPayments: false}) : this.setState({showBills: false})
    this.setState({showCreateBill: !this.state.showCreateBill})
  },

  viewBillsButton: function() {
    return <TouchableHighlight underlayColor="gray"
    onPress={this.toggleBills}
    style={[styles.finNavButtons, styles.dropdown]}
  >
    <Text style={{color: 'white'}}>Bills</Text>
    </TouchableHighlight>
  },


 viewPaymentsButton: function() {
  return <TouchableHighlight underlayColor="gray"
    onPress={this.togglePayments}
    style={[styles.finNavButtons, styles.dropdown]}
  >
    <Text style={{color: 'white'}}>Payments</Text>
    </TouchableHighlight>
 },

  viewCreateBillButton: function() {
  return <TouchableHighlight underlayColor="gray"
    onPress={this.toggleCreateBills}
    style={[styles.finNavButtons, styles.dropdown]}
  >
    <Text style={{color: 'white'}}>Create Bill</Text>
    </TouchableHighlight>
 },

 renderPayments: function() {
  if(this.state.showPayments){
    return (
      <PaymentContainer/>
    )
  }
 },


 renderBills: function() {
  if(this.state.showBills) {
    return (
    <BillContainer/>
    )
  }
 },

 renderCreateBill: function() {
  if(this.state.showCreateBill){
    return (
      <CreateBill sendBill = {this.sendBill} />
    )
  }
 },

  render: function() {
    return (
      <View style={[styles.finContainer]}>
        <View style={[styles.finBillPayContainer]}>
        {this.renderBills()}
        {this.renderPayments()}
        {this.renderCreateBill()}
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 25, paddingLeft: 10, paddingRight: 10}}>
          <View>
            {this.viewBillsButton()}
          </View>
          <View>
            {this.viewPaymentsButton()}
          </View>
          <View>
            {this.viewCreateBillButton()}
          </View>
        </View>
      </View>
    )
  }
});

var CreateBill = React.createClass({
  getInitialState: function() {
    return {
      name:'',
      total:'',
      date: gDate,
      bills: bills,
      showDate: false,
      showCustomSplit: false,
      splitEvenly: false
    }
  },

  toggleDate: function() {
    this.setState({showDate: !this.state.showDate})
  },

  renderDate: function() {
    if(this.state.showDate) {
      return <DatePickerExample toggleClose={this.toggleClose}/>
    }
  },

  setDateButton: function() {
    return <TouchableHighlight
      underlayColor="gray"
      onPress={this.toggleDate}>
      <Text>Set Date</Text>
    ></TouchableHighlight>
  },

  addBill: function() {
    var billObject = {
      name: this.state.name,
      total: this.state.total,
      date: gDate.toString().split(' ').slice(0, 4).join(' '),
    }
    bills.push(billObject);
  },

  // sendBillButton: function() {
  //   return <TouchableHighlight
  //   underlayColor='gray'
  //   onPress={this.addBill}><Text>Submit Bill</Text>
  //   </TouchableHighlight>
  // },

  toggleCustomSplit: function() {
    this.setState({showCustomSplit: !this.state.showCustomSplit})
  },

  toggleClose: function() {
    if(this.state.showDate) {
      this.setState({showDate: !this.state.showDate})
    }
    if(this.state.showCustomSplit) {
      this.setState({showCustomSplit: !this.state.showCustomSplit})
    }
  },

  renderBillInput: function() {
    return (
    <View style={{padding: 15, flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{fontSize: 18}}>Bill:</Text>
      </View>
      <View style={{flex: 6}}>
        <TextInput
        placeholder='Enter bill title...'
          onChangeText={(name) => this.setState({name})}
          value={this.state.name}
          rejectResponderTermination={false}
          style={styles.financeInput}
        />
      </View>
    </View>
    )
  },

  renderTotalInput: function() {
    return (
      <View style={{padding: 15, flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text
          style={{fontSize: 18}}>Total:</Text>
        </View>
        <View style={{flex: 6}}>
          <TextInput
            placeholder='Enter bill total...'
            onChangeText={(total) => this.setState({total})}
            value={this.state.total}
            rejectResponderTermination={false}
            style={styles.financeInput}
          />
        </View>
      </View>
    )
  },

  renderCustomSplit: function() {
    if(this.state.showCustomSplit) {
      return <CustomSplitContainer toggleClose={this.toggleClose}/>
    }
  },

  renderDateInput: function(){
    return (
      <View style={{alignItems: 'center'}} >
        <TouchableHighlight
          onPress={this.toggleDate}
          style={[styles.billDateButton]}>
          <Text style={{color: 'white'}}>Set Due Date</Text>
        </TouchableHighlight>
      </View>
    )
  },

  renderSplitEvenlyButton: function(){
    return (
      <View style={{alignItems: 'center', paddingBottom: 25, paddingTop: 10}} >
        <TouchableHighlight
          onPress={this.addBill}
          style={[styles.setDateButton]}>
          <Text style={{color: 'white'}}>Split Evenly</Text>
        </TouchableHighlight>
      </View>
    )
  },

  renderCustomSplitButton: function() {
    return (
      <View style={{alignItems: 'center', paddingBottom: 25, paddingTop: 10}} >
        <TouchableHighlight
          onPress={this.toggleCustomSplit}
          style={[styles.setDateButton]}>
          <Text style={{color: 'white'}}>Custom Split</Text>
        </TouchableHighlight>
      </View>
    )
  },

  addBillandClose: function(){
    return (
      <View>
        {this.addBill}
        {this.toggleClose}
      </View>
    )
  },

  render: function() {
    return (
      <View>
        <View style={{paddingTop: 10}}>{this.renderDate()}</View>
        <View>
          {this.renderBillInput()}
        </View>
        <View style={{marginTop: 0}}>
          {this.renderTotalInput()}
        </View>
        <View style={{padding: 10}}>
          {this.renderDateInput()}
        </View>
        <View style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-around'
        }}>
          <View>{
          this.renderSplitEvenlyButton()}
          </View>
          <Text>-- OR --</Text>
          <View>
          {this.renderCustomSplitButton()}
          </View>
        </View>
        <View>{this.renderCustomSplit()}</View>
      </View>
    )
  }
});

var CustomSplitContainer = React.createClass({
  getInitialState: function() {
    return {showKeyboard: false}
  },

  renderKeyboard: function() {
      if(this.state.showKeyboard) {
        return (<View style={{height: 250}}>
        </View>)
      }
    },

    toggleKeyboardTrue: function() {
    this.setState({showKeyboard: true})
  },

  toggleKeyboardFalse: function() {
    this.setState({showKeyboard: false})
  },

  render: function() {
  var context = this;
  var userlist = users.map(function(user) {
    return (

        <View style={{padding: 15, flexDirection: 'row', flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{fontSize: 18}}>{user}:</Text>
          </View>
          <View style={{flex: 6}}>
            <TextInput
              rejectResponderTermination={false}
              style={styles.financeInput}
            />
          </View>
        </View>
    )
  });
    return (
      <View>
        <ScrollView style={{height: 175}}>
          <View style={{padding: 1}}>{userlist}</View>
        </ScrollView>
        <View style={{flexDirection: 'row', paddingTop: 20}}>
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}} >
            <TouchableHighlight
              onPress={this.props.addBillandClose}
              style={[styles.setDateButton]}>
              <Text style={{color: 'white'}}>Submit</Text>
            </TouchableHighlight>
          </View>
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
           <Text style={{marginTop: 10, alignItems: 'center', justifyContent: 'center'}} underlayCoor="gray" onPress={this.props.toggleClose}>Close</Text>
          </View>
        </View>
        {this.renderKeyboard()}
      </View>


    )
  }
})

////////////////////// STYLES ////////////////////////////

const styles = StyleSheet.create({
  paymentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  splitForm: {
    justifyContent: 'flex-end'
  },
  finContainer: {
    flex: 1,
    alignItems: 'stretch'
  },
  finBillPayContainer: {
    flex: 9,
    alignItems: 'stretch'
  },
  finNavButtons: {
    width: 105,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#5bc0de',
    borderWidth: 1,
    borderColor: 'black',
    marginLeft: 5,
    marginRight: 5
  },
  navContainer: {
    flex: 1,
  },
  navWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 25,
    backgroundColor: '#F5F8FA'
  },
  navWelcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  container: {
    flex: 1,
    paddingTop: 25,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  navbar: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messageContainer: {
    flex: 8,
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  form: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  formTest: {
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  textInput: {
    paddingLeft: 8,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: 280,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 5
  },
  messageInput: {
    paddingLeft: 8,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: 260,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 5
  },
  financeInput: {
    paddingLeft: 8,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: 260,
    alignSelf: 'center',
    borderRadius: 5
  },
  choreInput: {
    paddingLeft: 8,
    height: 33,
    borderColor: 'gray',
    borderWidth: 1,
    width: 225,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 5
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'stretch'
  },
  sendMessageButton: {
    borderWidth: 2,
    borderColor: 'black',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5bc0de',
    margin: 10,
    borderRadius: 5
  },
  setDateButton: {
    width: 102,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#5bc0de',
    borderWidth: 1,
    borderColor: 'black',
    marginLeft: 5,
    marginRight: 5
  },

  submitButton: {
    width: 102,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#5bc0de',
    borderWidth: 1,
    borderColor: 'black',
    marginLeft: 5,
    marginRight: 5,
  },

  billDateButton: {
    width: 333,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#5bc0de',
    borderWidth: 1,
    borderColor: 'black',
    marginLeft: 5,
    marginRight: 5
  },
  viewTitle: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  dropdown: {
    flexDirection:'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5
  },
  floatView: {
    position: 'absolute',
    width: 100,
    height: 100,
    top: 200,
    left: 40,
    backgroundColor: '#5bc0de',
  },
  choreEntry: {
    flexDirection: 'row',
    marginLeft: 5,
    marginRight: 5,
    marginTop: 1,
    marginBottom: 1,
    backgroundColor: '#5bc0de'
  },
  messageEntry: {
    marginLeft: 5,
    marginRight: 5,
    marginTop: 1,
    marginBottom: 1,
    backgroundColor: 'lightgray',
    padding: 5
  },
  wrapper: {
    flex: 1,
  },
  loginButton: {
    marginTop: 30,
    borderWidth: 2,
    borderColor: 'black',
    width: 280,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5bc0de',
    borderRadius: 10
  },
  doneButtonCont: {
    flex: 1.7,
    // alignItems: 'stretch',
    // justifyContent: 'space-around',
  },
  doneButton: {
    //flex: 1,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center'
    // alignItems: 'center',
    // justifyContent: 'center'
  },
  choreData: {
    padding: 2,
    flex: 9,
    backgroundColor: 'lightgray'
  },
});

AppRegistry.registerComponent('ObieObieOh', () => Navigator);
