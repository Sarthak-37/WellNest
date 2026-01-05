import Session from "../models/Session.js";

// Get all published sessions (public) with search functionality
export const getAllPublishedSessions = async (req, res) => {
  try {
    const { search } = req.query; // Extract search term from query parameters

    let query = { status: 'published' };
    if (search) {
      // Create a case-insensitive regex for title or tags
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } } // Search within the tags array
      ];
    }

    const sessions = await Session.find(query)
      .populate('user_id', 'name email') // Populate creator details
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.json(sessions);
  } catch (err) {
    console.error("Error in getAllPublishedSessions:", err); // Log the error
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// Get logged-in user's sessions
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user_id: req.user._id })
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params; // Get the session ID from the URL parameters

    // Find the session and populate the user_id field to get creator's name and email
    const session = await Session.findById(id).populate('user_id', 'name email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Error fetching session by ID:', error);
    // Handle specific CastError if ID format is invalid
    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid session ID format.' });
    }
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// Create new session
export const createSession = async (req, res) => {

  const session = new Session({
    ...req.body,
    user_id: req.user._id
  });

  try {
    const newSession = await session.save();
    res.status(201).json(newSession);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a session
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      req.body,
      { new: true }
    ).populate('user_id', 'name email');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};



export const likeSession = async (req, res) => {
  const userId = req.user._id; //  auth middleware sets req.user.id
  const { id } = req.params; // Session ID from the URL parameter

  try {
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    let updatedSession;

    // Check if the user has already liked this session
    if (session.likedBy.includes(userId)) {
      // If already liked, UNLIKE IT: Decrement likes and remove user ID
      updatedSession = await Session.findByIdAndUpdate(
        id,
        {
          $inc: { likes: -1 },         // Atomically decrements the 'likes' count by 1
          $pull: { likedBy: userId }  // Removes the user's ID from the 'likedBy' array
        },
        {
          new: true,
          runValidators: true
        }
      ).populate('user_id', 'name email');;
      return res.status(200).json({ message: 'Session unliked successfully.', session: updatedSession }); 
    } else {
      // If not liked, LIKE IT: Increment likes and add user ID
      updatedSession = await Session.findByIdAndUpdate(
        id,
        {
          $inc: { likes: 1 },         // Atomically increments the 'likes' count by 1
          $push: { likedBy: userId }  // Adds the user's ID to the 'likedBy' array
        },
        {
          new: true,
          runValidators: true
        }
      ).populate('user_id', 'name email');;
      return res.status(200).json({ message: 'Session liked successfully.', session: updatedSession });
    }
  } catch (error) {
    console.error('Error processing like/unlike for session:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};


// Delete a session
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


