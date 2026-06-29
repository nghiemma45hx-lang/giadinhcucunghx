import { supabase } from './supabase';
import { FamilyMember, Announcement, TributeMessage, UserAccount } from './types';

// Connection status helper
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('members').select('id').limit(1);
    if (error) {
      const msg = error?.message?.toLowerCase() || '';
      const isMissingTable = error?.code === '42P01' || 
                            msg.includes('relation') || 
                            msg.includes('does not exist') ||
                            msg.includes('schema cache') ||
                            msg.includes('could not find');
      if (isMissingTable) {
        console.warn("Supabase is reachable but 'members' table is not created yet.");
      } else {
        console.warn("Supabase test connection failed:", error.message);
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase connection exception:", err);
    return false;
  }
}

function handleFetchError(tableName: string, error: any) {
  const msg = error?.message?.toLowerCase() || '';
  const isMissingTable = error?.code === '42P01' || 
                        msg.includes('relation') || 
                        msg.includes('does not exist') ||
                        msg.includes('schema cache') ||
                        msg.includes('could not find');
  if (isMissingTable) {
    console.warn(`Supabase table "${tableName}" does not exist yet. Application will run in Offline Mode using LocalStorage. Please execute the SQL Query in your Supabase SQL Editor to link tables.`);
  } else {
    console.warn(`Error fetching "${tableName}" from Supabase (falling back to Offline Mode):`, error?.message || error);
  }
}

function handleWriteError(operationName: string, tableName: string, error: any) {
  const msg = error?.message?.toLowerCase() || '';
  const isMissingTable = error?.code === '42P01' || 
                        msg.includes('relation') || 
                        msg.includes('does not exist') ||
                        msg.includes('schema cache') ||
                        msg.includes('could not find');
  if (isMissingTable) {
    console.warn(`Supabase table "${tableName}" does not exist yet. Cannot perform write operation "${operationName}".`);
  } else {
    console.warn(`Error on "${operationName}" for table "${tableName}" in Supabase:`, error?.message || error);
  }
}

// ---------------- MEMBERS API ----------------
export async function fetchMembers(): Promise<FamilyMember[] | null> {
  try {
    const { data, error } = await supabase.from('members').select('*');
    if (error) {
      handleFetchError('members', error);
      return null;
    }
    // Map database fields to types
    return data as FamilyMember[];
  } catch (err) {
    console.warn('Exception fetching members:', err);
    return null;
  }
}

