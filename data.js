/* SkillSwap Campus — mock data */
const AVATAR = (s) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

const CATEGORIES = ["Programming", "Design", "Marketing", "Data & AI", "Content", "Business", "Languages"];

const POPULAR_SKILLS = [
  { name: "Python", icon: "🐍", learners: "3.2k" },
  { name: "Web Development", icon: "💻", learners: "2.8k" },
  { name: "UI/UX Design", icon: "🎨", learners: "2.4k" },
  { name: "Video Editing", icon: "🎬", learners: "1.9k" },
  { name: "Digital Marketing", icon: "📈", learners: "1.7k" },
  { name: "Public Speaking", icon: "🎤", learners: "1.5k" },
  { name: "Data Science", icon: "📊", learners: "2.1k" },
  { name: "Photography", icon: "📷", learners: "1.3k" },
];

const STUDENTS = [
  {
    id: "aarav-mehta", name: "Aarav Mehta", college: "IIT Bombay", branch: "Computer Science", year: "3rd Year",
    bio: "Full-stack dev who loves building side projects. Currently exploring generative AI.",
    rating: 4.9, swaps: 24, availability: "Weekends • Evenings", mode: "Online", match: 96,
    teaches: [{ name: "Python", category: "Programming", level: "Advanced" }, { name: "React", category: "Programming", level: "Advanced" }],
    learns: [{ name: "UI/UX Design", category: "Design", level: "Beginner" }, { name: "Video Editing", category: "Content", level: "Beginner" }],
    achievements: ["Top Mentor 2025", "50+ hours taught", "Verified Skills"],
  },
  {
    id: "ishita-rao", name: "Ishita Rao", college: "NIT Trichy", branch: "Electronics", year: "2nd Year",
    bio: "Designer at heart. Turning Figma files into delightful experiences.",
    rating: 4.8, swaps: 18, availability: "Weekdays • Mornings", mode: "Both", match: 94,
    teaches: [{ name: "UI/UX Design", category: "Design", level: "Advanced" }, { name: "Figma", category: "Design", level: "Advanced" }],
    learns: [{ name: "Python", category: "Programming", level: "Beginner" }, { name: "Data Science", category: "Data & AI", level: "Beginner" }],
    achievements: ["Design Award 2024", "Community Favorite"],
  },
  {
    id: "rohan-kapoor", name: "Rohan Kapoor", college: "BITS Pilani", branch: "Information Technology", year: "4th Year",
    bio: "Data science enthusiast, hackathon addict, and coffee-fueled coder.",
    rating: 4.7, swaps: 31, availability: "Flexible", mode: "Online", match: 91,
    teaches: [{ name: "Data Science", category: "Data & AI", level: "Advanced" }, { name: "Machine Learning", category: "Data & AI", level: "Intermediate" }],
    learns: [{ name: "Public Speaking", category: "Business", level: "Beginner" }],
    achievements: ["Kaggle Expert", "3x Hackathon Winner"],
  },
  {
    id: "sara-iyer", name: "Sara Iyer", college: "VIT Vellore", branch: "Computer Science", year: "2nd Year",
    bio: "Content creator + JavaScript nerd. YouTube tutorials in my free time.",
    rating: 4.9, swaps: 21, availability: "Weekends", mode: "Both", match: 88,
    teaches: [{ name: "Video Editing", category: "Content", level: "Advanced" }, { name: "JavaScript", category: "Programming", level: "Intermediate" }],
    learns: [{ name: "React", category: "Programming", level: "Intermediate" }, { name: "UI/UX Design", category: "Design", level: "Beginner" }],
    achievements: ["Content Creator 2025"],
  },
  {
    id: "kabir-singh", name: "Kabir Singh", college: "Delhi University", branch: "Commerce", year: "3rd Year",
    bio: "Marketing student running two Instagram pages with 100k+ combined reach.",
    rating: 4.6, swaps: 15, availability: "Evenings", mode: "Offline", match: 85,
    teaches: [{ name: "Digital Marketing", category: "Marketing", level: "Advanced" }, { name: "Public Speaking", category: "Business", level: "Intermediate" }],
    learns: [{ name: "Web Development", category: "Programming", level: "Beginner" }],
    achievements: ["Growth Hacker", "20+ sessions"],
  },
  {
    id: "meera-nair", name: "Meera Nair", college: "Anna University", branch: "Mechanical", year: "4th Year",
    bio: "Photographer documenting campus life. Also fluent in three languages.",
    rating: 4.8, swaps: 27, availability: "Weekends • Afternoons", mode: "Both", match: 83,
    teaches: [{ name: "Photography", category: "Content", level: "Advanced" }, { name: "Spanish", category: "Languages", level: "Intermediate" }],
    learns: [{ name: "Figma", category: "Design", level: "Beginner" }],
    achievements: ["Verified Skills", "Campus Photographer"],
  },
  {
    id: "arjun-verma", name: "Arjun Verma", college: "IIIT Hyderabad", branch: "Computer Science", year: "1st Year",
    bio: "First-year but already shipping web apps. Loves teaching beginners.",
    rating: 4.5, swaps: 9, availability: "Weeknights", mode: "Online", match: 80,
    teaches: [{ name: "Web Development", category: "Programming", level: "Intermediate" }],
    learns: [{ name: "Machine Learning", category: "Data & AI", level: "Beginner" }, { name: "Photography", category: "Content", level: "Beginner" }],
    achievements: ["Rising Star"],
  },
  {
    id: "nisha-gupta", name: "Nisha Gupta", college: "Symbiosis Pune", branch: "Business Administration", year: "2nd Year",
    bio: "Case-comp finalist. Strong on pitching, decks and business storytelling.",
    rating: 4.7, swaps: 13, availability: "Flexible", mode: "Both", match: 78,
    teaches: [{ name: "Business Strategy", category: "Business", level: "Intermediate" }, { name: "Public Speaking", category: "Business", level: "Advanced" }],
    learns: [{ name: "Digital Marketing", category: "Marketing", level: "Intermediate" }],
    achievements: ["Case Comp Finalist"],
  },
].map((s) => ({ ...s, avatar: AVATAR(s.name) }));

