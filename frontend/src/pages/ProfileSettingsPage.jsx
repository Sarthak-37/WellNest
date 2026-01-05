// pages/ProfileSettingsPage.jsx

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { toast } from 'react-hot-toast';
import axiosInstance from '../services/axiosInstance';
import useAuthStore from '../stores/authStore'; // To get current user info
import { Lock, UserCircle, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function ProfileSettingsPage() {
    const { user, updateUser } = useAuthStore(); // Get user and a hypothetical updateUser function
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isPasswordChanging, setIsPasswordChanging] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setIsPasswordChanging(true);

        if (newPassword !== confirmNewPassword) {
            toast.error('New password and confirm new password do not match.');
            setIsPasswordChanging(false);
            return;
        }

        if (newPassword.length < 4) {
            toast.error('New password must be at least 4 characters long.');
            setIsPasswordChanging(false);
            return;
        }

        try {
            const response = await axiosInstance.post('/api/auth/change-password', {
                currentPassword,
                newPassword,
            });

            toast.success(response.data.message || 'Password changed successfully!');
            // Clear the form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error) {
            console.error('Failed to change password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password. Please try again.');
        } finally {
            setIsPasswordChanging(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar />
            <main className="flex-grow max-w-4xl mx-auto px-4 py-8 w-full">

                <div className="bg-white rounded-lg shadow-xl overflow-hidden p-6 md:p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6 border-b pb-4">
                        <UserCircle className="mr-3 h-7 w-7 text-indigo-600" />
                        Account Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        <div>
                            <p className="font-semibold text-gray-600">Name:</p>
                            <p className="text-lg capitalize">{user?.name || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600">Email:</p>
                            <p className="text-lg">{user?.email || 'Not provided'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-xl overflow-hidden p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6 border-b pb-4">
                        <Lock className="mr-3 h-7 w-7 text-indigo-600" />
                        Change Password
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <div>
                            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                id="current-password"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="new-password"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength="4"
                                autoComplete="new-password"
                            />
                            <p className="mt-2 text-xs text-gray-500">Must be at least 4 characters long.</p>
                        </div>
                        <div>
                            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirm-new-password"
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                minLength="4"
                                autoComplete="new-password"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isPasswordChanging}
                                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPasswordChanging ? (
                                    <span className="animate-pulse">Changing Password...</span>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5" />
                                        Change Password
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default ProfileSettingsPage;