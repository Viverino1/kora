import React from 'react';
import { LuHouse, LuSearch, LuSettings } from 'react-icons/lu';

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../providors/AuthProvidor';
import Search from './Search';
import Button from './Button';
export default function SideBar(): React.JSX.Element {
  const location = useLocation();
  const { user } = useAuth();
  return (
    <>
      {!location.pathname.includes('/watch') && (
        <>
          <Search />
          <nav className="draggable w-14 h-full border-r p-3 flex flex-col justify-between z-40 bg-gradient-to-r from-background to-background/75 backdrop-blur-3xl">
            <div className="space-y-3 flex flex-col items-center">
              <NavBarItem link="/" icon={LuHouse} isActive={location.pathname === '/'} />
              <NavBarItem disabled tooltip="Press TAB!" link="/" icon={LuSearch} />
            </div>
            <div className="space-y-3 flex flex-col items-center pb-0.5">
              <NavBarItem link="/settings" icon={LuSettings} isActive={location.pathname === '/settings'} />
              <button
                //onClick={() => auth.continueWithGoogle()}
                className="no-drag w-full aspect-square rounded-full overflow-clip flex items-center justify-center hover:text-text-light transition-all duration-300"
              >
                <img src={user?.pfp ?? undefined} alt="PFP" className="select-none pointer-events-none" />
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

function NavBarItem({
  link,
  icon: Icon,
  isActive = false,
  tooltip,
  disabled = false
}: {
  link: string;
  icon: React.ElementType;
  isActive?: boolean;
  tooltip?: string;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Link
      to={link}
      className={`group relative no-drag w-full aspect-square rounded-lg flex items-center justify-center ${
        !disabled ? 'hover:text-text-light' : 'focus:ring-0'
      } transition-all duration-300 ${isActive ? 'text-text-light' : ''}`}
    >
      <Icon className="w-5 h-5" />
      {tooltip && (
        <Button
          className="absolute group-hover:opacity-100 opacity-0"
          variant="chip"
          style={{ transform: 'translateX(calc(50% + 36px))' }}
        >
          {tooltip}
        </Button>
      )}
    </Link>
  );
}
