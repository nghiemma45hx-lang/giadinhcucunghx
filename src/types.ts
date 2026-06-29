export interface FamilyMember {
  id: string;
  name: string;
  nickname?: string;
  gender: 'male' | 'female';
  role: string; // e.g. "Cụ Ông", "Cụ Bà", "Bác", "Bố", "Cô", "Con Trai"
  generation: number; // 15, 16, 17, 18, 19
  fatherId?: string;
  motherId?: string;
  spouseId?: string; // primarily for linking partners
  birthDate?: string;
  deathDate?: string;
  isAlive: boolean;
  branch: 'ca' | 'hai' | 'goc'; // 'ca' is Branch of Cụ Bà Cả, 'hai' is Branch of Cụ Bà Hai, 'goc' is Generation 15 (origins)
  bio?: string;
  burialPlace?: string; // location of gravesite if deceased
  phone?: string;
  address?: string;
  education?: string;
  householdGroup?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string; // client-side check
  fullName: string;
  role: 'admin' | 'user';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  important: boolean;
}

export interface TributeMessage {
  id: string;
  senderName: string;
  relation: string;
  message: string;
  date: string;
}

export const INITIAL_MEMBERS: FamilyMember[] = [
  // --- THẾ HỆ 15 (Gốc) ---
  {
    id: "nghiem-dieu",
    name: "Nghiêm Điều",
    nickname: "Chu",
    gender: "male",
    role: "Cụ Cố Ông",
    generation: 15,
    isAlive: false,
    birthDate: "1895",
    deathDate: "1960",
    branch: "goc",
    bio: "Khởi tổ triều Nghiêm gia tộc, người luôn giữ đức hiếu nghĩa và nếp gia phong liêm khiết.",
    burialPlace: "Nghĩa trang Hòa Xá, Hà Nội"
  },
  {
    id: "cu-ba-lun",
    name: "Cụ Bà Lùn",
    gender: "female",
    role: "Cụ Cố Bà",
    generation: 15,
    isAlive: false,
    spouseId: "nghiem-dieu",
    branch: "goc",
    bio: "Hiền thê tần tảo, hết lòng nâng đỡ cụ cố ông xây dựng sự nghiệp dòng họ, nuôi dạy con cháu thành tài.",
    burialPlace: "Nghĩa trang Hòa Xá, Hà Nội"
  },

  // --- THẾ HỆ 16 ---
  {
    id: "nghiem-cung",
    name: "Nghiêm Cung",
    gender: "male",
    role: "Cụ Ông",
    generation: 16,
    fatherId: "nghiem-dieu",
    motherId: "cu-ba-lun",
    isAlive: false,
    birthDate: "1920",
    deathDate: "1998",
    branch: "goc",
    bio: "Cột trụ trung tâm của dòng họ thế hệ 16, đức độ bao dung, nổi tiếng chính trực, dạy bảo con cháu hiếu học lễ nghĩa.",
    burialPlace: "Lăng mộ tổ họ Nghiêm, xã Hòa Xá"
  },
  {
    id: "cu-ba-ca",
    name: "Cụ Bà Cả",
    gender: "female",
    role: "Cụ Bà Cả",
    generation: 16,
    spouseId: "nghiem-cung",
    isAlive: false,
    branch: "ca",
    bio: "Người hiền thục phụ đức, luôn yêu thương, lo lắng vun đắp gia phong mẫu mực.",
    burialPlace: "Nghĩa trang Hòa Xá, Hà Nội"
  },
  {
    id: "cu-ba-hai",
    name: "Cụ Bà Hai",
    gender: "female",
    role: "Cụ Bà Hai",
    generation: 16,
    spouseId: "nghiem-cung",
    isAlive: false,
    branch: "hai",
    bio: "Đức tính cần kiệm liêm sỉ, cả đời hy sinh phụng sự gia tiên, vun vén tổ ấm yên vui.",
    burialPlace: "Nghĩa trang Hòa Xá, Hà Nội"
  },

  // --- THẾ HỆ 17 (Dòng cụ Bà Cả) ---
  {
    id: "con-gai-ca",
    name: "Nghiêm Thị Nhất",
    nickname: "Thứ Nhất",
    gender: "female",
    role: "Con Gái Cả",
    generation: 17,
    fatherId: "nghiem-cung",
    motherId: "cu-ba-ca",
    isAlive: false,
    branch: "ca",
    bio: "Nết na thùy mị, hiếu thảo với cha mẹ, hết lòng giúp đỡ các em thuở nhỏ."
  },
  {
    id: "con-gai-hai",
    name: "Nghiêm Thị Hai",
    nickname: "Thứ Hai",
    gender: "female",
    role: "Con Gái Thứ Hai",
    generation: 17,
    fatherId: "nghiem-cung",
    motherId: "cu-ba-ca",
    isAlive: false,
    branch: "ca",
    bio: "Gia thế vẹn toàn, tần tảo hiền hậu, giữ trọn đạo hiếu đức hạnh người phụ nữ xưa."
  },

  // --- THẾ HỆ 17 (Dòng cụ Bà Hai) ---
  {
    id: "nghiem-canh",
    name: "Nghiêm Cảnh",
    gender: "male",
    role: "Bác Trai Cả",
    generation: 17,
    fatherId: "nghiem-cung",
    motherId: "cu-ba-hai",
    isAlive: false,
    birthDate: "1942",
    deathDate: "2018",
    branch: "hai",
    bio: "Bác cả dòng thứ, tính khí cương trực, có công lao lớn trong việc kết nối dòng họ những năm sau chiến tranh.",
    burialPlace: "Khu mộ gia đình, xã Hòa Xá"
  },
  {
    id: "nghiem-thi-toan",
    name: "Nghiêm Thị Toàn",
    gender: "female",
    role: "Bác Gái",
    generation: 17,
    fatherId: "nghiem-cung",
    motherId: "cu-ba-hai",
    isAlive: false,
    birthDate: "1945",
    deathDate: "2021",
    branch: "hai",
    bio: "Người phụ nữ giàu lòng nhân ái, thắt chặt nghĩa tình gia tộc ấm áp.",
    burialPlace: "Nghĩa trang Hòa Xá"
  },
  {
    id: "nghiem-phac",
    name: "Nghiêm Phác",
    gender: "male",
    role: "Bác Trai Hai",
    generation: 17,
    fatherId: "nghiem-cung",
    motherId: "cu-ba-hai",
    isAlive: true,
    birthDate: "1948",
    branch: "hai",
    bio: "Trí thức ưu tú, hiện sinh sống tại Hà Nội, luôn hướng về cội nguồn và tham mưu nhiều ý kiến quý báu xây dựng gia tộc.",
    phone: "0912345678",
    address: "Quận Cầu Giấy, TP. Hà Nội"
  },
  {
    id: "nghiem-xuan-ma",
    name: "Nghiêm Xuân Mã",
    gender: "male",
    role: "Bố",
    generation: 17,
    fatherId: "nghiem-cung",
    motherId: "cu-ba-hai",
    isAlive: false,
    birthDate: "1953",
    deathDate: "2023",
    branch: "hai",
    bio: "Kỹ sư cơ khí, người cha kính yêu, liêm khiết và bao dung, luôn giáo dục con cái tính tự lập và tử tế.",
    burialPlace: "Lăng mộ dòng họ Nghiêm, xã Hòa Xá"
  },
  {
    id: "nghiem-thi-hoan",
    name: "Nghiêm Thị Hoàn",
    gender: "female",
    role: "Cô Út",
    generation: 17,
    fatherId: "nghiem-cung",
    motherId: "cu-ba-hai",
    isAlive: true,
    birthDate: "1958",
    branch: "hai",
    bio: "Năng động hiền lành, luôn gắn bó với con cháu trong và ngoài nước.",
    phone: "0987654321",
    address: "Quận Hoàn Kiếm, TP. Hà Nội"
  },

  // --- THẾ HỆ 18 (Con cháu thế hệ tiếp theo) ---
  {
    id: "nghiem-xuan-long",
    name: "Nghiêm Xuân Long",
    gender: "male",
    role: "Con Trai Trưởng (Mã)",
    generation: 18,
    fatherId: "nghiem-xuan-ma",
    isAlive: true,
    birthDate: "1980",
    branch: "hai",
    bio: "Kỹ sư phần mềm xuất sắc, hiện đang sinh sống và làm việc tích cực tại TP. Hà Nội, điều hành trang web gia tộc.",
    phone: "0904455667",
    address: "Quận Thanh Xuân, TP. Hà Nội",
    education: "Thạc sĩ Khoa học Máy tính"
  },
  {
    id: "nghiem-thi-mai",
    name: "Nghiêm Thị Mai",
    gender: "female",
    role: "Con Gái (Mã)",
    generation: 18,
    fatherId: "nghiem-xuan-ma",
    isAlive: true,
    birthDate: "1983",
    branch: "hai",
    bio: "Giảng viên sư phạm tận tâm, luôn chăm lo bảo bọc gia đình.",
    phone: "0945566778",
    address: "Quận Hai Bà Trưng, TP. Hà Nội",
    education: "Thạc sĩ Giáo dục"
  },
  {
    id: "nghiem-xuan-tuan",
    name: "Nghiêm Xuân Tuấn",
    gender: "male",
    role: "Con Trai (Phác)",
    generation: 18,
    fatherId: "nghiem-phac",
    isAlive: true,
    birthDate: "1982",
    branch: "hai",
    bio: "Doanh nhân trẻ, tích cực ủng hộ các quỹ học bổng khuyến học của Nghiêm gia.",
    phone: "0911223344",
    address: "Quận Tây Hồ, Hà Nội"
  },
  {
    id: "nghiem-thi-hoa",
    name: "Nghiêm Thị Hoa",
    gender: "female",
    role: "Con Gái (Phác)",
    generation: 18,
    fatherId: "nghiem-phac",
    isAlive: true,
    birthDate: "1985",
    branch: "hai",
    address: "Quận Cầu Giấy, Hà Nội"
  },
  {
    id: "nghiem-xuan-hai",
    name: "Nghiêm Xuân Hải",
    gender: "male",
    role: "Con Trai (Cảnh)",
    generation: 18,
    fatherId: "nghiem-canh",
    isAlive: true,
    birthDate: "1978",
    branch: "hai",
    address: "Thành phố Hải Phòng"
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "Đóng góp quỹ tu sửa lăng mộ Cụ Cố",
    content: "Kính thưa quý cô dì chú bác cùng con cháu dòng họ Nghiêm Cung. Dự kiến vào tiết Thanh Minh sắp tới, Ban đại diện dòng họ sẽ tổ chức tu sửa, làm mới khuôn viên lăng mộ Cụ Điều và Cụ Bà Lùn tại nghĩa trang Hòa Xá. Kính mong nhận được sự chung tay đóng góp tâm đức của gia đình thành viên. Mọi khoản đóng góp xin gửi về thủ quỹ nhánh trưởng (Bác Nghiêm Phác) hoặc tài khoản đại diện dòng họ.",
    date: "2026-06-25",
    important: true
  },
  {
    id: "ann-2",
    title: "Đề nghị bổ sung thông tin thế hệ 18, 19",
    content: "Để hoàn thiện dữ liệu cây gia phả chuẩn xác, đề nghị các gia đình có con cháu thế hệ thứ 18 và 19 sinh thêm, hoặc có thay đổi thông tin kết hôn, học vị, nghề nghiệp chủ động cập nhật trực tiếp hoặc gửi thông tin về ban biên tập qua mục Quản trị/Thành viên để cập nhật lên phần mềm.",
    date: "2026-06-20",
    important: false
  },
  {
    id: "ann-3",
    title: "Tổ chức lễ giỗ Tổ cụ Nghiêm Cung",
    content: "Ban trị sự dòng họ trân trọng thông báo Lễ giỗ Cụ Nghiêm Cung sẽ được tổ chức trang trọng vào ngày rằm tháng 8 Âm lịch sắp tới tại Tổ đường gia đình Hòa Xá. Kính mời toàn thể con cháu sắp xếp công việc về dự đông đủ để bái vọng tổ tiên và gắn kết nghĩa tình gia tộc.",
    date: "2026-06-15",
    important: true
  }
];

