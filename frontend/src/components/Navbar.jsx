import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ChevronDown, LayoutDashboard, LogOut, Settings, PlusCircle, Search } from 'lucide-react'; // Added PlusCircle and Search
import useAuthStore from '../stores/authStore';
import { toast } from 'react-hot-toast';

function Navbar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); // Ref for closing dropdown on outside click

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully!'); // Provide feedback on logout
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white shadow-lg py-1 px-6 sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo/Brand */}
                <Link to="/dashboard" className="text-2xl lg:text-3xl font-extrabold text-indigo-700 hover:text-indigo-800 transition-colors">
                    WellNest
                </Link>

                {/* User Profile and Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="true"
                    >
                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200">
                            <span className="text-indigo-700 font-bold text-lg">
                                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <span className="text-gray-800 font-medium text-base hidden sm:block">
                            {user?.name || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 transform origin-top-right animate-fade-in-down">
                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                Signed in as <span className="font-semibold block">{user?.email || 'Guest'}</span>
                            </div>
                            {/* You can add a link to a profile settings page here */}
                            <Link
                                to="/profile-settings"
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <Settings className="mr-3 h-4 w-4" />
                                Profile Settings
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 border-t border-gray-100 mt-1"
                            >
                                <LogOut className="mr-3 h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Navbar;