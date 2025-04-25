import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Dashboard from './components/Dashboard';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Switch>
          <Route exact path="/" component={Dashboard} />
          <Route path="*">
            <Redirect to="/" />
          </Route>
        </Switch>
      </Router>
    </ThemeProvider>
  );
}

export default App; 