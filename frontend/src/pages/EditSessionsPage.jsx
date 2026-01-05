import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    X, Save, Upload, Trash2, Youtube, Loader2, CheckCircle, AlertCircle,
    Image, Clock
} from 'lucide-react';
import axiosInstance from '../services/axiosInstance'; // Assuming axiosInstance is properly configured
import toast from 'react-hot-toast'; // For consistent toast notifications

const SessionEditorModal = ({
    session, // No default null here; it comes from parent
    onClose,
    onSave, // Callback when a session is successfully saved/published (and closes modal)
    onAutoSave, // Callback for auto-save updates (keeps modal open)
    onDelete, // New callback for delete action
    mode // 'edit' or 'create', directly passed
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        youtube_url: '',
        imageUrl: '',
        tags: '',
        status: 'draft' // Default to draft for new sessions or initial state
    });
    const [currentMode, setCurrentMode] = useState(mode); // Internal state to manage mode
    const [isLoading, setIsLoading] = useState(true); // Set to true initially to fetch session data if in edit mode
    const [isSaving, setIsSaving] = useState(false); // New state for showing specific saving indicator
    const [saveStatusMessage, setSaveStatusMessage] = useState(''); // 'Saving...', 'Saved!', 'Error saving.'
    const [errors, setErrors] = useState({});

    // Ref to hold the auto-save timer
    const autoSaveTimerRef = useRef(null);
    // Ref to track if there are unsaved changes
    const hasUnsavedChangesRef = useRef(false);

    useEffect(() => {
        // When modal opens or session prop changes
        if (session) {
            setFormData({
                title: session.title || '',
                description: session.description || '',
                youtube_url: session.youtube_url || '',
                imageUrl: session.imageUrl || '',
                tags: (session.tags || []).join(', '),
                status: session.status || 'draft'
            });
            setCurrentMode('edit'); // Ensure mode is 'edit' if a session is provided
            setIsLoading(false); // Done loading initial session data
        } else { // mode is 'create'
            setFormData({
                title: '',
                description: '',
                youtube_url: '',
                imageUrl: '',
                tags: '',
                status: 'draft'
            });
            setCurrentMode('create'); // Ensure mode is 'create'
            setIsLoading(false); // No data to load for new session
        }
        hasUnsavedChangesRef.current = false; // Reset unsaved changes flag when session data is loaded/initialized
        setErrors({}); // Clear errors on session load/init
        setSaveStatusMessage(''); // Clear save message
    }, [session, mode]); // Depend on session and mode prop changes

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));

        // Mark as having unsaved changes
        hasUnsavedChangesRef.current = true;
        setSaveStatusMessage('Unsaved changes...'); // Indicate changes exist
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required.';
        if (!formData.youtube_url.trim()) newErrors.youtube_url = 'YouTube URL is required.';
        // Basic URL validation
        try {
            new URL(formData.youtube_url);
        } catch (_) {
            newErrors.youtube_url = 'Please enter a valid URL.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Auto-save function, memoized with useCallback
    const performAutoSave = useCallback(async () => {
        // Only auto-save if there are actual changes
        if (!hasUnsavedChangesRef.current) {
            return;
        }

        // Prevent auto-saving an empty new form without essential content (title or url)
        if (currentMode === 'create' && !formData.title.trim() && !formData.youtube_url.trim()) {
            return;
        }

        setIsSaving(true);
        setSaveStatusMessage('Saving draft...');
        setErrors({}); // Clear previous errors on auto-save attempt

        try {
            const dataToSave = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                status: 'draft' // Always save as draft for auto-save
            };

            let response;
            if (currentMode === 'create') { // If it's a truly new session (no _id yet)
                response = await axiosInstance.post('/api/session/create', dataToSave);
                // After successful creation, the new session object will have an _id.
                // Call onAutoSave to update the parent's state and effectively switch to 'edit' mode for this session.
                onAutoSave({ ...response.data, isNewSession: true });
            } else { // It's an existing session being edited
                response = await axiosInstance.patch(`/api/session/update/${session._id}`, dataToSave);
                onAutoSave(response.data); // Update the parent's session state
            }

            setSaveStatusMessage('Draft saved!');
            hasUnsavedChangesRef.current = false; // Reset changes flag
            toast.success('Draft saved automatically!', { id: 'auto-save-toast', duration: 1500 });
        } catch (error) {
            console.error('Auto-save failed:', error);
            setSaveStatusMessage('Error saving draft.');
            toast.error('Auto-save failed!', { id: 'auto-save-toast', duration: 3000 });
        } finally {
            setIsSaving(false);
            // Clear the status message after a short delay if it's not an error
            if (setSaveStatusMessage !== 'Error saving draft.') {
                 setTimeout(() => setSaveStatusMessage(''), 3000);
            }
        }
    }, [formData, currentMode, session, onAutoSave]); // Dependencies for useCallback

    // Effect for debounced auto-save
    useEffect(() => {
        // Clear any existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Set a new timer if there are unsaved changes
        if (hasUnsavedChangesRef.current) {
            autoSaveTimerRef.current = setTimeout(() => {
                performAutoSave();
            }, 5000); // 5 seconds of inactivity
        }

        // Cleanup: clear timer when component unmounts or dependencies change
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [formData, performAutoSave]); // Re-run effect when formData changes to reset timer

    const handleSubmit = async (publish = false) => {
        // Validate for publish action only, or if essential fields are missing for a draft save
        if (publish && !validateForm()) {
            toast.error('Please correct the errors in the form before publishing.');
            return;
        }
        // If saving draft, ensure at least title is present for initial save if new session
        if (!publish && currentMode === 'create' && !formData.title.trim()) {
            toast.error('A title is required to save a new draft.');
            setErrors(prev => ({...prev, title: 'Title is required to save draft.'}));
            return;
        }

        setIsLoading(true); // Use isLoading for full explicit save/publish action
        setSaveStatusMessage(publish ? 'Publishing...' : 'Saving...');

        try {
            const dataToSave = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                status: publish ? 'published' : 'draft' // Set status based on button clicked
            };

            let response;
            if (currentMode === 'create') {
                response = await axiosInstance.post('/api/session/create', dataToSave);
            } else {
                response = await axiosInstance.patch(`/api/session/update/${session._id}`, dataToSave);
            }

            hasUnsavedChangesRef.current = false; // Mark as saved by explicit action
            toast.success(publish ? 'Session published successfully!' : 'Session saved as draft!');
            onSave(response.data); // Notify parent of successful save/publish and trigger modal close
            // onClose() is handled by onSave in MySessionsPage for consistency
        } catch (error) {
            console.error('Save/Publish failed:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save session.';
            setErrors({ submit: errorMessage });
            toast.error(errorMessage);
            setSaveStatusMessage('Error saving.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setSaveStatusMessage(''), 3000); // Clear message
        }
    };

    const handleDeleteClick = async () => {
        if (!session || !session._id) {
            toast.error('Cannot delete: Session ID is missing.');
            return;
        }

        if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
            setIsLoading(true);
            try {
                // Assuming onDelete prop handles the actual API call and state update in parent
                await onDelete(session._id);
                // The parent will close the modal after successful deletion
            } catch (error) {
                console.error('Failed to delete session:', error);
                // Error message handled by onDelete in parent or here if preferred
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Show loading spinner for full-screen operations like initial data fetch
    if (isLoading && !isSaving) { // Only show full loading spinner for initial fetch
        return (
            <div className="fixed inset-0 bg-slate-800/30 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                    <p className="text-lg font-medium text-gray-700">Loading session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-800/30 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {currentMode === 'create' ? 'Create New Session' : `Edit Session: ${session?.title || 'Untitled'}`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6 flex-grow">
                    {errors.submit && (
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {errors.submit}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                            placeholder="e.g., Morning Yoga Flow"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="A brief description of your session"
                        />
                    </div>

                    {/* YouTube URL */}
                    <div>
                        <label htmlFor="youtube_url" className="block text-sm font-medium text-gray-700 mb-1">
                            YouTube Video URL <span className="text-red-500">*</span>
                        </label>
                        <div className="flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                <Youtube className="h-5 w-5 text-red-600" />
                            </span>
                            <input
                                type="text"
                                id="youtube_url"
                                name="youtube_url"
                                value={formData.youtube_url}
                                onChange={handleChange}
                                className={`flex-1 block w-full rounded-none rounded-r-md px-3 py-2 border ${errors.youtube_url ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                                placeholder="e.g., https://www.youtube.com/watch?v=xxxxxxxxxxx"
                            />
                        </div>
                        {errors.youtube_url && (
                            <p className="mt-1 text-sm text-red-600">{errors.youtube_url}</p>
                        )}
                        {formData.youtube_url && !errors.youtube_url && (
                            <div className="mt-4 aspect-video w-full rounded-lg overflow-hidden shadow-md">
                                {(() => {
                                try {
                                    const url = new URL(formData.youtube_url);
                                    let videoId = null;

                                    if (url.hostname.includes('youtu.be')) {
                                    // Shortened link: youtu.be/VIDEO_ID
                                    videoId = url.pathname.split('/')[1];
                                    } else if (url.hostname.includes('youtube.com')) {
                                    if (url.pathname === '/watch') {
                                        // Standard link: youtube.com/watch?v=VIDEO_ID
                                        videoId = url.searchParams.get('v');
                                    } else if (url.pathname.startsWith('/embed/')) {
                                        // Embed link: youtube.com/embed/VIDEO_ID
                                        videoId = url.pathname.split('/')[2];
                                    } else if (url.pathname.startsWith('/shorts/')) {
                                        // Shorts link: youtube.com/shorts/VIDEO_ID
                                        videoId = url.pathname.split('/')[2];
                                    }
                                    }

                                    if (videoId) {
                                    return (
                                        <iframe
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                        ></iframe>
                                    );
                                    }
                                } catch (e) {
                                    console.error('YouTube URL Error:', e);
                                }
                                return null;
                                })()}
                            </div>
                            )}

                    </div>

                    {/* Thumbnail Image URL */}
                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                            Thumbnail Image URL
                        </label>
                        <div className="flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                <Image className="h-5 w-5 text-blue-600" />
                            </span>
                            <input
                                type="text"
                                id="imageUrl"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                className={`flex-1 block w-full rounded-none rounded-r-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                                placeholder="e.g., https://unsplash.com/photos/your-image.jpg"
                            />
                        </div>
                        {formData.imageUrl && (
                            <div className="mt-4 w-48 h-32 rounded-lg overflow-hidden shadow-md border border-gray-200">
                                <img src={formData.imageUrl} alt="Session Thumbnail" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., meditation, yoga, quick"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center sticky bottom-0 z-10">
                    <div className="flex items-center text-sm text-gray-600 mb-3 sm:mb-0">
                        {isSaving ? (
                            <span className="flex items-center text-blue-500">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {saveStatusMessage}
                            </span>
                        ) : saveStatusMessage === 'Draft saved!' ? (
                            <span className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" /> {saveStatusMessage}
                            </span>
                        ) : saveStatusMessage.includes('Error') ? (
                            <span className="flex items-center text-red-600">
                                <AlertCircle className="h-4 w-4 mr-2" /> {saveStatusMessage}
                            </span>
                        ) : (
                            <span className="flex items-center text-gray-500">
                            </span>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        {currentMode === 'edit' && (
                            <button
                                onClick={handleDeleteClick}
                                disabled={isLoading || isSaving}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </button>
                        )}

                        <button
                            onClick={() => handleSubmit(false)} // Save as Draft
                            disabled={isLoading || isSaving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save className="h-4 w-4 mr-2" /> Save Draft
                        </button>

                        <button
                            onClick={() => handleSubmit(true)} // Publish
                            disabled={isLoading || isSaving || !formData.title.trim() || !formData.youtube_url.trim()} // Disable publish if required fields are empty
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Upload className="h-4 w-4 mr-2" /> Publish
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionEditorModal;