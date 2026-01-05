import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, Bell, User as UserIcon, Heart, PlayCircle,
    PlusCircle, Bookmark, Clock, Edit, Trash2
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import axiosInstance from '../services/axiosInstance'; // Import axiosInstance
import toast from 'react-hot-toast'; // Import toast for notifications

// Dashboard Components
import SessionCard from '../components/SessionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import MySessionsPage from './MySessionsPage'; // This component will handle its own data
import Navbar from '../components/Navbar';

const DashboardPage = () => {
    const { user, logout } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
    const [allSessions, setAllSessions] = useState([]);
    const [processingCardId, setProcessingCardId] = useState(null); // For like/unlike
    const navigate = useNavigate();

    // Function to fetch all published sessions
    const fetchAllPublishedSessions = useCallback(async () => {
        try {
            setIsLoading(true); // Keep loading true for all sessions tab
            // Append searchTerm as a query parameter for backend filtering
            const response = await axiosInstance.get(`/api/session/get-all-sessions?search=${searchTerm}`);
            setAllSessions(response.data);
        } catch (error) {
            console.error('Failed to fetch all published sessions:', error);
            toast.error('Failed to load public sessions.');
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm]); // Re-run when searchTerm changes

    // Fetch dashboard data on component mount and when searchTerm changes (for 'all' tab)
    useEffect(() => {
        if (activeTab === 'all') {
            fetchAllPublishedSessions();
        }
    }, [activeTab, fetchAllPublishedSessions]); // Also re-fetch if activeTab changes to 'all'

    // Handle like/unlike for sessions displayed in 'All Sessions' tab
    const handleLikeUnlike = async (sessionId) => {
        setProcessingCardId(sessionId);
        try {
            // Send the request to your dedicated like/unlike endpoint
            const response = await axiosInstance.post(`/api/session/like/${sessionId}`);

            // The backend is now sending { message: '...', session: updatedSession }
            // We need to extract the session object from the response.data
            const updatedSession = response.data.session;
            const message = response.data.message; // Get the message from backend

            // Update the allSessions state with the modified session
            setAllSessions(prevSessions =>
                prevSessions.map(sess =>
                    sess._id === updatedSession._id ? updatedSession : sess
                )
            );
            toast.success(message); // Display the message from backend
        } catch (error) {
            console.error('Failed to like/unlike session:', error);
            toast.error(error.response?.data?.message || 'Failed to update like status.');
        } finally {
            setProcessingCardId(null);
        }
    };

    

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Navbar />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'all'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            All Sessions
                        </button>
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'my'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            My Sessions
                        </button>
                    </nav>
                </div>

                {/* Search Bar (Only for All Sessions tab) */}
                {activeTab === 'all' && (
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            name="search"
                            id="search"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search sessions by title or tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                {/* Sessions Display */}
                {activeTab === 'all' ? (
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Wellness Sessions</h2>
                        {isLoading ? ( 
                             <LoadingSpinner />
                        ) : allSessions.length === 0 ? (
                            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                                <p className="text-gray-500">No sessions found matching your search.</p>
                                <p className="text-gray-400 text-sm mt-2">Try a different keyword or check back later!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {allSessions.map(session => ( // Use `allSessions` here, as filtering is done on backend
                                    <SessionCard
                                        key={session._id}
                                        session={session}
                                        isEditable={false} // Public sessions are not editable from here
                                        onLike={handleLikeUnlike}
                                        hasLiked={user && session.likedBy && session.likedBy.includes(user.id)} // Check if current user liked it
                                        isProcessing={processingCardId === session._id}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <section>
                        <MySessionsPage />
                    </section>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;