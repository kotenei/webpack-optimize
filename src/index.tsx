import React from "react";
import ReactDOM from "react-dom";
import { hot } from "react-hot-loader/root";

const Main = () => {
  return <div>Hello World</div>;
};

const App = hot(Main);

ReactDOM.render(<App />, document.getElementById("root"));
