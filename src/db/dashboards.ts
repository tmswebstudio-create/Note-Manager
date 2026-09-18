import { db } from './index.ts';
import { users, dashboards, dashboardMembers, categories, resources } from './schema.ts';
import { eq, and, or, sql, desc } from 'drizzle-orm';
import { MemberRole } from '../types.ts';

// Helper to generate a clean 6-character uppercase alphanumeric code
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DASH-${code}`;
}

// Link pending invites and ensure user has at least one dashboard
export async function ensureUserDefaultDashboard(userId: number, email: string) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Link any invitations matching this email that don't have userId yet
  await db.update(dashboardMembers)
    .set({ 
      userId, 
      status: 'active' 
    })
    .where(and(
      sql`LOWER(${dashboardMembers.email}) = ${cleanEmail}`,
      or(sql`${dashboardMembers.userId} IS NULL`, eq(dashboardMembers.status, 'invited'))
    ));

  // 2. Check if user already owns or belongs to any dashboard
  const userMemberships = await db.select({
    dashboardId: dashboardMembers.dashboardId,
  })
  .from(dashboardMembers)
  .where(or(
    eq(dashboardMembers.userId, userId),
    sql`LOWER(${dashboardMembers.email}) = ${cleanEmail}`
  ))
  .limit(1);

  if (userMemberships.length > 0) {
    return;
  }

  // 3. User has no dashboard yet -> Create their primary dashboard
  const dashboardId = `dash_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const inviteCode = generateInviteCode();

  await db.transaction(async (tx) => {
    await tx.insert(dashboards).values({
      id: dashboardId,
      name: 'My Workspace',
      ownerId: userId,
      inviteCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(dashboardMembers).values({
      dashboardId,
      userId,
      email: cleanEmail,
      role: 'owner',
      status: 'active',
      createdAt: new Date(),
    });
  });
}

// Check if user has access to dashboard and their role
export async function checkDashboardAccess(dashboardId: string, userId: number, email: string): Promise<{
  hasAccess: boolean;
  role: MemberRole;
  isOwner: boolean;
  dashboard?: any;
}> {
  const cleanEmail = email.trim().toLowerCase();

  // Check dashboard exists
  const dashList = await db.select().from(dashboards).where(eq(dashboards.id, dashboardId)).limit(1);
  if (dashList.length === 0) {
    return { hasAccess: false, role: 'viewer', isOwner: false };
  }
  const dashboard = dashList[0];

  if (dashboard.ownerId === userId) {
    return { hasAccess: true, role: 'owner', isOwner: true, dashboard };
  }

  // Check member entry
  const memberList = await db.select().from(dashboardMembers).where(
    and(
      eq(dashboardMembers.dashboardId, dashboardId),
      or(
        eq(dashboardMembers.userId, userId),
        sql`LOWER(${dashboardMembers.email}) = ${cleanEmail}`
      )
    )
  ).limit(1);

  if (memberList.length === 0) {
    return { hasAccess: false, role: 'viewer', isOwner: false };
  }

  const member = memberList[0];
  const role = (member.role as MemberRole) || 'editor';
  return { hasAccess: true, role, isOwner: role === 'owner', dashboard };
}

// Get all dashboards accessible to user
export async function getUserDashboards(userId: number, email: string) {
  const cleanEmail = email.trim().toLowerCase();

  // Ensure default dashboard exists
  await ensureUserDefaultDashboard(userId, cleanEmail);

  // Fetch all dashboard IDs user is member of or owns
  const memberships = await db.select({
    dashboardId: dashboardMembers.dashboardId,
    role: dashboardMembers.role,
  })
  .from(dashboardMembers)
  .where(or(
    eq(dashboardMembers.userId, userId),
    sql`LOWER(${dashboardMembers.email}) = ${cleanEmail}`
  ));

  const dashIds = Array.from(new Set(memberships.map(m => m.dashboardId)));
  if (dashIds.length === 0) {
    return [];
  }

  // Get dashboard details with owner info
  const allDashboards = await db.select({
    id: dashboards.id,
    name: dashboards.name,
    ownerId: dashboards.ownerId,
    ownerEmail: users.email,
    inviteCode: dashboards.inviteCode,
    createdAt: dashboards.createdAt,
    updatedAt: dashboards.updatedAt,
  })
  .from(dashboards)
  .leftJoin(users, eq(dashboards.ownerId, users.id))
  .where(sql`${dashboards.id} IN ${dashIds}`)
  .orderBy(desc(dashboards.updatedAt));

  // Get member counts for each dashboard
  const counts = await db.select({
    dashboardId: dashboardMembers.dashboardId,
    count: sql<number>`count(*)`.mapWith(Number),
  })
  .from(dashboardMembers)
  .where(sql`${dashboardMembers.dashboardId} IN ${dashIds}`)
  .groupBy(dashboardMembers.dashboardId);

  const countMap = new Map<string, number>();
  counts.forEach(c => countMap.set(c.dashboardId, c.count));

  const roleMap = new Map<string, MemberRole>();
  memberships.forEach(m => roleMap.set(m.dashboardId, (m.role as MemberRole) || 'editor'));

  return allDashboards.map(d => {
    const isOwner = d.ownerId === userId;
    const role = isOwner ? 'owner' : (roleMap.get(d.id) || 'editor');
    return {
      id: d.id,
      name: d.name,
      ownerId: d.ownerId,
      ownerEmail: d.ownerEmail || undefined,
      inviteCode: d.inviteCode,
      role,
      isOwner,
      memberCount: countMap.get(d.id) || 1,
      createdAt: d.createdAt?.getTime() || Date.now(),
      updatedAt: d.updatedAt?.getTime() || Date.now(),
    };
  });
}

// Create new dashboard
export async function createDashboard(userId: number, email: string, name: string) {
  const cleanEmail = email.trim().toLowerCase();
  const dashboardId = `dash_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  const inviteCode = generateInviteCode();

  await db.transaction(async (tx) => {
    await tx.insert(dashboards).values({
      id: dashboardId,
      name: name.trim() || 'New Workspace',
      ownerId: userId,
      inviteCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(dashboardMembers).values({
      dashboardId,
      userId,
      email: cleanEmail,
      role: 'owner',
      status: 'active',
      createdAt: new Date(),
    });
  });

  return {
    id: dashboardId,
    name: name.trim() || 'New Workspace',
    ownerId: userId,
    ownerEmail: cleanEmail,
    inviteCode,
    role: 'owner' as MemberRole,
    isOwner: true,
    memberCount: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Rename dashboard
export async function renameDashboard(dashboardId: string, userId: number, email: string, newName: string) {
  const access = await checkDashboardAccess(dashboardId, userId, email);
  if (!access.hasAccess || access.role === 'viewer') {
    throw new Error('Unauthorized to rename dashboard');
  }

  await db.update(dashboards)
    .set({ 
      name: newName.trim() || 'Workspace',
      updatedAt: new Date()
    })
    .where(eq(dashboards.id, dashboardId));

  return { success: true };
}

// Delete dashboard (owner only)
export async function deleteDashboard(dashboardId: string, userId: number) {
  const dash = await db.select().from(dashboards).where(eq(dashboards.id, dashboardId)).limit(1);
  if (dash.length === 0) {
    throw new Error('Dashboard not found');
  }
  if (dash[0].ownerId !== userId) {
    throw new Error('Only the dashboard owner can delete this dashboard');
  }

  await db.delete(dashboards).where(eq(dashboards.id, dashboardId));
  return { success: true };
}

// Get all members of a dashboard
export async function getDashboardMembers(dashboardId: string, userId: number, email: string) {
  const access = await checkDashboardAccess(dashboardId, userId, email);
  if (!access.hasAccess) {
    throw new Error('Unauthorized to view members of this dashboard');
  }

  const members = await db.select({
    id: dashboardMembers.id,
    dashboardId: dashboardMembers.dashboardId,
    userId: dashboardMembers.userId,
    email: dashboardMembers.email,
    role: dashboardMembers.role,
    status: dashboardMembers.status,
    createdAt: dashboardMembers.createdAt,
    dashboardOwnerId: dashboards.ownerId,
  })
  .from(dashboardMembers)
  .leftJoin(dashboards, eq(dashboardMembers.dashboardId, dashboards.id))
  .where(eq(dashboardMembers.dashboardId, dashboardId))
  .orderBy(dashboardMembers.createdAt);

  return members.map(m => ({
    id: m.id,
    dashboardId: m.dashboardId,
    userId: m.userId,
    email: m.email,
    role: (m.role as MemberRole) || 'editor',
    status: (m.status as 'active' | 'invited') || 'active',
    createdAt: m.createdAt?.getTime() || Date.now(),
    isOwner: m.dashboardOwnerId === m.userId,
  }));
}

// Invite a collaborator by email
export async function inviteCollaborator(
  dashboardId: string,
  inviterUserId: number,
  inviterEmail: string,
  inviteeEmail: string,
  role: 'editor' | 'viewer' = 'editor'
) {
  const cleanInvitee = inviteeEmail.trim().toLowerCase();
  if (!cleanInvitee || !cleanInvitee.includes('@')) {
    throw new Error('Valid email address is required');
  }

  const access = await checkDashboardAccess(dashboardId, inviterUserId, inviterEmail);
  if (!access.hasAccess || access.role === 'viewer') {
    throw new Error('Only owners and editors can invite collaborators');
  }

  // Check if already a member
  const existing = await db.select()
    .from(dashboardMembers)
    .where(and(
      eq(dashboardMembers.dashboardId, dashboardId),
      sql`LOWER(${dashboardMembers.email}) = ${cleanInvitee}`
    ))
    .limit(1);

  if (existing.length > 0) {
    // If already exists, update role if changed
    if (existing[0].role !== role) {
      await db.update(dashboardMembers)
        .set({ role })
        .where(eq(dashboardMembers.id, existing[0].id));
      return { success: true, message: `Updated ${cleanInvitee}'s role to ${role}`, memberId: existing[0].id };
    }
    throw new Error(`${cleanInvitee} is already a collaborator on this dashboard.`);
  }

  // Check if a registered user already exists with this email
  const existingUser = await db.select().from(users).where(sql`LOWER(${users.email}) = ${cleanInvitee}`).limit(1);

  const registeredUserId = existingUser.length > 0 ? existingUser[0].id : null;
  const status = registeredUserId ? 'active' : 'invited';

  const inserted = await db.insert(dashboardMembers).values({
    dashboardId,
    userId: registeredUserId,
    email: cleanInvitee,
    role,
    status,
    invitedBy: inviterUserId,
    createdAt: new Date(),
  }).returning();

  return { 
    success: true, 
    member: {
      id: inserted[0].id,
      dashboardId,
      userId: registeredUserId,
      email: cleanInvitee,
      role,
      status,
      createdAt: inserted[0].createdAt?.getTime() || Date.now(),
      isOwner: false,
    }
  };
}

