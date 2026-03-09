import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CoursePlayerTopNav from "@/components/courseplayer/CoursePlayerTopNav";
import CoursePlayerVideo from "@/components/courseplayer/CoursePlayerVideo";
import CoursePlayerTabs from "@/components/courseplayer/CoursePlayerTabs";
import CoursePlayerSidebar from "@/components/courseplayer/CoursePlayerSidebar";

export interface Lecture {
  id: string;
  number: number;
  title: string;
  duration: string;
  completed: boolean;
}

export interface Section {
  id: string;
  title: string;
  lectures: Lecture[];
  totalDuration: string;
}

const MOCK_SECTIONS: Section[] = [
  {
    id: "s3",
    title: "Section 3: Threat Actors",
    totalDuration: "1hr 7min",
    lectures: [
      { id: "l17", number: 17, title: "Threat Actors (OBJ 1.2, 2.1, & 2.2)", duration: "4min", completed: false },
      { id: "l18", number: 18, title: "Threat Actor Motivations (OBJ 2.1)", duration: "8min", completed: false },
      { id: "l19", number: 19, title: "Threat Actor Attributes (OBJ 2.1)", duration: "5min", completed: false },
      { id: "l20", number: 20, title: "Unskilled Attackers (OBJ 2.1)", duration: "3min", completed: false },
      { id: "l21", number: 21, title: "Hacktivists (OBJ 2.1)", duration: "4min", completed: false },
      { id: "l22", number: 22, title: "Organized Crime (OBJ 2.1)", duration: "5min", completed: false },
      { id: "l23", number: 23, title: "Nation-state Actor (OBJ 2.1)", duration: "7min", completed: false },
      { id: "l24", number: 24, title: "Insider Threats (OBJ 2.1)", duration: "6min", completed: false },
      { id: "l25", number: 25, title: "Shadow IT (OBJ 2.1)", duration: "5min", completed: false },
      { id: "l26", number: 26, title: "Threat Vectors and Attack Surfaces (OBJ 2.2)", duration: "9min", completed: false },
      { id: "l27", number: 27, title: "Outsmarting Threat Actors (OBJ 1.2)", duration: "11min", completed: false },
      { id: "lq3", number: 0, title: "Quiz 3: Checkpoint: Threat Actors", duration: "", completed: false },
    ],
  },
  {
    id: "s4",
    title: "Section 4: Physical Security",
    totalDuration: "57min",
    lectures: Array.from({ length: 9 }, (_, i) => ({
      id: `s4l${i}`,
      number: 28 + i,
      title: `Physical Security Lecture ${i + 1}`,
      duration: `${4 + (i % 4)}min`,
      completed: false,
    })),
  },
  {
    id: "s5",
    title: "Section 5: Social Engineering",
    totalDuration: "1hr 13min",
    lectures: Array.from({ length: 11 }, (_, i) => ({
      id: `s5l${i}`,
      number: 37 + i,
      title: `Social Engineering Lecture ${i + 1}`,
      duration: `${5 + (i % 5)}min`,
      completed: false,
    })),
  },
  {
    id: "s6",
    title: "Section 6: Malware",
    totalDuration: "1hr 2min",
    lectures: Array.from({ length: 8 }, (_, i) => ({
      id: `s6l${i}`,
      number: 48 + i,
      title: `Malware Lecture ${i + 1}`,
      duration: `${6 + (i % 3)}min`,
      completed: false,
    })),
  },
];

const CoursePlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>(MOCK_SECTIONS);
  const [currentLectureId, setCurrentLectureId] = useState("l17");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const allLectures = useMemo(() => sections.flatMap((s) => s.lectures), [sections]);
  const totalLectures = allLectures.length;
  const completedCount = allLectures.filter((l) => l.completed).length;
  const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const currentLecture = allLectures.find((l) => l.id === currentLectureId);

  const toggleComplete = (lectureId: string) => {
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        lectures: sec.lectures.map((l) =>
          l.id === lectureId ? { ...l, completed: !l.completed } : l
        ),
      }))
    );
  };

  const selectLecture = (lectureId: string) => {
    setCurrentLectureId(lectureId);
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      <CoursePlayerTopNav
        courseTitle="CompTIA Security+ (SY0-701) Complete Course & Practice Exam"
        progressPercent={progressPercent}
        onBack={() => navigate("/community/hub")}
      />

      <div className="flex flex-1 min-h-0">
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <CoursePlayerVideo
            lectureTitle={currentLecture?.title ?? ""}
          />
          <CoursePlayerTabs />
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <CoursePlayerSidebar
            sections={sections}
            currentLectureId={currentLectureId}
            onSelectLecture={selectLecture}
            onToggleComplete={toggleComplete}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Floating reopen button when sidebar closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-card border border-border rounded-l-lg px-2 py-4 text-xs text-muted-foreground hover:bg-muted transition-colors z-50"
          title="Show course content"
        >
          ◀
        </button>
      )}
    </div>
  );
};

export default CoursePlayer;
