/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from './components/AdminLayout';
import { PendingDevices } from './pages/PendingDevices';
import { Overview } from './pages/Overview';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { ServerPage } from './pages/ServerPage';
import { GroupsPage } from './pages/GroupsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <Overview />;
      case 'pending': return <PendingDevices />;
      case 'groups': return <GroupsPage />;
      case 'server': return <ServerPage />;
      case 'users': return <UsersPage />;
      case 'settings': return <SettingsPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
      default: return <Overview />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}
