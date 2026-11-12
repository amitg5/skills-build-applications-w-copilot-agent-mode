import { isValidObjectId, Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function parseRequiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
}

function parseObjectId(value: unknown, field: string) {
  if (typeof value !== 'string' || !isValidObjectId(value)) {
    throw badRequest(`Invalid ${field}`);
  }
  return new Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const payload = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const userId = parseObjectId(payload.userId, 'userId');
  const teamId = parseObjectId(payload.teamId, 'teamId');
  const type = parseRequiredString(payload.type, 'type');
  const minutes = Number(payload.minutes);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('minutes must be a positive number');
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw badRequest('userId must reference an existing user');
  }

  const teamExists = await Team.exists({ _id: teamId });
  if (!teamExists) {
    throw badRequest('teamId must reference an existing team');
  }

  const occurredAt = new Date();
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt,
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const payload = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const name = parseRequiredString(payload.name, 'name');
  const mascot = parseRequiredString(payload.mascot, 'mascot');
  const members = Array.isArray(payload.members) ? payload.members : [];

  const memberIds = members.map((member) => parseObjectId(member, 'member'));
  const team = await Team.create({ name, mascot, members: memberIds });
  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = parseRequiredString(userEmail, 'userEmail').toLowerCase();
  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const focusOrder = [...new Set([user.fitnessGoal, ...recentActivities.map((activity) => activity.type).filter(Boolean)])]
    .map((focus) => typeof focus === 'string' ? focus.trim() : '')
    .filter(Boolean)
    .map((focus) => focus.toLowerCase());

  let workouts = await Workout.find({ focus: { $in: focusOrder.map((focus) => new RegExp(`^${focus}$`, 'i')) } }).lean();
  if (workouts.length === 0) {
    workouts = await Workout.find().lean();
  }

  const priority = new Map(focusOrder.map((focus, index) => [focus.toLowerCase(), index]));
  const sorted = [...workouts].sort((left, right) => {
    const a = (priority.get(String(left.focus).toLowerCase()) ?? Number.MAX_SAFE_INTEGER);
    const b = (priority.get(String(right.focus).toLowerCase()) ?? Number.MAX_SAFE_INTEGER);
    return a - b || String(left.title).localeCompare(String(right.title));
  });

  return sorted.map((workout) => {
    const focus = String(workout.focus ?? '');
    const recentMatch = recentActivities.find((activity) => activity.type && activity.type.toLowerCase() === focus.toLowerCase());
    let reason = `Matches your ${user.fitnessGoal} goal`;
    if (recentMatch) {
      reason = `Builds on your recent ${recentMatch.type} activity and ${user.fitnessGoal} goal`;
    } else if (user.fitnessGoal && focus.toLowerCase() === String(user.fitnessGoal).toLowerCase()) {
      reason = `Matches your ${user.fitnessGoal} goal`;
    } else {
      reason = `Supports your ${user.fitnessGoal} focus with a ${focus} pattern`;
    }

    return {
      ...workout,
      reason,
    };
  });
}

export { User };
