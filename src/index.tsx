import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './login';
import Create from './create';
import Test from './test';
import HomeBalance from './homeBalance';
import Settings from './settings';
import QrCode from './QrCode';
import Networks from './settingsList/networks';
import SendToken from './pages/SendToken';
import SwapToken from './pages/SwapToken';
import Backup from './settingsList/backup';
import AddNetworkPage from './settingsList/addNetwork';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/HomeBalance" element={<HomeBalance />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create" element={<Create />} />
        <Route path="/test" element={<Test />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/QrCode" element={<QrCode />} />
        <Route path="/Networks" element={<Networks />} />
        <Route path="/send" element={<SendToken />} />
        <Route path="/swap" element={<SwapToken />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/addNetwork" element={<AddNetworkPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
