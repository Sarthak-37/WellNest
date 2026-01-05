import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import axiosInstance from '../services/axiosInstance';
import LoadingSpinner from '../components/LoadingSpinner';
import SessionCard from '../components/SessionCard';
import SessionEditorModal from './EditSessionsPage';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const MySessionsPage = () => {
    const {user} = useAuthStore();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [processingCardId, setProcessingCardId] = useState(null);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const response = await axiosInstance.get('/api/session/my-sessions');
                setSessions(response.data);
            } catch (error) {
                console.error('Failed to load sessions:', error);
                toast.error('Failed to load sessions.');
            } finally {
                setLoading(false);
            }
        };
        loadSessions();
    }, []);

    const handleSave = (savedSession) => {
        setSessions(prev => {
            const exists = prev.some(s => s._id === savedSession._id);
            if (exists) {
                return prev.map(s => s._id === savedSession._id ? savedSession : s);
            } else {
                return [savedSession, ...prev];
            }
        });
        setShowModal(false);
        setEditingSession(null);
        toast.success(savedSession.status === 'published' ? 'Session published successfully!' : 'Session saved as draft!');
    };

    const handleAutoSave = (savedSession) => {
        setSessions(prev => {
            if (savedSession._id) {
                const exists = prev.some(s => s._id === savedSession._id);
                if (exists) {
                    return prev.map(s => s._id === savedSession._id ? savedSession : s);
                } else {
                    return [savedSession, ...prev];
                }
            }
            return prev;
        });

        if (!editingSession && savedSession._id) {
            setEditingSession(savedSession);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
            return;
        }
        setProcessingCardId(id);
        try {
            await axiosInstance.delete(`/api/session/delete/${id}`);
            setSessions(prev => prev.filter(s => s._id !== id));
            toast.success('Session deleted successfully!');
            setShowModal(false);
            setEditingSession(null);
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error(error.response?.data?.message || 'Failed to delete session.');
        } finally {
            setProcessingCardId(null);
        }
    };

    

    const handlePublish = async (id) => {
        setProcessingCardId(id);
        try {
            const { data } = await axiosInstance.patch(`/api/session/update/${id}`, { status: 'published' });
            setSessions(prev => prev.map(s => s._id === id ? data : s));
            toast.success('Session published successfully!');
        } catch (error) {
            console.error('Failed to publish session:', error);
            toast.error(error.response?.data?.message || 'Failed to publish session.');
        } finally {
            setProcessingCardId(null);
        }
    };

    const handleUnpublish = async (id) => {
        setProcessingCardId(id);
        try {
            const { data } = await axiosInstance.patch(`/api/session/update/${id}`, { status: 'draft' });
            setSessions(prev => prev.map(s => s._id === id ? data : s));
            toast.success('Session unpublished successfully!');
        } catch (error) {
            console.error('Failed to unpublish session:', error);
            toast.error(error.response?.data?.message || 'Failed to unpublish session.');
        } finally {
            setProcessingCardId(null);
        }
    };

    const handleLike = async (id) => {
        setProcessingCardId(id);
        try {
            // This POST request will now toggle like/unlike on the backend
            const { data } = await axiosInstance.post(`/api/session/like/${id}`);

            setSessions(prev =>
                prev.map(s => (s._id === data.session._id ? data.session : s))
            );

            toast.success(data.message || 'Session like status updated successfully!');

        } catch (error) {
            console.error('Failed to update like status:', error);
            toast.error(error.response?.data?.message || 'Failed to update like status.');
        } finally {
            setProcessingCardId(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">My Sessions</h1>
                <button
                    onClick={() => {
                        setEditingSession(null);
                        setShowModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusCircle className="mr-2 h-5 w-5" /> New Session
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.length === 0 && !loading ? (
                    <p className="text-center text-gray-500 col-span-full">No sessions found. Create your first one!</p>
                ) : (
                    sessions.map(session => (
                        <SessionCard
                            key={session._id}
                            session={session}
                            isEditable={true}
                            onEdit={() => {
                                setEditingSession(session);
                                setShowModal(true);
                            }}
                            onDelete={handleDelete}
                            onPublish={handlePublish}
                            onUnpublish={handleUnpublish}
                            onLike={handleLike}
                            isProcessing={processingCardId === session._id}
                            // Pass a boolean indicating if the current user has liked this session
                            hasLiked={user && session.likedBy?.includes(user.id?.toString())}
                        />
                    ))
                )}
            </div>
            
            {showModal && (
                <SessionEditorModal
                    session={editingSession}
                    mode={editingSession ? 'edit' : 'create'}
                    onClose={() => {
                        setShowModal(false);
                        setEditingSession(null);
                    }}
                    onSave={handleSave}
                    onAutoSave={handleAutoSave}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default MySessionsPage;