export const INITIAL_TRIBUTES: TributeMessage[] = [
  {
    id: "trib-1",
    senderName: "Nghiêm Xuân Long",
    relation: "Cháu đích tôn",
    message: "Con cháu thế hệ thứ 18 xin kính cẩn cúi đầu tri ân công đức biển trời của Tổ tiên, Cụ Cố và Cha Ông. Chúng con nguyện luôn đoàn kết, tu dưỡng đạo đức để làm rạng danh dòng họ Nghiêm Cung.",
    date: "2026-06-28 12:45"
  },
  {
    id: "trib-2",
    senderName: "Nghiêm Thị Mai",
    relation: "Con gái cụ Xuân Mã",
    message: "Hôm nay nhân ngày giỗ cha, con thắp một nén nhang dâng hương hồn người. Cầu chúc cha ở cõi vĩnh hằng an lạc phù hộ độ trì cho cả gia đình luôn mạnh khỏe, bình an.",
    date: "2026-06-27 18:30"
  },
  {
    id: "trib-3",
    senderName: "Nghiêm Xuân Tuấn",
    relation: "Cháu nội cụ Cung",
    message: "Cầu mong gia tiên phù hộ cho đại gia quyến Nghiêm tộc vạn sự hanh thông, con cháu học hành đỗ đạt, hữu ích cho đời.",
    date: "2026-06-26 09:15"
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: "u-1",
    username: "admin",
    fullName: "Quản Trị Viên Nhánh Trưởng",
    role: "admin"
  },
  {
    id: "u-2",
    username: "nghiemphac",
    fullName: "Bác Nghiêm Phác",
    role: "user"
  }
];
