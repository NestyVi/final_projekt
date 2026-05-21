import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ 
          flex: 1, 
          marginLeft: '245px', 
          display: 'flex', 
          flexDirection: 'column' 
      }}>
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;