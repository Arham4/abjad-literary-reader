import { render } from 'solid-js/web';
import '@fontsource/noto-nastaliq-urdu/400.css';
import '@fontsource/noto-nastaliq-urdu/700.css';
import '@fontsource/gulzar/400.css';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import './styles/app.css';
import App from './App';

const root = document.getElementById('root');
if (root) {
  render(() => <App />, root);
}
