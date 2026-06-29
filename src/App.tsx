import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import { 
  TreeDeciduous, Users, Flame, BookOpen, Heart, Search, 
  Plus, Trash2, Edit3, Settings, LogOut, LogIn, FileDown, 
  FileUp, Award, MapPin, Sparkles, Phone, Shield, BarChart3, 
  ChevronRight, Calendar, Info, X, MessageSquare, CheckCircle, RefreshCw
} from 'lucide-react';
import { 
  FamilyMember, Announcement, TributeMessage, UserAccount,
  INITIAL_MEMBERS, INITIAL_ANNOUNCEMENTS, INITIAL_TRIBUTES, INITIAL_USERS 
} from './types';
import {
  testSupabaseConnection,
  fetchMembers,
  upsertMember,
  deleteMemberFromDB,
  fetchAnnouncements,
  upsertAnnouncement,
  deleteAnnouncementFromDB,
  fetchTributes,
  insertTribute,
  fetchSystemUsers,
  upsertSystemUser,
  deleteSystemUserFromDB,
  fetchAltarCounts,
  updateAltarCountInDB,
  seedInitialDataIfNeeded
} from './supabaseService';
import { convertSolarToLunar, getAgeOrLongevityText } from './dateUtils';


export default function App() {
  // --- STATE SYSTEM ---
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem('nghiem_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('nghiem_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [tributes, setTributes] = useState<TributeMessage[]>(() => {
    const saved = localStorage.getItem('nghiem_tributes');
    return saved ? JSON.parse(saved) : INITIAL_TRIBUTES;
  });

  const [incenseCount, setIncenseCount] = useState(() => Number(localStorage.getItem('nghiem_incense') || '245'));
  const [candleCount, setCandleCount] = useState(() => Number(localStorage.getItem('nghiem_candle') || '189'));
  const [flowerCount, setFlowerCount] = useState(() => Number(localStorage.getItem('nghiem_flower') || '112'));

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('nghiem_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'home' | 'family-tree' | 'member-list' | 'memorial' | 'statistics' | 'admin'>('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Search & Filter state for Member List
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGen, setFilterGen] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterAlive, setFilterAlive] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('generation-asc');

  // Interactive detail card selection
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Smoke particles array for Memorial Altar
  const [smokeParticles, setSmokeParticles] = useState<{ id: number; left: number }[]>([]);

  // Admin section sub-tab
  const [adminSubTab, setAdminSubTab] = useState<'members' | 'announcements' | 'accounts' | 'backup'>('members');

  // Tribute submission state
  const [newTribName, setNewTribName] = useState('');
  const [newTribRelation, setNewTribRelation] = useState('');
  const [newTribMessage, setNewTribMessage] = useState('');
  const [newTribTarget, setNewTribTarget] = useState('all');

  // Admin Member Form state
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [memberForm, setMemberForm] = useState<Partial<FamilyMember>>({
    name: '', nickname: '', gender: 'male', role: '', generation: 17,
    isAlive: true, branch: 'hai', bio: '', burialPlace: '', phone: '', address: '', education: '', householdGroup: ''
  });

  // Admin Announcement Form
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annForm, setAnnForm] = useState<Partial<Announcement>>({
    title: '', content: '', date: new Date().toISOString().split('T')[0], important: false
  });

  // Admin Account Form
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '123', fullName: '', role: 'user' as 'admin' | 'user' });
  const [systemUsers, setSystemUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('nghiem_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  // Supabase Integration States
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [loadingDB, setLoadingDB] = useState<boolean>(false);

  // Load data from Supabase on mount
  useEffect(() => {
    async function initSupabaseData() {
      setLoadingDB(true);
      const isConnected = await testSupabaseConnection();
      setSupabaseConnected(isConnected);

      if (isConnected) {
        try {
          // Attempt to seed initial data in Supabase if database tables exist but are empty
          await seedInitialDataIfNeeded(INITIAL_MEMBERS, INITIAL_ANNOUNCEMENTS, INITIAL_TRIBUTES, INITIAL_USERS);

          // Load members
          const dbMembers = await fetchMembers();
          if (dbMembers) {
            setMembers(dbMembers);
          }

          // Load announcements
          const dbAnnouncements = await fetchAnnouncements();
          if (dbAnnouncements) {
            setAnnouncements(dbAnnouncements);
          }

          // Load tributes
          const dbTributes = await fetchTributes();
          if (dbTributes) {
            setTributes(dbTributes);
          }

          // Load system users
          const dbUsers = await fetchSystemUsers();
          if (dbUsers) {
            setSystemUsers(dbUsers);
          }

          // Load altar counts
          const dbCounts = await fetchAltarCounts();
          if (dbCounts) {
            setIncenseCount(dbCounts.incense);
            setCandleCount(dbCounts.candle);
            setFlowerCount(dbCounts.flower);
          }
        } catch (err) {
          console.error("Error loading data from Supabase:", err);
        }
      }
      setLoadingDB(false);
    }
    initSupabaseData();
  }, []);

  // Save changes to localStorage

  useEffect(() => {
    localStorage.setItem('nghiem_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('nghiem_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('nghiem_tributes', JSON.stringify(tributes));
  }, [tributes]);

  useEffect(() => {
    localStorage.setItem('nghiem_current_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('nghiem_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  // Handle smoke particle animation cleanups
  useEffect(() => {
    if (smokeParticles.length > 0) {
      const timer = setTimeout(() => {
        setSmokeParticles(prev => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [smokeParticles]);

  // --- ACTIONS ---
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Predefined accounts
    if (loginUsername === 'admin' && loginPassword === '123') {
      const user = { id: 'u-1', username: 'admin', fullName: 'Quản Trị Viên Nhánh Trưởng', role: 'admin' as const };
      setCurrentUser(user);
      setShowLoginModal(false);
      resetLoginFields();
      return;
    }
    if (loginUsername === 'nghiemphac' && loginPassword === '123') {
      const user = { id: 'u-2', username: 'nghiemphac', fullName: 'Bác Nghiêm Phác', role: 'user' as const };
      setCurrentUser(user);
      setShowLoginModal(false);
      resetLoginFields();
      return;
    }

    // Custom accounts in state
    const found = systemUsers.find(u => u.username === loginUsername && loginPassword === '123');
    if (found) {
      setCurrentUser(found);
      setShowLoginModal(false);
      resetLoginFields();
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu (123) không chính xác!');
    }
  };

  const resetLoginFields = () => {
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  const triggerIncense = async () => {
    const newCount = incenseCount + 1;
    setIncenseCount(newCount);
    localStorage.setItem('nghiem_incense', String(newCount));
    
    // Add smoke particle
    const randomLeft = Math.floor(Math.random() * 40) + 30; // 30% to 70% left
    setSmokeParticles(prev => [...prev, { id: Date.now(), left: randomLeft }]);

    if (supabaseConnected) {
      await updateAltarCountInDB('incense', newCount);
    }
  };

  const triggerCandle = async () => {
    const newCount = candleCount + 1;
    setCandleCount(newCount);
    localStorage.setItem('nghiem_candle', String(newCount));

    if (supabaseConnected) {
      await updateAltarCountInDB('candle', newCount);
    }
  };

  const triggerFlower = async () => {
    const newCount = flowerCount + 1;
    setFlowerCount(newCount);
    localStorage.setItem('nghiem_flower', String(newCount));

    if (supabaseConnected) {
      await updateAltarCountInDB('flower', newCount);
    }
  };

  const submitTribute = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTribName.trim() || !newTribMessage.trim()) return;

    const newTribute: TributeMessage = {
      id: 'trib-' + Date.now(),
      senderName: newTribName,
      relation: newTribRelation || 'Con cháu',
      message: newTribMessage,
      date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    };

    setTributes(prev => [newTribute, ...prev]);
    setNewTribName('');
    setNewTribRelation('');
    setNewTribMessage('');

    if (supabaseConnected) {
      await insertTribute(newTribute);
    }
  };

  // --- MEMBER FORM CRUD ---
  const saveMember = async (e: FormEvent) => {
    e.preventDefault();
    
    const finalName = memberForm.name?.trim() || 'Không rõ tên';

    let targetMember: FamilyMember;
    if (formMode === 'add') {
      targetMember = {
        ...(memberForm as FamilyMember),
        name: finalName,
        id: 'mem-' + Date.now(),
        isAlive: memberForm.isAlive ?? true
      };
      setMembers(prev => [...prev, targetMember]);
    } else {
      targetMember = { 
        ...memberForm,
        name: finalName
      } as FamilyMember;
      setMembers(prev => prev.map(m => m.id === memberForm.id ? targetMember : m));
    }
    setShowMemberForm(false);

    if (supabaseConnected) {
      await upsertMember(targetMember);
    }
  };

  const editMemberClick = (m: FamilyMember) => {
    setFormMode('edit');
    setMemberForm(m);
    setShowMemberForm(true);
  };

  const deleteMember = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi cây gia phả?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
      if (selectedMember?.id === id) setSelectedMember(null);

      if (supabaseConnected) {
        await deleteMemberFromDB(id);
      }
    }
  };

  // --- ANNOUNCEMENT CRUD ---
  const saveAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!annForm.title || !annForm.content) return;

    const newAnn: Announcement = {
      ...(annForm as Announcement),
      id: 'ann-' + Date.now()
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    setShowAnnForm(false);
    setAnnForm({ title: '', content: '', date: new Date().toISOString().split('T')[0], important: false });

    if (supabaseConnected) {
      await upsertAnnouncement(newAnn);
    }
  };

  const deleteAnn = async (id: string) => {
    if (confirm('Xóa thông báo này?')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));

      if (supabaseConnected) {
        await deleteAnnouncementFromDB(id);
      }
    }
  };

  // --- USER ACCOUNT CRUD ---
  const saveUserAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.fullName) return;

    const newUser: UserAccount = {
      id: 'usr-' + Date.now(),
      username: userForm.username.toLowerCase().trim(),
      fullName: userForm.fullName,
      role: userForm.role
    };

    setSystemUsers(prev => [...prev, newUser]);
    setShowUserForm(false);
    setUserForm({ username: '', password: '123', fullName: '', role: 'user' });

    if (supabaseConnected) {
      await upsertSystemUser(newUser);
    }
  };

  const deleteUser = async (id: string) => {
    if (id === 'u-1' || id === 'u-2') {
      alert('Không thể xóa tài khoản hệ thống mặc định!');
      return;
    }
    if (confirm('Xóa tài khoản đăng nhập này?')) {
      setSystemUsers(prev => prev.filter(u => u.id !== id));

      if (supabaseConnected) {
        await deleteSystemUserFromDB(id);
      }
    }
  };

  // --- DATA EXPORT/IMPORT ---
  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      members, announcements, tributes, systemUsers, incenseCount, candleCount, flowerCount
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GiaPha_NghiemCung_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importData = (e: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.members) setMembers(parsed.members);
          if (parsed.announcements) setAnnouncements(parsed.announcements);
          if (parsed.tributes) setTributes(parsed.tributes);
          if (parsed.systemUsers) setSystemUsers(parsed.systemUsers);
          if (parsed.incenseCount) setIncenseCount(parsed.incenseCount);
          if (parsed.candleCount) setCandleCount(parsed.candleCount);
          if (parsed.flowerCount) setFlowerCount(parsed.flowerCount);
          alert('Khôi phục dữ liệu gia tộc thành công!');
        } catch (err) {
          alert('Lỗi định dạng file! Vui lòng chọn đúng file backup JSON hợp lệ.');
        }
      };
    }
  };

  const resetAllData = () => {
    if (confirm('Bạn có chắc chắn muốn ĐẶT LẠI HOÀN TOÀN dữ liệu về ban đầu? Mọi chỉnh sửa của bạn sẽ bị xóa.')) {
      setMembers(INITIAL_MEMBERS);
      setAnnouncements(INITIAL_ANNOUNCEMENTS);
      setTributes(INITIAL_TRIBUTES);
      setSystemUsers(INITIAL_USERS);
      setIncenseCount(245);
      setCandleCount(189);
      setFlowerCount(112);
      alert('Đã đặt lại dữ liệu gia phả mặc định thành công.');
    }
  };

  // --- COMPUTED / FILTERED STATES ---
  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        (m.nickname && m.nickname.toLowerCase().includes(q)) ||
        m.role.toLowerCase().includes(q)
      );
    }

    if (filterGen !== 'all') {
      result = result.filter(m => m.generation === Number(filterGen));
    }

    if (filterGender !== 'all') {
      result = result.filter(m => m.gender === filterGender);
    }

    if (filterAlive !== 'all') {
      const isAliveBool = filterAlive === 'alive';
      result = result.filter(m => m.isAlive === isAliveBool);
    }

    if (filterBranch !== 'all') {
      result = result.filter(m => m.branch === filterBranch);
    }

    // Sort options
    result.sort((a, b) => {
      if (sortBy === 'generation-asc') return a.generation - b.generation;
      if (sortBy === 'generation-desc') return b.generation - a.generation;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi');
      return 0;
    });

    return result;
  }, [members, searchQuery, filterGen, filterGender, filterAlive, filterBranch, sortBy]);

  // Statistics Computations
  const stats = useMemo(() => {
    const total = members.length;
    const alive = members.filter(m => m.isAlive).length;
    const deceased = total - alive;
    const male = members.filter(m => m.gender === 'male').length;
    const female = total - male;

    const byGeneration: Record<number, number> = {};
    members.forEach(m => {
      byGeneration[m.generation] = (byGeneration[m.generation] || 0) + 1;
    });

    const byBranch = {
      goc: members.filter(m => m.branch === 'goc').length,
      ca: members.filter(m => m.branch === 'ca').length,
      hai: members.filter(m => m.branch === 'hai').length,
    };

    return { total, alive, deceased, male, female, byGeneration, byBranch };
  }, [members]);

  const deceasedMembers = useMemo(() => {
    return members.filter(m => !m.isAlive);
  }, [members]);

  // Expand relationship details for Relative Explorer
  const getRelativeInfo = (member: FamilyMember) => {
    const father = members.find(m => m.id === member.fatherId);
    const mother = members.find(m => m.id === member.motherId);
    const spouse = members.find(m => m.id === member.spouseId || (m.spouseId && m.spouseId === member.id));
    const children = members.filter(m => m.fatherId === member.id || m.motherId === member.id);
    const siblings = members.filter(m => 
      m.id !== member.id && 
      ((member.fatherId && m.fatherId === member.fatherId) || (member.motherId && m.motherId === member.motherId))
    );

    return { father, mother, spouse, children, siblings };
  };

  const handleTributeToAncestor = (member: FamilyMember) => {
    setActiveTab('memorial');
    setNewTribTarget(member.id);
    setNewTribMessage(`Thắp nén tâm hương dâng Cụ ${member.name}. Con cháu luôn khắc ghi công ơn sinh thành dưỡng dục.`);
    triggerIncense();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] text-[#4a331a]">
      
      {/* 3. HERO BANNER */}
      <div className="relative bg-[#3e2a16] h-[200px] md:h-[260px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-25 bg-center bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1605369572399-05d8d64a0f6e?q=80&w=2000&auto=format&fit=crop')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a1d0f] to-transparent"></div>
        
        <div className="relative z-10 text-center px-4">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="h-[1px] w-12 bg-[#d6b583]"></div>
            <div className="text-[#d6b583] text-lg"><i className="fa-solid fa-leaf"></i></div>
            <div className="h-[1px] w-12 bg-[#d6b583]"></div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-[#fdfbf7] uppercase tracking-widest font-playfair drop-shadow-md mb-2">
            Gia Phả Gia Đình
          </h1>
          <h2 className="text-xl md:text-3xl font-bold text-[#d6b583] uppercase tracking-wider font-playfair drop-shadow-sm">
            Cụ Nghiêm Cung
          </h2>
        </div>
      </div>

      {/* 1. NAVBAR MENU */}
      <nav className="bg-[#5c3e21] text-[#fdfbf7] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            
            <div className="flex items-center space-x-2">
              <TreeDeciduous className="text-[#d6b583] w-6 h-6" />
              <span className="font-playfair text-lg font-bold tracking-wide hidden sm:inline text-[#fdfbf7]">Nghiêm Gia</span>
            </div>

            {/* Main Tabs */}
            <div className="flex space-x-1 overflow-x-auto max-w-[70%] sm:max-w-none no-scrollbar">
              <button 
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded text-xs md:text-sm font-medium transition flex items-center whitespace-nowrap ${activeTab === 'home' ? 'bg-[#4a3219] text-[#eadecb] border-b-2 border-[#d6b583]' : 'hover:bg-[#4a3219] hover:text-white'}`}
              >
                <i className="fa-solid fa-house mr-1"></i> Trang chủ
              </button>
              
              <button 
                onClick={() => setActiveTab('family-tree')}
                className={`px-3 py-1.5 rounded text-xs md:text-sm font-medium transition flex items-center whitespace-nowrap ${activeTab === 'family-tree' ? 'bg-[#4a3219] text-[#eadecb] border-b-2 border-[#d6b583]' : 'hover:bg-[#4a3219] hover:text-white'}`}
              >
                <TreeDeciduous className="w-3.5 h-3.5 mr-1" /> Cây gia phả
              </button>

              <button 
                onClick={() => setActiveTab('member-list')}
                className={`px-3 py-1.5 rounded text-xs md:text-sm font-medium transition flex items-center whitespace-nowrap ${activeTab === 'member-list' ? 'bg-[#4a3219] text-[#eadecb] border-b-2 border-[#d6b583]' : 'hover:bg-[#4a3219] hover:text-white'}`}
              >
                <Users className="w-3.5 h-3.5 mr-1" /> Thành viên
              </button>

              <button 
                onClick={() => setActiveTab('memorial')}
                className={`px-3 py-1.5 rounded text-xs md:text-sm font-medium transition flex items-center whitespace-nowrap ${activeTab === 'memorial' ? 'bg-[#4a3219] text-[#eadecb] border-b-2 border-[#d6b583]' : 'hover:bg-[#4a3219] hover:text-white'}`}
              >
                <Flame className="w-3.5 h-3.5 mr-1" /> Phòng tưởng nhớ
              </button>

              <button 
                onClick={() => setActiveTab('statistics')}
                className={`px-3 py-1.5 rounded text-xs md:text-sm font-medium transition flex items-center whitespace-nowrap ${activeTab === 'statistics' ? 'bg-[#4a3219] text-[#eadecb] border-b-2 border-[#d6b583]' : 'hover:bg-[#4a3219] hover:text-white'}`}
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1" /> Thống kê
              </button>

              {currentUser && currentUser.role === 'admin' && (
                <button 
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded text-xs md:text-sm font-medium transition flex items-center whitespace-nowrap ${activeTab === 'admin' ? 'bg-[#4a3219] text-[#eadecb] border-b-2 border-[#d6b583]' : 'hover:bg-[#4a3219] hover:text-white text-yellow-300'}`}
                >
                  <Shield className="w-3.5 h-3.5 mr-1" /> Quản trị
                </button>
              )}
            </div>

            {/* Login Section */}
            <div className="flex items-center space-x-3">
              {/* Supabase Indicator */}
              <div 
                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${
                  supabaseConnected === true 
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' 
                    : supabaseConnected === false 
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
                title={
                  supabaseConnected === true 
                    ? "Đã kết nối Supabase thành công. Ứng dụng hiện đang chỉ hiển thị và đồng bộ dữ liệu thực tế từ Database." 
                    : supabaseConnected === false
                    ? "Chưa tạo bảng trong Supabase. Chuyển sang chế độ Offline lưu trữ cục bộ. Hãy xem SQL Script ở mục Quản Trị -> Backup."
                    : "Đang kiểm tra kết nối Supabase..."
                }
              >
                <span className={`w-1.5 h-1.5 rounded-full ${supabaseConnected === true ? 'bg-emerald-400 animate-pulse' : supabaseConnected === false ? 'bg-amber-400' : 'bg-zinc-400 animate-pulse'}`}></span>
                <span className="font-mono text-[10px]">
                  {supabaseConnected === true ? 'Supabase (Đã đồng bộ)' : supabaseConnected === false ? 'Offline Mode' : 'Connecting'}
                </span>
              </div>

              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-[#d6b583] hidden md:inline font-playfair">
                    {currentUser.fullName}
                  </span>
                  <button 
                    onClick={handleLogout}
                    title="Đăng xuất" 
                    className="p-1.5 rounded bg-red-800 hover:bg-red-700 text-white transition text-xs flex items-center gap-1 font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Thoát</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1.5 rounded text-xs font-bold bg-[#d6b583] text-[#4a3219] hover:bg-[#c29f6b] transition shadow-sm flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" /> Đăng nhập
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* 2. DÒNG CHỮ CHẠY (MARQUEE) */}
      <div className="bg-[#d6b583] text-[#4a3219] py-1 border-b border-[#c29f6b] overflow-hidden whitespace-nowrap">
        <div className="relative w-full">
          <span className="animate-marquee inline-block text-xs md:text-sm font-medium">
            <i className="fa-solid fa-star text-[10px] mx-2 text-[#7c562e]"></i> 
            Mộc bản thụ nguyên, thuỷ lưu tuyền bản - Cây có cội, nước có nguồn. Chào mừng quý thành viên đến với trang thông tin dòng họ Gia Đình Cụ Nghiêm Cung. Chúc quý quyến vạn sự bình an, hanh thông cát tường! 
            <i className="fa-solid fa-star text-[10px] mx-2 text-[#7c562e]"></i> 
            Bảo tồn di sản cha ông là bổn phận thiêng liêng của con cháu. Hãy bổ sung thông tin thành viên thế hệ mới của gia đình để lưu danh sử xanh họ tộc.
            <i className="fa-solid fa-star text-[10px] mx-2 text-[#7c562e]"></i> 
          </span>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        
        {/* ==================== 1. TAB HOME ==================== */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Left: Quick Navigation */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-[#eadecb] sticky top-20">
                <h3 className="text-md font-bold text-[#6b4724] border-b-2 border-[#b8956b] pb-2 mb-4 uppercase tracking-wider font-playfair flex items-center gap-2">
                  <TreeDeciduous className="w-4 h-4 text-[#b8956b]" /> Danh Mục Chức Năng
                </h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <button 
                      onClick={() => setActiveTab('family-tree')} 
                      className="w-full text-left flex items-center p-2 rounded hover:bg-[#f4f0e6] text-[#5a3d1c] transition font-medium"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#b8956b] mr-2" /> Xem sơ đồ cây gia phả
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('member-list')} 
                      className="w-full text-left flex items-center p-2 rounded hover:bg-[#f4f0e6] text-[#5a3d1c] transition font-medium"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#b8956b] mr-2" /> Tra cứu danh sách dòng họ
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('memorial')} 
                      className="w-full text-left flex items-center p-2 rounded hover:bg-[#f4f0e6] text-[#5a3d1c] transition font-medium"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#b8956b] mr-2" /> Thắp hương tưởng nhớ Tổ tiên
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('statistics')} 
                      className="w-full text-left flex items-center p-2 rounded hover:bg-[#f4f0e6] text-[#5a3d1c] transition font-medium"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#b8956b] mr-2" /> Xem báo cáo thống kê họ tộc
                    </button>
                  </li>
                  <li className="pt-2 mt-2 border-t border-dashed border-[#eadecb]">
                    <span className="text-[10px] uppercase text-[#8b7355] font-bold block mb-1 px-2">Cơ sở dữ liệu</span>
                    <button 
                      onClick={exportData} 
                      className="w-full text-left flex items-center p-2 rounded hover:bg-[#f4f0e6] text-blue-700 transition"
                    >
                      <FileDown className="w-4 h-4 mr-2" /> Xuất file backup (.json)
                    </button>
                    {currentUser?.role === 'admin' && (
                      <label className="w-full text-left flex items-center p-2 rounded hover:bg-[#f4f0e6] text-green-700 cursor-pointer transition">
                        <FileUp className="w-4 h-4 mr-2" /> Import file phục hồi
                        <input type="file" accept=".json" onChange={importData} className="hidden" />
                      </label>
                    )}
                  </li>
                </ul>
              </div>
            </aside>

            {/* Center Content: Overview & History */}
            <main className="lg:col-span-2 space-y-6">
              
              {/* Overview Section */}
              <section className="bg-white rounded-lg p-6 shadow-sm border border-[#eadecb] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none">
                  <TreeDeciduous className="w-full h-full text-[#6b4724]" />
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold text-[#6b4724] mb-3 font-playfair flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-[#b8956b]" /> Cội Nguồn Tri Ân Gia Tộc
                </h2>
                
                <div className="text-sm text-[#5a3d1c] leading-relaxed space-y-3 text-justify">
                  <p>
                    Cây có gốc mới nở cành xanh ngọn, nước có nguồn mới bể rộng sông sâu. Việc lập gia phả là một hành trình gìn giữ văn hóa gia đình, là cầu nối tâm linh thiêng liêng để con cháu muôn đời sau ghi nhớ nguồn cội, công đức cao dày của Tổ tiên.
                  </p>
                  <p>
                    Gia phả gia đình Cụ <strong>Nghiêm Cung</strong> được khởi nguồn từ cụ tổ <strong>Nghiêm Điều (Chu)</strong> thuộc thế hệ thứ 15 và cụ tổ bà <strong>Lùn</strong>. Trải qua bao thăng trầm của lịch sử, các con cháu thuộc thế hệ 16, 17, 18, 19 tiếp tục phát huy truyền thống yêu nước, hiếu học, cần cù sáng tạo, gìn giữ nền nếp gia phong tốt đẹp.
                  </p>
                  <p className="italic font-medium text-center text-[#8b7355] border-y border-dashed border-[#eadecb] py-2 my-2">
                    "Tổ tông công đức thiên niên thịnh, Tử hiếu tôn hiền vạn đại vinh."
                  </p>
                </div>

                {/* Quick numeric stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-dashed border-[#eadecb]">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#b8956b] font-playfair">{stats.total}</div>
                    <div className="text-[10px] uppercase text-[#8b7355] mt-0.5 font-bold">Thành viên</div>
                  </div>
                  <div className="text-center border-l border-[#eadecb]">
                    <div className="text-2xl font-bold text-[#b8956b] font-playfair">{stats.alive}</div>
                    <div className="text-[10px] uppercase text-[#8b7355] mt-0.5 font-bold">Còn sống</div>
                  </div>
                  <div className="text-center border-l border-[#eadecb]">
                    <div className="text-2xl font-bold text-[#b8956b] font-playfair">{stats.deceased}</div>
                    <div className="text-[10px] uppercase text-[#8b7355] mt-0.5 font-bold">Đã khuất</div>
                  </div>
                  <div className="text-center border-l border-[#eadecb]">
                    <div className="text-2xl font-bold text-[#b8956b] font-playfair">5</div>
                    <div className="text-[10px] uppercase text-[#8b7355] mt-0.5 font-bold">Thế hệ ghi nhận</div>
                  </div>
                </div>
              </section>

              {/* Ancestors of Honor Spotlight */}
              <section className="bg-white rounded-lg p-6 shadow-sm border border-[#eadecb]">
                <h3 className="text-lg font-bold text-[#6b4724] mb-4 font-playfair border-b border-[#eadecb] pb-2 flex items-center justify-between">
                  <span>Bậc Tiền Nhân Khởi Tổ</span>
                  <Award className="w-4 h-4 text-[#b8956b]" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.filter(m => m.generation === 15).map(m => (
                    <div key={m.id} className="p-4 bg-[#fdfbf7] rounded border border-[#eadecb] flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs uppercase bg-[#b8956b] text-white px-2 py-0.5 rounded font-bold">{m.role}</span>
                          <span className="text-xs text-[#8b7355] font-semibold">Đời thứ {m.generation}</span>
                        </div>
                        <h4 className="font-bold text-[#6b4724] text-base">{m.name} {m.nickname && `(${m.nickname})`}</h4>
                        <p className="text-xs text-[#8b7355] mb-2">{m.birthDate || '?' } - {m.deathDate || '?'}</p>
                        <p className="text-xs text-[#5a3d1c] line-clamp-3">{m.bio || 'Chưa cập nhật tiểu sử.'}</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-dashed border-[#eadecb] flex justify-between items-center text-[11px]">
                        <span className="text-red-700 font-medium"><i className="fa-solid fa-vihara mr-1"></i> Đã mất</span>
                        <button 
                          onClick={() => handleTributeToAncestor(m)}
                          className="text-[#b8956b] hover:text-[#8b7355] font-bold flex items-center gap-1"
                        >
                          Thắp nhang & Kính viếng <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </main>

            {/* Sidebar Right: Announcements & Tributes Wall */}
            <aside className="lg:col-span-1 space-y-6">
              
              {/* Announcements Section */}
              <div className="bg-white rounded-lg shadow-sm border border-[#eadecb] overflow-hidden">
                <div className="bg-[#b8956b] text-white p-3 flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-1">
                    <i className="fa-solid fa-bullhorn"></i> Thông Báo Gia Tộc
                  </span>
                  <span className="text-[10px] bg-red-800 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">MỚI</span>
                </div>
                <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {announcements.map(ann => (
                    <div key={ann.id} className="border-b border-dashed border-[#eadecb] pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {ann.important && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">QUAN TRỌNG</span>
                        )}
                        <span className="text-[10px] text-[#8b7355] font-semibold">{ann.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-[#6b4724] hover:text-[#b8956b] transition mb-1">{ann.title}</h4>
                      <p className="text-[11px] text-[#5a3d1c] line-clamp-2">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Tributes Live feed */}
              <div className="bg-white rounded-lg shadow-sm border border-[#eadecb] overflow-hidden">
                <div className="bg-[#3e2a16] text-white p-3 flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> Tấm Lòng Con Cháu
                  </span>
                  <button onClick={() => setActiveTab('memorial')} className="text-[#d6b583] text-[11px] hover:underline font-bold">Viết lời kính viếng</button>
                </div>
                <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto bg-[#faf8f4]">
                  {tributes.map(t => (
                    <div key={t.id} className="bg-white rounded p-2.5 border border-[#eadecb] shadow-sm text-xs relative">
                      <div className="flex justify-between items-center mb-1 text-[10px]">
                        <span className="font-bold text-[#6b4724]">{t.senderName} ({t.relation})</span>
                        <span className="text-[#8b7355]">{t.date}</span>
                      </div>
                      <p className="text-[#5a3d1c] italic text-[11px]">"{t.message}"</p>
                    </div>
                  ))}
                </div>
              </div>

            </aside>

          </div>
        )}

        {/* ==================== 2. TAB FAMILY TREE ==================== */}
        {activeTab === 'family-tree' && (
          <div className="space-y-6">
            
            {/* Visual Traditional Tree Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-[#eadecb] p-4 md:p-6 overflow-x-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#6b4724] font-playfair inline-block border-b-2 border-[#b8956b] pb-2 uppercase tracking-wide">
                  Sơ Đồ Hệ Thống Gia Phả Gia Đình Cụ Nghiêm Cung
                </h2>
                <p className="text-xs text-[#8b7355] mt-2 italic">Nhấn vào các thành viên để mở hồ sơ lý lịch chi tiết và khám phá liên kết gia đình</p>
              </div>

              {/* Mini responsive flowchart */}
              <div className="flex flex-col items-center py-4 min-w-[760px] select-none">
                
                {/* Generation 15 (Ancestor) */}
                <div className="flex justify-center items-center space-x-4">
                  <button 
                    onClick={() => { const x = members.find(m => m.id === 'nghiem-dieu'); if(x) setSelectedMember(x); }}
                    className="flex flex-col items-center bg-blue-50 hover:bg-blue-100 hover:scale-105 border-2 border-blue-600 rounded p-2 text-center transition shadow-sm w-32"
                  >
                    <span className="text-[9px] uppercase font-bold text-blue-800">Cụ Cố Ông Đời 15</span>
                    <span className="text-xs font-bold uppercase text-[#4a3219]">Nghiêm Điều</span>
                    <span className="text-[10px] text-gray-500">(Chu)</span>
                  </button>
                  <div className="h-[2px] w-8 bg-[#8b7355]"></div>
                  <button 
                    onClick={() => { const x = members.find(m => m.id === 'cu-ba-lun'); if(x) setSelectedMember(x); }}
                    className="flex flex-col items-center bg-pink-50 hover:bg-pink-100 hover:scale-105 border-2 border-pink-500 rounded p-2 text-center transition shadow-sm w-32"
                  >
                    <span className="text-[9px] uppercase font-bold text-pink-700">Cụ Cố Bà Đời 15</span>
                    <span className="text-xs font-bold uppercase text-[#4a3219]">Cụ Bà Lùn</span>
                  </button>
                </div>

                {/* Connection Line */}
                <div className="w-[2px] h-6 bg-[#8b7355]"></div>

                {/* Generation 16 (Cụ Nghiêm Cung) */}
                <button 
                  onClick={() => { const x = members.find(m => m.id === 'nghiem-cung'); if(x) setSelectedMember(x); }}
                  className="flex flex-col items-center bg-amber-50 hover:bg-amber-100 hover:scale-105 border-2 border-amber-500 rounded p-2.5 text-center transition shadow-sm w-36"
                >
                  <span className="text-[9px] uppercase font-bold text-amber-800 font-playfair">Cụ Ông Đời 16</span>
                  <span className="text-xs font-bold uppercase text-[#4a3219]">Nghiêm Cung</span>
                </button>

                {/* Connection line branching */}
                <div className="w-[2px] h-6 bg-[#8b7355]"></div>
                <div className="w-[500px] h-[2px] bg-[#8b7355]"></div>

                {/* Branch level (Cụ Bà Cả & Cụ Bà Hai) */}
                <div className="flex justify-between w-[520px] pt-1">
                  
                  {/* Left Side: Chi Cụ Bà Cả */}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => { const x = members.find(m => m.id === 'cu-ba-ca'); if(x) setSelectedMember(x); }}
                      className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-500 rounded p-2 text-center w-32 transition shadow-sm"
                    >
                      <span className="text-[9px] uppercase font-bold text-purple-700">Cụ Bà Cả</span>
                      <span className="text-xs font-bold block text-[#4a3219]">Thế Hệ 16</span>
                    </button>
                    
                    <div className="w-[2px] h-5 bg-[#8b7355]"></div>
                    <div className="w-[120px] h-[2px] bg-[#8b7355]"></div>
                    
                    <div className="flex justify-between w-[140px] pt-1">
                      <button 
                        onClick={() => { const x = members.find(m => m.id === 'con-gai-ca'); if(x) setSelectedMember(x); }}
                        className="bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded p-1.5 text-center text-xs w-16"
                      >
                        <span className="block font-bold">N.T. Nhất</span>
                        <span className="text-[9px] text-gray-500">Đời 17</span>
                      </button>
                      <button 
                        onClick={() => { const x = members.find(m => m.id === 'con-gai-hai'); if(x) setSelectedMember(x); }}
                        className="bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded p-1.5 text-center text-xs w-16"
                      >
                        <span className="block font-bold">N.T. Hai</span>
                        <span className="text-[9px] text-gray-500">Đời 17</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Chi Cụ Bà Hai */}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => { const x = members.find(m => m.id === 'cu-ba-hai'); if(x) setSelectedMember(x); }}
                      className="bg-red-50 hover:bg-red-100 border-2 border-red-500 rounded p-2 text-center w-32 transition shadow-sm"
                    >
                      <span className="text-[9px] uppercase font-bold text-red-700">Cụ Bà Hai</span>
                      <span className="text-xs font-bold block text-[#4a3219]">Thế Hệ 16</span>
                    </button>
                    
                    <div className="w-[2px] h-5 bg-[#8b7355]"></div>
                    <div className="w-[340px] h-[2px] bg-[#8b7355]"></div>
                    
                    {/* Gener 17 children */}
                    <div className="flex justify-between w-[360px] pt-1">
                      <button 
                        onClick={() => { const x = members.find(m => m.id === 'ngiem-canh' || m.id === 'nghiem-canh'); if(x) setSelectedMember(x); }}
                        className="bg-red-50 hover:bg-red-100 border border-red-300 rounded p-1.5 text-center text-xs w-16"
                      >
                        <span className="block font-bold">N. Cảnh</span>
                        <span className="text-[9px] text-red-600 font-bold">Đã khuất</span>
                      </button>

                      <button 
                        onClick={() => { const x = members.find(m => m.id === 'nghiem-thi-toan'); if(x) setSelectedMember(x); }}
                        className="bg-red-50 hover:bg-red-100 border border-red-300 rounded p-1.5 text-center text-xs w-16"
                      >
                        <span className="block font-bold">N.T. Toàn</span>
                        <span className="text-[9px] text-red-600 font-bold">Đã khuất</span>
                      </button>

                      <button 
                        onClick={() => { const x = members.find(m => m.id === 'nghiem-phac'); if(x) setSelectedMember(x); }}
                        className="bg-green-50 hover:bg-green-100 border border-green-400 rounded p-1.5 text-center text-xs w-16"
                      >
                        <span className="block font-bold">N. Phác</span>
                        <span className="text-[9px] text-green-700 font-bold">Sống</span>
                      </button>

                      <button 
                        onClick={() => { const x = members.find(m => m.id === 'nghiem-xuan-ma'); if(x) setSelectedMember(x); }}
                        className="bg-red-50 hover:bg-red-100 border border-red-300 rounded p-1.5 text-center text-xs w-16"
                      >
                        <span className="block font-bold">N.X. Mã</span>
                        <span className="text-[9px] text-red-600 font-bold">Đã khuất</span>
                      </button>

                      <button 
                        onClick={() => { const x = members.find(m => m.id === 'nghiem-thi-hoan'); if(x) setSelectedMember(x); }}
                        className="bg-green-50 hover:bg-green-100 border border-green-400 rounded p-1.5 text-center text-xs w-16"
                      >
                        <span className="block font-bold">N.T. Hoàn</span>
                        <span className="text-[9px] text-green-700 font-bold">Sống</span>
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            </div>

            {/* INTERACTIVE RELATIVE EXPLORER - Absolutely incredible feature */}
            <div className="bg-white rounded-lg shadow-sm border border-[#eadecb] p-6">
              <h3 className="text-lg font-bold text-[#6b4724] font-playfair border-b pb-2 mb-4 uppercase tracking-wide flex items-center justify-between">
                <span>Bộ Công Cụ Khám Phá Liên Kết Dòng Họ</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>

              {!selectedMember ? (
                <div className="text-center py-8 bg-[#faf8f4] rounded border border-dashed border-[#eadecb]">
                  <TreeDeciduous className="w-12 h-12 text-[#b8956b] opacity-40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#8b7355]">Chọn một thành viên từ Sơ Đồ Cây ở trên hoặc nhấn nút bên dưới để chọn thành viên gốc</p>
                  <button 
                    onClick={() => { const root = members.find(m => m.id === 'nghiem-cung'); if(root) setSelectedMember(root); }}
                    className="mt-4 px-4 py-2 bg-[#b8956b] hover:bg-[#8b7355] text-white text-xs font-bold rounded shadow transition"
                  >
                    Chọn Cụ Nghiêm Cung làm Trung Tâm
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Selected Member Spotlight */}
                  <div className="bg-[#fdfbf7] border-2 border-[#b8956b] rounded-lg p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] uppercase bg-[#b8956b] text-white px-2 py-0.5 rounded font-bold">
                          Đời {selectedMember.generation}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedMember.isAlive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {selectedMember.isAlive ? 'Còn sống' : 'Đã khuất'}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-[#6b4724] uppercase font-playfair">{selectedMember.name}</h4>
                      {selectedMember.nickname && <p className="text-xs text-[#8b7355] font-semibold">Tên gọi khác: {selectedMember.nickname}</p>}
                      
                      <div className="text-xs text-[#5a3d1c] space-y-2 mt-4 border-t border-[#eadecb] pt-3">
                        <p><strong>Vai trò:</strong> {selectedMember.role}</p>
                        <p><strong>Giới tính:</strong> {selectedMember.gender === 'male' ? 'Nam' : 'Nữ'}</p>
                        {selectedMember.birthDate && <p><strong>Năm sinh:</strong> {selectedMember.birthDate}</p>}
                        {selectedMember.deathDate && <p><strong>Năm mất:</strong> {selectedMember.deathDate}</p>}
                        {selectedMember.phone && <p><strong>Điện thoại:</strong> {selectedMember.phone}</p>}
                        {selectedMember.address && <p><strong>Nơi ở hiện nay:</strong> {selectedMember.address}</p>}
                        {selectedMember.burialPlace && <p><strong>Vị trí phần mộ:</strong> {selectedMember.burialPlace}</p>}
                        {selectedMember.education && <p><strong>Học vị / Nghề nghiệp:</strong> {selectedMember.education}</p>}
                        
                        {/* Custom computed fields */}
                        {(() => {
                          const ageText = getAgeOrLongevityText(selectedMember);
                          if (!ageText) return null;
                          return (
                            <div className="bg-amber-50/60 p-2 rounded border border-amber-200/50 mt-1 text-[11px] font-semibold text-amber-900">
                              <strong>{ageText.label}:</strong> {ageText.value}
                            </div>
                          );
                        })()}

                        {!selectedMember.isAlive && selectedMember.deathDate && (() => {
                          const lunarResult = convertSolarToLunar(selectedMember.deathDate);
                          if (!lunarResult) return null;
                          return (
                            <div className="bg-red-50/30 p-2 rounded border border-red-200/30 mt-1 text-[11px] font-medium text-red-800">
                              <strong>Ngày giỗ Âm lịch:</strong> {lunarResult.lunarDateStr}
                            </div>
                          );
                        })()}

                        {selectedMember.householdGroup && (
                          <div className="bg-red-50/50 text-red-950 border border-red-200 p-2 rounded text-[11px] font-semibold mt-1">
                            <strong>Bầu đoàn nhà cụ:</strong> {selectedMember.householdGroup}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-[#eadecb] space-y-2">
                      <p className="text-xs font-semibold text-[#8b7355]">Tiểu sử / Ghi chú:</p>
                      <p className="text-xs text-[#5a3d1c] italic bg-white p-2 rounded border border-[#eadecb] max-h-24 overflow-y-auto">
                        {selectedMember.bio || 'Chưa có dữ liệu biên niên tiểu sử.'}
                      </p>
                      
                      {!selectedMember.isAlive && (
                        <button 
                          onClick={() => handleTributeToAncestor(selectedMember)}
                          className="w-full text-center bg-[#3e2a16] text-white py-2 rounded text-xs font-bold hover:bg-[#2a1d0f] transition mt-2 flex items-center justify-center gap-1"
                        >
                          <Flame className="w-3.5 h-3.5 text-orange-400" /> Thắp hương & Tưởng nhớ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Relative connections navigation */}
                  <div className="lg:col-span-2 bg-[#faf8f4] border border-[#eadecb] rounded-lg p-5">
                    <h4 className="font-bold text-[#6b4724] text-sm border-b border-[#eadecb] pb-2 mb-4 flex items-center justify-between">
                      <span>Mạng Lưới Thân Nhân Thân Cận</span>
                      <span className="text-xs text-[#8b7355] font-normal">Nhấp vào một người thân để chuyển đổi trung tâm</span>
                    </h4>

                    {(() => {
                      const rels = getRelativeInfo(selectedMember);
                      const hasAny = rels.father || rels.mother || rels.spouse || rels.siblings.length > 0 || rels.children.length > 0;
                      
                      if (!hasAny) {
                        return <p className="text-xs text-center text-gray-500 py-10">Chưa ghi nhận thông tin quan hệ thân nhân liên quan.</p>;
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          
                          {/* Cha & Mẹ */}
                          <div className="space-y-2">
                            <div className="font-bold text-[#8b7355] text-[11px] uppercase tracking-wider">Cha Mẹ sinh thành</div>
                            <div className="flex flex-col gap-2">
                              {rels.father ? (
                                <button 
                                  onClick={() => setSelectedMember(rels.father!)}
                                  className="text-left p-2 rounded bg-white hover:bg-amber-50 border border-[#eadecb] hover:border-[#b8956b] transition block"
                                >
                                  <span className="text-[10px] text-blue-700 font-bold block">Cha</span>
                                  <span className="font-bold">{rels.father.name}</span>
                                </button>
                              ) : (
                                <div className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-400">Không có dữ liệu Cha</div>
                              )}

                              {rels.mother ? (
                                <button 
                                  onClick={() => setSelectedMember(rels.mother!)}
                                  className="text-left p-2 rounded bg-white hover:bg-amber-50 border border-[#eadecb] hover:border-[#b8956b] transition block"
                                >
                                  <span className="text-[10px] text-pink-700 font-bold block">Mẹ</span>
                                  <span className="font-bold">{rels.mother.name}</span>
                                </button>
                              ) : (
                                <div className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-400">Không có dữ liệu Mẹ</div>
                              )}
                            </div>
                          </div>

                          {/* Bạn Đời / Phối Ngẫu */}
                          <div className="space-y-2">
                            <div className="font-bold text-[#8b7355] text-[11px] uppercase tracking-wider">Phối ngẫu / Bạn đời</div>
                            {rels.spouse ? (
                              <button 
                                onClick={() => setSelectedMember(rels.spouse!)}
                                className="w-full text-left p-2 rounded bg-white hover:bg-amber-50 border border-[#eadecb] hover:border-[#b8956b] transition block"
                              >
                                <span className="text-[10px] text-[#b8956b] font-bold block">Vợ / Chồng</span>
                                <span className="font-bold">{rels.spouse.name}</span>
                              </button>
                            ) : (
                              <div className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-400">Không có dữ liệu Phối ngẫu</div>
                            )}
                          </div>

                          {/* Anh Chị Em Ruột */}
                          <div className="space-y-2 md:col-span-1">
                            <div className="font-bold text-[#8b7355] text-[11px] uppercase tracking-wider">Anh chị em ruột ({rels.siblings.length})</div>
                            {rels.siblings.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
                                {rels.siblings.map(sib => (
                                  <button 
                                    key={sib.id}
                                    onClick={() => setSelectedMember(sib)}
                                    className="px-2.5 py-1.5 rounded bg-white hover:bg-amber-50 border border-[#eadecb] font-medium transition text-left"
                                  >
                                    {sib.name}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-400">Không có anh chị em ruột</div>
                            )}
                          </div>

                          {/* Con Cái */}
                          <div className="space-y-2 md:col-span-1">
                            <div className="font-bold text-[#8b7355] text-[11px] uppercase tracking-wider">Hậu duệ / Con cái ({rels.children.length})</div>
                            {rels.children.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
                                {rels.children.map(child => (
                                  <button 
                                    key={child.id}
                                    onClick={() => setSelectedMember(child)}
                                    className="px-2.5 py-1.5 rounded bg-white hover:bg-amber-50 border border-[#eadecb] font-medium transition text-left"
                                  >
                                    {child.name}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-400">Không có dữ liệu con cái</div>
                            )}
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== 3. TAB MEMBER LIST ==================== */}
        {activeTab === 'member-list' && (
          <div className="bg-white rounded-lg shadow-sm border border-[#eadecb] p-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#eadecb] pb-4 mb-6 gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#6b4724] font-playfair uppercase tracking-wide">
                  Danh Sách Thành Viên Gia Tộc
                </h2>
                <p className="text-xs text-[#8b7355] mt-1">Tổng cộng có {filteredMembers.length} thành viên khớp với bộ lọc tìm kiếm.</p>
              </div>

              {/* Quick Admin action */}
              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => {
                    setFormMode('add');
                    setMemberForm({
                      name: '', nickname: '', gender: 'male', role: '', generation: 17,
                      isAlive: true, branch: 'hai', bio: '', burialPlace: '', phone: '', address: '', education: '', householdGroup: ''
                    });
                    setShowMemberForm(true);
                  }}
                  className="px-4 py-2 bg-[#b8956b] hover:bg-[#8b7355] text-white text-xs font-bold rounded shadow transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Thêm thành viên mới
                </button>
              )}
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 mb-6 bg-[#faf8f4] p-4 rounded-lg border border-[#eadecb]">
              
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#6b4724] uppercase mb-1">Tìm kiếm theo tên</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nhập họ tên cần tìm..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs p-2 pl-8 border border-[#d6b583] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#b8956b]"
                  />
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6b4724] uppercase mb-1">Thế hệ / Đời</label>
                <select 
                  value={filterGen}
                  onChange={(e) => setFilterGen(e.target.value)}
                  className="w-full text-xs p-2 border border-[#d6b583] rounded bg-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="15">Thế hệ 15</option>
                  <option value="16">Thế hệ 16</option>
                  <option value="17">Thế hệ 17</option>
                  <option value="18">Thế hệ 18</option>
                  <option value="19">Thế hệ 19</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6b4724] uppercase mb-1">Giới tính</label>
                <select 
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full text-xs p-2 border border-[#d6b583] rounded bg-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6b4724] uppercase mb-1">Trạng thái</label>
                <select 
                  value={filterAlive}
                  onChange={(e) => setFilterAlive(e.target.value)}
                  className="w-full text-xs p-2 border border-[#d6b583] rounded bg-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="alive">Còn sống</option>
                  <option value="deceased">Đã khuất</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#6b4724] uppercase mb-1">Chi / Ngành</label>
                <select 
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="w-full text-xs p-2 border border-[#d6b583] rounded bg-white"
                >
                  <option value="all">Tất cả chi</option>
                  <option value="goc">Chi Gốc (Tổ)</option>
                  <option value="ca">Nhánh Cụ Bà Cả</option>
                  <option value="hai">Nhánh Cụ Bà Hai</option>
                </select>
              </div>

            </div>

            {/* Members Grid layout */}
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Không tìm thấy thành viên dòng họ nào phù hợp với bộ lọc tìm kiếm.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMembers.map(m => (
                  <div 
                    key={m.id} 
                    className={`bg-[#faf8f4] p-4 rounded-lg border hover:shadow-md transition flex flex-col justify-between ${selectedMember?.id === m.id ? 'border-[#b8956b] shadow-sm bg-amber-50/20' : 'border-[#eadecb]'}`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] uppercase font-bold text-[#8b7355] bg-white px-1.5 py-0.5 rounded border border-[#eadecb]">
                          Thế hệ {m.generation}
                        </span>
                        <span className={`text-[10px] font-bold ${m.isAlive ? 'text-green-700' : 'text-red-700'}`}>
                          {m.isAlive ? '● Còn sống' : '† Đã khuất'}
                        </span>
                      </div>

                      <h3 className="font-bold text-[#6b4724] text-base hover:underline cursor-pointer" onClick={() => { setSelectedMember(m); setActiveTab('family-tree'); }}>
                        {m.name}
                      </h3>
                      {m.nickname && <p className="text-[11px] text-[#8b7355] italic">({m.nickname})</p>}
                      
                      <div className="text-xs text-[#5a3d1c] mt-3 space-y-1 border-t border-[#eadecb]/50 pt-2.5">
                        <p><strong>Vai trò:</strong> {m.role}</p>
                        {m.birthDate && <p><strong>Năm sinh:</strong> {m.birthDate}</p>}
                        
                        {/* Custom computed fields */}
                        {(() => {
                          const ageText = getAgeOrLongevityText(m);
                          if (!ageText) return null;
                          return (
                            <p className="text-[11px] font-semibold text-amber-800">
                              <strong>{ageText.label}:</strong> {ageText.value}
                            </p>
                          );
                        })()}

                        {!m.isAlive && m.deathDate && (() => {
                          const lunarResult = convertSolarToLunar(m.deathDate);
                          if (!lunarResult) return null;
                          return (
                            <p className="text-[11px] text-red-800">
                              <strong>Ngày giỗ AL:</strong> {lunarResult.lunarDateStr.replace('Ngày ', '').replace('tháng ', '/').replace('năm ', ' ')}
                            </p>
                          );
                        })()}

                        {m.householdGroup && (
                          <p className="text-[11px] text-red-700 font-medium">
                            <strong>Bầu đoàn:</strong> {m.householdGroup}
                          </p>
                        )}

                        {m.branch === 'ca' ? (
                          <span className="inline-block mt-1 text-[9px] font-bold text-purple-700 bg-purple-50 px-1 rounded">Dòng Cụ Bà Cả</span>
                        ) : m.branch === 'hai' ? (
                          <span className="inline-block mt-1 text-[9px] font-bold text-red-700 bg-red-50 px-1 rounded">Dòng Cụ Bà Hai</span>
                        ) : (
                          <span className="inline-block mt-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1 rounded">Chi Gốc</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-dashed border-[#eadecb] flex items-center justify-between text-[11px]">
                      <button 
                        onClick={() => { setSelectedMember(m); setActiveTab('family-tree'); }}
                        className="text-[#b8956b] font-bold hover:underline"
                      >
                        Xem liên kết
                      </button>

                      {currentUser?.role === 'admin' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => editMemberClick(m)} 
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Sửa thành viên"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteMember(m.id)} 
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Xóa thành viên"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ==================== 4. TAB MEMORIAL ==================== */}
        {activeTab === 'memorial' && (
          <div className="bg-[#121212] rounded-lg shadow-2xl border border-[#2a2a2a] p-4 md:p-8 text-[#eadecb]">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-[#b8956b] text-xs font-bold tracking-[0.25em] uppercase block mb-2">Bàn Thờ Gia Tiên • Kính Cẩn Bái Vọng</span>
              <h2 className="text-2xl md:text-4xl font-bold font-playfair uppercase text-white tracking-wide">Phòng Thờ & Tưởng Niệm Gia Đường</h2>
              <p className="text-[11px] md:text-xs text-gray-400 mt-2">
                Không gian thờ tự tâm linh tam cấp trang nghiêm của dòng họ Nghiêm Cung. Nơi cháu con dâng hương thắp nến cầu nguyện tiên tổ anh linh an lạc, soi đường dẫn lối cho hậu duệ đời đời.
              </p>
            </div>

            {/* THREE-TIER ALTAR DISPLAY */}
            <div className="w-full bg-[#1c140d] bg-gradient-to-b from-[#251910] via-[#1a110a] to-[#120b06] rounded-2xl border-2 border-[#543d26] p-4 md:p-8 relative overflow-hidden mb-8 shadow-[inset_0_4px_30px_rgba(0,0,0,0.9)]">
              
              {/* Altar Ambient overlay glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none"></div>

              {/* Smoke Particles from incense burner floating up */}
              <div className="absolute inset-x-0 top-0 h-[450px] pointer-events-none z-20 overflow-hidden">
                {smokeParticles.map(p => (
                  <div 
                    key={p.id}
                    className="absolute bottom-32 w-6 h-6 bg-gray-400/10 rounded-full filter blur-lg smoke-particle"
                    style={{ left: `${p.left}%` }}
                  ></div>
                ))}
              </div>

              {/* 3-Tier Traditional Structured Steps */}
              <div className="flex flex-col space-y-6 relative z-10">
                
                {/* ----------------- CẤP THƯỢNG (TIER 1 - HIGHEST) ----------------- */}
                <div className="flex flex-col items-center">
                  <div className="text-center mb-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#d6b583] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/50">Cấp Thượng • Ngai Thờ Thượng Vị</span>
                  </div>
                  
                  {/* Majestic Ancestral Throne / Ngai Thờ (ỷ) */}
                  <div className="relative w-48 h-44 bg-gradient-to-b from-yellow-600 via-amber-800 to-amber-950 border-2 border-yellow-500 rounded-lg p-3 shadow-xl flex flex-col items-center justify-between text-center before:absolute before:inset-1 before:border before:border-yellow-400/30 before:rounded">
                    {/* Throne Crown Graphic */}
                    <div className="absolute -top-3 inset-x-0 flex justify-center">
                      <div className="w-24 h-4 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full border border-yellow-400 shadow-md flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                      </div>
                    </div>

                    {/* Miniature Pillars on left/right */}
                    <div className="absolute left-1.5 top-4 bottom-4 w-1.5 bg-yellow-500 rounded-full shadow"></div>
                    <div className="absolute right-1.5 top-4 bottom-4 w-1.5 bg-yellow-500 rounded-full shadow"></div>

                    <div className="mt-2 text-[#fff3e0] z-10 font-bold tracking-widest text-[9px] font-playfair uppercase">Nghiêm Gia Đường</div>
                    
                    {/* The Ancestral Tablet placed inside the Throne (ỷ thờ) */}
                    <div className="bg-gradient-to-b from-red-800 to-red-950 w-36 py-3 px-1 border border-yellow-400 rounded shadow-md z-10 flex flex-col items-center my-1.5">
                      <div className="text-[8px] text-yellow-400 tracking-wider font-bold mb-1">嚴氏宗族</div>
                      <div className="text-[10px] text-white font-serif font-bold leading-tight select-none writing-vertical">
                        ĐẠI TỔ KHẢO TỶ
                      </div>
                      <div className="text-[8px] text-yellow-400 tracking-wide mt-1 font-semibold">TỔ TIÊN VỊ TIỀN</div>
                    </div>

                    <div className="text-[8px] text-yellow-400/90 z-10 font-medium italic">Kính cẩn thần vị phụng thờ</div>
                  </div>

                  {/* Wood pedestal for Tier 1 */}
                  <div className="w-72 h-4 bg-gradient-to-r from-[#2c1d11] via-[#543d26] to-[#2c1d11] border-y border-[#78593a] rounded shadow-md mt-1"></div>
                </div>

                {/* ----------------- CẤP TRUNG (TIER 2 - MIDDLE - SENIOR DECEASED MEMBERS) ----------------- */}
                <div className="flex flex-col items-center">
                  <div className="text-center mb-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#d6b583] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/50">Cấp Trung • Tiên Tổ Cao Đời (Đời 15 - 17)</span>
                  </div>

                  {/* Tablet Grid for Senior Deceased (generation <= 17) */}
                  <div className="w-full max-w-4xl bg-gradient-to-b from-[#160f09] to-[#0f0a05] border border-[#3e2a16] p-4 rounded-xl shadow-inner min-h-[140px] flex flex-wrap justify-center gap-4 items-center">
                    {deceasedMembers.filter(m => m.generation <= 17).length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-6">Chưa có thông tin bài vị Tiên tổ tiền bối.</p>
                    ) : (
                      deceasedMembers
                        .filter(m => m.generation <= 17)
                        .sort((a, b) => a.generation - b.generation)
                        .map(anc => {
                          const ageInfo = getAgeOrLongevityText(anc);
                          const lunarInfo = anc.deathDate ? convertSolarToLunar(anc.deathDate) : null;
                          return (
                            <div 
                              key={anc.id}
                              onClick={() => handleTributeToAncestor(anc)}
                              title="Click để dâng lễ kính viếng"
                              className="relative w-28 bg-gradient-to-b from-red-800 to-red-950 border-2 border-yellow-600 rounded-t-md p-2 shadow-md hover:shadow-yellow-600/30 cursor-pointer hover:scale-105 transition-all duration-200 text-center flex flex-col justify-between h-[120px]"
                            >
                              {/* Gold trim */}
                              <div className="absolute top-0 inset-x-0 h-1 bg-yellow-500"></div>
                              <div className="text-[7px] text-yellow-400 font-bold tracking-widest uppercase bg-black/50 px-1 py-0.2 rounded-sm w-max mx-auto">Đời {anc.generation}</div>
                              
                              <div className="my-1">
                                <h4 className="text-[10px] font-bold text-white font-playfair tracking-wide leading-tight">{anc.name}</h4>
                                {anc.nickname && <p className="text-[8px] text-yellow-300 italic">({anc.nickname})</p>}
                                <p className="text-[7px] text-gray-300 mt-0.5 font-medium">{anc.role}</p>
                              </div>

                              <div className="text-[7px] text-gray-400 border-t border-yellow-500/30 pt-1 leading-tight">
                                {ageInfo && <p className="text-[#d6b583] font-semibold">{ageInfo.label}: {ageInfo.value}</p>}
                                {lunarInfo && <p className="text-[6px] text-gray-400 truncate">Giỗ: {lunarInfo.lunarDateStr.replace('Ngày ', '').replace('tháng ', '/').replace('năm ', ' ')}</p>}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Wood pedestal for Tier 2 */}
                  <div className="w-11/12 h-5 bg-gradient-to-r from-[#22160d] via-[#4d3721] to-[#22160d] border-y border-[#6b4c2e] rounded shadow-md mt-1"></div>
                </div>

                {/* ----------------- CẤP HẠ (TIER 3 - BOTTOM - JUNIOR DECEASED MEMBERS) ----------------- */}
                <div className="flex flex-col items-center">
                  <div className="text-center mb-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#d6b583] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/50">Cấp Hạ • Hậu Duệ Linh Thần (Đời 18 trở đi)</span>
                  </div>

                  {/* Tablet Grid for Junior Deceased (generation >= 18) */}
                  <div className="w-full max-w-4xl bg-gradient-to-b from-[#160f09] to-[#0f0a05] border border-[#3e2a16] p-4 rounded-xl shadow-inner min-h-[140px] flex flex-wrap justify-center gap-4 items-center">
                    {deceasedMembers.filter(m => m.generation >= 18).length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-6">Chưa có thông tin bài vị con cháu.</p>
                    ) : (
                      deceasedMembers
                        .filter(m => m.generation >= 18)
                        .sort((a, b) => a.generation - b.generation)
                        .map(anc => {
                          const ageInfo = getAgeOrLongevityText(anc);
                          const lunarInfo = anc.deathDate ? convertSolarToLunar(anc.deathDate) : null;
                          return (
                            <div 
                              key={anc.id}
                              onClick={() => handleTributeToAncestor(anc)}
                              title="Click để dâng lễ kính viếng"
                              className="relative w-28 bg-gradient-to-b from-[#5c0000] to-[#2b0000] border-2 border-[#b8956b] rounded-t-md p-2 shadow-md hover:shadow-amber-600/30 cursor-pointer hover:scale-105 transition-all duration-200 text-center flex flex-col justify-between h-[120px]"
                            >
                              {/* Gold trim */}
                              <div className="absolute top-0 inset-x-0 h-1 bg-[#b8956b]"></div>
                              <div className="text-[7px] text-[#d6b583] font-bold tracking-widest uppercase bg-black/50 px-1 py-0.2 rounded-sm w-max mx-auto">Đời {anc.generation}</div>
                              
                              <div className="my-1">
                                <h4 className="text-[10px] font-bold text-white tracking-wide leading-tight">{anc.name}</h4>
                                {anc.nickname && <p className="text-[8px] text-amber-200/80 italic">({anc.nickname})</p>}
                                <p className="text-[7px] text-gray-300 mt-0.5">{anc.role}</p>
                              </div>

                              <div className="text-[7px] text-gray-400 border-t border-[#b8956b]/30 pt-1 leading-tight">
                                {ageInfo && <p className="text-[#b8956b] font-semibold">{ageInfo.label}: {ageInfo.value}</p>}
                                {lunarInfo && <p className="text-[6px] text-gray-400 truncate">Giỗ: {lunarInfo.lunarDateStr.replace('Ngày ', '').replace('tháng ', '/').replace('năm ', ' ')}</p>}
                                {anc.householdGroup && <p className="text-[6px] text-red-400 truncate mt-0.5">{anc.householdGroup}</p>}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Grand Base Wood Table for Tier 3 & Offering Instruments */}
                  <div className="w-full h-8 bg-gradient-to-r from-[#1b110a] via-[#3d2a19] to-[#1b110a] border-y-2 border-[#543d26] rounded shadow-lg mt-1 relative flex items-center justify-between px-6">
                    <div className="w-2.5 h-6 bg-yellow-600/20 border border-yellow-600/30 rounded"></div>
                    <div className="text-[10px] text-[#b8956b] tracking-[0.3em] uppercase font-bold font-serif opacity-70">Án Thờ Nghiêm Cung Điện</div>
                    <div className="w-2.5 h-6 bg-yellow-600/20 border border-yellow-600/30 rounded"></div>
                  </div>
                </div>

                {/* ----------------- OFFERINGS & RITUAL ACCESSORIES DECK ----------------- */}
                <div className="bg-[#140e0a] border border-[#2d1e13] rounded-xl p-5 mt-4 flex flex-col md:flex-row items-center justify-around gap-6 shadow-inner">
                  
                  {/* Left: Traditional Altar Candle 1 */}
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-4 h-12 bg-gradient-to-b from-red-600 to-red-800 rounded-t-lg relative flex flex-col items-center">
                      {/* Fire Wick and animated fire candle */}
                      <div className="absolute -top-6 w-2.5 h-6 bg-gradient-to-t from-red-500 via-orange-400 to-yellow-200 rounded-full shadow-[0_0_12px_#ff7700] animate-bounce"></div>
                      <div className="absolute -top-3 w-0.5 h-3 bg-black"></div>
                    </div>
                    {/* Golden Candlestick Base */}
                    <div className="w-8 h-4 bg-yellow-500 rounded-t-sm shadow-md border-t border-yellow-400"></div>
                    <div className="w-12 h-2 bg-yellow-600 rounded-b shadow-md"></div>
                    <span className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Thần Đăng Tả</span>
                  </div>

                  {/* Center: The Incense Burner / Lư Hương Đồng */}
                  <div className="flex flex-col items-center">
                    {/* Glowing active incense stick counts */}
                    <div className="flex justify-center space-x-1.5 mb-[-8px]">
                      {Array.from({ length: Math.min(5, Math.ceil(incenseCount / 50) + 1) }).map((_, idx) => (
                        <div key={idx} className="w-0.5 h-12 bg-gradient-to-t from-amber-800 to-orange-400 rounded-t relative">
                          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-600 rounded-full shadow-[0_0_8px_#ff5e00] animate-ping"></div>
                        </div>
                      ))}
                    </div>

                    {/* Main Brass Incense Bowl */}
                    <div className="w-24 h-18 bg-gradient-to-b from-[#b5832a] via-[#855c16] to-[#402a06] rounded-b-3xl border-t-4 border-[#ffd075] flex flex-col items-center justify-center shadow-2xl relative">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-amber-100 text-center leading-tight">Nghiêm Gia</span>
                      <span className="text-[6px] text-yellow-500/80 uppercase font-bold tracking-widest mt-0.5">敬奉</span>
                    </div>

                    {/* Altar Pedestal under Altar Burner */}
                    <div className="w-28 h-2 bg-gradient-to-r from-amber-800 to-amber-950 rounded shadow-md mt-0.5"></div>
                  </div>

                  {/* Right: Offering Platters for Lotus Flowers and fruits */}
                  <div className="flex flex-col items-center">
                    {/* Pink Lotus Blossoms shown dynamically */}
                    <div className="flex justify-center items-end space-x-1 h-10 mb-1">
                      {flowerCount > 0 ? (
                        Array.from({ length: Math.min(4, Math.ceil(flowerCount / 10)) }).map((_, idx) => (
                          <div key={idx} className="text-pink-400 animate-pulse transition">
                            <Heart className="w-4 h-4 fill-pink-500" />
                          </div>
                        ))
                      ) : (
                        <span className="text-[8px] text-gray-600 italic">Chưa dâng hoa</span>
                      )}
                    </div>
                    {/* Offering Platter Bowl */}
                    <div className="w-20 h-5 bg-gradient-to-b from-yellow-500 to-amber-700 rounded-b-xl border-t border-yellow-300 shadow"></div>
                    <span className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Mâm Bồng Liên Hoa</span>
                  </div>

                  {/* Rightmost: Traditional Altar Candle 2 */}
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-4 h-12 bg-gradient-to-b from-red-600 to-red-800 rounded-t-lg relative flex flex-col items-center">
                      {/* Fire Wick and animated fire candle */}
                      <div className="absolute -top-6 w-2.5 h-6 bg-gradient-to-t from-red-500 via-orange-400 to-yellow-200 rounded-full shadow-[0_0_12px_#ff7700] animate-bounce"></div>
                      <div className="absolute -top-3 w-0.5 h-3 bg-black"></div>
                    </div>
                    {/* Golden Candlestick Base */}
                    <div className="w-8 h-4 bg-yellow-500 rounded-t-sm shadow-md border-t border-yellow-400"></div>
                    <div className="w-12 h-2 bg-yellow-600 rounded-b shadow-md"></div>
                    <span className="text-[9px] text-gray-500 mt-1 uppercase font-bold">Thần Đăng Hữu</span>
                  </div>

                </div>

              </div>

              {/* Counter Status Stats Overlay */}
              <div className="grid grid-cols-3 gap-3 text-center max-w-lg mx-auto my-6 py-2 border-y border-[#3a2c1d]/60 bg-black/30 rounded-lg px-2">
                <div>
                  <div className="text-xl font-bold text-yellow-500">{incenseCount}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-400">Lượt dâng hương</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-400">{candleCount}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-400">Ngọn nến hồng</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-pink-400">{flowerCount}</div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-400">Đóa sen dâng tế</div>
                </div>
              </div>

              {/* Altar interactive button controls */}
              <div className="flex flex-wrap justify-center gap-3 relative z-10">
                <button 
                  onClick={triggerIncense}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-[#121212] rounded-lg font-bold text-xs shadow-lg transition duration-200 flex items-center gap-1.5 transform hover:-translate-y-0.5 active:translate-y-0 border border-yellow-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Thắp một nén nhang
                </button>
                <button 
                  onClick={triggerCandle}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-bold text-xs shadow-lg transition duration-200 flex items-center gap-1.5 transform hover:-translate-y-0.5 active:translate-y-0 border border-red-500/20"
                >
                  <Flame className="w-3.5 h-3.5 animate-pulse" /> Thắp một ngọn nến
                </button>
                <button 
                  onClick={triggerFlower}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-800 hover:from-pink-700 hover:to-pink-900 text-white rounded-lg font-bold text-xs shadow-lg transition duration-200 flex items-center gap-1.5 transform hover:-translate-y-0.5 active:translate-y-0 border border-pink-500/20"
                >
                  <Heart className="w-3.5 h-3.5" /> Kính dâng đóa hoa sen
                </button>
              </div>

            </div>

            {/* Tribute and remembrance wall form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[#333]">
              
              <div className="lg:col-span-1 bg-[#1a1a1a] rounded-lg p-5 border border-[#2a2a2a]">
                <h4 className="font-bold text-white text-sm mb-3 uppercase tracking-wider border-b border-[#2d2d2d] pb-2">Gửi lời tri ân, tưởng niệm</h4>
                
                <form onSubmit={submitTribute} className="space-y-3.5 text-xs text-white">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Họ tên của bạn</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ví dụ: Nghiêm Xuân Long..." 
                      value={newTribName}
                      onChange={(e) => setNewTribName(e.target.value)}
                      className="w-full p-2 rounded bg-[#252525] border border-[#3e2a16] text-white focus:outline-none focus:border-[#b8956b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Quan hệ / Vai vế</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Cháu đích tôn, Con thứ..." 
                      value={newTribRelation}
                      onChange={(e) => setNewTribRelation(e.target.value)}
                      className="w-full p-2 rounded bg-[#252525] border border-[#3e2a16] text-white focus:outline-none focus:border-[#b8956b]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Gửi bái vọng riêng đến cụ</label>
                    <select 
                      value={newTribTarget}
                      onChange={(e) => setNewTribTarget(e.target.value)}
                      className="w-full p-2 rounded bg-[#252525] border border-[#3e2a16] text-white focus:outline-none focus:border-[#b8956b]"
                    >
                      <option value="all">Tất cả Gia tiên dòng họ Nghiêm Cung</option>
                      {deceasedMembers.map(m => (
                        <option key={m.id} value={m.id}>Cụ {m.name} (Đời {m.generation})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nội dung cầu chúc / Kỷ niệm</label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="Nhập lời cầu chúc an khang, tri ân thành tâm kính dâng tiên tổ..." 
                      value={newTribMessage}
                      onChange={(e) => setNewTribMessage(e.target.value)}
                      className="w-full p-2 rounded bg-[#252525] border border-[#3e2a16] text-white focus:outline-none focus:border-[#b8956b]"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-[#b8956b] hover:bg-[#8b7355] text-black font-bold py-2 rounded.5 transition shadow"
                  >
                    Gửi Lời Thành Tâm Kính Viếng
                  </button>
                </form>
              </div>

              {/* Tributes scroll board */}
              <div className="lg:col-span-2 bg-[#1a1a1a] rounded-lg p-5 border border-[#2a2a2a] flex flex-col justify-between max-h-[450px]">
                <div>
                  <h4 className="font-bold text-white text-sm mb-3 uppercase tracking-wider border-b border-[#2d2d2d] pb-2 flex items-center justify-between">
                    <span>Sổ Tơ Lòng Tưởng Niệm Gia Quyếnt</span>
                    <span className="text-xs text-gray-400 font-normal">Tổng số {tributes.length} lời bái vọng</span>
                  </h4>
                  
                  <div className="space-y-3 overflow-y-auto max-h-[360px] pr-2">
                    {tributes.map(t => (
                      <div key={t.id} className="p-3 bg-[#242424] rounded border border-[#333] hover:border-[#b8956b] transition text-xs">
                        <div className="flex justify-between items-center mb-1 text-[11px] text-[#d6b583]">
                          <span className="font-bold">{t.senderName} <span className="text-gray-400 font-normal">({t.relation})</span></span>
                          <span className="text-gray-500">{t.date}</span>
                        </div>
                        <p className="text-gray-200 italic leading-relaxed">"{t.message}"</p>
                        
                        {currentUser?.role === 'admin' && (
                          <div className="mt-2 text-right">
                            <button 
                              onClick={() => {
                                if (confirm('Xóa lời tưởng niệm này khỏi sổ lưu niệm?')) {
                                  setTributes(prev => prev.filter(item => item.id !== t.id));
                                }
                              }}
                              className="text-red-500 hover:underline text-[10px] font-bold"
                            >
                              Xóa bỏ
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== 5. TAB STATISTICS ==================== */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#eadecb]">
              <h2 className="text-xl md:text-2xl font-bold text-[#6b4724] font-playfair border-b pb-2 mb-6 uppercase tracking-wide">
                Báo Cáo Thống Kê Tổng Quan Gia Tộc
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-[#fdfbf7] rounded-lg border border-[#eadecb] text-center">
                  <div className="text-3xl font-bold text-[#b8956b] font-playfair">{stats.total}</div>
                  <div className="text-xs text-[#8b7355] font-semibold uppercase mt-1">Tổng Số Nhân Khẩu</div>
                </div>
                <div className="p-4 bg-[#fdfbf7] rounded-lg border border-[#eadecb] text-center">
                  <div className="text-3xl font-bold text-green-700 font-playfair">{stats.alive}</div>
                  <div className="text-xs text-[#8b7355] font-semibold uppercase mt-1">Còn Sống (Đang hưởng phúc)</div>
                </div>
                <div className="p-4 bg-[#fdfbf7] rounded-lg border border-[#eadecb] text-center">
                  <div className="text-3xl font-bold text-red-700 font-playfair">{stats.deceased}</div>
                  <div className="text-xs text-[#8b7355] font-semibold uppercase mt-1">Đã Khuất (Tiên tổ)</div>
                </div>
                <div className="p-4 bg-[#fdfbf7] rounded-lg border border-[#eadecb] text-center">
                  <div className="text-3xl font-bold text-[#6b4724] font-playfair">{Math.round((stats.male / stats.total) * 100) || 0}%</div>
                  <div className="text-xs text-[#8b7355] font-semibold uppercase mt-1">Tỷ Lệ Nam Giới</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
                
                {/* Generation breakdown chart using pure styled CSS */}
                <div className="bg-[#faf8f4] p-5 rounded-lg border border-[#eadecb]">
                  <h3 className="font-bold text-[#6b4724] font-playfair mb-4 uppercase tracking-wider text-center">
                    Cơ cấu thành viên theo thế hệ
                  </h3>
                  <div className="space-y-3.5">
                    {[15, 16, 17, 18, 19].map(g => {
                      const count = stats.byGeneration[g] || 0;
                      const percentage = Math.round((count / stats.total) * 100) || 0;
                      return (
                        <div key={g} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-[#5a3d1c]">
                            <span>Thế hệ đời thứ {g}</span>
                            <span>{count} thành viên ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#b8956b] h-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Donut Chart SVG for Gender and Branch breakdown */}
                <div className="bg-[#faf8f4] p-5 rounded-lg border border-[#eadecb] flex flex-col justify-between">
                  <h3 className="font-bold text-[#6b4724] font-playfair mb-4 uppercase tracking-wider text-center">
                    Phân bố dân số theo chi ngành
                  </h3>

                  <div className="space-y-4">
                    {/* Gốc */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#5a3d1c]">
                        <span>Thế hệ sáng tổ (Thượng tổ dòng họ)</span>
                        <span>{stats.byBranch.goc} người</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-700 h-full" style={{ width: `${(stats.byBranch.goc / stats.total) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* Cụ Bà Cả */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#5a3d1c]">
                        <span>Chi ngành nhánh Cụ Bà Cả</span>
                        <span>{stats.byBranch.ca} người ({Math.round((stats.byBranch.ca / stats.total) * 100) || 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full" style={{ width: `${(stats.byBranch.ca / stats.total) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* Cụ Bà Hai */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#5a3d1c]">
                        <span>Chi ngành nhánh Cụ Bà Hai</span>
                        <span>{stats.byBranch.hai} người ({Math.round((stats.byBranch.hai / stats.total) * 100) || 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-red-600 h-full" style={{ width: `${(stats.byBranch.hai / stats.total) * 100}%` }}></div>
                      </div>
                    </div>

                  </div>

                  <div className="border-t border-[#eadecb] pt-4 mt-4 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block">Nam giới</span>
                      <span className="text-lg font-bold text-blue-700">{stats.male}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-semibold uppercase block">Nữ giới</span>
                      <span className="text-lg font-bold text-pink-700">{stats.female}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ==================== 6. TAB ADMIN ==================== */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-sm border border-[#eadecb] overflow-hidden">
            
            {/* Header section with admin tabs */}
            <div className="bg-[#4a3219] text-white p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-yellow-400" />
                <div>
                  <h2 className="text-lg md:text-xl font-bold font-playfair uppercase">Bàn làm việc hệ thống quản trị</h2>
                  <p className="text-xs text-[#d6b583]">Quản trị viên: {currentUser.fullName}</p>
                </div>
              </div>

              {/* Internal admin sub-navigation */}
              <div className="flex space-x-1 border-t border-[#6b4724] md:border-0 pt-3 md:pt-0">
                <button 
                  onClick={() => setAdminSubTab('members')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition ${adminSubTab === 'members' ? 'bg-[#b8956b] text-black' : 'hover:bg-[#5c3e21]'}`}
                >
                  Nhân khẩu gia tộc
                </button>
                <button 
                  onClick={() => setAdminSubTab('announcements')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition ${adminSubTab === 'announcements' ? 'bg-[#b8956b] text-black' : 'hover:bg-[#5c3e21]'}`}
                >
                  Thông báo dòng họ
                </button>
                <button 
                  onClick={() => setAdminSubTab('accounts')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition ${adminSubTab === 'accounts' ? 'bg-[#b8956b] text-black' : 'hover:bg-[#5c3e21]'}`}
                >
                  Tài khoản hệ thống
                </button>
                <button 
                  onClick={() => setAdminSubTab('backup')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition ${adminSubTab === 'backup' ? 'bg-[#b8956b] text-black' : 'hover:bg-[#5c3e21]'}`}
                >
                  Sao lưu dữ liệu
                </button>
              </div>
            </div>

            {/* Inner Dashboard Content */}
            <div className="p-6">
              
              {/* SUBTAB 1: MANAGING MEMBERS */}
              {adminSubTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-sm text-[#6b4724] uppercase tracking-wide">Quản lý cơ sở dữ liệu nhân khẩu ({members.length})</h3>
                    <button 
                      onClick={() => {
                        setFormMode('add');
                        setMemberForm({
                          name: '', nickname: '', gender: 'male', role: '', generation: 17,
                          isAlive: true, branch: 'hai', bio: '', burialPlace: '', phone: '', address: '', education: '', householdGroup: ''
                        });
                        setShowMemberForm(true);
                      }}
                      className="px-3 py-1.5 bg-[#b8956b] hover:bg-[#8b7355] text-white text-xs font-bold rounded shadow transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm thành viên mới
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#faf8f4] text-[#6b4724] border-b-2 border-[#eadecb]">
                          <th className="p-2.5 font-bold">Họ và tên</th>
                          <th className="p-2.5 font-bold">Thế hệ</th>
                          <th className="p-2.5 font-bold">Phân hệ vai trò</th>
                          <th className="p-2.5 font-bold">Giới tính</th>
                          <th className="p-2.5 font-bold">Chi ngành</th>
                          <th className="p-2.5 font-bold">Trạng thái</th>
                          <th className="p-2.5 font-bold text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {members.map(m => (
                          <tr key={m.id} className="hover:bg-[#faf8f4]">
                            <td className="p-2.5 font-bold text-[#4a3219]">{m.name} {m.nickname && `(${m.nickname})`}</td>
                            <td className="p-2.5 font-semibold">Đời thứ {m.generation}</td>
                            <td className="p-2.5 text-gray-600">{m.role}</td>
                            <td className="p-2.5">{m.gender === 'male' ? 'Nam' : 'Nữ'}</td>
                            <td className="p-2.5">
                              {m.branch === 'ca' ? (
                                <span className="text-purple-700 font-bold bg-purple-50 px-1 py-0.5 rounded text-[10px]">Cụ Bà Cả</span>
                              ) : m.branch === 'hai' ? (
                                <span className="text-red-700 font-bold bg-red-50 px-1 py-0.5 rounded text-[10px]">Cụ Bà Hai</span>
                              ) : (
                                <span className="text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded text-[10px]">Chi Gốc</span>
                              )}
                            </td>
                            <td className="p-2.5 font-bold">
                              {m.isAlive ? <span className="text-green-700">Còn sống</span> : <span className="text-red-700">Đã khuất</span>}
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex justify-center space-x-1.5">
                                <button onClick={() => editMemberClick(m)} className="p-1 hover:bg-blue-50 text-blue-700 rounded"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteMember(m.id)} className="p-1 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: MANAGING ANNOUNCEMENTS */}
              {adminSubTab === 'announcements' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-sm text-[#6b4724] uppercase tracking-wide">Quản lý bảng tin thông báo dòng họ</h3>
                    <button 
                      onClick={() => setShowAnnForm(true)}
                      className="px-3 py-1.5 bg-[#b8956b] hover:bg-[#8b7355] text-white text-xs font-bold rounded shadow transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tạo bản tin mới
                    </button>
                  </div>

                  <div className="space-y-3">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-4 rounded border border-[#eadecb] bg-[#fdfbf7] flex justify-between items-start text-xs">
                        <div className="space-y-1 max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-semibold">{ann.date}</span>
                            {ann.important && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 font-bold rounded text-[9px]">QUAN TRỌNG</span>}
                          </div>
                          <h4 className="font-bold text-[#6b4724] text-sm">{ann.title}</h4>
                          <p className="text-gray-700 leading-relaxed">{ann.content}</p>
                        </div>
                        <button 
                          onClick={() => deleteAnn(ann.id)} 
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: USER ACCOUNTS */}
              {adminSubTab === 'accounts' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-sm text-[#6b4724] uppercase tracking-wide">Quản lý tài khoản đăng nhập biên tập gia phả</h3>
                    <button 
                      onClick={() => setShowUserForm(true)}
                      className="px-3 py-1.5 bg-[#b8956b] hover:bg-[#8b7355] text-white text-xs font-bold rounded shadow transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm tài khoản mới
                    </button>
                  </div>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[#6b4724] border-b border-gray-200">
                          <th className="p-2.5 font-bold">Họ & Tên thành viên</th>
                          <th className="p-2.5 font-bold">Tên đăng nhập (Username)</th>
                          <th className="p-2.5 font-bold">Vai trò phân quyền</th>
                          <th className="p-2.5 font-bold">Mật khẩu mặc định</th>
                          <th className="p-2.5 text-center font-bold">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {systemUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="p-2.5 font-bold">{user.fullName}</td>
                            <td className="p-2.5 font-semibold text-gray-700">{user.username}</td>
                            <td className="p-2.5">
                              {user.role === 'admin' ? (
                                <span className="text-red-700 font-bold bg-red-50 px-1 py-0.5 rounded">Quản trị viên</span>
                              ) : (
                                <span className="text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded">Biên tập viên</span>
                              )}
                            </td>
                            <td className="p-2.5 text-gray-400">123 (mặc định)</td>
                            <td className="p-2.5 text-center">
                              <button 
                                onClick={() => deleteUser(user.id)}
                                disabled={user.id === 'u-1' || user.id === 'u-2'}
                                className={`p-1 rounded ${user.id === 'u-1' || user.id === 'u-2' ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 4: BACKUP & DATABASE MANAGEMENT */}
              {adminSubTab === 'backup' && (
                <div className="space-y-6 max-w-xl text-xs">
                  {/* Supabase Connection Details & Guide */}
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-lg leading-relaxed">
                    <h4 className="font-bold text-emerald-900 uppercase mb-1.5 flex items-center gap-1.5 text-sm">
                      <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                      Tích hợp cơ sở dữ liệu Supabase & Deploy Vercel
                    </h4>
                    <p className="text-gray-600 mb-3 text-xs leading-relaxed">
                      Hệ thống đã liên kết và kết nối đầy đủ tới cơ sở dữ liệu Supabase của dòng họ Cụ Nghiêm Cung.
                      Khi bạn deploy dự án lên <strong>Vercel</strong> hoặc môi trường sản xuất khác, hãy thêm 2 biến môi trường sau vào phần cấu hình (Environment Variables):
                    </p>
                    <div className="bg-zinc-900 text-zinc-300 p-3 rounded-md font-mono text-[10px] mb-3 overflow-x-auto space-y-1">
                      <div>VITE_SUPABASE_URL="https://yaatfuqzemvdwrtrqtxa.supabase.co"</div>
                      <div>VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC..."</div>
                    </div>
                    
                    <div className="bg-[#f0f9ff] border border-blue-200 text-[#1e3a8a] p-3 rounded-lg leading-relaxed">
                      <strong className="block mb-1 text-[#0369a1]"><i className="fa-solid fa-circle-info"></i> Hướng dẫn tạo bảng trong Supabase (Chạy 1 lần):</strong>
                      <span className="text-[11px] block text-gray-700 mb-2">
                        Để lưu dữ liệu lâu dài và có thể đồng bộ tức thì, hãy copy đoạn mã SQL thiết lập cấu trúc bảng dưới đây, dán vào phần <strong>SQL Editor (New Query)</strong> của trang quản trị Supabase Dashboard và nhấn <strong>Run</strong>:
                      </span>
                      <textarea
                        readOnly
                        rows={10}
                        value={`-- 1. Create members table
create table if not exists public.members (
  id text primary key,
  name text not null,
  nickname text,
  gender text not null,
  role text,
  generation integer not null,
  "fatherId" text,
  "motherId" text,
  "spouseId" text,
  "birthDate" text,
  "deathDate" text,
  "isAlive" boolean default true,
  branch text,
  bio text,
  "burialPlace" text,
  phone text,
  address text,
  education text,
  "householdGroup" text
);

-- Hướng dẫn nâng cấp bảng members hiện tại:
alter table public.members add column if not exists "householdGroup" text;

-- 2. Create announcements table
create table if not exists public.announcements (
  id text primary key,
  title text not null,
  content text not null,
  date text,
  important boolean default false
);

-- 3. Create tributes table
create table if not exists public.tributes (
  id text primary key,
  "senderName" text not null,
  relation text,
  message text not null,
  date text
);

-- 4. Create system_users table
create table if not exists public.system_users (
  id text primary key,
  username text not null unique,
  "fullName" text not null,
  role text default 'user'
);

-- 5. Create altar_counts table
create table if not exists public.altar_counts (
  key text primary key,
  value integer not null
);

-- Enable RLS and insert policies
alter table public.members enable row level security;
alter table public.announcements enable row level security;
alter table public.tributes enable row level security;
alter table public.system_users enable row level security;
alter table public.altar_counts enable row level security;

create policy "Allow public read/write access" on public.members for all using (true);
create policy "Allow public read/write access" on public.announcements for all using (true);
create policy "Allow public read/write access" on public.tributes for all using (true);
create policy "Allow public read/write access" on public.system_users for all using (true);
create policy "Allow public read/write access" on public.altar_counts for all using (true);`}
                        className="w-full p-2 font-mono text-[9px] bg-slate-100 text-slate-800 border border-slate-300 rounded focus:outline-none"
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">Mẹo: Nhấp chuột vào khung text trên sẽ tự động bôi đen toàn bộ, ấn Ctrl+C để sao chép.</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#6b4724] uppercase mb-1.5">Xuất dữ liệu gia phả (Backup File)</h4>
                    <p className="text-gray-500 mb-3 leading-relaxed">Tải xuống toàn bộ dữ liệu họ tộc hiện tại bao gồm thành viên, tiểu sử, thông báo, tài khoản dưới dạng file .json bảo mật. Lưu giữ dự phòng tránh sự cố máy tính.</p>
                    <button 
                      onClick={exportData}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded shadow transition flex items-center gap-1"
                    >
                      <FileDown className="w-4 h-4" /> Tải về tệp sao lưu dữ liệu (.json)
                    </button>
                  </div>

                  <div className="border-t border-[#eadecb] pt-5">
                    <h4 className="font-bold text-[#6b4724] uppercase mb-1.5">Phục hồi dữ liệu từ tệp sao lưu</h4>
                    <p className="text-gray-500 mb-3 leading-relaxed">Chọn tệp tin .json gia phả bạn đã tải về trước đó để khôi phục toàn bộ cấu trúc sơ đồ, tiểu sử thành viên.</p>
                    <label className="inline-flex items-center px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded shadow cursor-pointer transition gap-1">
                      <FileUp className="w-4 h-4" /> Khôi phục từ file backup (.json)
                      <input type="file" accept=".json" onChange={importData} className="hidden" />
                    </label>
                  </div>

                  <div className="border-t border-[#eadecb] pt-5">
                    <h4 className="font-bold text-red-700 uppercase mb-1.5">Đặt lại dữ liệu gốc ban đầu</h4>
                    <p className="text-gray-500 mb-3 leading-relaxed">Xóa mọi thay đổi tạm thời của bạn và khôi phục lại dữ liệu mẫu gốc ban đầu của gia đình Cụ Nghiêm Cung.</p>
                    <button 
                      onClick={resetAllData}
                      className="px-4 py-2 bg-red-600 hover:bg-red-800 text-white font-bold rounded shadow transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" /> Reset cấu hình dữ liệu mặc định
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* ==================== LOGIN MODAL ==================== */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden relative border border-[#b8956b]">
            
            <button 
              onClick={() => { setShowLoginModal(false); resetLoginFields(); }} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-[#3e2a16] p-5 text-center text-white">
              <TreeDeciduous className="text-[#d6b583] w-10 h-10 mx-auto mb-2" />
              <h2 className="text-lg font-bold font-playfair uppercase tracking-widest">Đăng Nhập Quản Trị</h2>
              <p className="text-[10px] text-gray-300 mt-1">Hệ thống gia phả bảo mật nội bộ gia đình</p>
            </div>

            <div className="p-5 text-xs">
              {loginError && (
                <div className="mb-4 bg-red-50 border border-red-300 text-red-700 p-2 rounded text-center font-medium">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Tên đăng nhập</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nhập tài khoản (ví dụ: admin, nghiemphac...)"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full p-2.5 border border-[#d6b583] rounded bg-[#fdfbf7] focus:outline-none focus:ring-1 focus:ring-[#b8956b]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Mật khẩu</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Nhập mật khẩu mặc định: 123"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full p-2.5 border border-[#d6b583] rounded bg-[#fdfbf7] focus:outline-none focus:ring-1 focus:ring-[#b8956b]"
                  />
                </div>
                
                <div className="bg-gray-50 p-2.5 rounded text-[10px] text-gray-500 leading-relaxed border">
                  <strong>Tài khoản mẫu:</strong><br />
                  - Quản trị viên: <code>admin</code> / mật khẩu <code>123</code><br />
                  - Người dùng: <code>nghiemphac</code> / mật khẩu <code>123</code>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#b8956b] hover:bg-[#8b7355] text-black font-bold py-2.5 rounded shadow-md text-sm transition"
                >
                  Đăng Nhập Vào Hệ Thống
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ==================== ADMIN MEMBER ADD/EDIT FORM MODAL ==================== */}
      {showMemberForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden relative border border-[#b8956b] my-8">
            
            <button 
              onClick={() => setShowMemberForm(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-[#4a3219] p-4 text-white">
              <h3 className="font-bold font-playfair text-base uppercase tracking-wider">
                {formMode === 'add' ? 'Thêm thành viên mới vào gia phả' : 'Sửa thông tin lý lịch thành viên'}
              </h3>
            </div>

            <form onSubmit={saveMember} className="p-5 text-xs space-y-3.5 max-h-[500px] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Họ và tên thành viên (Không bắt buộc)</label>
                  <input 
                    type="text" placeholder="Ví dụ: Nghiêm Xuân..." 
                    value={memberForm.name || ''}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Tên thường gọi / Tên tự</label>
                  <input 
                    type="text" placeholder="Ví dụ: Chu, Tèo..." 
                    value={memberForm.nickname || ''}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, nickname: e.target.value }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Thế hệ / Đời thứ</label>
                  <select 
                    value={memberForm.generation || 17}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, generation: Number(e.target.value) }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  >
                    <option value={15}>Đời 15 (Cụ tổ)</option>
                    <option value={16}>Đời 16 (Cụ Cung)</option>
                    <option value={17}>Đời 17 (Bố, Bác, Cô)</option>
                    <option value={18}>Đời 18 (Con cháu)</option>
                    <option value={19}>Đời 19 (Chắt)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Giới tính</label>
                  <select 
                    value={memberForm.gender || 'male'}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  >
                    <option value="male">Nam giới</option>
                    <option value="female">Nữ giới</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 mb-1">Chi ngành</label>
                  <select 
                    value={memberForm.branch || 'hai'}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, branch: e.target.value as any }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  >
                    <option value="goc">Chi Gốc (Tổ)</option>
                    <option value="ca">Chi Cụ Bà Cả</option>
                    <option value="hai">Chi Cụ Bà Hai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Vai vế / Vai trò xã hội</label>
                  <input 
                    type="text" placeholder="Ví dụ: Bác cả, Con thứ, Dâu trưởng..." 
                    value={memberForm.role || ''}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Trạng thái nhân khẩu</label>
                  <select 
                    value={memberForm.isAlive ? 'true' : 'false'}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, isAlive: e.target.value === 'true' }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  >
                    <option value="true">Còn sống</option>
                    <option value="false">Đã khuất</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Năm sinh</label>
                  <input 
                    type="text" placeholder="Ví dụ: 1953..." 
                    value={memberForm.birthDate || ''}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1 font-semibold text-red-700">Năm mất (Nếu đã khuất)</label>
                  <input 
                    type="text" placeholder="Ví dụ: 2023..." 
                    value={memberForm.deathDate || ''}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, deathDate: e.target.value }))}
                    className="w-full p-2 border border-[#d6b583] rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Mã liên kết Cha (ID)</label>
                  <select 
                    value={memberForm.fatherId || ''}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, fatherId: e.target.value }))}
                    className="w-full p-2 border border-[#d6b583] rounded bg-white"
                  >
                    <option value="">Không có / Chưa xác định</option>
                    {members.filter(m => m.gender === 'male' && m.id !== memberForm.id).map(m => (
                      <option key={m.id} value={m.id}>{m.name} (Đời {m.generation})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Mã liên kết Mẹ (ID)</label>
                  <select 
                    value={memberForm.motherId || ''}
                    onChange={(e) => setMemberForm(prev => ({ ...prev, motherId: e.target.value }))}
                    className="w-full p-2 border border-[#d6b583] rounded bg-white"
                  >
                    <option value="">Không có / Chưa xác định</option>
                    {members.filter(m => m.gender === 'female' && m.id !== memberForm.id).map(m => (
                      <option key={m.id} value={m.id}>{m.name} (Đời {m.generation})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Điện thoại liên hệ (Đối với thành viên đang sống)</label>
                <input 
                  type="text" placeholder="Ví dụ: 0912..." 
                  value={memberForm.phone || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Nơi ở hiện nay / Địa chỉ gia đình</label>
                <input 
                  type="text" placeholder="Ví dụ: Xã Hòa Xá, Mỹ Đức, Hà Nội..." 
                  value={memberForm.address || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-red-700 mb-1">Bầu đoàn nhà cụ (Ví dụ: Bầu đoàn nhà cụ...)</label>
                <input 
                  type="text" placeholder="Ghi bầu đoàn nhà cụ..." 
                  value={memberForm.householdGroup || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, householdGroup: e.target.value }))}
                  className="w-full p-2 border-2 rounded focus:outline-none focus:ring-1 focus:ring-red-500 bg-red-50/5"
                  style={{ borderColor: '#ef4444' }}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1 text-red-800">Nơi an táng / Lăng mộ phần (Nếu đã khuất)</label>
                <input 
                  type="text" placeholder="Ví dụ: Nghĩa trang quê nhà Hòa Xá..." 
                  value={memberForm.burialPlace || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, burialPlace: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Học vị / Sự nghiệp / Thành tích nổi bật</label>
                <input 
                  type="text" placeholder="Ví dụ: Thạc sĩ, Kỹ sư, Bác sĩ..." 
                  value={memberForm.education || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, education: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Biên niên tiểu sử / Kỷ niệm sự nghiệp dòng họ</label>
                <textarea 
                  rows={3}
                  placeholder="Ghi nhận tóm tắt tiểu sử, đóng góp và những câu chuyện quý báu..." 
                  value={memberForm.bio || ''}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-[#b8956b] hover:bg-[#8b7355] text-black font-bold py-2.5 rounded transition"
                >
                  Lưu Thông Tin Nhân Khẩu
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowMemberForm(false)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition"
                >
                  Hủy bỏ
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================== ADMIN ANNOUNCEMENT MODAL ==================== */}
      {showAnnForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative border border-[#b8956b]">
            
            <button onClick={() => setShowAnnForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <X className="w-5 h-5" />
            </button>

            <div className="bg-[#4a3219] p-4 text-white">
              <h3 className="font-bold font-playfair text-sm uppercase">Tạo thông báo mới dòng họ</h3>
            </div>

            <form onSubmit={saveAnnouncement} className="p-5 text-xs space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Tiêu đề thông báo</label>
                <input 
                  type="text" required placeholder="Ví dụ: Tổ chức giỗ tổ..." 
                  value={annForm.title || ''}
                  onChange={(e) => setAnnForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Ngày đăng bản tin</label>
                <input 
                  type="date" required 
                  value={annForm.date || ''}
                  onChange={(e) => setAnnForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Nội dung chi tiết thông báo</label>
                <textarea 
                  rows={4} required placeholder="Nhập đầy đủ thông báo hướng dẫn cho con cháu dòng họ..." 
                  value={annForm.content || ''}
                  onChange={(e) => setAnnForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" id="ann-important"
                  checked={annForm.important || false}
                  onChange={(e) => setAnnForm(prev => ({ ...prev, important: e.target.checked }))}
                  className="w-4 h-4 text-[#b8956b] border-gray-300 rounded focus:ring-[#b8956b]"
                />
                <label htmlFor="ann-important" className="font-bold text-red-700">Đánh dấu quan trọng (Ghi nhận nhấp nháy đỏ)</label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="submit" className="flex-1 bg-[#b8956b] hover:bg-[#8b7355] text-black font-bold py-2 rounded transition">Lưu thông báo</button>
                <button type="button" onClick={() => setShowAnnForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Hủy bỏ</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ==================== ADMIN USER ACCOUNT MODAL ==================== */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden relative border border-[#b8956b]">
            
            <button onClick={() => setShowUserForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <X className="w-5 h-5" />
            </button>

            <div className="bg-[#4a3219] p-4 text-white">
              <h3 className="font-bold font-playfair text-sm uppercase">Thêm tài khoản truy cập mới</h3>
            </div>

            <form onSubmit={saveUserAccount} className="p-5 text-xs space-y-4">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Tên đăng nhập (Username - Viết liền không dấu)</label>
                <input 
                  type="text" required placeholder="Ví dụ: nghiemyen, nghiemlong..." 
                  value={userForm.username}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Họ tên đầy đủ người sở hữu</label>
                <input 
                  type="text" required placeholder="Ví dụ: Bác Nghiêm Thị Yến..." 
                  value={userForm.fullName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Vai trò phân quyền</label>
                <select 
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full p-2 border border-[#d6b583] rounded"
                >
                  <option value="user">Biên tập viên (Quyền sửa thành viên cơ bản)</option>
                  <option value="admin">Quản trị viên tối cao (Quản trị hệ thống toàn quyền)</option>
                </select>
              </div>
              <div className="bg-amber-50 text-amber-900 border border-amber-200 p-2.5 rounded leading-relaxed text-[10px]">
                <strong>Ghi chú:</strong> Mật khẩu mặc định sau khi tạo tài khoản của tất cả thành viên sẽ là <code>123</code>.
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="submit" className="flex-1 bg-[#b8956b] hover:bg-[#8b7355] text-black font-bold py-2 rounded transition">Tạo tài khoản</button>
                <button type="button" onClick={() => setShowUserForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Hủy bỏ</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 5. FOOTER */}
      <footer className="bg-[#3e2a16] text-[#eadecb] py-8 border-t-4 border-[#b8956b] mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h4 className="font-playfair font-bold text-lg mb-2 text-[#fdfbf7]">Hệ Thống Gia Phả Gia Đình Cụ Nghiêm Cung</h4>
          <p className="text-xs opacity-75 mb-4 max-w-md mx-auto">
            Học tập phong tục tổ tông tốt đẹp, giữ trọn chữ hiếu, tôn sư trọng đạo, gìn giữ gia tài tinh thần cho vạn thế mai sau.
          </p>
          <div className="text-[10px] opacity-60">
            &copy; 2026 Bản quyền thuộc sở hữu dòng họ Nghiêm Cung. Địa chỉ tổ quán: Xã Hòa Xá, Thành phố Hà Nội.
          </div>
        </div>
      </footer>

    </div>
  );
}
