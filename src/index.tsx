import React from 'react';
import ReactDOM from 'react-dom';
import loadable from '@loadable/component';
import { hot } from 'react-hot-loader/root';

import './index.scss';

const Layout = loadable(() => import('./components/layout'));

const Main = () => {
  return (
    <div>
      Hello <Layout />
    </div>
  );
};

const App = hot(Main);

ReactDOM.render(<App />, document.getElementById('root'));
