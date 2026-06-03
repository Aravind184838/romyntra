import XLSX from 'xlsx';

const flatten = (obj, prefix = '') => {
  let result = {};
  for (let key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      if (val._id || val.name || val.email || val.title) {
        result[newKey] = val.name || val.title || val.email || val._id?.toString() || '';
      } else {
        Object.assign(result, flatten(val, newKey));
      }
    } else if (Array.isArray(val)) {
      result[newKey] = val.map(v => {
        if (v && typeof v === 'object') return v.name || v.title || v._id?.toString() || JSON.stringify(v);
        return v;
      }).join(', ');
    } else {
      result[newKey] = val instanceof Date ? val.toISOString() : (val ?? '');
    }
  }
  return result;
};

const pick = (obj, fields) => {
  const out = {};
  for (const f of fields) {
    const keys = f.split('.');
    let val = obj;
    for (const k of keys) {
      if (val == null) break;
      val = val[k];
    }
    out[f] = val ?? '';
  }
  return out;
};

const fmtDate = (d) => d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : '';

const USER_FIELDS = ['_id', 'name', 'email', 'phone', 'age', 'gender', 'lookingFor', 'role', 'isVerified', 'isProfileComplete', 'isRestricted', 'bio', 'interests', 'location.city', 'lastActive', 'createdAt'];

export const exportUsersToExcel = async (User) => {
  const users = await User.find({}).lean();
  const rows = users.map(u => {
    const row = pick(u, USER_FIELDS);
    row.interests = (u.interests || []).join(', ');
    row.lastActive = fmtDate(u.lastActive);
    row.createdAt = fmtDate(u.createdAt);
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const MATCH_FIELDS = ['_id', 'matchScore', 'isSuperLike', 'status', 'initiatedBy', 'lastMessage.content', 'lastMessage.sentAt', 'createdAt', 'updatedAt'];

export const exportMatchesToExcel = async (Match) => {
  const matches = await Match.find({}).populate('users', 'name email').lean();
  const rows = matches.map(m => {
    const row = pick(m, MATCH_FIELDS);
    row.users = (m.users || []).map(u => u.name || u.email).join(' & ');
    row.initiatedBy = m.initiatedBy?.name || m.initiatedBy?.toString() || '';
    row.lastMessage = m.lastMessage?.content || '';
    row.lastMessageSentAt = fmtDate(m.lastMessage?.sentAt);
    row.createdAt = fmtDate(m.createdAt);
    row.updatedAt = fmtDate(m.updatedAt);
    delete row['lastMessage.content'];
    delete row['lastMessage.sentAt'];
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matches');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const MESSAGE_FIELDS = ['_id', 'match', 'sender', 'content', 'messageType', 'encrypted', 'readAt', 'deliveredAt', 'createdAt'];

export const exportMessagesToExcel = async (Message) => {
  const messages = await Message.find({}).populate('match', '_id').populate('sender', 'name email').sort({ createdAt: -1 }).limit(10000).lean();
  const rows = messages.map(m => {
    const row = pick(m, MESSAGE_FIELDS);
    row.match = m.match?._id?.toString() || '';
    row.sender = m.sender?.name || m.sender?.email || m.sender?.toString() || '';
    row.readAt = fmtDate(m.readAt);
    row.deliveredAt = fmtDate(m.deliveredAt);
    row.createdAt = fmtDate(m.createdAt);
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Messages');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const REPORT_FIELDS = ['_id', 'reporter', 'reported', 'reason', 'description', 'status', 'adminNote', 'resolvedBy', 'createdAt', 'updatedAt'];

export const exportReportsToExcel = async (Report) => {
  const reports = await Report.find({}).populate('reporter', 'name email').populate('reported', 'name email').populate('resolvedBy', 'name email').sort({ createdAt: -1 }).lean();
  const rows = reports.map(r => {
    const row = pick(r, REPORT_FIELDS);
    row.reporter = r.reporter?.name || r.reporter?.email || r.reporter?.toString() || '';
    row.reported = r.reported?.name || r.reported?.email || r.reported?.toString() || '';
    row.resolvedBy = r.resolvedBy?.name || r.resolvedBy?.email || '';
    row.createdAt = fmtDate(r.createdAt);
    row.updatedAt = fmtDate(r.updatedAt);
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reports');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const SWIPE_FIELDS = ['_id', 'swiper', 'swiped', 'action', 'createdAt'];

export const exportSwipesToExcel = async (Swipe) => {
  const swipes = await Swipe.find({}).populate('swiper', 'name email').populate('swiped', 'name email').sort({ createdAt: -1 }).limit(10000).lean();
  const rows = swipes.map(s => {
    const row = pick(s, SWIPE_FIELDS);
    row.swiper = s.swiper?.name || s.swiper?.email || s.swiper?.toString() || '';
    row.swiped = s.swiped?.name || s.swiped?.email || s.swiped?.toString() || '';
    row.createdAt = fmtDate(s.createdAt);
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Swipes');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const exportAllToExcel = async (models) => {
  const { User, Match, Message, Report, Swipe } = models;
  const wb = XLSX.utils.book_new();

  const users = await User.find({}).lean();
  const userRows = users.map(u => {
    const row = pick(u, USER_FIELDS);
    row.interests = (u.interests || []).join(', ');
    row.lastActive = fmtDate(u.lastActive);
    row.createdAt = fmtDate(u.createdAt);
    return row;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(userRows), 'Users');

  const matches = await Match.find({}).populate('users', 'name email').lean();
  const matchRows = matches.map(m => {
    const row = pick(m, MATCH_FIELDS);
    row.users = (m.users || []).map(u => u.name || u.email).join(' & ');
    row.initiatedBy = m.initiatedBy?.name || m.initiatedBy?.toString() || '';
    row.lastMessage = m.lastMessage?.content || '';
    row.createdAt = fmtDate(m.createdAt);
    row.updatedAt = fmtDate(m.updatedAt);
    delete row['lastMessage.content'];
    delete row['lastMessage.sentAt'];
    return row;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matchRows), 'Matches');

  const messages = await Message.find({}).populate('sender', 'name email').sort({ createdAt: -1 }).limit(10000).lean();
  const msgRows = messages.map(m => ({
    _id: m._id.toString(), match: m.match?.toString() || '',
    sender: m.sender?.name || m.sender?.email || '', content: m.content,
    messageType: m.messageType, createdAt: fmtDate(m.createdAt)
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(msgRows), 'Messages');

  const reports = await Report.find({}).populate('reporter', 'name email').populate('reported', 'name email').sort({ createdAt: -1 }).lean();
  const reportRows = reports.map(r => ({
    _id: r._id.toString(), reporter: r.reporter?.name || '', reported: r.reported?.name || '',
    reason: r.reason, description: r.description, status: r.status, createdAt: fmtDate(r.createdAt)
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportRows), 'Reports');

  const swipes = await Swipe.find({}).populate('swiper', 'name email').populate('swiped', 'name email').sort({ createdAt: -1 }).limit(10000).lean();
  const swipeRows = swipes.map(s => ({
    _id: s._id.toString(), swiper: s.swiper?.name || '', swiped: s.swiped?.name || '',
    action: s.action, createdAt: fmtDate(s.createdAt)
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(swipeRows), 'Swipes');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
