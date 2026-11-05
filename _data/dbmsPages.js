// Complete 30-page Chapter 1 DBMS study guide ("Data, Databases, and DBMS Fundamentals").
// Mirrors src/assets/study-materials/dbms-chapter-01.pdf page-for-page (Pages 1 to 30).

module.exports = [
  {
    pageNumber: 1,
    unit: 'Part I: Database Foundations · Chapter 1',
    title: 'Data, Databases, and DBMS Fundamentals — Roadmap & Learning Objectives',
    sections: [
      {
        heading: 'Why This Matters & Prerequisites',
        bullets: [
          'Why This Matters: Every application you use daily—from UPI payments and IRCTC train bookings to your university exam portal—lives or dies by how safely it stores, searches, and updates shared data; mastering these foundations gives you the vocabulary and mental model behind every system in computer science.',
          'Prerequisites: None. Basic familiarity with files, folders, and variables in any programming language (C, Python, or Java) is helpful but not required.'
        ]
      },
      {
        heading: 'Learning Objectives (What You Will Master in This Chapter)',
        bullets: [
          '• Distinguish clearly between data, information, knowledge, and metadata with concrete university and banking examples.',
          '• Define a Database and a Database Management System (DBMS), and explain how a DBMS acts as a controlled bridge between applications, the operating system, and physical disk storage.',
          '• Analyze the seven classic pitfalls of traditional file-processing systems (redundancy, inconsistency, data isolation, atomicity failures, concurrency anomalies, security gaps, and program-data dependence) and prove how a DBMS resolves each.',
          '• Contrast a general DBMS with a Relational DBMS (RDBMS) using E.F. Codd’s foundational relational rules.',
          '• Identify the roles of Database Administrators (DBAs), designers, application developers, analysts, and parametric end users.',
          '• Explore our book-wide running database (UniVerseDB), inspect live metadata catalogs, and connect to a relational database safely from Python (psycopg2/sqlite3) and Java (JDBC) using parameterized queries.'
        ]
      }
    ],
    callout: 'CHAPTER 1 OVERVIEW: Complete 30-Page Chapter covering theory, worked numerical examples, Python/Java JDBC code, rapid-revision cheat sheet, GATE/Viva question bank, and full worked solutions.'
  },
  {
    pageNumber: 2,
    unit: 'Chapter 1 Contents · Pages 1 to 30',
    title: 'Table of Contents — Chapter 1: Data, Databases, and DBMS Fundamentals',
    sections: [
      {
        heading: 'Sections 1.1 to 1.8 (Core Concepts, Architecture & Code)',
        bullets: [
          '1.1 Data vs. Information vs. Knowledge vs. Metadata (Formal Definitions & Worked Example 1.1) — Page 3',
          '1.2 What Is a Database? Introducing UniVerseDB (Formal Definition & Running Schema) — Page 5',
          '1.3 What Is a DBMS and How Does It Sit Between Users and Disk? — Page 5',
          '1.4 Why Not Simply Store Everything in Flat Files? (The 7 Classic Problems & Worked Example 1.2) — Page 7',
          '1.5 Core Responsibilities and Internal Subsystems of a DBMS (Worked Example 1.3: System Catalog) — Page 9',
          '1.6 DBMS vs. RDBMS and E.F. Codd’s Relational Vision (Worked Example 1.4: Workload Selection) — Page 11',
          '1.7 Database Users, Roles, and DBA Responsibilities — Page 13',
          '1.8 Modern DBMS Landscape and Connecting Safely from Python & Java — Page 14'
        ]
      },
      {
        heading: 'Sections 1.9 to 1.11 (Revision Sheet, Question Bank & Complete Answer Key)',
        bullets: [
          '1.9 Chapter 1 Summary & One-Page Rapid-Revision Cheat Sheet — Page 18',
          '1.10 Chapter 1 Exam, GATE & Placement Question Bank (MCQs, Short/Long Answers, Numericals) — Page 19',
          '1.11 Chapter 1 Complete Answer Key & Step-by-Step Worked Solutions — Page 25'
        ]
      }
    ],
    callout: 'STUDY TIP: Jump directly to any page from Page 1 to Page 30 using the page selector above, or download the 30-page Chapter 1 PDF for offline revision.'
  },
  {
    pageNumber: 3,
    unit: 'Section 1.1 · Data, Information, Knowledge & Metadata',
    title: '1.1 Data vs. Information vs. Knowledge vs. Metadata',
    sections: [
      {
        heading: 'Concept: The Raw Ingredients vs. The Cooked Meal',
        bullets: [
          'Think of data as raw ingredients sitting on a kitchen counter—unwashed vegetables, unmeasured spices, and uncooked rice. By themselves, a list of numbers like 101, 8.42, 10, 2026-08-26 tells a dean nothing.',
          'When you process, organize, and attach context to those raw facts—discovering that "Student 101 (Asha) in Department 10 (CSE) has achieved a CGPA of 8.42 as of August 26, 2026, qualifying for the Merit Scholarship"—you have transformed raw data into actionable information.'
        ]
      },
      {
        heading: '1.1.1 Formal Definitions',
        bullets: [
          '1. Data (Raw Facts): Known, recorded facts, symbols, numbers, text strings, images, or timestamps that have implicit meaning in the real world but have not yet been organized or interpreted for a specific decision.',
          '2. Information (Processed Data): Data that has been filtered, aggregated, joined, or formatted within a specific context so that it becomes meaningful and useful to a human user or downstream software system.',
          '3. Knowledge (Actionable Rules & Patterns): Higher-level insights or decision rules derived from analyzing information over time (e.g., observing that students whose mid-semester attendance drops below 65% have a 78% probability of failing the DBMS lab).',
          '4. Metadata ("Data About Data"): Structural and descriptive information that defines the properties, data types, constraints, storage locations, and ownership of the raw data itself. Without metadata, a DBMS sees only an uninterpreted stream of bytes on disk.'
        ]
      }
    ],
    callout: 'WORKED EXAMPLE 1.1: Traces how raw exam submissions, attendance logs, and fee receipts are interpreted via metadata into university information.'
  },
  {
    pageNumber: 4,
    unit: 'Section 1.1.2 · Hierarchy Diagram & Worked Trace',
    title: 'Figure 1.1 & Table 1.1: Tracing Data, Metadata, and Information',
    sections: [
      {
        heading: 'The 3-Level Data–Information–Knowledge Hierarchy',
        bullets: [
          'Level 1 (Raw Data / Unprocessed Facts): (1, "Asha", 10, 8.42, "Patna"), (2, "Ravi", 10, 7.25, "Delhi") stored on slotted 8 KB disk pages on NVMe SSD.',
          'Level 2 (Information / Contextualized Output): DBMS Query Processor applies SELECT, AVG(), RANK() using System Catalog Metadata (Table: Student, Col: CGPA DECIMAL(3,2)) to produce "CSE Average CGPA = 8.34; Asha ranks #2 in batch".',
          'Level 3 (Knowledge / Actionable Decision): Historical rules trigger "Auto-trigger academic mentorship alert if CGPA < 6.0".'
        ]
      },
      {
        heading: 'Table 1.1: Tracing Raw Data, Governing Metadata & Resulting Information',
        bullets: [
          '• Raw Data: 78, 82, 91 | Metadata: Marks INT CHECK (Marks BETWEEN 0 AND 100) | Resulting Information: Student’s average score in CSE core subjects is 83.67%.',
          '• Raw Data: 2026-08-26, 120 | Metadata: EnrollDate DATE, Count INT | Resulting Information: Course registration volume increased by 17.65% today.',
          '• Raw Data: "25BCS101", 72 | Metadata: StudentID VARCHAR(10), DBMS_Score INT | Resulting Information: Student 25BCS101 earned grade B (8 grade points) in DBMS.',
          '• Raw Data: 501, 60, 60 | Metadata: SectionID INT, Capacity INT, Enrolled INT | Resulting Information: Section 501 is FULL; redirect new applicants to waitlist.'
        ]
      }
    ],
    callout: 'COMMON MISTAKE: Actual student records (101, "Asha", 8.42) are user data (instance data). Column names (StudentID, Name, CGPA), types (INT, VARCHAR(80)), and constraints (PRIMARY KEY) in the system catalog are metadata.'
  },
  {
    pageNumber: 5,
    unit: 'Sections 1.2 & 1.3 · Databases, UniVerseDB & DBMS Role',
    title: '1.2 What Is a Database? Introducing UniVerseDB & 1.3 What Is a DBMS?',
    sections: [
      {
        heading: '1.2.1 Formal Definition of a Database',
        bullets: [
          'A database is a logically coherent, organized collection of related data that models a specific real-world domain (called the Universe of Discourse (UoD) or mini-world).',
          '1. Logical Coherence: Represents a specific aspect of the real world (e.g., a university’s academic and financial operations), and changes in the real world are promptly reflected in the database.',
          '2. Inherent Meaning: Data elements are structured into entities, attributes, and relationships rather than an arbitrary assortment of disconnected values.',
          '3. Purposeful Design: Designed, built, and populated with data for a specific community of users and applications.'
        ]
      },
      {
        heading: '1.3 What Is a DBMS and How Does It Sit Between Users and Disk?',
        bullets: [
          'Imagine a busy bank vault holding Rs. 500 Crore in cash and ledgers. If every customer and cashier walked directly into the vault with a pen, two cashiers would overwrite the same page and a power cut would leave half-written entries.',
          'A Database Management System (DBMS) is the armored, automated vault controller: no user or application ever touches raw disk files directly. Every request passes through the DBMS in SQL, guaranteeing safety, speed, privacy, and crash recovery.'
        ]
      }
    ],
    callout: 'RUNNING DATABASE (UniVerseDB): Instead of switching between disconnected toy tables in every chapter, we build, query, normalize, index, and tune one realistic university database throughout the course.'
  },
  {
    pageNumber: 6,
    unit: 'Section 1.3.1 · UniVerseDB Schema & DBMS Layer Architecture',
    title: 'Table 1.2: UniVerseDB Core Tables & Figure 1.2: DBMS Software Layer',
    sections: [
      {
        heading: 'Table 1.2: Snapshot of Core Tables in UniVerseDB',
        bullets: [
          '• Department (DeptID [PK], DeptName, Building, Budget): (10, "CSE", "Turing Block", 5000000), (20, "ECE", "Shannon Hall", 4200000), (30, "MBA", "Kautilya Wing", 3000000).',
          '• Student (StudentID [PK], Name, DeptID [FK], CGPA, City): (1, "Asha", 10, 8.42, "Patna"), (2, "Ravi", 10, 7.25, "Delhi"), (3, "Meera", 20, 9.01, "Patna"), (4, "Kabir", NULL, 6.80, "Jaipur").',
          '• Course (CourseID [PK], Title, Credits, DeptID [FK]): ("CS301", "Database Systems", 4, 10), ("CS201", "Data Structures", 4, 10), ("EC204", "Digital Circuits", 3, 20).',
          '• Enrollment (StudentID [FK], SectionID [FK], Grade) & FeeAccount (AccountID [PK], StudentID [FK], Balance).'
        ]
      },
      {
        heading: '1.3.1 Formal Definition of a DBMS & Figure 1.2 Layering',
        bullets: [
          'A DBMS is a general-purpose software suite that enables users and applications to define, construct, manipulate, secure, share, and recover databases efficiently across concurrent users and hardware failures.',
          'Architecture Flow: Users & Apps (Web Portals, Mobile Apps, Python/Java Services, DBAs) -> SQL Queries / API Calls -> DBMS Engine (Query Parser & Optimizer, Security & Access Control, Concurrency Lock/MVCC Mgr, Crash Recovery WAL Mgr) -> Operating System & Database Files (Data Files, B+ Tree Indexes, System Catalog, Write-Ahead Logs) -> Physical Storage / NVMe SSD.'
        ]
      }
    ],
    callout: 'KEY DISTINCTION: Defining specifies schema/constraints in the catalog; Constructing stores data on SSD/HDD pages; Manipulating queries and updates data; Sharing coordinates concurrent transactions.'
  },
  {
    pageNumber: 7,
    unit: 'Section 1.4 · File-Processing Systems vs. DBMS',
    title: '1.4 Why Not Simply Store Everything in Flat Files? (Problems 1–4)',
    sections: [
      {
        heading: 'Real-Life Use: Why Your Banking App Never Edits Disk Files Directly',
        bullets: [
          'When you transfer Rs. 1,000 via UPI, the banking app never opens balances.txt directly. It sends an API request to the backend server, which submits a transactional SQL request to a DBMS (Oracle, PostgreSQL, or TiDB) that verifies permissions, locks/versions rows, writes a durable WAL log entry, and only then confirms "Payment Successful."'
        ]
      },
      {
        heading: '1.4.1 The Seven Classic Problems of File-Processing Systems (Part 1)',
        bullets: [
          '1. Data Redundancy and Wasted Storage: Student Name, Phone, and DeptName are duplicated across academics.csv, fees.csv, and library.csv. Across 50,000 students and 12 departments, the same profile is stored 12 times.',
          '2. Data Inconsistency (Loss of Single Source of Truth): When Asha updates her phone number at the Academic Office (academics.csv), fees.csv and library.csv still hold her old number.',
          '3. Difficulty in Accessing Data (Data Isolation): Answering ad-hoc cross-departmental queries ("all CSE students with CGPA > 8.5 who have zero library fines and paid hostel fees") requires writing a new 200-line Python/C script to parse and join three different file formats.',
          '4. Program–Data Dependence: Adding a new column UPI_ID as the third field in fees.csv breaks every existing C or Python script that reads columns by fixed positional offset (row[2], row[3]).'
        ]
      }
    ],
    callout: 'EXAM HIGHLIGHT: "Explain the seven drawbacks of traditional file-processing systems compared to a DBMS" is one of the most frequent 10-mark questions in B.Tech semester exams.'
  },
  {
    pageNumber: 8,
    unit: 'Section 1.4.1 & 1.4.2 · File-System Problems 5–7 & Numerical Setup',
    title: 'Problems 5–7 (Integrity, Atomicity, Concurrency) & Worked Example 1.2',
    sections: [
      {
        heading: 'The Seven Classic Problems of File-Processing Systems (Part 2)',
        bullets: [
          '5. Integrity Enforcement Problems: Rules like CGPA BETWEEN 0.00 AND 10.00 must be copy-pasted as if/else checks into every application program; one forgotten check writes CGPA = 95.0 to disk.',
          '6. Atomicity of Updates (Crash Corruption): If power fails after deducting Rs. 10,000 from wallet.csv but before updating fees.csv, Rs. 10,000 vanishes because OS file writes are not multi-step atomic.',
          '7. Concurrent-Access Anomalies & Coarse Security: Two clerks reading Balance = 20,000 simultaneously and saving Rs. 15,000 and Rs. 12,000 overwrite each other’s update (Lost Update Anomaly, Figure 1.3), whereas a DBMS acquires an Exclusive Row Lock (X) to preserve the true final balance of Rs. 7,000.'
        ]
      },
      {
        heading: '1.4.2 Worked Example 1.2: Quantifying Redundancy & Update Overhead',
        bullets: [
          'Problem Statement: A university has N = 40,000 students. Each student’s shared profile (StudentID: 10 B, Name: 50 B, Address: 100 B, Phone: 15 B, Email: 45 B) occupies S_profile = 220 bytes.',
          '• Legacy File System: 8 departments each store all 40,000 profiles (220 B) + 30 B department data.',
          '• Centralized DBMS (UniVerseDB): The 220 B profile is stored once in Student, and each of the 8 departmental tables stores only the 10 B StudentID foreign key + 30 B department data.'
        ]
      }
    ],
    callout: 'CONCURRENCY TRACE (Figure 1.3): Flat files suffer Lost Update corruption when concurrent readers overwrite each other; DBMS row-level locking serializes conflicting updates.'
  },
  {
    pageNumber: 9,
    unit: 'Sections 1.4.2, 1.4.3 & 1.5 · Storage Math & When to Use Flat Files',
    title: 'Worked Example 1.2 Solution, GATE Tip & Core DBMS Subsystems',
    sections: [
      {
        heading: 'Step-by-Step Solution to Worked Example 1.2',
        bullets: [
          '• (a) File System Storage (T_file): 8 × 40,000 × (220 + 30) bytes = 80,000,000 bytes ≈ 80.0 MB.',
          '• (a) Centralized DBMS Storage (T_dbms): (40,000 × 220) + (8 × 40,000 × 40) = 8.8 MB + 12.8 MB = 21.6 MB.',
          '• (b) Storage Savings: (80.0 − 21.6) / 80.0 × 100% = 73.0% reduction (58.8 MB of redundant non-key duplication eliminated).',
          '• (c) Phone Number Update I/O: Updating 5,000 phone numbers requires 5,000 × 8 = 40,000 writes in flat files vs. 5,000 × 1 = 5,000 updates in the DBMS (8× fewer writes and zero inconsistency risk).'
        ]
      },
      {
        heading: 'GATE & Interview Tip: When Is a Simple File System Preferable to a DBMS?',
        bullets: [
          '1. Static, read-only, or append-only archive logs with zero concurrent random updates.',
          '2. Large unstructured binary blobs (4K videos, raw medical MRI scans, compiled binaries)—store the file path/URL in the DBMS and the raw bytes in object/file storage (e.g., Amazon S3).',
          '3. Single-user embedded hardware with extreme real-time determinism or tiny KB-scale RAM constraints.'
        ]
      }
    ],
    callout: 'SECTION 1.5 PREVIEW: Every production DBMS fulfills these guarantees through eight specialized internal subsystems, starting with Data Definition (DDL Compilation).'
  },
  {
    pageNumber: 10,
    unit: 'Section 1.5 · Comparison Table & Eight Core DBMS Responsibilities',
    title: 'Table 1.3: File System vs. DBMS & The 8 Core DBMS Responsibilities',
    sections: [
      {
        heading: 'Table 1.3: Architectural Comparison Across 7 Dimensions',
        bullets: [
          '1. Data Redundancy: High in private flat files vs. Controlled and minimal via normalization in a DBMS.',
          '2. Data Consistency: Prone to partial-update inconsistency vs. Enforced automatically via single point of storage, foreign keys, and ACID transactions.',
          '3. Program–Data Independence: Tight coupling in flat files vs. Logical and physical data independence in a DBMS.',
          '4–7. Querying, Integrity, Crash Recovery & Concurrency: Procedural loops, buried if/else checks, OS buffered write corruption, and whole-file locks vs. Declarative SQL, schema constraints, Write-Ahead Logging (WAL/ARIES), and row-level locking/MVCC.'
        ]
      },
      {
        heading: 'The Eight Core Responsibilities of a Production DBMS',
        bullets: [
          '1. Data Definition (DDL Compilation) · 2. Data Manipulation (DML & Query Execution) · 3. Cost-Based Query Optimization · 4. Data Integrity Management (PK, FK, CHECK, NOT NULL) · 5. Security & Authorization (GRANT/REVOKE, Views, RLS) · 6. Concurrency Control (2PL, MVCC) · 7. Crash Recovery & Logging (WAL UNDO/REDO) · 8. Metadata (System Catalog / Data Dictionary) Management.'
        ]
      }
    ],
    callout: 'INTERVIEW KEYWORD: Write-Ahead Logging (WAL) and ARIES guarantee Atomicity and Durability; 2PL and MVCC guarantee Isolation.'
  },
  {
    pageNumber: 11,
    unit: 'Sections 1.5.1 & 1.6 · Live System Catalog & DBMS vs. RDBMS',
    title: '1.5.1 Querying INFORMATION_SCHEMA & 1.6 DBMS vs. RDBMS',
    sections: [
      {
        heading: '1.5.1 Worked Example 1.3: Inspecting Live Metadata in the System Catalog',
        bullets: [
          'Querying User Data (Instance Rows): SELECT StudentID, Name, CGPA FROM Student WHERE DeptID = 10;',
          'Querying Metadata (ANSI SQL System Catalog): SELECT column_name, data_type, is_nullable, character_maximum_length FROM information_schema.columns WHERE table_name = \'student\' ORDER BY ordinal_position;',
          'Catalog Output: Returns 5 metadata rows describing studentid (integer, NO), name (character varying, NO, 80), deptid (integer, YES), cgpa (numeric, YES), and city (character varying, YES, 60).'
        ]
      },
      {
        heading: '1.6 DBMS vs. RDBMS and Codd’s Relational Vision',
        bullets: [
          'Core Principle: Every RDBMS is a DBMS, but not every DBMS is an RDBMS.',
          'DBMS is the umbrella term for any database management software (hierarchical trees, XML, key-value stores, graph nodes, or tables).',
          'An RDBMS (Relational Database Management System), introduced by Dr. Edgar F. (Ted) Codd at IBM in 1970, represents all data logically as two-dimensional tables (relations) connected via values in key columns rather than physical memory pointers.'
        ]
      }
    ],
    callout: 'SQL DIALECT NOTE: PostgreSQL stores catalog table names in lowercase (\'student\') in information_schema, whereas Oracle uses uppercase (\'STUDENT\') in USER_TAB_COLUMNS.'
  },
  {
    pageNumber: 12,
    unit: 'Sections 1.6.1 & 1.6.2 · General DBMS vs. RDBMS & Codd’s Rules',
    title: 'Table 1.4: General DBMS vs. RDBMS & E.F. Codd’s Relational Rules',
    sections: [
      {
        heading: 'Table 1.4: General / Non-Relational DBMS vs. Relational DBMS (RDBMS)',
        bullets: [
          '• Logical Structure: Trees (Hierarchical), pointer graphs (Network), JSON documents, or key-value pairs vs. Two-dimensional tables (relations) of rows (tuples) and columns (attributes).',
          '• Relationships & Integrity: Physical disk pointers or nested documents with app-level checks vs. Matching data values (Primary Keys & Foreign Keys) enforced inside the engine kernel.',
          '• Representative Examples: IBM IMS, IDMS, MongoDB, Redis, Neo4j vs. PostgreSQL, MySQL (InnoDB), Oracle Database, Microsoft SQL Server, IBM Db2, SQLite.'
        ]
      },
      {
        heading: '1.6.2 E.F. Codd’s Foundational Relational Principles (Exam Summary)',
        bullets: [
          '• Rule 0 (Foundation Rule): Any RDBMS must manage databases entirely through its relational capabilities.',
          '• Rule 1 (Information Rule): All information—including metadata—is represented explicitly at the logical level in one way: by values in tables (relations).',
          '• Rule 2 (Guaranteed Access Rule): Every atomic scalar value is logically accessible via (Table Name, Primary Key Value, Column Name)—never by byte offset or pointer.',
          '• Rule 3 (Systematic Treatment of NULL Values): NULL values are supported uniformly across all data types to represent missing or inapplicable information.'
        ]
      }
    ],
    callout: 'CODD’S 12 RULES: Published in 1985 (numbered Rule 0 to Rule 12, totaling 13 rules) to distinguish true relational engines from hierarchical databases.'
  },
  {
    pageNumber: 13,
    unit: 'Sections 1.6.2, 1.6.3 & 1.7 · Codd’s Rules 4, 8, 9 & Workload Selection',
    title: 'Codd’s Catalog & Independence Rules + Worked Example 1.4',
    sections: [
      {
        heading: 'Codd’s Rules 4, 8, and 9 & Viva Trap',
        bullets: [
          '• Rule 4 (Dynamic Online Catalog Based on the Relational Model): Metadata is stored in relational catalog tables and queried using regular SQL.',
          '• Rules 8 & 9 (Physical and Logical Data Independence): Application programs remain unimpaired when physical storage structures (Rule 8) or information-preserving logical table structures (Rule 9) are modified.',
          '• Viva Trap: Unlike desktop tools or flat CSV readers, enterprise RDBMS engines guarantee multi-user ACID concurrency, Write-Ahead Logging crash recovery, and online relational catalogs.'
        ]
      },
      {
        heading: '1.6.3 Worked Example 1.4: Selecting the Right Database System for Real Workloads',
        bullets: [
          '• Scenario A (Offline mobile chat history on a single phone): Embedded RDBMS (SQLite)—serverless, in-process, full SQL and ACID protection against battery loss.',
          '• Scenario B (UniVerseDB for 45,000 students with concurrent registrations and fee transfers): Enterprise Client-Server RDBMS (PostgreSQL / Oracle / MySQL InnoDB).',
          '• Scenario C (20 TB of raw 1080p CCTV video recordings): File/Object Storage (S3/filesystem) for raw .mp4 files + RDBMS for searchable metadata (VideoID, GateNo, StartTime, FilePathURL).'
        ]
      }
    ],
    callout: 'SECTION 1.7 INTRO: Database personnel are classified into Actors on the Scene (daily users and administrators) and Workers Behind the Scene (DBMS kernel engineers).'
  },
  {
    pageNumber: 14,
    unit: 'Sections 1.7 & 1.8 · Database Users, Roles & DBA Responsibilities',
    title: 'Table 1.5: Taxonomy of Database Users & DBA Responsibilities',
    sections: [
      {
        heading: 'Table 1.5: Taxonomy of Database Users in UniVerseDB',
        bullets: [
          '1. Database Administrator (DBA): Superuser responsible for access authorization, CPU/I/O monitoring, encrypted backups/WAL archiving, index tuning, and capacity planning.',
          '2. Database Designer / Architect: Identifies entities, relationships, and business rules; designs ER models and normalizes tables to 3NF/BCNF.',
          '3. System Analyst & Application Programmer (Software Engineer): Codes backend APIs (Python FastAPI, Java Spring Boot, Node.js) using parameterized SQL queries.',
          '4. Data Analyst / BI Engineer: Writes analytical SQL (GROUP BY, Window Functions, CTEs) for reporting without modifying production records.',
          '5. Naive / Parametric End Users: Largest group; interacts through pre-built web/mobile forms (canned transactions) such as clicking "Download Grade Card".'
        ]
      },
      {
        heading: 'Exam Checkpoint: Naive (Parametric) Users vs. Casual End Users',
        bullets: [
          'Naive (Parametric) End Users repeatedly execute pre-programmed "canned transactions" via standard forms (bank tellers, IRCTC clerks, students checking marks), whereas Casual End Users (deans, middle managers) occasionally query the database for different information using interactive query tools.'
        ]
      }
    ],
    callout: 'TEXTBOOK TAXONOMY: Memorize the distinction between Naive/Parametric End Users (canned transactions) and Casual End Users (ad-hoc interactive queries) for MCQs.'
  },
  {
    pageNumber: 15,
    unit: 'Section 1.8 · Modern DBMS Internals & Application Connectivity',
    title: 'PostgreSQL vs. MySQL InnoDB vs. Oracle vs. SQLite vs. MongoDB',
    sections: [
      {
        heading: 'Modern DBMS Internals Comparison',
        bullets: [
          '• PostgreSQL: Open-source object-relational gold standard; stores rows in 8 KB slotted heap pages (PGDATA/base/) and logs changes to 16 MB WAL segments (pg_wal/).',
          '• MySQL (InnoDB Engine): Stores every table physically as a clustered B+ tree index organized around the Primary Key in 16 KB pages (.ibd files).',
          '• Oracle Database: Enterprise RDBMS using tablespaces, undo segments for MVCC, redo logs, and Real Application Clusters (RAC).',
          '• SQLite: Serverless, in-process C library storing an entire relational database inside a single cross-platform file (universedb.db).',
          '• MongoDB: Document NoSQL DBMS storing binary JSON (BSON) documents managed by the WiredTiger storage engine.'
        ]
      },
      {
        heading: '1.8.1 Three Ironclad Rules for Connecting Python & Java to a DBMS',
        bullets: [
          '1. Always use Parameterized Queries (? or %s placeholders)—never concatenate raw user strings into SQL (prevents SQL Injection).',
          '2. Manage Transaction Boundaries Explicitly—commit when the unit of work succeeds and roll back on exception.',
          '3. Close Cursors and Return Connections to the Pool—use context managers (with in Python, try-with-resources in Java).'
        ]
      }
    ],
    callout: 'CONNECTION PIPELINE (Figure 1.4): App Code (Python/Java) -> Connection Pool (reuses open TCP sockets) -> DB Driver (psycopg2/JDBC binds ? params) -> DBMS Server.'
  },
  {
    pageNumber: 16,
    unit: 'Section 1.8.1 · Production Python & Java JDBC Connectivity Code',
    title: 'Listing 1.2 (Python DB-API 2.0) & Listing 1.3 (Java JDBC)',
    sections: [
      {
        heading: 'Listing 1.2: Complete Python DB-API 2.0 Example (sqlite3 / psycopg2)',
        bullets: [
          'Uses with sqlite3.connect("universedb.sqlite") as conn: and parameterized placeholders: SELECT StudentID, Name, CGPA, City FROM Student WHERE DeptID = ? AND CGPA >= ? ORDER BY CGPA DESC;',
          'Executes an atomic scholarship credit transaction: UPDATE FeeAccount SET Balance = Balance - 1000.00 WHERE StudentID IN (SELECT StudentID FROM Student WHERE DeptID = ? AND CGPA >= ?);',
          'Calls conn.commit() on success, conn.rollback() inside except Exception as err:, and cursor.close() inside finally:.'
        ]
      },
      {
        heading: 'Listing 1.3: Production Java JDBC Example (Part 1)',
        bullets: [
          'Connects to jdbc:postgresql://localhost:5432/universedb using PreparedStatement with ? placeholders: SELECT StudentID, Name, CGPA FROM Student WHERE DeptID = ? AND CGPA >= ?.'
        ]
      }
    ],
    callout: 'SECURITY RULE: Parameterized queries separate SQL syntax compilation from literal user parameters, making SQL Injection impossible and allowing query plan caching.'
  },
  {
    pageNumber: 17,
    unit: 'Section 1.8.1 · Java JDBC try-with-resources Implementation',
    title: 'Listing 1.3 (Continued): Safe Parameter Binding & ResultSet Iteration',
    sections: [
      {
        heading: 'Java JDBC try-with-resources Block',
        bullets: [
          'try (Connection conn = DriverManager.getConnection(URL, "app_user", "secret_pwd"); PreparedStatement pstmt = conn.prepareStatement(sql)) {',
          '  pstmt.setInt(1, deptId); // Binds first ? safely as an integer',
          '  pstmt.setDouble(2, minCgpa); // Binds second ? safely as a double',
          '  try (ResultSet rs = pstmt.executeQuery()) { while (rs.next()) { System.out.printf("ID: %d | Name: %s | CGPA: %.2f%n", rs.getInt("StudentID"), rs.getString("Name"), rs.getDouble("CGPA")); } }',
          '}'
        ]
      }
    ],
    callout: 'RESOURCE SAFETY: Java try-with-resources automatically closes ResultSet, PreparedStatement, and Connection in reverse order even if an SQLException is thrown.'
  },
  {
    pageNumber: 18,
    unit: 'Section 1.9 · Chapter 1 Summary & Rapid-Revision Cheat Sheet',
    title: '1.9 Chapter 1 Summary & One-Page Visual Cheat Sheet',
    sections: [
      {
        heading: 'Chapter 1 Key Takeaways',
        bullets: [
          '1. Data vs. Information vs. Metadata: Data is raw recorded facts; Information is processed, contextualized data; Metadata is "data about data" stored in the system catalog.',
          '2. Database vs. DBMS: A database is the organized collection of logically related data; the DBMS is the software engine that defines, stores, queries, secures, and recovers it.',
          '3. Seven File-System Defects Solved by a DBMS: (1) Redundancy, (2) Inconsistency, (3) Data isolation, (4) Program-data dependence, (5) Buried integrity rules, (6) Non-atomic crash corruption, and (7) Concurrent lost updates & coarse security.',
          '4. DBMS vs. RDBMS: Every RDBMS organizes data strictly as mathematical relations (tables) linked by keys and governed by Codd’s rules.'
        ]
      },
      {
        heading: 'One-Page Visual Cheat Sheet: Formulas & Keywords',
        bullets: [
          '• Redundancy Savings Formula: T_saved = (k − 1) × N × S_duplicated across k files of N records (eliminates k − 1 duplicate copies and k − 1 extra writes).',
          '• Atomicity Failure -> Solved by DBMS Write-Ahead Logging (WAL) (UNDO/REDO).',
          '• Lost Update Anomaly -> Solved by DBMS Locking (2PL) or MVCC.',
          '• Codd’s Rule 1 & Rule 2 -> All info in tables; access via (Table, PK, Column) with zero physical pointers.',
          '• Safe DB Connection -> Always use PreparedStatement / parameterized placeholders (?, %s).'
        ]
      }
    ],
    callout: 'RAPID REVISION: Review this single page 10 minutes before your semester exam or technical viva.'
  },
  {
    pageNumber: 19,
    unit: 'Section 1.10 · Chapter 1 Question Bank (Part A: MCQs 1–6)',
    title: '1.10 Chapter 1 Exam, GATE & Placement Question Bank (MCQs 1–6)',
    sections: [
      {
        heading: 'Part A: Multiple-Choice Questions (Questions 1 to 6)',
        bullets: [
          '1. [Easy] Which of the following best describes the contents of the INFORMATION_SCHEMA (Data Dictionary) in a relational database? (A) Only PK values (B) Metadata describing table structures, columns, data types, constraints, and views (C) Uncommitted RAM values (D) Deleted user tuples.',
          '2. [Easy] In a university file-processing system, a student’s address is updated in hostel.dat but not library.dat. This defect is formally known as: (A) Data isolation (B) Program-data dependence (C) Data inconsistency (D) Dirty read.',
          '3. [Easy] Changing a field in a COBOL/C flat file from a 4-byte integer to an 8-byte integer forces 15 programs to be recompiled. Which DBMS property prevents this? (A) Durability (B) Data independence (C) Referential integrity (D) MVCC.',
          '4. [Medium] According to E.F. Codd’s Guaranteed Access Rule (Rule 2), every atomic value in a relational database must be logically accessible by specifying: (A) File name, block, offset (B) Table name, primary key value, and column name (C) B+ tree pointers (D) Schema, FK, timestamp.',
          '5. [Medium] Power fails after debiting Rs. 5,000 from Account X before crediting Account Y. Which DBMS responsibility restores Account X on reboot? (A) Query optimization (B) Discretionary access control (C) Atomicity and crash recovery via Write-Ahead Logging (WAL) (D) BCNF normalization.',
          '6. [Medium] Which category of database users interacts exclusively by invoking pre-written "canned transactions" via web/mobile forms without writing SQL?'
        ]
      }
    ],
    callout: 'SELF-TEST: Try solving MCQs 1–10 before checking the complete worked explanations in Section 1.11 (Page 25).'
  },
  {
    pageNumber: 20,
    unit: 'Section 1.10.1 & 1.10.2 · MCQs 7–10 & Short-Answer Questions',
    title: 'Part A: MCQs 7–10 & Part B: Short-Answer Questions (1–3)',
    sections: [
      {
        heading: 'Part A: Multiple-Choice Questions (Questions 7 to 10)',
        bullets: [
          '7. [Medium] Which statement accurately distinguishes a general DBMS from an RDBMS? -> (B) An RDBMS represents all data and relationships logically as tables (relations) and key values, whereas a general DBMS may use hierarchical, network, document, or key-value structures.',
          '8. [Hard] Two railway booking clerks simultaneously read Seat 42 as available in a flat file and sell it to two different passengers. Which DBMS subsystem prevents this anomaly? -> (B) Concurrency Control Manager.',
          '9. [Hard] For which workload is a traditional relational DBMS least appropriate as the primary byte store compared to file/object storage? -> (C) Storing 500 Terabytes of immutable raw 4K satellite video streams with no record-level updates.',
          '10. [Hard] Why is a PreparedStatement (parameterized query) superior to string concatenation? -> (B) It separates SQL syntax from user-supplied literal parameters, preventing SQL injection and enabling execution plan reuse.'
        ]
      },
      {
        heading: '1.10.2 Part B: 5 Short-Answer Questions (2–3 Marks Semester Exam Style)',
        bullets: [
          '1. Differentiate between data, information, and metadata using a concrete example from a hospital or university database.',
          '2. Why does data redundancy in a file-processing system almost inevitably lead to data inconsistency? How does a DBMS prevent this?',
          '3. What is the difference between Naive (Parametric) End Users and Casual End Users? Give one real-world example of each.'
        ]
      }
    ],
    callout: 'EXAM STRATEGY: For 2–3 mark short-answer questions, always include a 1-line formal definition plus 1 concrete table/column example.'
  },
  {
    pageNumber: 21,
    unit: 'Sections 1.10.2, 1.10.3 & 1.10.4 · Long-Answer & Numerical Problems',
    title: 'Short Answers 4–5, Part C: Long-Answer Essays & Part D: Numericals',
    sections: [
      {
        heading: 'Short Answers 4–5 & 1.10.3 Part C: Long-Answer / Essay Questions (5–10 Marks)',
        bullets: [
          'SA 4: State E.F. Codd’s Information Rule (Rule 1) and Dynamic Online Catalog Rule (Rule 4), and explain how they simplify database administration.',
          'SA 5: List any four core responsibilities of a Database Administrator (DBA) in a production enterprise environment.',
          'LA 1 [10 Marks]: Explain in detail the seven major problems of traditional file-processing systems that a college maintaining separate Excel/CSV files will face, and the DBMS mechanism that solves each.',
          'LA 2 [8 Marks]: Draw a neat block diagram showing how a DBMS sits between users/apps, the OS, and disk storage, and trace the 6-step lifecycle of an UPDATE request.',
          'LA 3 [6 Marks]: Compare and contrast a general DBMS and an RDBMS across six technical dimensions, plus three scenarios where data belongs outside an RDBMS.'
        ]
      },
      {
        heading: '1.10.4 Part D: 4 Numerical & Practical Design Problems (Problems 1–3)',
        bullets: [
          'Problem 1 [Numerical — Storage & Write Amplification]: 100,000 customers (CustomerID 8 B, FullName 60 B, ShippingAddress 120 B, Phone 16 B, Email 56 B = 260 B) across 6 microservices (+40 B each). Compute (a) legacy storage in MB, (b) centralized RDBMS storage & % reduction, and (c) redundant writes avoided if 15% update their address.',
          'Problem 2 [Practical — College Placement Portal Blueprint]: Identify 5 core entities + PKs, 4 user roles + permissions, and 4 strict integrity constraints.',
          'Problem 3 [Practical — Concurrent Schedule Trace]: Joint bank account (Rs. 50,000) with concurrent Rs. 15,000 withdrawal (P1) and Rs. 20,000 deposit (P2).'
        ]
      }
    ],
    callout: 'NUMERICAL PRACTICE: Worked step-by-step solutions for all Part D problems are provided on Pages 26–27.'
  },
  {
    pageNumber: 22,
    unit: 'Sections 1.10.4 & 1.10.5 · Catalog Design & GATE CS Questions',
    title: 'Problem 4 (Catalog Design) & Part E: GATE CS Questions (1–4)',
    sections: [
      {
        heading: 'Problem 4: Miniature System Catalog Design',
        bullets: [
          'Design two system catalog tables—SYS_TABLES and SYS_COLUMNS—and write down the exact rows inserted when executing CREATE TABLE Department and CREATE TABLE Student in UniVerseDB.'
        ]
      },
      {
        heading: '1.10.5 Part E: 5 GATE CS Style Questions (MCQ, MSQ, and NAT)',
        bullets: [
          '1. [GATE MCQ — 1 Mark]: Which statement is NOT a valid advantage of a DBMS over a conventional OS file-processing environment? -> (B) Complete elimination of all main-memory and CPU overhead for single-user read-only sequential scans.',
          '2. [GATE MSQ — 2 Marks]: Which items are stored inside the System Catalog (Data Dictionary) of a standard RDBMS? -> (A) Attribute names, types, nullability, (B) Views, triggers, PK/FK constraints, (C) Optimizer statistical histograms, tuple counts (N_R), and block counts (B_R).',
          '3. [GATE MSQ — 2 Marks]: Which statements are TRUE according to Codd’s relational principles and modern RDBMS architecture? -> (A) Logical relationships via matching attribute values, (B) Querying catalog via SQL, (C) Physical data independence when creating/dropping a B+ tree index.',
          '4. [GATE NAT — 2 Marks]: k = 10 flat files, N = 50,000 employees, 150 B shared profile (including 10 B EmpID) + 50 B department attributes. Compute total disk space saved in MB when migrated to a centralized RDBMS.'
        ]
      }
    ],
    callout: 'GATE NAT TIP: Watch out for the foreign key (EmpID = 10 B) retained in each of the 10 departmental tables when computing net space saved!'
  },
  {
    pageNumber: 23,
    unit: 'Sections 1.10.5 to 1.10.8 · GATE NAT 5, Viva, SQL Labs & Diagnostics',
    title: 'GATE NAT 5, Part F: Viva Questions, Part G: SQL Labs & Part H',
    sections: [
      {
        heading: 'GATE NAT 5 & 1.10.6 Part F: 5 Viva / Technical Placement Interview Questions',
        bullets: [
          'GATE NAT 5 [2 Marks]: In UniVerseDB, Department has 4 attributes (3 tuples) and Student has 5 attributes (4 tuples). How many rows are returned by SELECT * FROM information_schema.columns WHERE table_name IN (\'department\', \'student\')?',
          'Viva 1: "I can store 10,000 rows in a Python dictionary or JSON file. Give three concrete reasons to install PostgreSQL."',
          'Viva 2: "What is one major architectural difference in how MySQL (InnoDB) and PostgreSQL store a table on disk?"',
          'Viva 3: "Where should a backend engineer store user profile pictures and PDF invoices—in a BLOB column or AWS S3?"',
          'Viva 4: "Why is opening a new TCP database connection on every HTTP request a terrible idea, and how do you fix it?"',
          'Viva 5: "Between DELETE FROM Student; and DROP TABLE Student;, which deletes metadata from the system catalog?"'
        ]
      },
      {
        heading: '1.10.7 Part G: 3 Hands-On SQL Labs & 1.10.8 Part H: Spot the Mistake',
        bullets: [
          '• Lab 1.1: Create & populate Department and Student tables from Table 1.2.',
          '• Lab 1.2: Test PK duplicate (StudentID = 1) and FK violation (DeptID = 99) errors.',
          '• Lab 1.3: Write a LEFT JOIN + GROUP BY query displaying each department’s name, enrolled student count, and average CGPA.'
        ]
      }
    ],
    callout: 'HANDS-ON SQL: Full runnable SQL solutions and expected output tables are provided on Pages 29–30.'
  },
  {
    pageNumber: 24,
    unit: 'Section 1.10.8 · Three "Spot the Mistake" Diagnostic Challenges',
    title: 'Part H: Three Real-World "Spot the Mistake" Diagnostic Challenges',
    sections: [
      {
        heading: 'Identify the Flaw and Write the Corrected Version',
        bullets: [
          '1. Challenge 1 (Viva Statement): "In UniVerseDB, the string \'CSE\' inside the DeptName column is metadata because it describes what department Asha belongs to."',
          '2. Challenge 2 (Python Database Code): city_input = request.args.get("city"); cursor.execute(f"SELECT Name, CGPA FROM Student WHERE City = \'{city_input}\';")',
          '3. Challenge 3 (Architecture Design): "To make our university portal faster, we gave the Android mobile app direct root credentials to our production PostgreSQL server so the app can run SQL queries directly over the public internet without a backend API server."'
        ]
      }
    ],
    callout: 'DIAGNOSTIC CHECK: Compare your answers against the complete solutions in Section 1.11 starting on the next page.'
  },
  {
    pageNumber: 25,
    unit: 'Section 1.11 · Chapter 1 Complete Answer Key (Part A & Part B)',
    title: '1.11 Complete Answer Key & Worked Solutions (MCQs & Short Answers)',
    sections: [
      {
        heading: 'Solutions to Part A: Multiple-Choice Questions (MCQs 1–10)',
        bullets: [
          '1. (B) INFORMATION_SCHEMA stores metadata (table definitions, column names, types, constraints, views), not user tuples.',
          '2. (C) Data inconsistency occurs when duplicated copies of the same real-world fact disagree across files.',
          '3. (B) Data independence decouples application programs from physical storage details and logical schema extensions.',
          '4. (B) Codd’s Rule 2 guarantees logical access via (Table Name, Primary Key Value, Column Name) without pointers.',
          '5. (C) Crash Recovery Manager uses Write-Ahead Logging (WAL) to guarantee Atomicity on reboot.',
          '6. (A) Parametric (naive) end users invoke pre-written canned transactions via forms/buttons.',
          '7. (B) An RDBMS strictly models data as tables (relations) and key values.',
          '8. (B) Concurrency Control Manager serializes conflicting concurrent updates via locks or MVCC.',
          '9. (C) Multi-terabyte immutable 4K video streams belong on file/object storage with metadata in the RDBMS.',
          '10. (B) Parameterized queries separate SQL syntax from literal parameters, eliminating SQL injection and enabling plan reuse.'
        ]
      },
      {
        heading: 'Solutions to Part B: Short-Answer Questions (1–2)',
        bullets: [
          '• SA 1 (Data vs. Information vs. Metadata): Data = (101, \'Asha\', 8.42); Metadata = CGPA DECIMAL(3,2) CHECK (CGPA BETWEEN 0 AND 10); Information = "Asha ranks 1st in CSE with an 8.42 CGPA."',
          '• SA 2 (Redundancy -> Inconsistency): Duplicated facts across independent files become inconsistent when a partial update misses a file; solved via normalized tables and atomic transactions.'
        ]
      }
    ],
    callout: 'ANSWER KEY: Every MCQ answer includes the exact conceptual justification needed for viva follow-up questions.'
  },
  {
    pageNumber: 26,
    unit: 'Section 1.11 · Worked Solutions (Short Answers 3–5, Long Answers & Part D)',
    title: 'Solutions to Part B (3–5), Part C (Long Answers) & Part D (Problem 1)',
    sections: [
      {
        heading: 'Solutions to Part B (3–5) & Part C (Long-Answer Grading Rubrics)',
        bullets: [
          '• SA 3 (Naive vs. Casual End Users): Naive users run fixed canned transactions (IRCTC clerk, student portal); Casual users run varied interactive queries (deans, analysts).',
          '• SA 4 (Codd’s Rule 1 & Rule 4): Rule 1 stores all info as values in tables; Rule 4 stores metadata in relational catalog tables queryable via standard SQL.',
          '• SA 5 (Four Core DBA Responsibilities): Security/GRANT-REVOKE, automated backups & WAL recovery, query/index tuning, and capacity/migration oversight.',
          '• Part C Rubrics: Q1 (10 Marks: 1.5m definition + 7m seven file-system problems with college examples + 1.5m Table 1.3); Q2 (8 Marks: 3m Figure 1.2 diagram + 5m 6-step UPDATE lifecycle); Q3 (6 Marks: 4m Table 1.4 + 2m three non-RDBMS scenarios).'
        ]
      },
      {
        heading: 'Solution to Part D — Problem 1 (Storage & Write Amplification)',
        bullets: [
          '• Shared profile size S_profile = 8 + 60 + 120 + 16 + 56 = 260 bytes.',
          '• (a) Legacy File System Storage: T_file = 6 × 100,000 × (260 + 40) = 180,000,000 bytes = 180.0 MB.',
          '• (b) Centralized RDBMS Storage: Master Customer table (100,000 × 260 = 26.0 MB) + 6 service tables (6 × 100,000 × 48 = 28.8 MB) => T_rdbms = 54.8 MB.'
        ]
      }
    ],
    callout: 'EXAM GRADING TIP: Reproducing Figure 1.2 and Table 1.3/1.4 neatly in semester exams secures full structural marks.'
  },
  {
    pageNumber: 27,
    unit: 'Section 1.11 · Worked Solutions (Part D Problems 1–4 & GATE 1–2)',
    title: 'Solutions to Part D (Problems 1c, 2, 3, 4) & Part E (GATE 1–2)',
    sections: [
      {
        heading: 'Solutions to Part D (Continued)',
        bullets: [
          '• Problem 1 (b & c): Storage reduction = (180.0 − 54.8) / 180.0 × 100% = 69.56%. Redundant writes avoided = (15,000 × 6) − 15,000 = 75,000 writes/year.',
          '• Problem 2 (College Placement Portal): Entities = Student(StudentID), Company(CompanyID), JobPosting(JobID), Application(AppID), InterviewSlot(SlotID); 4 Roles = Placement DBA, Recruiter, Student, Faculty Coordinator; 4 Constraints = CGPA range, MinCGPA check, UNIQUE(StudentID, JobID), Dream-Tier lock.',
          '• Problem 3 (Concurrent Bank Account Trace): Initial Rs. 50,000 with −15,000 (P1) and +20,000 (P2) must end at Rs. 55,000. Flat-file interleaving yields wrong balances of Rs. 70,000 or Rs. 35,000; DBMS Exclusive (X) lock yields Rs. 55,000.',
          '• Problem 4 (Miniature System Catalog): SYS_TABLES holds (\'Department\', 4, \'DeptID\') and (\'Student\', 5, \'StudentID\'); SYS_COLUMNS holds 9 attribute rows.'
        ]
      },
      {
        heading: 'Solutions to Part E: GATE CS Questions (1 & 2)',
        bullets: [
          '1. Answer: (B). A DBMS adds query parsing, buffer management, locking, and logging layers, so it does not eliminate memory/CPU overhead for simple single-user read-only file scans.',
          '2. Answer: (A), (B), and (C). The system catalog stores attribute definitions, views/triggers/constraints, and optimizer statistics.'
        ]
      }
    ],
    callout: 'NUMERICAL CHECK: Always verify whether foreign-key bytes in child tables are included when calculating RDBMS storage.'
  },
  {
    pageNumber: 28,
    unit: 'Section 1.11 · Worked Solutions (GATE 3–5 & Viva Interview Answers 1–4)',
    title: 'Solutions to Part E (GATE 3–5) & Part F (Viva Model Answers 1–4)',
    sections: [
      {
        heading: 'Solutions to Part E: GATE CS Questions (3, 4, and 5)',
        bullets: [
          '3. Answer: (A), (B), and (C). Option (D) is false because a relational table is an unordered mathematical set of tuples at the logical level.',
          '4. Answer: 62.5 MB. T_legacy = 10 × 50,000 × 200 = 100.0 MB; T_rdbms = (1 × 50,000 × 150) + (10 × 50,000 × 60) = 7.5 MB + 30.0 MB = 37.5 MB; Total Space Saved = 100.0 − 37.5 = 62.5 MB.',
          '5. Answer: 9. information_schema.columns stores one row per attribute (column) in the schema, independent of tuple count: 4 + 5 = 9 rows.'
        ]
      },
      {
        heading: 'Solutions to Part F: Viva / Technical Placement Interview Questions (1–4)',
        bullets: [
          '1. Why PostgreSQL over JSON/Dict: (1) Durability & Crash Safety via WAL, (2) Multi-worker Concurrency via MVCC/locks, (3) Indexed Querying & Joins via B+ trees and hash joins.',
          '2. PostgreSQL vs. MySQL InnoDB Storage: PostgreSQL uses an unordered Heap File of 8 KB pages with secondary B+ tree indexes pointing to physical ctid locations; MySQL InnoDB is an Index-Organized Table (IOT) where the table itself is the Primary Key B+ tree (16 KB pages).',
          '3. BLOBs vs. Object Storage (S3): Store large binary images/PDFs in Object Storage (AWS S3 / GCS) and store metadata (FileURL, Checksum, SizeBytes) in the RDBMS to avoid bloating the buffer pool cache and backups.',
          '4. Connection Pooling: Opening a new TCP/TLS connection and backend process per HTTP request takes 20–100 ms and exhausts max_connections; use a Connection Pool (HikariCP, SQLAlchemy Pool, PgBouncer).'
        ]
      }
    ],
    callout: 'PLACEMENT FAVORITE: The PostgreSQL Heap File (ctid) vs. MySQL InnoDB Clustered B+ Tree comparison (Viva Q2) is a classic backend SDE interview question.'
  },
  {
    pageNumber: 29,
    unit: 'Section 1.11 · Viva Q5 & Complete SQL Lab Solutions (Listing 1.4)',
    title: 'Viva Question 5 & Solutions to Part G: Hands-On SQL Labs 1.1–1.3',
    sections: [
      {
        heading: 'Viva Question 5: DELETE FROM Student; vs. DROP TABLE Student;',
        bullets: [
          'DELETE FROM Student; is a DML operation that removes only the instance data (tuples) while leaving the table’s metadata in the system catalog intact.',
          'DROP TABLE Student; is a DDL operation that removes both the instance data and the table’s schema definition (metadata) from the system catalog.'
        ]
      },
      {
        heading: 'Listing 1.4: Complete SQL Solutions for Labs 1.1, 1.2, and 1.3',
        bullets: [
          '• Lab 1.1 DDL: CREATE TABLE Department (DeptID INT PRIMARY KEY, DeptName VARCHAR(50) UNIQUE NOT NULL, Building VARCHAR(60), Budget DECIMAL(12,2) CHECK (Budget > 0)); and CREATE TABLE Student (StudentID INT PRIMARY KEY, Name VARCHAR(80) NOT NULL, DeptID INT, CGPA DECIMAL(3,2) CHECK (CGPA BETWEEN 0.00 AND 10.00), City VARCHAR(60), FOREIGN KEY (DeptID) REFERENCES Department(DeptID));',
          '• Lab 1.2 Constraint Tests: Duplicate StudentID = 1 fails with Entity/Key Integrity Error; non-existent DeptID = 99 fails with Referential Integrity Error.',
          '• Lab 1.3 Aggregation Query: SELECT d.DeptName, COUNT(s.StudentID) AS EnrolledStudents, ROUND(AVG(s.CGPA), 2) AS AvgCGPA FROM Department d LEFT JOIN Student s ON d.DeptID = s.DeptID GROUP BY d.DeptID, d.DeptName ORDER BY d.DeptID;'
        ]
      }
    ],
    callout: 'SQL LAB TIP: Notice why LEFT JOIN and COUNT(s.StudentID) are required in Lab 1.3 so MBA (with 0 students) appears with EnrolledStudents = 0 instead of being dropped!'
  },
  {
    pageNumber: 30,
    unit: 'Section 1.11 · Lab 1.3 Output & Part H Diagnostic Solutions',
    title: 'Lab 1.3 Expected Output & Solutions to Part H: "Spot the Mistake"',
    sections: [
      {
        heading: 'Expected Output of Lab 1.3',
        bullets: [
          '• CSE: EnrolledStudents = 2 | AvgCGPA = 7.84',
          '• ECE: EnrolledStudents = 1 | AvgCGPA = 9.01',
          '• MBA: EnrolledStudents = 0 | AvgCGPA = NULL'
        ]
      },
      {
        heading: 'Solutions to Part H: "Spot the Mistake" Diagnostic Challenges',
        bullets: [
          '1. Mistake 1 Fixed: The value \'CSE\' inside a row of the Department table is user data (instance data), not metadata. The column name DeptName and its type VARCHAR(50) in the system catalog are the metadata.',
          '2. Mistake 2 Fixed: Using an f-string (f"... \'{city_input}\'") concatenates raw user input directly into the SQL command string, creating a critical SQL Injection vulnerability (e.g., Patna\' OR \'1\'=\'1). Fix by passing a parameter tuple: cursor.execute("SELECT Name, CGPA FROM Student WHERE City = ?;", (city_input,)).',
          '3. Mistake 3 Fixed: Exposing the database directly to untrusted client devices with superuser credentials allows anyone who decompiles the mobile APK to steal or drop the entire database. Always use a 3-tier architecture where the mobile app talks to a backend API server over HTTPS, and the API server connects to the DBMS using a least-privilege role inside a private VPC network.'
        ]
      }
    ],
    callout: 'END OF CHAPTER 1: You have completed Chapter 1 (Data, Databases, and DBMS Fundamentals). Download the full 30-page Chapter 1 PDF above for offline study.'
  }
];
