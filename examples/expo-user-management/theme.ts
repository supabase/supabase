import {extendTheme} from 'native-base';
import {Platform} from 'react-native';

export const theme = extendTheme({
  colors: {
    primary: {
      50: '#dffef2',
      100: '#b9f3de',
      200: '#91ebc9',
      300: '#68e1b5',
      400: '#40d9a0',
      500: '#26bf86',
      600: '#1a9569',
      700: '#0c6a4a',
      800: '#01412c',
      900: '#00170c',
    },
  },
  components: {
    Text: {
      baseStyle: {},
      defaultProps: {},
      variants: {
        error: {
          color: 'red.500',
          py: 1,
        },
      },
      sizes: {},
    },
    Badge: {
      defaultProps: {
        rounded: 8,
        px: 4,
        mr: 2,
      },
    },
    Box: {
      defaultProps: {},
    },
    Input: {
      baseStyle: ({colorMode}) => {
        return {
          padding: Platform.OS === 'ios' ? 4 : 2,
          borderColor: colorMode === 'dark' ? 'gray.800' : 'gray.300',
          backgroundColor: colorMode === 'dark' ? 'gray.800' : 'white',
        };
      },
    },
  },
  config: {
    useSystemColorMode: true,
  },
});
