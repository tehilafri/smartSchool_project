import { Provider } from 'react-redux';
import { store } from './store';
import Router from "./Router";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <Router />
      </div>
    </Provider>
  );
}

export default App;