export async function upsertMember(member: FamilyMember): Promise<boolean> {
  const payload: any = {
    id: member.id,
    name: member.name,
    nickname: member.nickname || null,
    gender: member.gender,
    role: member.role || '',
    generation: member.generation,
    fatherId: member.fatherId || null,
    motherId: member.motherId || null,
    spouseId: member.spouseId || null,
    birthDate: member.birthDate || null,
    deathDate: member.deathDate || null,
    isAlive: member.isAlive,
    branch: member.branch || 'hai',
    bio: member.bio || null,
    burialPlace: member.burialPlace || null,
    phone: member.phone || null,
    address: member.address || null,
    education: member.education || null,
    householdGroup: member.householdGroup || null
  };

  try {
    const { error } = await supabase.from('members').upsert(payload);
    if (error) {
      const errorMsg = error.message?.toLowerCase() || '';
      const isMissingColumn = error.code === '42703' || errorMsg.includes('column') || errorMsg.includes('does not exist');
      
      if (isMissingColumn) {
        console.warn("Supabase 'members' table is missing the 'householdGroup' column. Retrying write without 'householdGroup'...");
        delete payload.householdGroup;
        const { error: retryError } = await supabase.from('members').upsert(payload);
        if (retryError) {
          handleWriteError('upsertMember (retry)', 'members', retryError);
          return false;
        }
        return true;
      }
      
      handleWriteError('upsertMember', 'members', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception upserting member:', err);
    return false;
  }
}

export async function deleteMemberFromDB(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      handleWriteError('deleteMemberFromDB', 'members', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception deleting member:', err);
    return false;
  }
}

// ---------------- ANNOUNCEMENTS API ----------------
export async function fetchAnnouncements(): Promise<Announcement[] | null> {
  try {
    const { data, error } = await supabase.from('announcements').select('*').order('date', { ascending: false });
    if (error) {
      handleFetchError('announcements', error);
      return null;
    }
    return data as Announcement[];
  } catch (err) {
    console.warn('Exception fetching announcements:', err);
    return null;
  }
}

export async function upsertAnnouncement(ann: Announcement): Promise<boolean> {
  try {
    const { error } = await supabase.from('announcements').upsert({
      id: ann.id,
      title: ann.title,
      content: ann.content,
      date: ann.date,
      important: ann.important
    });
    if (error) {
      handleWriteError('upsertAnnouncement', 'announcements', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception upserting announcement:', err);
    return false;
  }
}

export async function deleteAnnouncementFromDB(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      handleWriteError('deleteAnnouncementFromDB', 'announcements', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception deleting announcement:', err);
    return false;
  }
}

// ---------------- TRIBUTES API ----------------
export async function fetchTributes(): Promise<TributeMessage[] | null> {
  try {
    const { data, error } = await supabase.from('tributes').select('*').order('id', { ascending: false });
    if (error) {
      handleFetchError('tributes', error);
      return null;
    }
    return data as TributeMessage[];
  } catch (err) {
    console.warn('Exception fetching tributes:', err);
    return null;
  }
}

export async function insertTribute(tribute: TributeMessage): Promise<boolean> {
  try {
    const { error } = await supabase.from('tributes').insert({
      id: tribute.id,
      senderName: tribute.senderName,
      relation: tribute.relation,
      message: tribute.message,
      date: tribute.date
    });
    if (error) {
      handleWriteError('insertTribute', 'tributes', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception inserting tribute:', err);
    return false;
  }
}

// ---------------- USER ACCOUNTS API ----------------
export async function fetchSystemUsers(): Promise<UserAccount[] | null> {
  try {
    const { data, error } = await supabase.from('system_users').select('*');
    if (error) {
      handleFetchError('system_users', error);
      return null;
    }
    return data as UserAccount[];
  } catch (err) {
    console.warn('Exception fetching system users:', err);
    return null;
  }
}

export async function upsertSystemUser(user: UserAccount): Promise<boolean> {
  try {
    const { error } = await supabase.from('system_users').upsert({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    });
    if (error) {
      handleWriteError('upsertSystemUser', 'system_users', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception upserting system user:', err);
    return false;
  }
}

export async function deleteSystemUserFromDB(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('system_users').delete().eq('id', id);
    if (error) {
      handleWriteError('deleteSystemUserFromDB', 'system_users', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception deleting system user:', err);
    return false;
  }
}

// ---------------- ALTAR COUNTS API ----------------
export interface AltarCounts {
  incense: number;
  candle: number;
  flower: number;
}

export async function fetchAltarCounts(): Promise<AltarCounts | null> {
  try {
    const { data, error } = await supabase.from('altar_counts').select('*');
    if (error) {
      handleFetchError('altar_counts', error);
      return null;
    }
    const counts: AltarCounts = { incense: 245, candle: 189, flower: 112 };
    data.forEach(item => {
      if (item.key === 'incense') counts.incense = Number(item.value);
      if (item.key === 'candle') counts.candle = Number(item.value);
      if (item.key === 'flower') counts.flower = Number(item.value);
    });
    return counts;
  } catch (err) {
    console.warn('Exception fetching altar counts:', err);
    return null;
  }
}

export async function updateAltarCountInDB(key: 'incense' | 'candle' | 'flower', value: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('altar_counts').upsert({ key, value });
    if (error) {
      handleWriteError(`updateAltarCountInDB [${key}]`, 'altar_counts', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Exception updating altar count [${key}]:`, err);
    return false;
  }
}

// ---------------- AUTOMATIC SEED SYSTEM ----------------
export async function seedInitialDataIfNeeded(
  initialMembers: FamilyMember[],
  initialAnnouncements: Announcement[],
  initialTributes: TributeMessage[],
  initialUsers: UserAccount[]
): Promise<boolean> {
  try {
    // 1. Seed Members
    const { data: memberCheck, error: mErr } = await supabase.from('members').select('id').limit(1);
    if (!mErr && (!memberCheck || memberCheck.length === 0)) {
      console.log('Seeding initial family members into Supabase...');
      for (const m of initialMembers) {
        await upsertMember(m);
      }
    }

    // 2. Seed Announcements
    const { data: annCheck, error: aErr } = await supabase.from('announcements').select('id').limit(1);
    if (!aErr && (!annCheck || annCheck.length === 0)) {
      console.log('Seeding initial announcements into Supabase...');
      for (const a of initialAnnouncements) {
        await upsertAnnouncement(a);
      }
    }

    // 3. Seed Tributes
    const { data: tribCheck, error: tErr } = await supabase.from('tributes').select('id').limit(1);
    if (!tErr && (!tribCheck || tribCheck.length === 0)) {
      console.log('Seeding initial tributes into Supabase...');
      for (const t of initialTributes) {
        await insertTribute(t);
      }
    }

    // 4. Seed Users
    const { data: userCheck, error: uErr } = await supabase.from('system_users').select('id').limit(1);
    if (!uErr && (!userCheck || userCheck.length === 0)) {
      console.log('Seeding initial system users into Supabase...');
      for (const u of initialUsers) {
        await upsertSystemUser(u);
      }
    }

    // 5. Seed Altar Counts
    const { data: altarCheck, error: altErr } = await supabase.from('altar_counts').select('key');
    if (!altErr && (!altarCheck || altarCheck.length === 0)) {
      console.log('Seeding initial altar counts...');
      await updateAltarCountInDB('incense', 245);
      await updateAltarCountInDB('candle', 189);
      await updateAltarCountInDB('flower', 112);
    }

    return true;
  } catch (err) {
    console.warn('Exception seeding Supabase:', err);
    return false;
  }
}
