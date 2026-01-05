import { Link } from 'react-router-dom';
import { PlayCircle, Heart, Clock, UserIcon, Edit, Trash2, Eye, Upload } from 'lucide-react';

const SessionCard = ({
    session,
    isEditable = false,
    onEdit = () => {},
    onPublish = () => {},
    onUnpublish = () => {},
    onDelete = () => {},
    onLike = () => {},
    isProcessing = false,
    hasLiked = false
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
            {/* Status Bar (only visible if editable) */}
            {isEditable && (
                <div className={`p-3 flex justify-between items-center text-sm font-medium ${
                    session.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                    <span className={`px-2 py-0.5 rounded-full ${
                        session.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {session.status === 'published' ? 'Published' : 'Draft'}
                    </span>

                    <div className="text-gray-500">
                        <Clock className="inline-block h-3.5 w-3.5 mr-1 align-middle" />
                        <span className="align-middle">
                            {new Date(session.updatedAt || session.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            )}

            {/* Session Image or Placeholder */}
            <div className="h-48 bg-gray-100 overflow-hidden relative group">
                {session.imageUrl ? (
                    <img
                      src={session.imageUrl}
                      alt={session.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://flimp.net/wp-content/uploads/2024/06/Why-Employee-Wellness-Is-Good-for-Business-Benefits-and-ROI.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                      <PlayCircle className="h-16 w-16 text-gray-300" />
                    </div>
                  )}

                 {/* Overlay for quick view on hover for non-editable cards */}
                 {!isEditable && (
                    <Link
                        to={`/sessions/${session._id}`}
                        className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label={`View ${session.title}`}
                    >
                        <Eye className="h-10 w-10 text-white animate-pulse" />
                    </Link>
                )}
            </div>

            {/* Session Content */}
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-800 leading-tight pr-2 line-clamp-2">
                        {session.title}
                    </h3>
                    {/* Like button and count */}
                    <button
                        onClick={() => onLike(session._id)}
                        disabled={isProcessing}
                        className="flex items-center text-sm text-gray-500 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-2"
                        aria-label={hasLiked ? "Unlike session" : "Like session"}
                    >
                        <Heart
                            className={`h-5 w-5 mr-1 ${
                                hasLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'
                            } transition-all duration-200`}
                        />
                        <span className="text-base font-medium">{session.likes}</span>
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                    {session.description || 'No description available.'}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-3">
                    <UserIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span className="font-medium">{session.user_id?.name || 'Anonymous'}</span>
                </div>

                {/* Tags section with line-clamp */}
                {session.tags && session.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 overflow-hidden" style={{ maxHeight: '3.5rem' }}> {/* Adjusted height for 2 lines of tags */}
                        {session.tags.map(tag => (
                            <span key={tag} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4 mt-auto"> {/* mt-auto pushes buttons to the bottom */}
                {isEditable ? (
                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            to={`/sessions/${session._id}`}
                            className="flex items-center justify-center py-2.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors duration-200"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                        </Link>

                        <button
                            onClick={onEdit}
                            disabled={isProcessing}
                            className="flex items-center justify-center py-2.5 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </button>

                        {session.status === 'published' ? (
                            <button
                                onClick={() => onUnpublish(session._id)}
                                disabled={isProcessing}
                                className="flex items-center justify-center py-2.5 bg-gray-50 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors duration-200 w-full col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2 transform rotate-180" />
                                        Unpublish
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => onPublish(session._id)}
                                disabled={isProcessing}
                                className="flex items-center justify-center py-2.5 bg-green-50 text-green-600 rounded-md text-sm font-medium hover:bg-green-100 transition-colors duration-200 w-full col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Publish
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => onDelete(session._id)}
                            disabled={isProcessing}
                            className="flex items-center justify-center py-2.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors duration-200 w-full col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    // Default view for non-editable cards (e.g., on a public sessions page)
                    <Link
                        to={`/sessions/${session._id}`}
                        className="w-full flex items-center justify-center py-2.5 bg-indigo-600 text-white rounded-md text-base font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-md"
                    >
                        <PlayCircle className="h-5 w-5 mr-2" />
                        View Session
                    </Link>
                )}
            </div>
        </div>
    );
};

export default SessionCard;