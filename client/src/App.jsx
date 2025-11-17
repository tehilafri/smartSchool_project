import { Provider } from 'react-redux';
import { store } from './store';
import Router from "./Router";
import ErrorNotification from './components/ErrorNotification';
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        {console.log(import.meta.env.VITE_NODE_URL)}
        <Router />
        <ErrorNotification />
      </div>
    </Provider>
  );
}

export default App;