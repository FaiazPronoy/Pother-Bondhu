import mongoose from "mongoose";
import TeamInvite from "../models/inviteModel.js";
import Team from "../models/teamModel.js";
import userModel from "../models/userModel.js";



// Send invitations
export const sendInvitations = async (req, res) => {
  try {
    const { teamId, volunteerIds } = req.body;
    const fromUserId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(teamId) || !Array.isArray(volunteerIds) || volunteerIds.length === 0
        || volunteerIds.length > 20 || !volunteerIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Choose up to 20 volunteers to invite' });
    }

    // Verify the user is the creator of the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    if (team.creator.toString() !== fromUserId.toString()) {
      return res.status(403).json({ error: 'Only team creator can send invitations' });
    }

    // every invitee has to be a volunteer who is not you and not already in the team
    const ids = [...new Set(volunteerIds.map(String))];
    const invitees = await userModel.countDocuments({ _id: { $in: ids }, role: 'volunteer' });
    const members = new Set(team.members.map(String));
    if (invitees !== ids.length || ids.includes(String(fromUserId)) || ids.some((id) => members.has(id))) {
      return res.status(400).json({ error: 'You can only invite volunteers who are not already in the team' });
    }

    const invitations = await Promise.all(
      ids.map(async (volunteerId) => {
        // Check if invitation already exists
        const existingInvite = await TeamInvite.findOne({
          team: teamId,
          to: volunteerId,
          status: 'pending'
        });
        
        if (existingInvite) {
          return existingInvite;
        }

        return await TeamInvite.create({
          team: teamId,
          from: fromUserId,
          to: volunteerId,
          status: 'pending'
        });
      })
    );

    res.status(201).json(invitations);
  } catch (error) {
    console.error('Error in sendInvitations:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get user's pending invitations
export const getMyInvitations = async (req, res) => {
  try {
    const invites = await TeamInvite.find({ 
      to: req.userId,
      status: 'pending'
    }).populate('team from', 'name email');

    res.json(invites);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Respond to invitation
export const respondToInvitation = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Answer with accepted or rejected' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    const invite = await TeamInvite.findById(req.params.id)
      .populate('team', 'members');

    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    if (invite.to.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to respond to this invitation' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already responded' });
    }

    invite.status = status;
    await invite.save();

    if (status === 'accepted') {
      // Add user to team if accepted
      await Team.updateOne({ _id: invite.team._id }, { $addToSet: { members: invite.to } });
    }

    res.json(invite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};