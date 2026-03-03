import User from "../models/User.js";
import admin from "../config/firebase-admin.js";

// Get all users with pagination and filters
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      role = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Build query
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Role filter
    if (role && ["user", "admin"].includes(role)) {
      query.role = role;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = order === "asc" ? 1 : -1;

    // Execute query with pagination
    const users = await User.find(query)
      .select("-__v")
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Convert to plain JS objects for better performance

    // Get total count
    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const userCount = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Users registered in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Total resumes generated
    const resumeStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalResumes: { $sum: "$resumesGenerated" },
          avgResumesPerUser: { $avg: "$resumesGenerated" },
        },
      },
    ]);

    // Provider breakdown
    const providerStats = await User.aggregate([
      {
        $group: {
          _id: "$provider",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          admins: adminCount,
          regularUsers: userCount,
          active: activeUsers,
          inactive: inactiveUsers,
        },
        growth: {
          last7Days: weeklyUsers,
          last30Days: recentUsers,
        },
        resumes: {
          total: resumeStats[0]?.totalResumes || 0,
          average: Math.round(resumeStats[0]?.avgResumesPerUser || 0),
        },
        providers: providerStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user' or 'admin'",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from demoting themselves
    if (
      user.firebaseUid === req.user.firebaseUid &&
      role === "user"
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot demote yourself from admin",
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

// Toggle user active status
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deactivating themselves
    if (user.firebaseUid === req.user.firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (user.firebaseUid === req.user.firebaseUid) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Delete from MongoDB
    await user.deleteOne();

    // Optionally: Delete from Firebase Auth as well
    try {
      await admin.auth().deleteUser(user.firebaseUid);
      console.log(`🗑️ Deleted user from Firebase Auth: ${user.firebaseUid}`);
    } catch (firebaseError) {
      console.error("Firebase delete error:", firebaseError);
      // Continue even if Firebase delete fails
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// Get recent user activity
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentUsers = await User.find()
      .select("name email photo lastLogin createdAt role")
      .sort({ lastLogin: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      recentActivity: recentUsers,
    });
  } catch (error) {
    console.error("Get recent activity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity",
    });
  }
};