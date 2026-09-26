import mongoose from 'mongoose';
import escapeRegex from '../utils/escapeRegex.js';
import Team from '../models/teamModel.js';
import TeamInvite from "../models/inviteModel.js";
import userModel from "../models/userModel.js";


export const createTeam = async (req, res) => {
  try {
    const { teamName, location, teamType, description } = req.body;
    const name = String(teamName || '').trim();

    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ message: "Only volunteers can start a team" });
    }
    if (!name || name.length > 60) {
      return res.status(400).json({ message: "Give the team a name (up to 60 characters)" });
    }
    if (teamType && !['Rescue', 'Medical', 'Other'].includes(teamType)) {
      return res.status(400).json({ message: "Unknown team type" });
    }

    const team = await Team.create({
      name,
      area: String(location || '').slice(0, 60),
      description: String(description || '').slice(0, 500),
      creator: req.userId,
      members: [req.userId], 
      category: teamType || 'Rescue',
    });

    res.json(team);
  } catch (err) {
    console.error("Team creation error:", err);
    res.status(500).json({ error: "Failed to create team" });
  }
};

export const postTeamActivity = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { message } = req.body;

    const text = String(message || '').trim();
    if (!text || text.length > 280) {
      return res.status(400).json({ error: "Write an update of up to 280 characters" });
    }
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found" });
    if (!team.members.some((m) => m.toString() === req.userId)) {
      return res.status(403).json({ error: "Only team members can post updates" });
    }

    team.activities.push({ message: text });
    await team.save();

    res.json(team.activities);
  } catch (err) {
    res.status(500).json({ error: "Failed to post update" });
  }
};

export const getMyTeams = async (req, res) => {
  try {
    // teams the user started or has joined
    const teams = await Team.find({ members: req.userId }).lean();

    if (!teams || teams.length === 0) {
      return res.json([]);
    }

    // Get all unique user IDs from teams (creator  members)
    const userIds = new Set();
    teams.forEach(team => {
      if (team.creator) userIds.add(team.creator.toString());
      if (team.members && Array.isArray(team.members)) {
        team.members.forEach(member => userIds.add(member.toString()));
      }
    });

    // Fetch all users in a single query
    const users = await userModel.find(
      { _id: { $in: Array.from(userIds) } },
      { name: 1, email: 1 }
    ).lean();

    // Create a map for quick lookups
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    // Manually populate the teams
    const populatedTeams = teams.map(team => {
      // Populate creator
      if (team.creator && userMap[team.creator.toString()]) {
        team.creator = {
          _id: team.creator,
          name: userMap[team.creator.toString()].name
        };
      } else {
        team.creator = { _id: team.creator, name: "Unknown User" };
      }

      // Populate members
      if (team.members && Array.isArray(team.members)) {
        team.members = team.members.map(memberId => {
          const member = userMap[memberId.toString()];
          return member ?
            { _id: memberId, name: member.name, email: member.email } :
            { _id: memberId, name: "Unknown User", email: "unknown@example.com" };
        });
      } else {
        team.members = [];
      }

      return team;
    });

    res.json(populatedTeams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ message: "Error fetching teams", error: err.message });
  }
};


export const getAllTeams = async (req, res) => {
  try {
    const { type = '' } = req.query;
    const filter = {};
    if (type) filter.category = new RegExp(`^${escapeRegex(type)}$`, 'i'); // exact, case-insensitive
    const teams = await Team.find(filter)
      .populate('creator', 'name')
      .populate('members', 'name')
      .lean();
    res.status(200).json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ message: 'Error fetching teams', error: err.message });
  }
};

export const listTeams = async (req, res) => {
  try {
    const raw = (req.query.search || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip = (page - 1) * limit;
    const type = (req.query.type || '').trim();

    let query = {};
    let useText = false; // only true when we actually use $text

    if (raw) {
      const words = raw.split(/\s+/).filter(Boolean).map(escapeRegex);

      if (words.length === 1) {
        // 1 word -> fuzzy regex
        const w = words[0];
        query = {
          $or: [
            { name: { $regex: w, $options: 'i' } },
            { slug: { $regex: w, $options: 'i' } },
            { area: { $regex: w, $options: 'i' } },
          ],
        };
      } else {
        // many words -> ALL words must match somewhere (AND of ORs)
        query = {
          $and: words.map((w) => ({
            $or: [
              { name: { $regex: w, $options: 'i' } },
              { slug: { $regex: w, $options: 'i' } },
              { area: { $regex: w, $options: 'i' } },
            ],
          })),
        };
      }
    

      // If you prefer exact phrase for multi-word, comment out the AND block above
      // and use this instead:
      // useText = true;
      // query = { $text: { $search: `"${raw}"` } };
    }
    if (type) {
     query.category = new RegExp(`^${escapeRegex(type)}$`, 'i'); // exact type
    }

    const findQuery = Team.find(query);

    // Only apply textScore sort/select when using $text
    if (useText) {
      findQuery.sort({ score: { $meta: 'textScore' } })
               .select({ score: { $meta: 'textScore' } });
    } else {
      findQuery.sort(raw ? { createdAt: -1 } : { createdAt: -1 });
    }

    const [items, total] = await Promise.all([
      findQuery.skip(skip).limit(limit),
      Team.countDocuments(query),
    ]);

    res.json({ items, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getTeamByKey = async (req, res) => {
  try {
    const rawKey = (req.params.key || '').trim();

    if (!rawKey) {
      return res.status(400).json({ message: 'Missing team key' });
    }

    const populate = [
      { path: 'creator', select: 'name' },
      { path: 'members', select: 'name' }
    ];

    // 1) Try custom id and slug first (string fields)
    let team =
      (await Team.findOne({ id: rawKey }).populate(populate)) ||
      (await Team.findOne({ slug: rawKey }).populate(populate));

    // 2) If key looks like an ObjectId, try _id explicitly in multiple ways
    if (!team && mongoose.Types.ObjectId.isValid(rawKey)) {
      try {
        // a) findById (casting)
        team = await Team.findById(rawKey).populate(populate);
      } catch (_) { /* ignore */ }

      if (!team) {
        try {
          // b) direct match on _id
          team = await Team.findOne({ _id: rawKey }).populate(populate);
        } catch (_) { /* ignore */ }
      }

      if (!team) {
        try {
          // c) cast to ObjectId and match (some drivers prefer explicit cast)
          const oid = new mongoose.Types.ObjectId(rawKey);
          team = await Team.findOne({ _id: oid }).populate(populate);
        } catch (_) { /* ignore */ }
      }
    }

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    return res.json({ team });
  } catch (err) {
    console.error('[getTeamByKey] error:', err);
    return res.status(500).json({ message: err.message });
  }
};