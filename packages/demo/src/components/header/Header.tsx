import { ReactElement } from 'react';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import cupcakeLogo from '../../assets/img/cupcakes.png';
import styled from '@emotion/styled';

const Img = styled('img')`
  width: 32px;
`;

export const Header = (): ReactElement => {
  return (
    <AppBar position="static" color="transparent">
      <Toolbar>
        <IconButton size="large" edge="start" color="inherit" aria-label="menu">
          <Img src={cupcakeLogo} />
        </IconButton>
        <Typography variant="h6" component="div" mr={4}>
          Cupcakes
        </Typography>
        <Typography>Docs</Typography>
      </Toolbar>
    </AppBar>
  );
};
