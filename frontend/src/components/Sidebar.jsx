import React from 'react';
import { 
  MdDashboard, 
  MdFolder, 
  MdTerminal, 
  MdStorage, 
  MdHardware,
  MdNetworkCheck,
  MdMiscellaneousServices,
  MdOutlet,
  MdSecurity,
  MdPalette,
  MdSettings,
  MdViewInAr,
  MdDescription,
  MdSpeed
} from 'react-icons/md';
import { RiServerLine } from 'react-icons/ri';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
    { id: 'files', label: 'File Manager', icon: MdFolder },
    { id: 'terminal', label: 'Terminal', icon: MdTerminal },
    { id: 'database', label: 'Database', icon: MdStorage },
    { id: 'storage', label: 'Storage', icon: MdHardware },
    { id: 'network', label: 'Network', icon: MdNetworkCheck },
    { id: 'services', label: 'Web Services', icon: MdMiscellaneousServices },
    { id: 'ports', label: 'Port Manager', icon: MdOutlet },
    { id: 'security', label: 'Security Center', icon: MdSecurity },
    { id: 'docker', label: 'Docker Manager', icon: MdViewInAr },
    { id: 'logs', label: 'Log Manager', icon: MdDescription },
    { id: 'performance', label: 'Performance Monitor', icon: MdSpeed },
    { id: 'tailwind-demo', label: 'Tailwind Demo', icon: MdPalette },
    { id: 'settings', label: 'Settings', icon: MdSettings }
  ];

  return (
    <div className="w-20 h-screen bg-gradient-to-b from-slate-800 to-slate-700 text-white py-5 fixed left-0 top-0 shadow-xl z-50 flex flex-col items-center">
      {/* Logo/Header */}
      <div className="text-3xl mb-10 p-2.5 rounded-xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-lg">
        <RiServerLine className="text-white" />
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-2.5 flex-1">
        {menuItems.map(item => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`
                w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer 
                transition-all duration-200 text-xl relative group hover:scale-105
                ${activeTab === item.id 
                  ? 'bg-blue-500/30 border-2 border-blue-500/50 shadow-lg shadow-blue-500/30' 
                  : 'border-2 border-transparent hover:bg-white/10 hover:shadow-md'
                }
              `}
            >
              <IconComponent className="w-6 h-6" />
              
              {/* Tooltip */}
              <div className="absolute left-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm 
                            opacity-0 group-hover:opacity-100 transition-all duration-200 
                            pointer-events-none whitespace-nowrap z-50 shadow-lg
                            before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 
                            before:-translate-x-1 before:border-4 before:border-transparent 
                            before:border-r-gray-900">
                {item.label}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Status Indicator */}
      <div className="w-3 h-3 bg-green-500 rounded-full mb-5 animate-pulse shadow-lg shadow-green-500/50"></div>
    </div>
  );
};

export default Sidebar;