const SESSIONS = [
  { title: "Python Basics → Loops & Functions", with: "Aarav Mehta", when: "Today • 6:00 PM", mode: "Online", status: "Confirmed" },
  { title: "Figma Auto-layout Deep Dive", with: "Ishita Rao", when: "Tomorrow • 10:30 AM", mode: "Online", status: "Confirmed" },
  { title: "Video Editing — Cuts & Pacing", with: "Sara Iyer", when: "Sat • 4:00 PM", mode: "Offline", status: "Pending" },
  { title: "Intro to Machine Learning", with: "Rohan Kapoor", when: "Sun • 11:00 AM", mode: "Online", status: "Confirmed" },
];

const REQUESTS = [
  { name: "Ishita Rao", offer: "UI/UX Design", want: "Python", status: "Pending", time: "2h ago" },
  { name: "Kabir Singh", offer: "Digital Marketing", want: "Web Development", status: "Pending", time: "5h ago" },
  { name: "Rohan Kapoor", offer: "Data Science", want: "Public Speaking", status: "Accepted", time: "1d ago" },
  { name: "Meera Nair", offer: "Photography", want: "Figma", status: "Declined", time: "3d ago" },
];

const POSTS = [
  { name: "Sara Iyer", time: "1h ago", text: "Just finished my 20th swap! Taught video editing, learned React hooks in return. This platform is unreal 🚀", likes: 42, comments: 8 },
  { name: "Rohan Kapoor", time: "4h ago", text: "Looking for someone to swap Machine Learning for Public Speaking. I get stage fright at every hackathon pitch 😅", likes: 27, comments: 12 },
  { name: "Ishita Rao", time: "1d ago", text: "Tip: bring one real project to every swap session. You learn 3x faster when the practice is real.", likes: 88, comments: 15 },
];