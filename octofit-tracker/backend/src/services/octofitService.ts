import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = input as Record<string, unknown>;
  
  // Validate required fields
  if (!body.userId || !body.teamId || !body.type || body.minutes === undefined) {
    const error = new Error('Missing required fields: userId, teamId, type, minutes');
    Object.assign(error, { status: 400 });
    throw error;
  }

  // Validate that userId and teamId are valid ObjectIds
  if (!mongoose.Types.ObjectId.isValid(body.userId as string)) {
    const error = new Error('Invalid userId format');
    Object.assign(error, { status: 400 });
    throw error;
  }
  if (!mongoose.Types.ObjectId.isValid(body.teamId as string)) {
    const error = new Error('Invalid teamId format');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const userId = new mongoose.Types.ObjectId(body.userId as string);
  const teamId = new mongoose.Types.ObjectId(body.teamId as string);

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    Object.assign(error, { status: 400 });
    throw error;
  }

  // Verify team exists
  const team = await Team.findById(teamId);
  if (!team) {
    const error = new Error('Team not found');
    Object.assign(error, { status: 400 });
    throw error;
  }

  // Compute points from minutes (1 point per minute)
  const points = Number(body.minutes);
  
  // Create activity
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: body.type,
    minutes: body.minutes,
    points,
    occurredAt: body.occurredAt || new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = input as Record<string, unknown>;
  
  // Validate required fields
  if (!body.name || !body.mascot) {
    const error = new Error('Missing required fields: name, mascot');
    Object.assign(error, { status: 400 });
    throw error;
  }

  // Validate and convert members array if provided
  let members: mongoose.Types.ObjectId[] = [];
  if (body.members) {
    const memberArray = body.members as unknown[];
    for (const memberId of memberArray) {
      if (!mongoose.Types.ObjectId.isValid(memberId as string)) {
        const error = new Error('Invalid member ID format');
        Object.assign(error, { status: 400 });
        throw error;
      }
      members.push(new mongoose.Types.ObjectId(memberId as string));
    }
  }

  // Create team
  const team = await Team.create({
    name: body.name,
    mascot: body.mascot,
    members,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const results = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $sort: { totalPoints: -1 },
    },
    {
      $project: {
        teamName: '$teamData.name',
        totalPoints: 1,
        _id: 0,
      },
    },
  ]);

  // Add 1-based rank to results
  return results.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  // Find user by email
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    const error = new Error('User not found');
    Object.assign(error, { status: 404 });
    throw error;
  }

  // Get recent activities for this user to determine focus preference
  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .lean();

  // Determine the best workout focus
  // Priority 1: Match user's fitness goal
  // Priority 2: Match recent activity types
  let preferredFocus: string | null = null;
  let reason: string | null = null;

  if (user.fitnessGoal) {
    // Try to match user's fitness goal
    const workoutByGoal = await Workout.findOne({ focus: user.fitnessGoal }).lean();
    if (workoutByGoal) {
      preferredFocus = user.fitnessGoal;
      reason = `Matches your ${user.fitnessGoal} goal`;
    }
  }

  // If no match by goal, try to find workout matching recent activity
  if (!preferredFocus && recentActivities.length > 0) {
    const recentActivityType = recentActivities[0].type;
    // Map activity types to workout focuses (e.g., 'run' -> 'endurance', 'strength' -> 'strength')
    const focusMap: Record<string, string> = {
      run: 'endurance',
      cycle: 'endurance',
      strength: 'strength',
      walk: 'endurance',
    };
    const suggestedFocus = focusMap[recentActivityType];
    if (suggestedFocus) {
      const workoutByActivity = await Workout.findOne({ focus: suggestedFocus }).lean();
      if (workoutByActivity) {
        preferredFocus = suggestedFocus;
        reason = `Builds on recent ${recentActivityType} activity`;
      }
    }
  }

  // Get all workouts and prioritize by preferred focus
  const allWorkouts = await Workout.find().lean();

  if (allWorkouts.length === 0) {
    return [];
  }

  // Sort: preferred focus first, then return all
  const sorted = allWorkouts.sort((a, b) => {
    if (preferredFocus) {
      const aMatch = a.focus === preferredFocus ? 0 : 1;
      const bMatch = b.focus === preferredFocus ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    return 0;
  });

  // Add reason to first suggestion
  if (sorted.length > 0 && reason) {
    return [{ ...sorted[0], reason }, ...sorted.slice(1)];
  }

  return sorted;
}

export { User };
