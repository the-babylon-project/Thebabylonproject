import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
// import Login from './components/Login';
// import MainMenu from './components/MainMenu';
// import Matchmaking from './components/Matchmaking';
// import Profile from './components/Profile';
// import Game from './game/Game';

import * as PropTypes from "prop-types";
import Splash from "./components/Splash";

// function Routes(props) {
//   return null;
// }
//
// Routes.propTypes = {children: PropTypes.node};
const App = () => {
  return (
      <div className="App">
          <header className="App-header">
              <script src="https://cdn.babylonjs.com/babylon.js"></script>
              <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
              <Splash/>
          </header>
      </div>
  );
};

export default App;

// <Router>
//   <Routes>
//     <Route exact path="/" element={<Splash/>} />
//     {/*<Route path="/login" component={Login} />*/}
//     {/*<Route path="/main-menu" component={MainMenu} />*/}
//     {/*<Route path="/matchmaking" component={Matchmaking} />*/}
//     {/*<Route path="/profile" component={Profile} />*/}
//     {/*<Route path="/game" component={Game} />*/}
//   </Routes>
// </Router>
