"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { StudentWalkthroughVideo } from "@/components/video/StudentWalkthroughVideo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Award,
  Calendar,
  Clock,
  Users,
  Database,
  Cpu,
  Layers,
  FileCode2,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  Zap,
  Lock,
  PlayCircle,
  GraduationCap,
  HelpCircle,
  FolderGit2,
  BookOpen,
  ArrowUpRight,
  Laptop,
  Video,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  // Target: Saturday 14 November 2026, 10:30 AM IST
  const targetDate = new Date("2026-11-14T10:30:00+05:30").getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [activePhase, setActivePhase] = useState<number>(1);
  const [expandedSession, setExpandedSession] = useState<number | null>(1);
  const [showFullSyllabus, setShowFullSyllabus] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    function calculateCountdown() {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const curriculumPhases = [
    {
      id: 1,
      title: "Phase 1: Foundations",
      dates: "S1–S2 · 14–21 Nov",
      summary: "Python for Data Engineering, Pandas & SQL Mastery (Window functions, query tuning)",
      sessions: [
        {
          num: 1,
          date: "Sat 14 Nov 2026",
          title: "Python & Pandas Foundations",
          moduleA: "VS Code, Git, Databricks Free Edition & Azure setup; Python core, control flow, data structures.",
          moduleB: "CSV/JSON handling, exceptions, OOP essentials; Pandas Series, DataFrames, groupby, datetime cleaning.",
          lab: "Build a CSV data processor: read → clean → transform → aggregate → report.",
        },
        {
          num: 2,
          date: "Sat 21 Nov 2026",
          title: "SQL Mastery (Joins, CTEs, Window Functions)",
          moduleA: "SELECT, inner/left/self/anti joins, aggregations, GROUP BY/HAVING, subqueries, NULL traps.",
          moduleB: "CTEs, window functions (ROW_NUMBER, RANK, LAG/LEAD, moving averages), execution plans & tuning.",
          lab: "Solve 25 interview-grade SQL challenges live under timed conditions.",
        },
      ],
    },
    {
      id: 2,
      title: "Phase 2: Modeling & Architecture",
      dates: "S3 · 28 Nov",
      summary: "3-NF, Dimensional Modeling, Slowly Changing Dimensions & Medallion Lakehouse",
      sessions: [
        {
          num: 3,
          date: "Sat 28 Nov 2026",
          title: "Data Modeling & Lakehouse Architecture",
          moduleA: "OLTP vs OLAP, normalization (3-NF), star/snowflake schemas, SCD Type 1 & 2 patterns.",
          moduleB: "Warehouse vs Lakehouse; Medallion architecture (Bronze, Silver, Gold); metadata-driven framework design.",
          lab: "Model a banking/retail scenario end-to-end and write the production DDL schemas.",
        },
      ],
    },
    {
      id: 3,
      title: "Phase 3: Azure Data Platform",
      dates: "S4 · 05 Dec",
      summary: "ADLS Gen2, Azure Data Factory & Parameterized Ingestion (Assessment 1)",
      sessions: [
        {
          num: 4,
          date: "Sat 05 Dec 2026",
          title: "Azure Data Factory & ADLS Gen2 Ingestion",
          moduleA: "Azure subscriptions, RBAC, Key Vault, ADLS Gen2 hierarchical namespace, ACLs & lifecycle.",
          moduleB: "ADF linked services, datasets, integration runtimes, pipelines, triggers, monitoring & alerts.",
          lab: "Build a parameterised, metadata-driven Azure SQL → ADLS Gen2 ingestion framework.",
        },
      ],
    },
    {
      id: 4,
      title: "Phase 4: Spark + Databricks",
      dates: "S5–S10 · 12 Dec – 23 Jan",
      summary: "PySpark, Delta Lake, Unity Catalog, Lakeflow, Asset Bundles & Cert Sprint 1",
      sessions: [
        {
          num: 5,
          date: "Sat 12 Dec 2026",
          title: "Spark & Databricks Foundations",
          moduleA: "Spark driver, executors, DAG, lazy evaluation, cluster types, notebooks & Volumes.",
          moduleB: "PySpark DataFrame API, transformations vs actions, reading CSV/JSON/Parquet, file partitioning.",
          lab: "Deploy your first PySpark processing pipeline: raw files → cleaned Parquet.",
        },
        {
          num: 6,
          date: "Sat 19 Dec 2026",
          title: "PySpark Deep Dive & Performance Tuning",
          moduleA: "Shuffle vs broadcast joins, window functions, UDFs vs vectorized pandas UDFs.",
          moduleB: "Partitioning, repartition vs coalesce, caching, Spark UI analysis, skew mitigation & AQE.",
          lab: "Large-dataset pipeline with broadcast-tuned joins and skew resolution.",
        },
        {
          num: 7,
          date: "Sat 02 Jan 2027",
          title: "Delta Lake — ACID, Time Travel & Optimization",
          moduleA: "ACID transactions, transaction log (_delta_log), time travel, schema enforcement & evolution, MERGE INTO.",
          moduleB: "OPTIMIZE, Z-Ordering, liquid clustering, VACUUM, Change Data Feed (CDF), Medallion implementation.",
          lab: "Build Bronze → Silver → Gold with Delta Lake upserts and history rollback.",
        },
        {
          num: 8,
          date: "Sat 09 Jan 2027",
          title: "Unity Catalog & Data Governance",
          moduleA: "Unity Catalog metastore, 3-level namespace (catalog.schema.table), row filters, column masks, Volumes.",
          moduleB: "Lineage graphs, audit logging, data discovery, quality expectations governed in Unity Catalog.",
          lab: "Govern your medallion lakehouse end-to-end with row filters and masking policies.",
        },
        {
          num: 9,
          date: "Sat 16 Jan 2027",
          title: "Lakeflow Pipelines, Jobs, Asset Bundles & CI/CD",
          moduleA: "Lakeflow Spark Declarative Pipelines (DLT), streaming tables, materialized views, AUTO CDC, Lakeflow Jobs.",
          moduleB: "Databricks Asset Bundles (DABs), Git folders, multi-environment deployment pipelines (Dev/Prod).",
          lab: "Deploy an end-to-end Lakeflow pipeline and job through a Databricks Asset Bundle.",
        },
        {
          num: 10,
          date: "Sat 23 Jan 2027",
          title: "Cert Sprint 1 — Databricks Certified Data Engineer Associate",
          moduleA: "Official skills outline walkthrough; 60–80 exam-style drills with answer rationale across all domains.",
          moduleB: "Full-length timed mock: 45 questions in 90 minutes; domain-wise score breakdown & revision playbook.",
          lab: "Complete the full-length proctored-condition mock exam + personal review.",
        },
      ],
    },
    {
      id: 5,
      title: "Phase 5: Microsoft Fabric",
      dates: "S11–S13 · 30 Jan – 13 Feb",
      summary: "OneLake, Lakehouse & Warehouse, Real-Time Intelligence & Cert Sprint 2 (DP-700)",
      sessions: [
        {
          num: 11,
          date: "Sat 30 Jan 2027",
          title: "Fabric I — OneLake, Lakehouse & Ingestion",
          moduleA: "Fabric capacities, workspaces, OneLake unified lake, shortcuts, Delta tables, V-Order optimization.",
          moduleB: "Dataflows Gen2, Fabric pipelines, Mirroring operational DBs, PySpark & SQL data processing.",
          lab: "Build a Fabric lakehouse with shortcuts, a pipeline and a Dataflow Gen2.",
        },
        {
          num: 12,
          date: "Sat 06 Feb 2027",
          title: "Fabric II — Warehouse, Real-Time Intelligence & Git",
          moduleA: "T-SQL Fabric Warehouse, Lakehouse vs Warehouse selection, Eventstreams, KQL databases & queries.",
          moduleB: "Git integration, deployment pipelines, Monitoring Hub, Capacity Metrics, Direct Lake semantic models.",
          lab: "Wire an eventstream into a KQL database and publish a real-time analytics dashboard.",
        },
        {
          num: 13,
          date: "Sat 13 Feb 2027",
          title: "Cert Sprint 2 — Microsoft Fabric Data Engineer (DP-700)",
          moduleA: "DP-700 domain review (30-35% each), case-study analysis, scenario questions, drag-and-drop traps.",
          moduleB: "Full-length timed mock: 40–60 questions in 100 minutes; personal score breakdown & booking strategy.",
          lab: "Complete the full-length Microsoft Fabric mock exam + personal review.",
        },
      ],
    },
    {
      id: 6,
      title: "Phase 6: Gen AI + Claude",
      dates: "S14–S16 · 20 Feb – 06 Mar",
      summary: "LLMs, Claude API, Production RAG, Agents, MCP & Cert Sprint 3 (CCAR-F)",
      sessions: [
        {
          num: 14,
          date: "Sat 20 Feb 2027",
          title: "Gen AI Foundations, Claude API & Prompting",
          moduleA: "Transformers, tokens, context windows, model selection (latency, cost, intelligence), hallucination controls.",
          moduleB: "System prompts, chain-of-thought, Claude Messages API hands-on, streaming & structured JSON outputs.",
          lab: "Ship a Claude-powered data assistant that explains lakehouse queries in plain English.",
        },
        {
          num: 15,
          date: "Sat 27 Feb 2027",
          title: "RAG, Agents, MCP & Claude Code",
          moduleA: "Embeddings, chunking, vector stores (Vector Search, FAISS), production RAG over your Gold lakehouse layer.",
          moduleB: "Claude tool use, single & orchestrator agent patterns, Model Context Protocol (MCP) servers, Claude Code.",
          lab: "Build a RAG system plus an MCP tool a Claude agent calls against your lakehouse.",
        },
        {
          num: 16,
          date: "Sat 06 Mar 2027",
          title: "Cert Sprint 3 — CCAR-F, Capstone Showcase & Graduation",
          moduleA: "CCAR-F blueprint: agentic architecture, evaluation, cost & safety; full-length 120-min timed mock.",
          moduleB: "Capstone Showcase: every learner demos their governed lakehouse + Claude agent; graduation ceremony.",
          lab: "Mock exam + live capstone demonstration of your end-to-end system.",
        },
      ],
    },
  ];

  const faqs = [
    {
      q: "I work full-time. Can I manage?",
      a: "Classes are Saturdays only, 10:30 AM–2:30 PM IST, and recordings are up the same day.",
    },
    {
      q: "I'm new to coding. Is this too advanced?",
      a: "We start with Python and SQL basics and build up step by step.",
    },
    {
      q: "What if I miss a class?",
      a: "Watch the recording the same day in your private classroom.",
    },
    {
      q: "Do I lose access after the course ends?",
      a: "No. Your recordings and materials stay available for life, free.",
    },
    {
      q: "I studied in an earlier TiBen AI Academy cohort. Can I still watch my recordings?",
      a: "Yes. Sign in with your registered email. If you can't see your course, message us on WhatsApp for your enrollment code.",
    },
    {
      q: "Are exam fees included?",
      a: "No. You pay each exam fee directly to the provider when you book.",
    },
    {
      q: "How do I get into the classroom after paying?",
      a: "You'll receive an enrollment code. Sign in, redeem it, and your classroom unlocks.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
      <Navbar />

      {/* 2. HERO — TWO DOORS */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Learn live. Keep your classroom for life.
            </h1>
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              TiBen AI Academy is the private classroom for our cohorts. Join a live program, and every
              recording, notebook and slide stays yours to rewatch, free, forever.
            </p>
          </div>

          {/* Two Doors Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
            {/* Door 1: New Here */}
            <Card className="border-teal-500/30 bg-white dark:bg-slate-900/90 shadow-xl flex flex-col justify-between p-6 sm:p-7 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-teal-500 text-slate-950 font-bold text-xs uppercase px-2.5 py-1">
                    New Here?
                  </Badge>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    Only 20 seats
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    Data Horizon
                  </h2>
                  <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                    Data Engineering + Gen AI · Weekend Certification Edition
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Starts Saturday 14 Nov 2026 · 16 Saturdays · Live instruction with Arul Benjamin.
                  </p>
                </div>

                {/* Countdown Box Inside Door 1 */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071527] border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Next cohort starts in
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-lg sm:text-2xl font-bold font-mono text-teal-600 dark:text-teal-300">
                        {timeLeft.days}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                        Days
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-lg sm:text-2xl font-bold font-mono text-teal-600 dark:text-teal-300">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                        Hours
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-lg sm:text-2xl font-bold font-mono text-teal-600 dark:text-teal-300">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                        Mins
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="block text-lg sm:text-2xl font-bold font-mono text-amber-500">
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                        Secs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <a href="#data-horizon" className="w-full sm:flex-1">
                  <Button className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5 h-10">
                    See the Program
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </a>
                <a
                  href="https://wa.me/919894481283?text=Hi%20Arul%2C%20I%20have%20a%20question%20about%20Data%20Horizon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1"
                >
                  <Button variant="outline" className="w-full border-slate-300 dark:border-slate-700 text-xs font-semibold h-10 gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-teal-500" />
                    Talk to Arul on WhatsApp
                  </Button>
                </a>
              </div>
            </Card>

            {/* Door 2: Already a Student */}
            <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl flex flex-col justify-between p-6 sm:p-7 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase px-2.5 py-1">
                    Already a Student?
                  </Badge>
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                    Lifetime Access
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {user ? "Welcome back!" : "Student Sign In"}
                  </h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Private Classroom &amp; Resource Vault
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Sign in to watch your class recordings, download materials and pick up where you left off.
                    Current and previous cohorts: your recordings are all here.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071527] border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <PlayCircle className="h-4 w-4 text-teal-500 shrink-0" />
                    <span>Watch all sessions with zero ads</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <FileCode2 className="h-4 w-4 text-cyan-500 shrink-0" />
                    <span>Download Google Drive notebooks &amp; slides</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Resume exactly where you stopped</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {user ? (
                  <Link href="/dashboard" className="w-full block">
                    <Button className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs h-10 gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      Go to My Classroom
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login" className="w-full block">
                    <Button className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs h-10 gap-1.5">
                      Sign In to My Classroom
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}

                <div className="text-center pt-1">
                  <Link
                    href="/redeem"
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                  >
                    Have an enrollment code? Redeem it →
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 2.5 STUDENT PLATFORM WALKTHROUGH & HOW-TO VIDEO */}
      <section id="walkthrough" className="py-12 sm:py-16 bg-slate-100/70 dark:bg-[#09182a] border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge
              variant="outline"
              className="text-xs uppercase tracking-wider font-semibold border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              New Student Orientation
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platform Walkthrough: How TiBen AI Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              New to TiBen AI Academy or activating your cohort access key? Watch our complete step-by-step
              walkthrough video below to see how to sign in, redeem your code, stream live session recordings, and download lab materials.
            </p>
          </div>

          <StudentWalkthroughVideo />
        </div>
      </section>

      {/* 3. YOUR CLASSROOM FOR LIFE */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Your classroom for life
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              When you join a TiBen AI Academy cohort, you never lose your learning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-5 space-y-2.5 shadow-xs">
              <div className="h-9 w-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Lifetime free access
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Once you&apos;re enrolled, your recordings never expire and there&apos;s nothing extra to pay.
              </p>
            </Card>

            <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-5 space-y-2.5 shadow-xs">
              <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Video className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Every class recorded
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Missed a Saturday? Watch it the same day in full quality without missing a beat.
              </p>
            </Card>

            <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-5 space-y-2.5 shadow-xs">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Previous cohorts welcome
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Recordings from earlier TiBen AI cohorts are available here too, so past students can sign in and revise anytime.
              </p>
            </Card>

            <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-5 space-y-2.5 shadow-xs">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Everything in one place
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Recordings, notebooks, slides and datasets for each session, with progress tracking so you resume where you stopped.
              </p>
            </Card>
          </div>

          <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            Private and ad-free. Only enrolled students can see the classroom.
          </p>
        </div>
      </section>

      {/* 4. HOW TO ACCESS YOUR CLASSROOM */}
      <section className="py-14 bg-slate-50 dark:bg-[#071527] border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              How to access your classroom
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Three quick steps to get into your sessions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-2 shadow-xs">
              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                01
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sign up with your email
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sign up with the same email you used at admission so your Google Drive materials work seamlessly.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-2 shadow-xs">
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                02
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Enter your enrollment code
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enter your enrollment code on the <Link href="/redeem" className="underline text-teal-600 dark:text-teal-400 font-semibold">Redeem page</Link> to unlock your course.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-2 shadow-xs">
              <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                03
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Start watching
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Open your dashboard, click into your classroom, stream recordings, and download your lab resources.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/instructions"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              <span>Read the full guide</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. UPCOMING PROGRAM: DATA HORIZON */}
      <section id="data-horizon" className="py-16 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              Live Weekend Cohort · Starts 14 Nov 2026
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Become a Data Engineer who can build with AI, in 16 Saturdays.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Learn Python, SQL, Databricks, Microsoft Fabric and Claude step by step, build real
              projects, and prepare for 3 industry certifications, live with a mentor, while you keep your job.
            </p>
          </div>

          {/* Fact Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              16 live Saturdays
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              10:30 AM – 2:30 PM IST
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              ~59 hours live
            </span>
            <span className="px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              3 certifications
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Only 20 seats
            </span>
          </div>
        </div>
      </section>

      {/* 6. WHO THIS IS FOR */}
      <section className="py-16 bg-slate-50 dark:bg-[#071527] border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Who this is for
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Designed for learners taking practical steps into modern data and AI
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Freshers &amp; Early Career
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Freshers and early-career engineers who want a strong Data Engineering start.
              </p>
            </Card>

            <Card className="p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-2">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Career Switchers
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Working professionals (testing, support, mainframe, DBAs, analysts) moving into Data + AI.
              </p>
            </Card>

            <Card className="p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Data Engineers
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Data engineers adding Databricks, Fabric and Gen AI to their skills.
              </p>
            </Card>

            <Card className="p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
                04
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Certification Seekers
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Anyone aiming for Databricks, Microsoft Fabric or Claude certification.
              </p>
            </Card>
          </div>

          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center max-w-2xl mx-auto">
            <p className="text-xs sm:text-sm font-semibold text-teal-800 dark:text-teal-300">
              &ldquo;We start from the basics in Session 1. If you&apos;re willing to practise, you can do this.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* 7. WHAT YOU'LL BE ABLE TO DO */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              What you&apos;ll be able to do
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Skills you can demonstrate and discuss with confidence
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                Write Python and SQL for real data work
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                Build pipelines and lakehouses on Databricks and Microsoft Fabric
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                Use Spark, Delta Lake and Unity Catalog the way companies do
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                Build a Gen AI / RAG agent with Claude on your own data
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                Show 7 portfolio projects you built yourself in interviews
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                Sit 3 certification exams after full-length mock tests
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. YOUR LEARNING JOURNEY */}
      <section className="py-16 bg-slate-50 dark:bg-[#071527] border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Your learning journey
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              16 Saturdays structured into 4 practical phases
            </p>
          </div>

          {/* Simple Vertical Timeline */}
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 uppercase">
                  Phase 1 · S1–S2 (14–21 Nov)
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Foundations: Python, Pandas and SQL
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Environment setup, clean Python scripting, data wrangling, window functions and query tuning.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                  Phase 2 · S3–S9 (28 Nov – 16 Jan)
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Databricks &amp; Lakehouse: Spark, Delta Lake, Unity Catalog, Pipelines
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  PySpark transformations, Delta ACID transactions, Unity Catalog governance, and Lakeflow CI/CD.
                </p>
              </div>
              <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] uppercase shrink-0 w-fit">
                Sprint: 23 Jan
              </Badge>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                  Phase 3 · S10–S12 (30 Jan – 06 Feb)
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Microsoft Fabric: OneLake, Lakehouse, Warehouse
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Shortcuts, Dataflows Gen2, Mirroring, T-SQL Warehouses, Eventstreams and Git deployment pipelines.
                </p>
              </div>
              <Badge className="bg-blue-500 text-white font-bold text-[10px] uppercase shrink-0 w-fit">
                Sprint: 13 Feb
              </Badge>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
                  Phase 4 · S13–S16 (20 Feb – 06 Mar)
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Gen AI with Claude: RAG, Agents, MCP, Capstone
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Claude Messages API, vector indexing, production RAG, tool use, MCP servers and capstone showcase.
                </p>
              </div>
              <Badge className="bg-purple-500 text-white font-bold text-[10px] uppercase shrink-0 w-fit">
                Sprint: 06 Mar
              </Badge>
            </div>
          </div>

          {/* Toggle Button for Full Syllabus Accordion */}
          <div className="text-center pt-2">
            <Button
              variant="outline"
              onClick={() => setShowFullSyllabus(!showFullSyllabus)}
              className="text-xs font-bold border-slate-300 dark:border-slate-700 gap-1.5"
            >
              <span>{showFullSyllabus ? "Hide Detailed Syllabus" : "View Full 16-Session Syllabus"}</span>
              {showFullSyllabus ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Detailed Syllabus Accordion Container */}
          {showFullSyllabus && (
            <div className="space-y-6 pt-4 animate-in fade-in-50 duration-200">
              {/* Phase Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 justify-start sm:justify-center">
                {curriculumPhases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => {
                      setActivePhase(phase.id);
                      setExpandedSession(phase.sessions[0].num);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      activePhase === phase.id
                        ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {phase.title.split(":")[0]}
                  </button>
                ))}
              </div>

              {/* Active Phase Details */}
              {(() => {
                const current = curriculumPhases.find((p) => p.id === activePhase)!;
                return (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xl space-y-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {current.title}
                        </h3>
                        <Badge variant="outline" className="text-[10px] text-teal-600 dark:text-teal-400 border-teal-500/30">
                          {current.dates}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {current.summary}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {current.sessions.map((s) => {
                        const isOpen = expandedSession === s.num;
                        return (
                          <div
                            key={s.num}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedSession(isOpen ? null : s.num)}
                              className="w-full text-left p-3.5 flex items-center justify-between gap-4 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="h-6 w-6 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                                  {String(s.num).padStart(2, "0")}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {s.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    {s.date}
                                  </p>
                                </div>
                              </div>
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                              )}
                            </button>

                            {isOpen && (
                              <div className="p-3.5 pt-1 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5 text-[11px]">
                                      Module A (10:30 AM – 12:20 PM)
                                    </span>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{s.moduleA}</p>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5 text-[11px]">
                                      Module B (12:40 PM – 2:30 PM)
                                    </span>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{s.moduleB}</p>
                                  </div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 text-[11px]">
                                  <strong>Hands-on Lab: </strong>
                                  {s.lab}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* 9. 3 CERTIFICATIONS, PREPARED STEP BY STEP */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              3 certifications, prepared step by step
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Each certification sprint includes blueprint walkthroughs, drills, and a full-length timed mock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cert 1 */}
            <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                    Sprint: 23 Jan
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Databricks Certified Data Engineer Associate
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Proves your ability to use Spark, Delta Lake, Unity Catalog, Lakeflow pipelines and production deployments.
                </p>
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  Includes a full-length timed mock + personal review
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono">
                45 questions · 90 minutes · US$200 · 2-year validity
              </div>
            </Card>

            {/* Cert 2 */}
            <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30">
                    Sprint: 13 Feb
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Microsoft Fabric Data Engineer Associate (DP-700)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Proves your ability to build on OneLake, Fabric Lakehouse, Warehouse, KQL, and Git deployment pipelines.
                </p>
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  Includes a full-length timed mock + personal review
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono">
                40–60 questions · 100 minutes · ~US$165 · 1-year free renewal
              </div>
            </Card>

            {/* Cert 3 */}
            <Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] text-purple-600 dark:text-purple-400 border-purple-500/30">
                    Sprint: 06 Mar
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Claude Certified Architect — Foundations (CCAR-F)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Proves your ability to design with prompt engineering, Claude API, tool use, RAG, agents and evaluation.
                </p>
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  Includes a full-length timed mock + personal review
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono">
                120 minutes · Pearson VUE · US$125 · 12-month validity
              </div>
            </Card>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Exam fees are paid directly to the certification provider and are not part of the course fee.
          </p>
        </div>
      </section>

      {/* 10. MEET YOUR MENTOR */}
      <section className="py-16 bg-slate-50 dark:bg-[#071527] border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Meet your mentor
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Arul has spent 13+ years building enterprise systems for banks, insurers and healthcare companies.
              He teaches what he uses at work: explained simply, shown live, practised hands-on.
            </p>
          </div>

          <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-lg space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-teal-500 to-amber-500 p-0.5 shrink-0">
                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-lg text-teal-400">
                  AB
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Arul Benjamin
                </h3>
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  AI Architect · Founder, TiBen AI Academy
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  13+ years across Banking, Insurance &amp; Healthcare
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                <span>Microsoft Certified: Azure AI Engineer Associate (AI-102)</span>
              </p>
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                <span>Google Certified Generative AI Leader</span>
              </p>
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                <span>5,000+ professionals trained across live AI cohorts</span>
              </p>
            </div>

            <blockquote className="text-xs italic text-slate-500 dark:text-slate-400 border-l-2 border-teal-500 pl-3">
              &ldquo;Empowering learners to build future-ready careers with practical, real-world skills.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* 11. FEE: ONE FEE, TWO EASY INSTALLMENTS */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              One fee, two easy installments
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Honest and straightforward pricing. No hidden renewal charges.
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-2xl border border-teal-500/30 bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-md">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Total Course Fee
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                ₹40,000
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#071527] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Installment 1
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">₹25,000</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  To confirm your seat in the 20-member live cohort.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#071527] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                  Installment 2
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">₹15,000</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Only after Session 8, so you see the value before paying the rest.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                <span>16 live 4-hour Saturday sessions (~59 hours)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                <span>3 certification sprints with mocks and personal reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                <span>7 portfolio projects incl. Lakehouse + Claude Agent capstone</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                <span>Mentor chat support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-teal-500 shrink-0" />
                <span>Lifetime free access to all recordings and materials in your private classroom</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/register" className="w-full sm:flex-1">
                <Button className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs h-10">
                  Enroll Now
                </Button>
              </Link>
              <a
                href="https://wa.me/919894481283?text=Hi%20Arul%2C%20I%20have%20a%20question%20about%20fees%20and%20enrollment"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1"
              >
                <Button variant="outline" className="w-full border-slate-300 dark:border-slate-700 text-xs font-semibold h-10 gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-teal-500" />
                  Ask on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FAQ (ACCORDION) */}
      <section className="py-16 bg-slate-50 dark:bg-[#071527] border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Frequently asked questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear answers to common questions
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 13. FINAL CTA BANNER */}
      <section className="py-16 bg-white dark:bg-slate-900/80 transition-colors text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-2">
            <Badge className="bg-amber-500 text-slate-950 font-bold text-xs uppercase px-2.5 py-1">
              Cohort Limited to 20 Seats
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Only 20 seats. Classes begin Saturday, 14 November 2026.
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-8 text-xs sm:text-sm h-11">
                Enroll Now
              </Button>
            </Link>
            <a
              href="https://wa.me/919894481283?text=Hi%20Arul%2C%20I%20want%20to%20enroll%20in%20Data%20Horizon"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-300 dark:border-slate-700 text-xs sm:text-sm h-11 gap-2">
                <Phone className="h-4 w-4 text-teal-500" />
                WhatsApp +91 98944 81283
              </Button>
            </a>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 font-medium"
            >
              Already a student? Sign in to your classroom →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
