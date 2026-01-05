
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Heart, ArrowLeft } from 'lucide-react'; // Youtube icon is not needed for a button
import useAuthStore from '../stores/authStore';

const SessionDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuthStore();
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                setIsLoading(true);
                const response = await axiosInstance.get(`/api/session/get-session/${id}`); // Using the correct API URL
                setSession(response.data);
            } catch (error) {
                console.error('Failed to fetch session details:', error);
                toast.error(error.response?.data?.message || 'Failed to load session details.');
                setSession(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchSession();
        }
    }, [id]);

    const handleLikeUnlike = async () => {
        if (!session) return;
        setIsLiking(true);
        try {
            const response = await axiosInstance.post(`/api/session/like/${session._id}`);
            const updatedSession = response.data.session;
            const message = response.data.message;
            setSession(updatedSession);
            toast.success(message || 'Like status updated successfully!');
        } catch (error) {
            console.error('Failed to like/unlike session:', error);
            toast.error(error.response?.data?.message || 'Failed to update like status.');
        } finally {
            setIsLiking(false);
        }
    };

    // Helper function to extract YouTube video ID from various URL formats
    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        let videoId = null;
        try {
            const parsedUrl = new URL(url);

            // Standard YouTube watch links
            if (parsedUrl.hostname.includes('youtube.com') && parsedUrl.pathname === '/watch') {
                videoId = parsedUrl.searchParams.get('v');
            }
            // Shortened YouTube links
            else if (parsedUrl.hostname.includes('youtu.be')) {
                videoId = parsedUrl.pathname.split('/')[1];
            }
            // Embed links
            else if (parsedUrl.hostname.includes('youtube.com') && parsedUrl.pathname.startsWith('/embed/')) {
                videoId = parsedUrl.pathname.split('/')[2];
            }
            // YouTube Shorts links
            else if (parsedUrl.hostname.includes('youtube.com') && parsedUrl.pathname.startsWith('/shorts/')) {
                videoId = parsedUrl.pathname.split('/')[2];
            }
            // Attempt to parse googleusercontent.com proxy URLs
            else if (parsedUrl.hostname.includes('googleusercontent.com') && url.includes('youtube.com')) {
                const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                 if (match) {
                    videoId = match[1];
                }
            }
            // Fallback for any other valid YouTube URL pattern (redundant but safe)
            if (!videoId) {
                const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (match) {
                    videoId = match[1];
                }
            }

        } catch (e) {
            console.error('Invalid YouTube URL provided:', url, e);
        }
        return videoId;
    };


    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="flex-grow max-w-4xl mx-auto px-6 py-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Session Not Found</h1>
                    <p className="text-gray-600 mb-6">The session you are looking for does not exist or has been removed.</p>
                    <Link to="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back to Dashboard
                    </Link>
                </main>
            </div>
        );
    }

    const hasLiked = user && session.likedBy && session.likedBy.includes(user.id);
    const creatorName = session.user_id?.name || 'Unknown Creator';
    const videoId = getYouTubeVideoId(session.youtube_url); // Get video ID once

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar />
            <main className="flex-grow max-w-5xl lg:max-w-7xl mx-auto px-4 py-8 md:px-6 w-full">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                    {/* 1. Image (or Placeholder if no image) */}
                    <div className="relative w-full h-80 bg-gray-200 overflow-hidden">
                        {session.imageUrl ? (
                            <img
                            src={session.imageUrl}
                            alt={session.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://flimp.net/wp-content/uploads/2024/06/Why-Employee-Wellness-Is-Good-for-Business-Benefits-and-ROI.png";
                            }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg bg-gray-200">
                                No Image Available
                            </div>
                        )}
                    </div>

                    <div className="p-6 md:p-8 lg:p-10">
                        {/* 2. Title and Like */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                                {session.title}
                            </h1>
                            <button
                                onClick={handleLikeUnlike}
                                disabled={isLiking}
                                className="flex items-center text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:ml-4 shrink-0"
                                aria-label={hasLiked ? "Unlike session" : "Like session"}
                            >
                                <Heart
                                    className={`h-9 w-9 mr-3 ${
                                        hasLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'
                                    } transition-all duration-200`}
                                />
                                <span className="text-3xl font-bold text-gray-700">{session.likes}</span>
                            </button>
                        </div>

                        {/* 3. Creator Info */}
                        <p className="text-base text-gray-600 mb-8">
                            Created by <span className="font-semibold text-indigo-700">{creatorName}</span>
                        </p>

                        {/* 4. Tags */}
                        {session.tags && session.tags.length > 0 && (
                            <div className="mb-8 border-b border-gray-200 pb-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Tags</h2>
                                <div className="flex flex-wrap gap-3">
                                    {session.tags.map((tag, index) => (
                                        <span key={index} className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 shadow-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. Description */}
                        <div className="mb-8 border-b border-gray-200 pb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">About This Session</h2>
                            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                                {session.description || 'No detailed description available for this session.'}
                            </p>
                        </div>

                        {/* 6. Video Embed (if available) */}
                        {videoId && (
                            <div className="mb-8 border-b border-gray-200 pb-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Video</h2>
                                <div className="aspect-video w-full bg-gray-900 flex items-center justify-center rounded-lg overflow-hidden">
                                    <iframe
                                        // Using the standard YouTube embed URL
                                        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                </div>
                            </div>
                        )}

                        {/* 7. Other Data (Dates) */}
                        <div className="text-sm text-gray-500 pt-4">
                            <p className="mb-1">Published: {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString()}</p>
                            <p>Last Updated: {new Date(session.updatedAt).toLocaleDateString()} at {new Date(session.updatedAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SessionDetailPage;