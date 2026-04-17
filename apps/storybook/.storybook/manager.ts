import { addons } from 'storybook/manager-api';
import { storybookTheme } from './theme';
 
addons.setConfig({
  theme: storybookTheme,
  addons: {
    toolbar: {
      grid: {
        hidden: true,
      }
    }
  }
});