// Remove a collaborator from dashboard (or leave)
export async function removeCollaborator(
  dashboardId: string,
  requesterUserId: number,
  requesterEmail: string,
  memberId: number
) {
  const access = await checkDashboardAccess(dashboardId, requesterUserId, requesterEmail);
  if (!access.hasAccess) {
    throw new Error('Unauthorized');
  }

  const targetMember = await db.select().from(dashboardMembers).where(eq(dashboardMembers.id, memberId)).limit(1);
  if (targetMember.length === 0) {
    throw new Error('Member not found');
  }

  const member = targetMember[0];
  const isSelf = member.userId === requesterUserId || member.email.toLowerCase() === requesterEmail.toLowerCase();

  // Non-owners can only remove themselves (leave)
  if (!access.isOwner && !isSelf) {
    throw new Error('Only the dashboard owner can remove other collaborators');
  }

  // Owner cannot leave their own dashboard without deleting it or transferring
  if (access.isOwner && isSelf) {
    throw new Error('The dashboard owner cannot leave. You can delete the dashboard if you no longer need it.');
  }

  await db.delete(dashboardMembers).where(eq(dashboardMembers.id, memberId));
  return { success: true };
}

// Join dashboard via invite code
export async function joinDashboardWithCode(userId: number, email: string, rawInviteCode: string) {
  const cleanEmail = email.trim().toLowerCase();
  const code = rawInviteCode.trim().toUpperCase();

  const dashList = await db.select().from(dashboards).where(eq(dashboards.inviteCode, code)).limit(1);
  if (dashList.length === 0) {
    throw new Error('Invalid invite code. Please check the code and try again.');
  }

  const dashboard = dashList[0];

  // Check if already member
  const existing = await db.select().from(dashboardMembers).where(
    and(
      eq(dashboardMembers.dashboardId, dashboard.id),
      or(
        eq(dashboardMembers.userId, userId),
        sql`LOWER(${dashboardMembers.email}) = ${cleanEmail}`
      )
    )
  ).limit(1);

  if (existing.length > 0) {
    return {
      success: true,
      alreadyMember: true,
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
      }
    };
  }

  // Add as active editor
  await db.insert(dashboardMembers).values({
    dashboardId: dashboard.id,
    userId,
    email: cleanEmail,
    role: 'editor',
    status: 'active',
    createdAt: new Date(),
  });

  return {
    success: true,
    alreadyMember: false,
    dashboard: {
      id: dashboard.id,
      name: dashboard.name,
    }
  };
}
