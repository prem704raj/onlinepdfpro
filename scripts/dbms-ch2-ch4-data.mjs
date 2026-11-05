// Exact page-by-page textbook content for DBMS Chapters 2, 3, and 4 (Part I: Database Foundations)

export const CHAPTER_02 = {
  number: 2,
  fileName: 'dbms-chapter-02.pdf',
  downloadName: 'DBMS-Chapter-02-Architecture-Data-Independence.pdf',
  partLabel: 'PART I: DATABASE FOUNDATIONS',
  headerPart: 'PART I: FOUNDATIONS',
  title: 'DBMS Architecture and Data Independence',
  themeColor: '#1f4e78',
  themeLight: '#dbe8f5',
  themeBorder: '#6c9ac3',
  pageCount: 29,
  whyThisMatters: 'Why can a bank upgrade its storage from SATA SSDs to NVMe arrays, add new B+ Tree indexes, or split a 50-million-row table without breaking a single line of mobile app code? The answer is the ANSI/SPARC Three-Schema Architecture and Data Independence—the architectural backbone of every modern database engine.',
  prerequisites: 'Chapter 1 (Data, Databases, Metadata, System Catalog, and UniVerseDB core tables).',
  objectives: [
    'Distinguish rigorously between a Database Schema (Intension) and a Database Instance (Extension), and trace the three critical states of a database lifecycle (Empty State, Initial State, Current Valid State).',
    'Explain the ANSI/SPARC Three-Schema Architecture (Internal, Conceptual, and External levels) and the two schema mappings that connect them.',
    'Contrast Physical Data Independence with Logical Data Independence, classify real-world database changes, and prove how SQL Views preserve Logical Data Independence.',
    'Trace a SQL query step-by-step through all 8 internal modules of the DBMS Engine (Query Processor Layer and Storage Manager Layer).',
    'Compare 1-Tier, 2-Tier, and 3-Tier/N-Tier application architectures and size connection pools quantitatively using Little’s Law (L = λ × W).',
    'Master the complete taxonomy of database languages (DDL, SDL, VDL, Procedural vs. Declarative DML, DCL, TCL) and contrast PostgreSQL multi-process vs. MySQL multi-threaded server architectures.'
  ],
  toc: [
    ['2', 'DBMS Architecture and Data Independence', '1', true],
    ['2.1', 'Database Schema vs. Database Instance (Intension vs. Extension)', '3'],
    ['2.1.1', 'Formal Definitions: Schema, Construct, and Instance', '3', false, true],
    ['2.1.2', 'Three Critical States in the Life of a Database (t0, t1, t2, t3)', '3', false, true],
    ['2.1.3', 'Worked Example 2.1: Programming Analogy & Classifying 6 Operations', '4', false, true],
    ['2.2', 'The ANSI/SPARC Three-Schema Architecture', '5'],
    ['2.2.1', 'Deep Dive into the Three Levels: Internal, Conceptual, External', '5', false, true],
    ['2.2.2', 'Mappings Between Schema Levels (External/Conceptual & Conceptual/Internal)', '7', false, true],
    ['2.3', 'Data Independence: Logical vs. Physical', '7'],
    ['2.3.1', 'Physical Data Independence & Examples', '8', false, true],
    ['2.3.2', 'Logical Data Independence & Why It Is Harder to Achieve', '8', false, true],
    ['2.3.3', 'Worked Example 2.2: Achieving Logical Data Independence with SQL Views', '9', false, true],
    ['2.3.4', 'Worked Example 2.3: Classifying 8 Real-World Database Modifications', '10', false, true],
    ['2.4', 'Inside the DBMS Engine: Internal Component Architecture', '11'],
    ['2.4.1', 'Component-by-Component Walkthrough (Query Processor & Storage Manager)', '12', false, true],
    ['2.4.2', 'Worked Example 2.4: Tracing a SQL Query Through All 8 Internal Modules', '13', false, true],
    ['2.5', 'Application Architectures: 1-Tier, 2-Tier, and 3-Tier / N-Tier', '14'],
    ['2.5.1', 'Comparison of 1-Tier, 2-Tier, and 3-Tier Architectures', '15', false, true],
    ['2.5.2', 'Worked Example 2.5: Connection Pool Sizing with Little’s Law (L = λ × W)', '16', false, true],
    ['2.6', 'Database Languages and Interfaces (Complete Taxonomy)', '17'],
    ['2.6.1', 'DDL, SDL, VDL, DML, DCL, TCL & PostgreSQL vs. MySQL Process Models', '18', false, true],
    ['2.7', 'Chapter 2 Summary & One-Page Rapid-Revision Cheat Sheet', '19'],
    ['2.8', 'Chapter 2 Exam, GATE & Placement Question Bank (Parts A–H)', '21'],
    ['2.9', 'Chapter 2 Complete Answer Key & Worked Solutions', '25']
  ],
  pages: [
    // Page 3
    {
      blocks: [
        { type: 'h2', text: '2.1  Database Schema vs. Database Instance (Intension vs. Extension)' },
        { type: 'p', text: 'Every database has two distinct aspects: its structural blueprint, which is designed carefully at the start of a project and changes rarely, and the actual rows of data stored inside it, which change every millisecond as users insert, update, and delete records.' },
        { type: 'callout', kind: 'concept', title: 'CONCEPT | The Architectural Blueprint vs. The People Living Inside the Building', body: 'Think of a university hostel building. The architectural blueprint showing 4 floors, 120 rooms, fire exits, and room capacities is the Database Schema (Intension)—it stays fixed for years. The specific students sleeping in those rooms on Tuesday at 10:00 PM is the Database Instance (Extension)—it changes every semester, weekend, and hour.' },
        { type: 'h3', text: '2.1.1  Formal Definitions' },
        { type: 'list', ordered: true, items: [
          'Database Schema (Intension / Meta-Structure): The formal description of the database structure, table names, column names, data types, and integrity constraints, specified during database design and stored permanently in the DBMS System Catalog (Data Dictionary).',
          'Schema Construct: Each individual object or component within a schema—such as the relation schema Student(StudentID, Name, DeptID, CGPA, City) or Course(CourseID, Title, Credits).',
          'Database Instance (Extension / Database State / Snapshot): The actual collection of data (tuples/rows) residing in the database at a specific moment in time t. Every DML operation (INSERT, UPDATE, DELETE) transitions the database from state S_t to a new state S_{t+1}.'
        ] },
        { type: 'h3', text: '2.1.2  Three Critical States in the Life of a Database' },
        { type: 'list', ordered: false, items: [
          'Empty Database State (at time t0): Immediately after executing CREATE TABLE statements (DDL), the schema exists in the system catalog, but the tables contain zero rows (an empty set of tuples ∅).',
          'Initial Database State (at time t1): When the database is first bulk-loaded or populated with initial university records.',
          'Current Valid State (at time t2, t3, ...): At any point during operation, the DBMS ensures that the current instance satisfies every constraint defined in the schema.'
        ] }
      ]
    },
    // Page 4
    {
      blocks: [
        { type: 'diagram', caption: 'Figure 2.1: Evolution of Database Schema (Intension) vs. Database Instance (Extension) across lifecycle timestamps t0 -> t3.', rows: [
          ['t0: DDL Execution (CREATE TABLE Student)', 't1: Initial Load (INSERT 3 Rows)', 't2: DML Update (UPDATE CGPA)', 't3: DDL Evolution (ALTER TABLE ADD Phone)'],
          ['Schema: Fixed (5 cols) | Instance: 0 rows (Empty State)', 'Schema: Unchanged | Instance: State S1 (3 rows)', 'Schema: Unchanged | Instance: State S2 (Asha CGPA=8.65)', 'Schema: Version 2 (6 cols) | Instance: State S3']
        ] },
        { type: 'h3', text: '2.1.3  Worked Example 2.1: Programming Analogy & Classifying Schema vs. Instance Operations' },
        { type: 'table', caption: 'Mapping Programming Language Concepts to DBMS Schema & Instance Concepts', headers: ['C / Java / Python Concept', 'DBMS Equivalent', 'Change Frequency & Governing Sub-Language'], rows: [
          ['class Student { int id; String name; }', 'Relation Schema (Intension)', 'Very Rare (Changed only via DDL: CREATE, ALTER, DROP)'],
          ['Field / Member Variable (int id)', 'Attribute / Column Name & Domain', 'Very Rare (Stored in System Catalog Metadata)'],
          ['new Student(101, "Asha", 8.42)', 'Tuple / Row in Current Instance', 'Frequent — Thousands per second (DML: INSERT, UPDATE, DELETE)'],
          ['Set of all live Student objects in heap at time t', 'Database Instance / Extension at time t', 'Changes continuously with every committed transaction']
        ] },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 2.1 | Classifying 6 Operations on UniVerseDB', body: 'Classify whether each operation modifies the Schema, the Instance, Both, or Neither:\n1. INSERT INTO Student VALUES (5, "Vikram", 10, 8.10, "Pune"); -> Modifies Instance only.\n2. ALTER TABLE Student ADD COLUMN Email VARCHAR(120); -> Modifies Schema (and extends existing instance rows with NULL).\n3. DELETE FROM Enrollment WHERE Grade = "F"; -> Modifies Instance only.\n4. DELETE FROM Student; (deletes all 40,000 rows) -> Modifies Instance only (table reaches Empty State, Schema still exists!).\n5. DROP TABLE Student; -> Removes BOTH the Instance and the Schema from the catalog.\n6. SELECT Name, CGPA FROM Student WHERE DeptID = 10; -> Modifies NEITHER (read-only query).' },
        { type: 'callout', kind: 'mistake', title: 'COMMON MISTAKE | Confusing Empty Table with Dropped Table', body: 'After DELETE FROM Student; or TRUNCATE TABLE Student;, the Database Instance is empty (0 rows), but the Database Schema still exists in the catalog. Only DROP TABLE removes the schema.' }
      ]
    },
    // Page 5
    {
      blocks: [
        { type: 'h2', text: '2.2  The ANSI/SPARC Three-Schema Architecture' },
        { type: 'p', text: 'Proposed in 1975 by the ANSI/X3/SPARC Study Group, the Three-Schema Architecture separates user applications from physical disk representations by dividing schema definitions into three distinct abstraction levels.' },
        { type: 'diagram', caption: 'Figure 2.2: The ANSI/SPARC Three-Schema Architecture showing External Views, Conceptual Schema, Internal Schema, and Two-Level Mappings.', rows: [
          ['EXTERNAL LEVEL (View Level)', 'Student Portal View (Name, Course, Grade)  |  Registrar View (All Academic Cols)  |  Accounts View (StudentID, FeeBalance)'],
          ['↕ External / Conceptual Mapping', 'Translates virtual view queries into logical table queries (Provides Logical Data Independence)'],
          ['CONCEPTUAL LEVEL (Logical Level)', 'Community View of Entire UniVerseDB: Student, Department, Course, Section, Enrollment, FeeAccount + PK/FK Constraints'],
          ['↕ Conceptual / Internal Mapping', 'Translates logical tables/columns into physical slotted pages, B+ Trees, and byte offsets (Provides Physical Data Independence)'],
          ['INTERNAL LEVEL (Physical Level)', '8 KB Slotted Pages, B+ Tree on Student(StudentID), Hash Index on DeptID, LZ4 Compression, NVMe Block Pointers']
        ] },
        { type: 'h3', text: '2.2.1  Deep Dive into the Three Levels' },
        { type: 'list', ordered: true, items: [
          'Internal Level (Physical Schema): The lowest level of abstraction. It describes how data is physically stored on disk—file organizations (heap files, clustered B+ trees), record layouts, byte offsets, block sizes (e.g., 8 KB pages), compression, and encryption. Managed by the DBA and Storage Engine.',
          'Conceptual Level (Logical Schema): The unified community view of the entire database. It describes what data is stored (entities, data types, relationships, primary/foreign keys, and semantic constraints) while hiding all physical storage details and index structures.',
          'External Level (View Level / Subschemas): The highest level of abstraction. It defines tailored virtual views for specific user groups (e.g., a Student View hides Faculty Salaries and other students’ CGPAs), providing security, customization, and simplification.'
        ] }
      ]
    },
    // Page 6
    {
      blocks: [
        { type: 'table', caption: 'Table 2.1: Master Comparison of the Three ANSI/SPARC Schema Levels', headers: ['Dimension', 'External Level (View)', 'Conceptual Level (Logical)', 'Internal Level (Physical)'], rows: [
          ['Abstraction Level', 'Highest (Closest to End Users)', 'Middle (Community Logical View)', 'Lowest (Closest to SSD/Disk)'],
          ['Number of Schemas', 'Many (One per user role/app)', 'Exactly One per database', 'Exactly One per database'],
          ['Core Question Answered', 'What slice of data does Role X see?', 'What tables, columns & rules exist?', 'How are bytes & indexes stored on disk?'],
          ['Primary Audience', 'End Users, Frontend Developers', 'Database Designers, Backend Devs', 'DBAs, DBMS Storage Engine'],
          ['SQL Construct', 'CREATE VIEW ... AS SELECT ...', 'CREATE TABLE, ALTER TABLE, PK/FK', 'CREATE INDEX, TABLESPACE, FILLFACTOR'],
          ['Stores Duplicate Data?', 'No (Unmaterialized Views store query only)', 'No (Logical metadata in catalog)', 'Yes (Actual data files + index files on disk)']
        ] },
        { type: 'h3', text: '2.2.2  Mappings Between Schema Levels' },
        { type: 'p', text: 'Because only the physical database actually exists on disk at the Internal Level, the DBMS must translate every user query written against an External View down to Conceptual tables and finally to Internal disk blocks via two mappings:' },
        { type: 'list', ordered: false, items: [
          'External / Conceptual Mapping: Maps fields and virtual relations in an External View to the underlying tables and columns in the Conceptual Schema. If the Conceptual Schema is refactored (e.g., splitting a table), the DBA updates this mapping (the view definition) so external applications continue running unchanged.',
          'Conceptual / Internal Mapping: Maps logical table and column definitions in the Conceptual Schema to physical files, page headers, and B+ Tree indexes in the Internal Schema. When a DBA adds an index or moves a table to a new NVMe partition, only this mapping changes.'
        ] },
        { type: 'callout', kind: 'exam', title: 'EXAM CHECKPOINT | Do All Three Schemas Store Actual Data?', body: 'No! The External Schema, Conceptual Schema, and Internal Schema are all metadata blueprints stored in the System Catalog. The actual user data (Database Instance) exists only once—at the physical disk level below the Internal Schema.' }
      ]
    },
    // Page 7
    {
      blocks: [
        { type: 'h2', text: '2.3  Data Independence: Logical vs. Physical' },
        { type: 'p', text: 'The crowning achievement of the Three-Schema Architecture is Data Independence: the capacity to change the schema at one level of a database system without having to change the schema at the next higher level (or rewrite application programs).' },
        { type: 'h3', text: '2.3.1  Physical Data Independence' },
        { type: 'p', text: 'Physical Data Independence is the ability to modify the Internal Schema (physical storage structures, indexes, file organizations, or hardware placement) without having to alter the Conceptual Schema or External Views.' },
        { type: 'list', ordered: false, items: [
          'Creating or dropping a B+ Tree or Hash index on Student(City) to speed up queries.',
          'Switching table storage from an unsorted Heap file to a Clustered Index or partitioning Enrollment by year.',
          'Changing disk block size from 4 KB to 8 KB, enabling page-level LZ4 compression, or migrating tablespaces from HDD to NVMe SSD.',
          'Why it is easy to achieve: The DBMS Query Optimizer automatically re-evaluates the Conceptual/Internal mapping and chooses the new index or file path transparently.'
        ] },
        { type: 'h3', text: '2.3.2  Logical Data Independence' },
        { type: 'p', text: 'Logical Data Independence is the ability to modify the Conceptual Schema (adding/splitting tables, adding columns, or restructuring relationships) without having to alter External Schemas (Views) or rewrite application programs.' },
        { type: 'list', ordered: false, items: [
          'Splitting Student_Base into two normalized tables Student_Identity and Student_Academic to eliminate redundancy.',
          'Adding a new column AadhaarHash or BloodGroup to the Student table, or adding a new table Alumni.',
          'Why Logical Data Independence is harder to achieve than Physical Data Independence: Application programs and SQL queries depend heavily on logical table names, column names, and integrity constraints. Preserving backward compatibility requires carefully crafted updatable SQL Views (External/Conceptual mappings).'
        ] }
      ]
    },
    // Page 8
    {
      blocks: [
        { type: 'h3', text: '2.3.3  Worked Example 2.2: Achieving Logical Data Independence with SQL Views' },
        { type: 'p', text: 'Suppose 45 university microservices query a legacy table Student_Portal_View(StudentID, FullName, DeptID, CGPA). During a normalization audit, the DBA splits the underlying conceptual table into two tables and splits FullName into FirstName and LastName. Observe how Logical Data Independence saves all 45 microservices from breaking:' },
        { type: 'code', title: 'Listing 2.1: Preserving External Application Compatibility After Conceptual Schema Refactoring', code: `-- 1. BEFORE REFACTORING: Original Conceptual Table & External View
CREATE TABLE Student_Legacy (
    StudentID INT PRIMARY KEY,
    FullName  VARCHAR(100) NOT NULL,
    DeptID    INT,
    CGPA      DECIMAL(3,2),
    FeeDue    DECIMAL(10,2)
);

CREATE VIEW Student_Portal_View AS
SELECT StudentID, FullName, DeptID, CGPA FROM Student_Legacy;

-- 2. CONCEPTUAL REFACTORING: DBA decomposes table & splits FullName
CREATE TABLE Student_Profile (
    StudentID INT PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName  VARCHAR(50) NOT NULL,
    DeptID    INT
);
CREATE TABLE Student_Grades (
    StudentID INT PRIMARY KEY REFERENCES Student_Profile(StudentID),
    CGPA      DECIMAL(3,2)
);

-- 3. LOGICAL DATA INDEPENDENCE IN ACTION: Redefine External/Conceptual Mapping!
CREATE OR REPLACE VIEW Student_Portal_View AS
SELECT p.StudentID,
       (p.FirstName || ' ' || p.LastName) AS FullName,
       p.DeptID,
       g.CGPA
FROM Student_Profile p
JOIN Student_Grades g ON p.StudentID = g.StudentID;
-- Result: Every existing app running "SELECT FullName, CGPA FROM Student_Portal_View" works with ZERO code changes!` }
      ]
    },
    // Page 9
    {
      blocks: [
        { type: 'h3', text: '2.3.4  Worked Example 2.3: Classifying 8 Real-World Database Modifications' },
        { type: 'table', caption: 'Classifying Database Changes by Schema Level and Type of Data Independence Invoked', headers: ['#', 'Database Operation / Modification', 'Schema Level Changed', 'Independence Type / Impact'], rows: [
          ['1', 'CREATE INDEX idx_student_cgpa ON Student(CGPA);', 'Internal Schema', 'Physical Data Independence (Zero Conceptual/App change)'],
          ['2', 'Move tablespace pg_default from /dev/sda1 to NVMe /mnt/nvme0', 'Internal Schema', 'Physical Data Independence'],
          ['3', 'Split Student into Student_Core and Student_Hostel and update View', 'Conceptual Schema', 'Logical Data Independence (External View shields apps)'],
          ['4', 'ALTER TABLE Course ADD COLUMN SyllabusURL VARCHAR(255);', 'Conceptual Schema', 'Logical Data Independence (Existing SELECT col1, col2 unaffected)'],
          ['5', 'Enable Transparent Data Encryption (TDE) & 8 KB page compression', 'Internal Schema', 'Physical Data Independence'],
          ['6', 'CREATE VIEW Dean_Dashboard AS SELECT DeptID, AVG(CGPA)...', 'External Schema', 'Adds a new External Subschema (Conceptual unchanged)'],
          ['7', 'UPDATE Student SET CGPA = 9.10 WHERE StudentID = 1;', 'None (Instance Only)', 'DML State Transition (No schema level is modified!)'],
          ['8', 'Change Student(DeptID) index from B+ Tree to Hash Index', 'Internal Schema', 'Physical Data Independence']
        ] },
        { type: 'callout', kind: 'exam', title: 'EXAM CHECKPOINT | Why SELECT * Is an Enemy of Logical Data Independence', body: 'If an application writes SELECT * FROM Student and reads columns by ordinal position (row[0], row[1], ...), adding or reordering a column in the Conceptual Schema can break the host application. Always specify explicit column names (SELECT StudentID, Name, CGPA) and query through External Views!' }
      ]
    },
    // Page 10
    {
      blocks: [
        { type: 'h2', text: '2.4  Inside the DBMS Engine: Internal Component Architecture' },
        { type: 'p', text: 'What actually happens inside PostgreSQL, Oracle, or MySQL in the 2 milliseconds between receiving a SQL string over a TCP socket and returning result rows? A DBMS engine is organized into two main processing layers sitting above disk storage:' },
        { type: 'diagram', caption: 'Figure 2.3: Internal Component Architecture of a DBMS Engine (Query Processor, Storage Manager, and Disk Structures).', rows: [
          ['1. INTERFACES', 'Naive Users (Web/Mobile Apps) | Application Programmers (JDBC/psycopg2) | Analysts (SQL CLI) | DBA (DDL/Tuning)'],
          ['2. QUERY PROCESSOR', '[DDL Interpreter] -> Updates Catalog  |  [DML Parser & Verifier] -> [Query Optimizer (Cost-Based)] -> [Execution Engine]'],
          ['3. STORAGE MANAGER', '[Buffer Manager (RAM Pool)] | [File & Access Methods Mgr] | [Transaction & Concurrency Mgr (Locks/MVCC)] | [Recovery Mgr (WAL)]'],
          ['4. DISK STORAGE', '[Data Files (.ibd / Heap)] | [System Catalog (Data Dictionary)] | [B+ Tree & Hash Indexes] | [Write-Ahead Log (Redo/Undo)] | [Histogram Stats]']
        ] },
        { type: 'h3', text: '2.4.1  Component-by-Component Walkthrough' },
        { type: 'list', ordered: true, items: [
          'DDL Interpreter: Parses schema statements (CREATE, ALTER, DROP) and records structural definitions directly in the System Catalog (Data Dictionary).',
          'DML Compiler & Parser: Checks syntax, verifies table/column names against the System Catalog, checks user privileges, and translates SQL into an internal Relational Algebra parse tree.',
          'Query Optimizer (The Brain of the DBMS): Consults statistical histograms in the catalog (table cardinality, index selectivity) to evaluate multiple candidate execution plans (e.g., Index Scan vs. Sequential Scan, Hash Join vs. Merge Join) and picks the minimum-cost physical plan.',
          'Query Evaluation / Execution Engine: Executes the chosen physical operator tree (using Volcano/iterator pipelines) by requesting pages from the Storage Manager.'
        ] }
      ]
    },
    // Page 11
    {
      blocks: [
        { type: 'h3', text: 'Storage Manager Subsystems & Physical Disk Structures' },
        { type: 'list', ordered: true, items: [
          'Buffer Manager: Manages the in-memory Buffer Pool (RAM cache of 8 KB disk pages). It implements page replacement policies (LRU-K, Clock-Sweep) and pins active pages so 99% of reads hit fast RAM instead of disk.',
          'File & Access Methods Manager: Organizes pages into heap files, slotted pages, and B+ Tree index structures, translating logical page IDs into OS file offsets.',
          'Transaction & Concurrency Control Manager: Guarantees ACID properties across concurrent sessions using Lock Tables (Shared/Exclusive locks) and Multi-Version Concurrency Control (MVCC snapshots) plus deadlock detection (wait-for graphs).',
          'Recovery Manager: Enforces the Write-Ahead Logging (WAL) protocol and ARIES crash recovery (Analysis, Redo, Undo) so committed transactions never vanish and aborted transactions leave no dirty state.'
        ] },
        { type: 'h3', text: '2.4.2  Worked Example 2.4: Tracing a SQL Query Through All 8 Internal Modules' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 2.4 | Step-by-Step Execution Trace of SELECT Name FROM Student WHERE StudentID = 101', body: 'Step 1 (Parser & Catalog Check): Parser validates SQL syntax and queries the System Catalog to confirm table Student and columns Name, StudentID exist.\nStep 2 (Authorization): Verifies the current database user holds SELECT privilege on Student.\nStep 3 (Query Optimizer): Checks catalog statistics—sees Student has 50,000 rows and a unique B+ Tree primary key index on StudentID (height = 3). Chooses B+ Tree Index Lookup (cost = 3 page reads) over Full Table Scan (cost = 1,250 page reads).\nStep 4 (Execution Engine): Invokes the Index Scan operator for key 101.\nStep 5 (Concurrency Manager): Acquires an MVCC read snapshot (or Shared S-lock) to ensure a consistent read.\nStep 6 (Buffer Manager): Checks the RAM Buffer Pool hash table for root/internal/leaf B+ Tree pages and data page #42. If page #42 is not in RAM (buffer miss), asks File Manager to fetch block #42 from SSD into a buffer frame.\nStep 7 (Tuple Extraction): Reads slot offset on page #42, extracts Name = "Asha", and streams the tuple back to the client socket.' }
      ]
    },
    // Page 12
    {
      blocks: [
        { type: 'h2', text: '2.5  Application Architectures: 1-Tier, 2-Tier, and 3-Tier / N-Tier' },
        { type: 'p', text: 'How do end users and application servers connect to the DBMS across a network? System architects classify deployments by how Presentation (UI), Business Logic, and Data Management are distributed across tiers:' },
        { type: 'diagram', caption: 'Figure 2.4: Comparison of 1-Tier (Local/Embedded), 2-Tier (Fat Client–Server), and 3-Tier (Web/Microservice) Database Architectures.', rows: [
          ['1-TIER ARCHITECTURE', '[Presentation + App Logic + Embedded DBMS (SQLite) on Single Device / Local Host] — Zero network hops'],
          ['2-TIER ARCHITECTURE', '[Client Workstation (UI + Business Logic + JDBC/ODBC Driver)]  <=== Direct TCP SQL Connection ===>  [DBMS Server]'],
          ['3-TIER ARCHITECTURE', '[Browser / Mobile App (UI)] <== HTTPS/REST ==> [App Server + Connection Pool (HikariCP/PgBouncer)] <== SQL ==> [DBMS Server]']
        ] },
        { type: 'table', caption: 'Table 2.2: Engineering Comparison of 1-Tier, 2-Tier, and 3-Tier Database Architectures', headers: ['Feature', '1-Tier (Direct / Embedded)', '2-Tier (Client–Server)', '3-Tier / N-Tier (Web / Enterprise)'], rows: [
          ['Where Business Logic Lives', 'Same local process', 'Client machine ("Fat Client")', 'Middle Application Tier (Node/Spring/FastAPI)'],
          ['DB Credentials Exposure', 'Local file permissions', 'Risky: DB credentials/network exposed to clients', 'Secure: DB sits in private VPC subnet; only App Tier connects'],
          ['Connection Scalability', '1 local user', 'Poor (~100–500 clients; 1 DB connection per user)', 'Massive (100,000+ users multiplexed over 50–100 pooled connections)'],
          ['Real-World Examples', 'SQLite in Android/iOS, DBA console', 'Legacy desktop ERP, DBeaver/pgAdmin IDE', 'IRCTC, Swiggy, UPI Banking, University Web Portal']
        ] }
      ]
    },
    // Page 13
    {
      blocks: [
        { type: 'h3', text: '2.5.2  Worked Example 2.5: Connection Pool Sizing in 2-Tier vs. 3-Tier Using Little’s Law' },
        { type: 'p', text: 'Why do production databases crash when thousands of clients open direct 2-Tier connections, and how does a 3-Tier Connection Pool (like PgBouncer or HikariCP) solve it mathematically?' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 2.5 | Quantitative Memory & Connection Pool Sizing (Little’s Law: L = λ × W)', body: 'Problem Setup: During course registration, N = 12,000 students are logged into the portal simultaneously. On average, the system receives λ = 1,200 SQL queries per second, and each SQL query takes W = 20 ms (0.020 seconds) to execute. Each open PostgreSQL backend process consumes M = 10 MB of RAM.\n\nCase A — 2-Tier Architecture (1 Dedicated DB Connection per Logged-in Student):\n• Total DB Connections = 12,000.\n• Total RAM just for connection processes = 12,000 × 10 MB = 120,000 MB = 120 GB of RAM! Worse, 12,000 OS processes cause catastrophic CPU context-switching thrashing.\n\nCase B — 3-Tier Architecture with Connection Pooling (Little’s Law):\n• By Little’s Law, the average number of concurrently active SQL queries is:\n  L = λ × W = 1,200 queries/sec × 0.020 sec = 24 active connections!\n• Even provisioning a 2.5× safety headroom pool of P = 60 pooled DB connections:\n  Total Connection RAM = 60 × 10 MB = 600 MB RAM (a 99.5% reduction from 120 GB to 0.6 GB!).' },
        { type: 'callout', kind: 'concept', title: 'REAL-LIFE USE | Core Rule of Connection Pool Sizing (PostgreSQL / HikariCP Formula)', body: 'More database connections do NOT mean higher throughput! Because disk I/O and CPU cores are finite, the industry-standard HikariCP formula for optimal connection pool size on an n-core database server is: Pool Size = (2 × CPU_Cores) + Effective_Spindle_Count (typically 20 to 64 connections per DB node).' }
      ]
    },
    // Page 14
    {
      blocks: [
        { type: 'h2', text: '2.6  Database Languages and Interfaces (Complete Taxonomy)' },
        { type: 'p', text: 'A DBMS provides specialized sub-languages for defining schemas, manipulating data, controlling access, and managing transactions:' },
        { type: 'table', caption: 'Complete Taxonomy of DBMS Languages (DDL, SDL, VDL, DML, DCL, TCL)', headers: ['Sub-Language', 'Full Name & Schema Level', 'Key SQL Commands & Purpose'], rows: [
          ['DDL', 'Data Definition Language (Conceptual)', 'CREATE, ALTER, DROP, TRUNCATE, RENAME — Defines conceptual schemas & constraints in the catalog.'],
          ['SDL', 'Storage Definition Language (Internal)', 'CREATE TABLESPACE, CREATE INDEX, FILLFACTOR — Specifies physical storage structures (merged into DDL in modern SQL).'],
          ['VDL', 'View Definition Language (External)', 'CREATE VIEW, CREATE MATERIALIZED VIEW — Defines external user subschemas and virtual views.'],
          ['DML (Declarative)', 'Non-Procedural DML (What to fetch)', 'SELECT, INSERT, UPDATE, DELETE — User specifies WHAT data is needed, not HOW to loop/index-scan.'],
          ['DML (Procedural)', 'Procedural DML (How to fetch)', 'Relational Algebra, PL/SQL cursors, T-SQL loops — Specifies step-by-step navigation.'],
          ['DCL', 'Data Control Language (Security)', 'GRANT, REVOKE — Controls access permissions and role privileges.'],
          ['TCL', 'Transaction Control Language (ACID)', 'BEGIN, COMMIT, ROLLBACK, SAVEPOINT, SET TRANSACTION — Manages atomic transaction boundaries.']
        ] },
        { type: 'h3', text: '2.6.1  PostgreSQL Multi-Process vs. MySQL Multi-Threaded Server Architecture' },
        { type: 'list', ordered: false, items: [
          'PostgreSQL (Process-per-Connection Model): A master supervisor process (postmaster) listens on port 5432 and forks a separate OS process (postgres backend) for each client connection, communicating via a shared RAM Buffer Pool. Crash in one backend process cannot corrupt another client’s memory space, though connection pooling (PgBouncer) is recommended at high concurrency.',
          'MySQL InnoDB (Thread-per-Connection Model): A single daemon process (mysqld) listens on port 3306 and spawns a lightweight OS thread per client connection within one shared address space. Lower memory overhead per connection (~256 KB vs. ~5–10 MB), though a fatal segfault in one thread crashes the entire mysqld process.'
        ] }
      ]
    },
    // Page 15
    {
      blocks: [
        { type: 'h2', text: '2.7  Chapter 2 Summary & One-Page Rapid-Revision Cheat Sheet' },
        { type: 'table', caption: 'Chapter 2 Rapid-Revision Formula & Concept Sheet', headers: ['Concept / Topic', 'Core Rule / Exam Formula / Key Takeaway'], rows: [
          ['Schema vs. Instance', 'Schema (Intension) = structural blueprint in catalog (rarely changes, DDL). Instance (Extension) = rows at time t (changes constantly, DML).'],
          ['Empty vs. Dropped Table', 'DELETE / TRUNCATE leaves an Empty Instance (0 rows) with Schema intact. DROP TABLE removes both Instance and Schema.'],
          ['External Schema (View)', 'Highest abstraction; multiple user-specific views (CREATE VIEW); hides sensitive columns & simplifies joins.'],
          ['Conceptual Schema', 'Middle abstraction; single unified logical blueprint of all tables, data types, and PK/FK constraints.'],
          ['Internal Schema', 'Lowest abstraction; single physical blueprint of slotted pages, B+ Trees, hash indexes, and compression.'],
          ['Physical Data Independence', 'Modify Internal Schema (add/drop index, change file org) without altering Conceptual Schema. Easier to achieve.'],
          ['Logical Data Independence', 'Modify Conceptual Schema (split/merge tables, add columns) without altering External Views or apps. Harder to achieve.'],
          ['Query Processor Modules', 'DDL Interpreter + DML Parser/Verifier + Cost-Based Query Optimizer + Execution Engine.'],
          ['Storage Manager Modules', 'Buffer Manager (RAM pool) + File/Access Manager + Transaction/Concurrency Manager + Recovery Manager (WAL).'],
          ['Little’s Law (Connection Pool)', 'Active Connections L = λ × W (Arrival rate λ × Mean query latency W). 3-Tier pools multiplex thousands of users onto ~50 connections.']
        ] },
        { type: 'callout', kind: 'exam', title: 'RAPID VIVA CHECKLIST | 3 Questions Every Interviewer Asks from Chapter 2', body: '1. Why is Logical Data Independence harder than Physical Data Independence? Because application queries directly reference logical table/column semantics, whereas physical file/index lookups are completely hidden behind the Query Optimizer.\n2. Does creating a B+ Tree index change the Conceptual Schema? No—only the Internal Schema.\n3. Where is the Database Schema stored? Inside the System Catalog (Data Dictionary), which is itself stored as special system tables on disk!' }
      ]
    },
    // Page 16
    {
      blocks: [
        { type: 'h2', text: 'Student Revision & Lecture Notes — Chapter 2' },
        { type: 'p', text: 'Use this dedicated revision workspace to sketch the ANSI/SPARC Three-Schema diagram, write down the 8 internal DBMS engine modules in order, and practice Little’s Law connection pool calculations before your semester exam or GATE test.' },
        { type: 'table', caption: 'Self-Check Memory Grid (Complete Without Looking Back)', headers: ['Prompt', 'Your Recall Notes / Key Keywords'], rows: [
          ['Draw the 3 ANSI/SPARC levels & 2 mappings', 'External Views <-> External/Conceptual Mapping <-> Conceptual Schema <-> Conceptual/Internal Mapping <-> Internal Schema <-> Disk'],
          ['List 3 examples of Physical Data Independence', '1. Adding/dropping B+ Tree index  2. Changing Heap file to Clustered file  3. Moving datafile to NVMe SSD'],
          ['List 2 examples of Logical Data Independence', '1. Splitting a table into two & updating External View  2. Adding a new column without breaking explicit SELECTs'],
          ['Trace a query through 4 Query Processor modules', '1. Parser/Translator  2. Catalog Authorization/Verifier  3. Cost-Based Optimizer  4. Execution Engine'],
          ['Little’s Law formula for active DB connections', 'L = λ × W  (e.g., 1,200 req/s × 0.02 s = 24 concurrent active connections)']
        ] },
        { type: 'callout', kind: 'concept', title: 'NEXT UP | Chapter 2 Exam, GATE & Placement Question Bank', body: 'Pages 17 to 21 present the complete Chapter 2 Question Bank across 8 sections (Parts A–H): 10 MCQs, 5 Short-Answer Questions, 3 Long-Answer Essays, 4 Numerical & Architecture Problems, 5 GATE CS Questions, 5 Viva Questions, 3 Hands-On SQL Labs, and 3 "Spot the Mistake" Challenges, followed by complete step-by-step solutions on Pages 22 to 29.' }
      ]
    },
    // Page 17
    {
      blocks: [
        { type: 'h2', text: '2.8  Chapter 2 Exam, GATE & Placement Question Bank' },
        { type: 'h3', text: 'Part A: 10 Multiple-Choice Questions (MCQs)' },
        { type: 'list', ordered: true, items: [
          'Q1. The description of a database structure stored in the system catalog is called the database __________, whereas the actual data stored at a particular moment is called the database __________.\n(A) Extension; Intension   (B) Intension (Schema); Extension (Instance)   (C) View; Schema   (D) Instance; Metadata',
          'Q2. Which level of the ANSI/SPARC Three-Schema Architecture describes how data is physically stored in 8 KB slotted pages and B+ Tree indexes?\n(A) External Level   (B) Conceptual Level   (C) Internal Level   (D) View Level',
          'Q3. A DBA executes CREATE INDEX idx_course_dept ON Course(DeptID); to speed up joins. Which property ensures that no existing SQL queries or application programs need to be modified?\n(A) Logical Data Independence   (B) Physical Data Independence   (C) View Serialization   (D) Referential Integrity',
          'Q4. Immediately after executing CREATE TABLE Alumni (AlumniID INT PRIMARY KEY, Name VARCHAR(80)); and before any INSERT statement is run, the table is in the:\n(A) Uninitialized Schema State   (B) Empty Database State   (C) Dropped State   (D) Initial Loaded State',
          'Q5. Which of the following modifications requires Logical Data Independence so that external users remain unaffected?\n(A) Switching an index from a B+ Tree to a Hash Index   (B) Moving a tablespace to a faster SSD array   (C) Decomposing the Student table into Student_Basic and Student_Contact   (D) Compressing disk blocks with LZ4'
        ] }
      ]
    },
    // Page 18
    {
      blocks: [
        { type: 'h3', text: 'Part A: Multiple-Choice Questions (Continued — Q6 to Q10)' },
        { type: 'list', ordered: false, items: [
          '6. Q6. Which internal DBMS component is responsible for consulting catalog histograms and choosing the lowest-cost physical execution plan?\n(A) DDL Interpreter   (B) Buffer Manager   (C) Query Optimizer   (D) Recovery Manager',
          '7. Q7. Which Storage Manager component pins 8 KB pages in RAM and uses replacement policies such as Clock-Sweep or LRU-K?\n(A) Transaction Manager   (B) Buffer Manager   (C) Query Parser   (D) File Authorization Manager',
          '8. Q8. Why is a 3-Tier architecture preferred over a 2-Tier architecture for public internet applications with 50,000 concurrent users?\n(A) 3-Tier eliminates the need for a DBMS   (B) 3-Tier isolates the database in a private network and multiplexes users over a small connection pool   (C) 2-Tier cannot execute SQL JOINs   (D) 3-Tier stores all tables in browser localStorage',
          '9. Q9. SQL SELECT is classified primarily as a:\n(A) Procedural DML   (B) Declarative (Non-Procedural) DML   (C) Storage Definition Language (SDL)   (D) Data Control Language (DCL)',
          '10. Q10. How does PostgreSQL handle 100 concurrent client connections compared to MySQL InnoDB?\n(A) PostgreSQL spawns 100 separate OS backend processes; MySQL spawns 100 threads inside a single mysqld process   (B) Both use a single single-threaded event loop   (C) PostgreSQL uses threads; MySQL forks processes   (D) Neither supports concurrent connections'
        ] },
        { type: 'h3', text: 'Part B: 5 Short-Answer Questions (2–3 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'B1. Differentiate between Database Schema (Intension) and Database Instance (Extension) with one concrete example from UniVerseDB.',
          'B2. Explain the difference between DELETE FROM Student;, TRUNCATE TABLE Student;, and DROP TABLE Student; in terms of Schema vs. Instance.',
          'B3. Why is Logical Data Independence harder to achieve in practice than Physical Data Independence?',
          'B4. State the exact role of (a) the Buffer Manager and (b) the Write-Ahead Log (Recovery Manager) inside the DBMS Storage Manager.',
          'B5. Distinguish between Procedural DML and Declarative (Non-Procedural) DML with examples.'
        ] }
      ]
    },
    // Page 19
    {
      blocks: [
        { type: 'h3', text: 'Part C: 3 Long-Answer / Essay Questions (5–10 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'C1. Draw and explain the ANSI/SPARC Three-Schema Architecture in detail. Clearly describe the Internal, Conceptual, and External levels, the two inter-level mappings, and how they provide Physical and Logical Data Independence.',
          'C2. Draw the complete internal component architecture diagram of a DBMS engine. Trace step-by-step how the query SELECT s.Name, d.DeptName FROM Student s JOIN Department d ON s.DeptID = d.DeptID WHERE s.CGPA > 8.5; travels through the Query Processor and Storage Manager.',
          'C3. Compare 1-Tier, 2-Tier, and 3-Tier application architectures across security, connection scalability, business logic deployment, and maintenance. Explain why connection pooling is mandatory at the middle tier.'
        ] },
        { type: 'h3', text: 'Part D: 4 Numerical & Practical Architecture Problems' },
        { type: 'list', ordered: true, items: [
          'D1. (Connection Pool Sizing via Little’s Law): An e-commerce database receives λ = 2,500 SQL queries/sec during a flash sale. Average query execution time is W = 12 ms. (a) What is the average number of concurrently active queries L? (b) If each PostgreSQL connection process requires 8 MB of RAM, compare the connection memory footprint of a 2-Tier design with 25,000 connected users vs. a 3-Tier pool sized at 2.5 × L.',
          'D2. (Buffer Pool Hit Ratio & Effective Access Time): Suppose a DBMS Buffer Pool has a page hit ratio of H = 98%. Fetching an 8 KB page from RAM takes t_RAM = 0.005 ms (5 microseconds), whereas fetching a page from NVMe SSD on a buffer miss takes t_SSD = 0.25 ms. Compute the average effective page access time t_eff and the speedup compared to having no Buffer Manager (H = 0%).',
          'D3. (Index Scan vs. Full Table Scan Cost): The Student table has 100,000 rows stored across 2,500 disk pages (40 rows/page). A B+ Tree index on StudentID has height h = 3 (root, intermediate, leaf) plus 1 data page fetch. How many page reads does the Query Optimizer save on a point lookup WHERE StudentID = 4092 compared to a sequential scan (average 1,250 pages)?',
          'D4. (View Mapping Rewrite): Given conceptual tables Employee_Core(EmpID, FirstName, LastName, DeptID) and Employee_Pay(EmpID, BasePay, Bonus), write the exact SQL CREATE VIEW statement so legacy payroll reports querying Legacy_Emp(EmpID, FullName, TotalComp, DeptID) continue working without modification.'
        ] }
      ]
    },
    // Page 20
    {
      blocks: [
        { type: 'h3', text: 'Part E: 5 GATE CS Style Questions (MCQ, MSQ, and NAT)' },
        { type: 'list', ordered: true, items: [
          'E1. [GATE MCQ — 1 Mark] Consider the following operations on a relational database:\nI. Creating a secondary B+ Tree index on an existing column.\nII. Splitting a relation R(A,B,C) into R1(A,B) and R2(A,C) and updating external views.\nIII. Updating the salary of employee #104 using an UPDATE statement.\nWhich of the above operations modify the Conceptual Schema?\n(A) I and II only   (B) II only   (C) II and III only   (D) I, II, and III',
          'E2. [GATE MSQ — 2 Marks] Which of the following statements about the ANSI/SPARC Three-Schema Architecture are TRUE? (Multiple options may be correct)\n(A) A database has exactly one Conceptual Schema and one Internal Schema, but may have multiple External Schemas.\n(B) Unmaterialized External Views store only the view query definition in the System Catalog, not a separate physical copy of the tuples.\n(C) Modifying the Conceptual/Internal mapping while keeping the Conceptual Schema invariant provides Logical Data Independence.\n(D) The System Catalog is consulted during query compilation to verify relation names, attribute domains, and access privileges.',
          'E3. [GATE NAT — 2 Marks] A 3-Tier web application forwards λ = 800 SQL transactions/sec to a relational database. Each transaction holds a pooled database connection for an average of W = 35 ms. Using Little’s Law, the minimum number of active database connections required to handle the steady-state load without queueing is ________.',
          'E4. [GATE NAT — 2 Marks] A DBMS Buffer Manager achieves a buffer pool hit ratio of 96%. Memory page access takes 10 microseconds (0.01 ms) and disk I/O on a buffer miss takes 2.0 ms. The effective average page access time in microseconds is ________.',
          'E5. [GATE MCQ — 2 Marks] Match the DBMS Engine component with its primary responsibility:\nP. DDL Interpreter   1. Enforces ARIES redo/undo logging using Write-Ahead Logs\nQ. Query Optimizer   2. Parses schema definitions and writes metadata to the System Catalog\nR. Buffer Manager    3. Evaluates candidate relational algebra plans using histogram statistics\nS. Recovery Manager  4. Caches disk blocks in RAM frames and manages dirty page flushing\n(A) P-2, Q-3, R-4, S-1   (B) P-3, Q-2, R-4, S-1   (C) P-2, Q-4, R-3, S-1   (D) P-1, Q-3, R-4, S-2'
        ] }
      ]
    },
    // Page 21
    {
      blocks: [
        { type: 'h3', text: 'Part F: 5 Viva / Technical Placement Interview Questions' },
        { type: 'list', ordered: true, items: [
          'F1. "In my Spring Boot / Node.js production app, we increased the database connection pool max size from 30 to 1,000, and our database throughput actually dropped by 60%. Why?"',
          'F2. "If an SQL View does not store data on disk, what happens internally when I run SELECT * FROM Student_Portal_View WHERE CGPA > 9.0?"',
          'F3. "Why do we say that SQL is a declarative (non-procedural) language, and what converts declarative SQL into a procedural execution plan?"',
          'F4. "What is the difference between a regular View and a Materialized View in terms of the Three-Schema Architecture?"',
          'F5. "When should an engineering team choose an embedded 1-Tier database like SQLite or DuckDB over a 3-Tier client-server DBMS like PostgreSQL?"'
        ] },
        { type: 'h3', text: 'Part G: 3 Hands-On SQL Lab Exercises (UniVerseDB)' },
        { type: 'list', ordered: true, items: [
          'Lab 2.1 (External Views for Role-Based Security): Write SQL DDL to create two External Views on Student(StudentID, Name, DeptID, CGPA, FeeBalance, Phone): (a) Public_Directory_View exposing only StudentID, Name, DeptID; (b) Accounts_Audit_View exposing only StudentID, Name, FeeBalance for students with FeeBalance > 0.',
          'Lab 2.2 (Inspecting the Query Optimizer with EXPLAIN): Write the SQL commands to run EXPLAIN ANALYZE on a query filtering Student by City = "Patna" before and after creating an index CREATE INDEX idx_student_city ON Student(City); and verify Physical Data Independence.',
          'Lab 2.3 (Zero-Downtime Table Split via Views): Demonstrate Logical Data Independence by splitting Course(CourseID, Title, Credits, SyllabusText) into Course_Meta(CourseID, Title, Credits) and Course_Syllabus(CourseID, SyllabusText) while keeping a view Course backward-compatible.'
        ] },
        { type: 'h3', text: 'Part H: 3 "Spot the Mistake" Diagnostic Challenges' },
        { type: 'list', ordered: true, items: [
          'Mistake 2.1: A student claims: "Running DELETE FROM Enrollment; changes the Conceptual Schema because the table structure is now empty."',
          'Mistake 2.2: A developer writes SELECT * FROM Student in 30 backend services and claims their code has full Logical Data Independence when new columns are added in the middle of the table.',
          'Mistake 2.3: A junior DBA sets max_connections = 5000 on an 8-core PostgreSQL server without PgBouncer so every microservice thread gets a dedicated connection.'
        ] }
      ]
    },
    // Page 22
    {
      blocks: [
        { type: 'h2', text: '2.9  Chapter 2 Complete Answer Key & Worked Solutions' },
        { type: 'h3', text: 'Solutions to Part A: Multiple-Choice Questions (Q1 to Q10)' },
        { type: 'table', caption: 'Answer Key & Detailed Explanations for Part A MCQs', headers: ['Q#', 'Ans', 'Detailed Step-by-Step Explanation'], rows: [
          ['Q1', '(B)', 'Schema = Intension (structural blueprint in the catalog). Instance = Extension (current set of tuples at time t).'],
          ['Q2', '(C)', 'The Internal Level (Physical Schema) specifies slotted page layouts, byte offsets, and B+ Tree/Hash index structures.'],
          ['Q3', '(B)', 'Adding or dropping an index modifies only the Internal Schema. Physical Data Independence shields the Conceptual Schema and queries.'],
          ['Q4', '(B)', 'Right after CREATE TABLE, the schema is registered in the catalog and the relation contains 0 tuples—the Empty Database State.'],
          ['Q5', '(C)', 'Decomposing a table alters the Conceptual Schema. Logical Data Independence (via External Views) hides this change from users.'],
          ['Q6', '(C)', 'The Query Optimizer uses catalog histograms and cost formulas to pick the lowest-cost physical execution plan.'],
          ['Q7', '(B)', 'The Buffer Manager manages the RAM Buffer Pool, page pinning, dirty bits, and page replacement (LRU-K / Clock-Sweep).'],
          ['Q8', '(B)', '3-Tier places the DB inside a private subnet and multiplexes tens of thousands of web users over a small connection pool.'],
          ['Q9', '(B)', 'SQL SELECT is declarative: the programmer states WHAT result set is desired, and the Optimizer decides HOW to fetch it.'],
          ['Q10', '(A)', 'PostgreSQL forks one OS backend process per client connection; MySQL InnoDB spawns one OS thread per connection inside mysqld.']
        ] }
      ]
    },
    // Page 23
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part B: Short-Answer Questions (B1 to B5)' },
        { type: 'list', ordered: false, items: [
          'Answer B1 (Schema vs. Instance): The Database Schema (Intension) is the invariant structural definition stored in the System Catalog—for example, Student(StudentID INT PK, Name VARCHAR(80), DeptID INT, CGPA DECIMAL(3,2)). The Database Instance (Extension) is the actual set of rows stored at a specific instant t—for example, {(1, "Asha", 10, 8.42), (2, "Ravi", 10, 7.25)}.',
          'Answer B2 (DELETE vs. TRUNCATE vs. DROP): Both DELETE FROM Student; and TRUNCATE TABLE Student; remove all rows from the current Database Instance (leaving the table in the Empty State with 0 rows) while keeping the Database Schema intact in the catalog. DROP TABLE Student; removes both the data instance AND the table’s schema definition from the System Catalog.',
          'Answer B3 (Why Logical Data Independence Is Harder): Physical changes (new index, new page size) are resolved automatically by the DBMS Query Optimizer without touching query semantics. Logical changes (splitting tables, renaming/refactoring columns) alter the constructs referenced directly by SQL queries, requiring the DBA to maintain External Views (or INSTEAD OF triggers for writes) to preserve backward compatibility.',
          'Answer B4 (Buffer Manager & Recovery Manager): (a) The Buffer Manager caches 8 KB disk pages in RAM frames so queries avoid slow disk I/O, tracking pinned pages and dirty pages. (b) The Recovery Manager enforces Write-Ahead Logging (WAL), ensuring log records reach disk before dirty data pages so the DBMS can perform ARIES Redo/Undo recovery after a crash.',
          'Answer B5 (Procedural vs. Declarative DML): A Procedural DML (such as Relational Algebra or cursor loops) requires the user to specify both WHAT data is needed and HOW to navigate records step-by-step. A Declarative DML (such as SQL SELECT) requires specifying only WHAT conditions the result must satisfy, leaving physical navigation and join ordering to the Query Optimizer.'
        ] }
      ]
    },
    // Page 24
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part C: Long-Answer / Essay Questions (C1 & C2)' },
        { type: 'callout', kind: 'example', title: 'Model Solution C1 | The ANSI/SPARC Three-Schema Architecture (10 Marks Structure)', body: '1. Architectural Motivation: Prior to 1975, applications hardcoded physical file pointers (zero data independence). ANSI/SPARC introduced three decoupled schema levels:\n• Internal Level (Physical Schema): Describes file allocation, 8 KB slotted pages, B+ Trees, hash buckets, and compression.\n• Conceptual Level (Logical Schema): Describes the community logical structure—all entity tables, attributes, data types, and PK/FK/CHECK constraints—hiding physical storage.\n• External Level (View Subschemas): Provides tailored virtual views (CREATE VIEW) for individual user roles, enforcing column/row security and simplifying complex joins.\n2. Inter-Level Mappings & Data Independence:\n• Conceptual/Internal Mapping links logical tables to physical files/indexes -> enables Physical Data Independence.\n• External/Conceptual Mapping links virtual views to conceptual tables -> enables Logical Data Independence.' },
        { type: 'callout', kind: 'example', title: 'Model Solution C2 | Internal DBMS Engine Query Execution Trace (10 Marks Structure)', body: 'When SELECT s.Name, d.DeptName FROM Student s JOIN Department d ON s.DeptID = d.DeptID WHERE s.CGPA > 8.5; arrives:\n1. DML Parser & Verifier: Validates lexical/grammar rules, checks System Catalog for Student and Department, verifies SELECT privileges, and builds a Relational Algebra tree.\n2. Cost-Based Query Optimizer: Reads catalog histograms, pushes down σ_{CGPA > 8.5}(Student), and selects an Index Nested Loop or Hash Join with Department.\n3. Execution Engine: Executes the physical operator pipeline.\n4. Concurrency & Buffer Managers: Acquires an MVCC read snapshot, requests index/data pages from the RAM Buffer Pool (fetching any missing blocks via the File Manager), and returns matching (Name, DeptName) tuples.' }
      ]
    },
    // Page 25
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part C (C3) & Part D: Numerical Architecture Problems (D1 & D2)' },
        { type: 'p', text: 'Answer C3 Summary: 1-Tier embeds UI, logic, and DB in one local process (fast, zero network, single-user/local device). 2-Tier puts UI + business logic on client workstations talking directly to the DB server over TCP (exposes DB network/credentials, scales poorly beyond a few hundred connections). 3-Tier places a middle Application + Connection Pool tier between clients and the private DB server, enforcing security, centralizing business rules, and multiplexing 100,000+ users onto a few dozen pooled DB connections.' },
        { type: 'callout', kind: 'example', title: 'Worked Solution D1 | Connection Pool Sizing via Little’s Law', body: 'Given: Arrival rate λ = 2,500 queries/sec, Mean query service time W = 12 ms = 0.012 sec, Memory per connection = 8 MB.\n(a) By Little’s Law, average concurrently active queries:\n    L = λ × W = 2,500 × 0.012 = 30 active connections.\n(b) Memory comparison:\n    • 2-Tier (25,000 connected users): 25,000 × 8 MB = 200,000 MB = 200 GB RAM!\n    • 3-Tier Pool (sized at 2.5 × L = 2.5 × 30 = 75 connections): 75 × 8 MB = 600 MB RAM.\n    • Memory Saved = 200,000 MB − 600 MB = 199.4 GB (99.7% reduction!).' },
        { type: 'callout', kind: 'example', title: 'Worked Solution D2 | Buffer Pool Hit Ratio & Effective Access Time', body: 'Given: Hit ratio H = 0.98 (Miss rate = 1 − H = 0.02), t_RAM = 0.005 ms, t_SSD = 0.25 ms.\n• Effective Page Access Time:\n  t_eff = H × t_RAM + (1 − H) × (t_RAM + t_SSD)\n  (or using standard direct miss penalty t_eff = 0.98 × 0.005 + 0.02 × 0.25 = 0.0049 + 0.0050 = 0.0099 ms = 9.9 microseconds).\n• Without Buffer Manager (H = 0, every access hits SSD = 0.25 ms = 250 microseconds):\n  Speedup = 0.25 ms / 0.0099 ms = 25.25× faster page access!' }
      ]
    },
    // Page 26
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part D (D3 & D4) and Part E: GATE CS Questions (E1 to E5)' },
        { type: 'callout', kind: 'example', title: 'Worked Solutions D3 & D4 | Index I/O Savings & View Mapping', body: 'Solution D3 (Index Scan vs. Full Table Scan):\n• B+ Tree Lookup reads h = 3 index pages + 1 data page = 4 page reads.\n• Sequential Table Scan reads an average of 2,500 / 2 = 1,250 pages (and 2,500 pages in the worst case if checking non-unique attributes).\n• Pages saved on average = 1,250 − 4 = 1,246 page reads (a 312.5× I/O reduction!).\n\nSolution D4 (SQL View for Logical Data Independence):\nCREATE OR REPLACE VIEW Legacy_Emp AS\nSELECT c.EmpID,\n       (c.FirstName || \' \' || c.LastName) AS FullName,\n       (p.BasePay + p.Bonus) AS TotalComp,\n       c.DeptID\nFROM Employee_Core c\nJOIN Employee_Pay p ON c.EmpID = p.EmpID;' },
        { type: 'table', caption: 'Solutions & Explanations for Part E: GATE CS Questions (E1 to E5)', headers: ['GATE Q#', 'Correct Answer', 'Step-by-Step GATE Derivation'], rows: [
          ['E1 (MCQ)', '(B) II only', 'I modifies the Internal Schema (index). III modifies only the Database Instance (DML). Only II (splitting relation R into R1, R2) modifies the Conceptual Schema.'],
          ['E2 (MSQ)', '(A), (B), (D)', '(C) is false because modifying the Conceptual/Internal mapping provides Physical Data Independence, not Logical Data Independence. (A), (B), and (D) are all true.'],
          ['E3 (NAT)', '28', 'By Little’s Law: L = λ × W = 800 req/sec × 0.035 sec = 28 active connections.'],
          ['E4 (NAT)', '89.6 µs (or 90 µs)', 't_eff = 0.96 × 10 µs + 0.04 × 2000 µs = 9.6 + 80 = 89.6 microseconds (90.0 µs if RAM probe is included on miss: 10 + 0.04 × 2000 = 90 µs).'],
          ['E5 (MCQ)', '(A) P-2, Q-3, R-4, S-1', 'DDL Interpreter -> Catalog (2); Query Optimizer -> Cost/Histograms (3); Buffer Mgr -> RAM cache (4); Recovery Mgr -> ARIES WAL (1).']
        ] }
      ]
    },
    // Page 27
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part F: Viva & Technical Placement Interview Questions (F1 to F5)' },
        { type: 'list', ordered: false, items: [
          'Answer F1 (Why 1,000 DB Connections Degrades Throughput): A database server has a fixed number of CPU cores (e.g., 8 or 16) and disk I/O queues. When 1,000 connections execute queries concurrently, the OS kernel spends most CPU cycles context-switching between 1,000 processes/threads, invalidating L1/L2 CPU caches and increasing lock contention. Sizing the pool to (2 × Cores) + Spindle_Count (~20–50 connections) maximizes throughput and minimizes tail latency.',
          'Answer F2 (How Unmaterialized Views Execute Internally — View Resolution / Query Modification): Because a standard SQL View stores only its SELECT definition in the System Catalog, the Query Rewriter performs View Resolution: it substitutes the view’s underlying SELECT query into your outer query and pushes predicates (like WHERE CGPA > 9.0) down into the base tables before optimization.',
          'Answer F3 (Declarative SQL to Procedural Plan): SQL is declarative because you specify the logical properties of the output without specifying which index to read or which join algorithm (Hash Join, Merge Join, Nested Loop) to run. The DBMS Query Compiler and Cost-Based Query Optimizer translate declarative SQL into a procedural tree of physical Relational Algebra operators.',
          'Answer F4 (Regular View vs. Materialized View): A regular View is purely an External Schema construct (virtual query, 0 data bytes on disk, always 100% fresh). A Materialized View defines an External view AND physically stores precomputed result tuples in the Internal Schema on disk (fast reads for heavy aggregations, requires REFRESH MATERIALIZED VIEW).',
          'Answer F5 (When to Use 1-Tier Embedded DB vs. 3-Tier Server DBMS): Use 1-Tier (SQLite/DuckDB) for mobile apps, desktop software, edge devices, CLI tools, or single-node analytical notebooks where zero network latency and zero administration are key. Use 3-Tier (PostgreSQL/MySQL/Oracle) when multiple concurrent networked users/services need shared ACID writes, centralized access control, and high availability.'
        ] }
      ]
    },
    // Page 28
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part G: Hands-On SQL Lab Exercises (Labs 2.1 to 2.3)' },
        { type: 'code', title: 'Complete SQL Solutions for Labs 2.1, 2.2, and 2.3', code: `-- Lab 2.1: Role-Based External Views on UniVerseDB
CREATE VIEW Public_Directory_View AS
SELECT StudentID, Name, DeptID
FROM Student;

CREATE VIEW Accounts_Audit_View AS
SELECT StudentID, Name, FeeBalance
FROM Student
WHERE FeeBalance > 0;

-- Lab 2.2: Verifying Physical Data Independence with EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT StudentID, Name FROM Student WHERE City = 'Patna';
-- Output before index: Seq Scan on Student (cost=0.00..1250.00 rows=250)

CREATE INDEX idx_student_city ON Student(City);

EXPLAIN ANALYZE SELECT StudentID, Name FROM Student WHERE City = 'Patna';
-- Output after index: Bitmap Heap Scan / Index Scan using idx_student_city (Zero SQL query change!)

-- Lab 2.3: Zero-Downtime Conceptual Split with Backward-Compatible View
CREATE TABLE Course_Meta (
    CourseID VARCHAR(10) PRIMARY KEY,
    Title    VARCHAR(100) NOT NULL,
    Credits  INT NOT NULL
);
CREATE TABLE Course_Syllabus (
    CourseID     VARCHAR(10) PRIMARY KEY REFERENCES Course_Meta(CourseID),
    SyllabusText TEXT
);
CREATE VIEW Course AS
SELECT m.CourseID, m.Title, m.Credits, s.SyllabusText
FROM Course_Meta m
LEFT JOIN Course_Syllabus s ON m.CourseID = s.CourseID;` }
      ]
    },
    // Page 29
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part H: "Spot the Mistake" Diagnostic Challenges (2.1 to 2.3)' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 2.1 | DELETE Never Alters the Conceptual Schema', body: 'The student confused Database Instance (Extension) with Database Schema (Intension). Running DELETE FROM Enrollment; removes all tuples from the current instance (transitioning the table to the Empty Database State), but the table definition, column types, and constraints in the Conceptual Schema remain 100% untouched in the System Catalog.' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 2.2 | SELECT * Breaks Positional Host Programs', body: 'Writing SELECT * couples application code to the exact column count and column order of the Conceptual Schema. If a DBA adds or reorders columns, code reading row[2] or INSERT INTO Table VALUES (...) without a column list will either crash or map values into the wrong columns. True Logical Data Independence requires explicit column lists and External Views.' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 2.3 | Unpooled High max_connections Causes Server Thrashing', body: 'Setting max_connections = 5000 on an 8-core PostgreSQL server consumes ~25–50 GB of RAM just for backend process overhead and causes severe CPU context-switching and lock contention under load. The correct fix is placing a 3-Tier transaction pooler (PgBouncer or HikariCP) in front of PostgreSQL with a server pool size of ~20–32 connections.' },
        { type: 'callout', kind: 'concept', title: 'END OF CHAPTER 2 | Up Next: Chapter 3 — Data Models: Evolution, Comparison, and Modeling Levels', body: 'In Chapter 3, we trace the evolution of database models from 1960s Hierarchical (IBM IMS) and Network (CODASYL) pointer chains to E.F. Codd’s Relational Model, Object-Relational hybrids, and modern NoSQL engines (Document, Key-Value, Wide-Column, and Graph).' }
      ]
    }
  ]
};

export const CHAPTER_03 = {
  number: 3,
  fileName: 'dbms-chapter-03.pdf',
  downloadName: 'DBMS-Chapter-03-Data-Models.pdf',
  partLabel: 'PART I: DATABASE FOUNDATIONS',
  headerPart: 'PART I: FOUNDATIONS',
  title: 'Data Models: Evolution, Comparison, and Modeling Levels',
  themeColor: '#1f4e78',
  themeLight: '#dbe8f5',
  themeBorder: '#6c9ac3',
  pageCount: 26,
  whyThisMatters: 'Why did E.F. Codd win the Turing Award for replacing pointer-based Hierarchical and Network databases with the Relational Model? And why do modern systems combine PostgreSQL (Relational/ORDBMS) with MongoDB (Document), Redis (Key-Value), Cassandra (Wide-Column), and Neo4j (Graph)? Mastering data models lets you design the right schema for any workload.',
  prerequisites: 'Chapters 1 & 2 (DBMS Fundamentals, Three-Schema Architecture, and Data Independence).',
  objectives: [
    'Define a Data Model formally in terms of its three essential components: Structural part, Manipulative part, and Integrity Constraints.',
    'Classify data models across the three abstraction categories: Conceptual (High-Level), Representational/Logical, and Physical (Low-Level).',
    'Trace the historical evolution from Hierarchical (IBM IMS) and Network (CODASYL) models to the Relational Model, OODBMS/ORDBMS, and modern NoSQL models.',
    'Represent a Many-to-Many (M:N) Student–Course relationship side-by-side across Hierarchical, Network, Relational, and Document models.',
    'Progress systematically from a Conceptual ER design to a Logical Relational schema and finally a Physical SQL deployment.',
    'Select the optimal data model in system design interviews and write hybrid Object-Relational PostgreSQL DDL using Composite Types, Arrays, and JSONB.'
  ],
  toc: [
    ['3', 'Data Models: Evolution, Comparison, and Modeling Levels', '1', true],
    ['3.1', 'What Is a Data Model and What Does It Contain?', '3'],
    ['3.1.1', 'The Three Essential Components of Every Data Model', '3', false, true],
    ['3.1.2', 'Three Categories of Data Models (Conceptual, Logical, Physical)', '3', false, true],
    ['3.2', 'Evolution of Data Models: From Legacy Pointers to Modern Engines', '4'],
    ['3.2.1', 'Hierarchical Model (1960s — IBM IMS Tree Structure)', '4', false, true],
    ['3.2.2', 'Network Model (1969 — CODASYL DBTG Directed Graph)', '5', false, true],
    ['3.2.3', 'Relational Model (1970 — E.F. Codd’s Mathematical Relations)', '6', false, true],
    ['3.2.4', 'Object-Oriented (OODBMS) and Object-Relational (ORDBMS) Models', '6', false, true],
    ['3.2.5', 'Modern Semi-Structured & NoSQL Models (Document, KV, Wide-Column, Graph)', '7', false, true],
    ['3.3', 'Dedicated Comparison Spread: The Seven Major Data Models', '8'],
    ['3.3.1', 'Worked Example 3.1: Representing an M:N Relationship Across 4 Models', '8', false, true],
    ['3.3.2', 'Table 3.1: Master Comparison of the 7 Major Data Models', '9', false, true],
    ['3.4', 'Conceptual vs. Logical vs. Physical Data Modeling', '10'],
    ['3.4.1', 'Table 3.2: Side-by-Side Comparison of the Three Modeling Stages', '11', false, true],
    ['3.4.2', 'Worked Example 3.2: End-to-End Walkthrough (Conceptual -> Logical -> Physical)', '11', false, true],
    ['3.5', 'Choosing the Right Data Model in System Design Interviews', '12'],
    ['3.5.1', 'Worked Example 3.3: Hybrid Object-Relational Modeling in PostgreSQL', '13', false, true],
    ['3.5.2', 'Worked Example 3.4: Polyglot Persistence for a Campus Super-App', '14', false, true],
    ['3.6', 'Chapter 3 Summary & One-Page Rapid-Revision Cheat Sheet', '15'],
    ['3.7', 'Chapter 3 Exam, GATE & Placement Question Bank (Parts A–H)', '17'],
    ['3.8', 'Chapter 3 Complete Answer Key & Worked Solutions', '21']
  ],
  pages: [
    // Page 3
    {
      blocks: [
        { type: 'h2', text: '3.1  What Is a Data Model and What Does It Contain?' },
        { type: 'p', text: 'A Data Model is an integrated collection of mathematical and conceptual tools used to describe the structure of a database, the operations allowed on that data, and the constraints that keep the data valid.' },
        { type: 'h3', text: '3.1.1  The Three Essential Components of Every Data Model' },
        { type: 'list', ordered: true, items: [
          'Structural Part (Data Structures): Defines how data is conceptually organized and perceived by users (e.g., 2D tables/relations in the Relational Model, parent–child trees in the Hierarchical Model, JSON documents in the Document Model, or nodes and edges in a Graph Model).',
          'Manipulative Part (Operations): Defines the set of formal operators used to retrieve and update data (e.g., Relational Algebra operators σ, π, ⋈ in the Relational Model; tree-traversal GET NEXT WITHIN PARENT in IMS; or Cypher pattern matching in Neo4j).',
          'Integrity Constraints Part (Validation Rules): Defines structural rules that every valid database instance must obey (e.g., Primary Key uniqueness and Foreign Key referential integrity in the Relational Model, or strict single-parent tree rules in the Hierarchical Model).'
        ] },
        { type: 'h3', text: '3.1.2  Three Categories of Data Models (Aligned with ANSI/SPARC)' },
        { type: 'list', ordered: false, items: [
          '1. High-Level / Conceptual Data Models (Entity-Relationship / EER): Close to how business stakeholders think; models Entities, Attributes, and Relationships without tying to any specific DBMS.',
          '2. Representational / Implementation (Logical) Data Models (Relational, Network, Hierarchical, Document): Understandable by developers while directly implementable in a commercial DBMS.',
          '3. Low-Level / Physical Data Models: Describe byte-level record formats, slotted page headers, B+ Tree node layouts, and disk block access paths.'
        ] }
      ]
    },
    // Page 4
    {
      blocks: [
        { type: 'h2', text: '3.2  Evolution of Data Models: From Legacy Pointers to Modern Engines' },
        { type: 'h3', text: '3.2.1  The Hierarchical Data Model (1960s — IBM IMS)' },
        { type: 'p', text: 'Developed by IBM and North American Rockwell for the Apollo Moon program, the Hierarchical Model organizes records as an upside-down tree of parent and child segments:' },
        { type: 'list', ordered: false, items: [
          'Strict 1:N Parent–Child Rule: Every child record has at most ONE parent record (except the root, which has none), while a parent can have multiple children. Natural for strict 1:N hierarchies (Department -> Course -> Section).',
          'Fatal Flaw on M:N Relationships: Because a child cannot have two parents in a strict tree, modeling a Many-to-Many relationship (e.g., Student enrolls in many Courses, and a Course has many Students) requires either duplicating Student records under every Course (causing massive redundancy and update anomalies) or maintaining complex "virtual pointer segments".',
          'Zero Physical Data Independence: Queries require procedural tree navigation (GET UNIQUE, GET NEXT WITHIN PARENT). If the tree hierarchy is reorganized, every COBOL/C application program breaks!'
        ] },
        { type: 'h3', text: '3.2.2  The Network Data Model (1969 — CODASYL DBTG)' },
        { type: 'p', text: 'Standardized by the Conference on Data Systems Languages (CODASYL), the Network Model generalized the strict tree into a directed graph using Owner–Member Sets (1:N links):' },
        { type: 'list', ordered: false, items: [
          'Multiple Parents Allowed: A record type (e.g., Enrollment intersection record) can simultaneously be a member of two different Owner sets (owned by Student AND owned by Course), solving M:N relationships without duplicating Student data.',
          'Fatal Flaw — Circular Pointer Chains ("Spaghetti Navigation"): Records are connected on disk via physical circular linked lists of disk pointers (Next, Prior, and Owner pointers). Programmers had to manually navigate pointer chains using currency indicators (FIND FIRST, FIND NEXT WITHIN SET). A single corrupted disk pointer broke the entire ring!'
        ] }
      ]
    },
    // Page 5
    {
      blocks: [
        { type: 'diagram', caption: 'Figure 3.1 & 3.2: Four-Panel Evolution (Hierarchical Tree vs. Network Graph vs. Relational Tables vs. Document JSON) & CODASYL Pointer Ring vs. Logical Foreign Keys.', rows: [
          ['1. HIERARCHICAL (IBM IMS)', 'Course(CS301) ---> Dup Student(Asha), Student(Ravi) | Course(CS201) ---> Dup Student(Asha) [Redundant Tree!]'],
          ['2. NETWORK (CODASYL)', 'Student(Asha) --[Owner Set Pointer Ring]--> Enrollment(Grade A) <--[Owner Set Pointer Ring]-- Course(CS301)'],
          ['3. RELATIONAL (E.F. Codd)', 'Student(StudentID=1)  <--- Logical Value Match (FK = PK) --->  Enrollment(StudentID=1, CourseID="CS301", Grade="A")'],
          ['4. DOCUMENT (MongoDB)', '{ "_id": 1, "name": "Asha", "enrollments": [ { "courseId": "CS301", "grade": "A" }, { "courseId": "CS201", "grade": "A+" } ] }']
        ] },
        { type: 'h3', text: '3.2.3  The Relational Data Model (1970 — E.F. Codd’s Revolution)' },
        { type: 'p', text: 'In his landmark 1970 paper "A Relational Model of Data for Large Shared Data Banks," Edgar F. Codd replaced physical disk pointers with mathematical Relations (2D tables) and value-based Foreign Keys:' },
        { type: 'list', ordered: false, items: [
          'Value-Based Relationships (No User-Visible Pointers!): Two tables are linked purely by matching attribute values (e.g., Student.DeptID = Department.DeptID), not by hardcoded disk addresses.',
          'Declarative Queries & Set-At-A-Time Processing: Instead of record-at-a-time pointer loops, users write declarative SQL based on Relational Algebra and Relational Calculus, achieving full Physical Data Independence.'
        ] },
        { type: 'h3', text: '3.2.4  Object-Oriented (OODBMS) and Object-Relational (ORDBMS) Models' },
        { type: 'p', text: 'In the 1980s–1990s, CAD/CAM and multimedia systems needed complex nested objects and inheritance. Pure OODBMS (ObjectStore, db4o) stored programming objects directly with Object IDs (OIDs) but lacked declarative SQL tooling. Object-Relational DBMS (ORDBMS — PostgreSQL, Oracle, Informix) won by extending the Relational Model with User-Defined Types (UDTs), Arrays, JSONB, table inheritance, and spatial indexes (PostGIS) while preserving full SQL and ACID.' }
      ]
    },
    // Page 6
    {
      blocks: [
        { type: 'h3', text: '3.2.5  Modern Semi-Structured and NoSQL Data Models (2000s–Present)' },
        { type: 'p', text: 'Web-scale applications with massive horizontal write throughput, flexible schemas, or deep graph traversals led to four specialized families of NoSQL ("Not Only SQL") data models:' },
        { type: 'list', ordered: true, items: [
          'Document Data Model (MongoDB, Couchbase, Firestore): Stores self-describing hierarchical documents in JSON/BSON format. Ideal for product catalogs, CMS articles, and user profiles where related nested arrays can be fetched in a single read without multi-table joins.',
          'Key–Value Data Model (Redis, Amazon DynamoDB, Memcached): An ultra-fast hash map associating a unique Key with an opaque Value (string, JSON, hash, or sorted set). Delivers sub-millisecond O(1) lookups for session stores, caching, rate limiters, and leaderboards.',
          'Wide-Column / Column-Family Data Model (Apache Cassandra, Google Bigtable, HBase): Organizes data by Row Key into column families where rows are sorted lexicographically and stored in LSM-Trees (Log-Structured Merge-Trees). Built for massive write-heavy time-series, IoT telemetry, and chat message history.',
          'Graph Data Model (Neo4j, Amazon Neptune, JanusGraph): Models entities as Nodes (Vertices) and relationships as first-class directed Edges with properties (Property Graph). Uses Index-Free Adjacency so multi-hop traversals (e.g., 5-hop fraud detection or social "friends of friends") run in O(k) local hops rather than expensive 5-way SQL self-joins.'
        ] },
        { type: 'callout', kind: 'concept', title: 'CONCEPT | Why Graph Databases Beat Relational Joins on Deep Multi-Hop Queries', body: 'In a relational table of 100M users, finding a 5-hop connection requires 5 self-joins of the Friendship table (O(log N) B+ Tree lookups per hop). In a Property Graph with Index-Free Adjacency, each node holds direct memory references to its adjacent edges, traversing only the local neighborhood!' }
      ]
    },
    // Page 7
    {
      blocks: [
        { type: 'h2', text: '3.3  Dedicated Comparison Spread: The Seven Major Data Models' },
        { type: 'h3', text: '3.3.1  Worked Example 3.1: Representing an M:N Relationship Across 4 Models' },
        { type: 'p', text: 'Suppose Asha (StudentID 1) and Ravi (StudentID 2) both enroll in CS301 (Database Systems), and Asha also enrolls in CS201 (Data Structures). Compare how four data models represent this M:N relationship:' },
        { type: 'list', ordered: true, items: [
          'Hierarchical Model: Because a child segment can have only one parent, placing Student under Course forces Asha’s entire record (Name, CGPA, City) to be duplicated under both CS301 and CS201 (or requires proprietary IBM IMS logical twin pointers).',
          'Network Model: Creates three record types (Student, Course, and an intersection record Enrollment) linked by two CODASYL Owner–Member pointer sets (Student_Enrolls and Course_Roster). Avoids duplication, but queries must traverse circular pointer chains.',
          'Relational Model: Creates three normalized relations—Student(StudentID PK, Name), Course(CourseID PK, Title), and junction table Enrollment(StudentID FK, CourseID FK, Grade)—linked cleanly by matching primary/foreign key values.',
          'Document Model (MongoDB): Embeds an array of course enrollments inside Asha’s student document for 1-read student transcripts, or references course ObjectIds when courses have thousands of students.'
        ] },
        { type: 'code', title: 'Neo4j Cypher Query vs. SQL for a 2-Hop "Co-Enrolled Classmates" Query', code: `-- Neo4j Property Graph (Cypher): Find classmates enrolled in the same course as Asha
MATCH (s:Student {name: 'Asha'})-[:ENROLLED_IN]->(c:Course)<-[:ENROLLED_IN]-(peer:Student)
WHERE peer.studentId <> s.studentId
RETURN DISTINCT peer.name, c.title;

-- Equivalent Relational SQL (Requires 2 Joins on Enrollment):
SELECT DISTINCT s2.Name, c.Title
FROM Student s1
JOIN Enrollment e1 ON s1.StudentID = e1.StudentID
JOIN Enrollment e2 ON e1.SectionID = e2.SectionID
JOIN Student s2    ON e2.StudentID = s2.StudentID
JOIN Course c      ON c.CourseID = 'CS301'
WHERE s1.Name = 'Asha' AND s2.StudentID <> s1.StudentID;` }
      ]
    },
    // Page 8
    {
      blocks: [
        { type: 'table', caption: 'Table 3.1: Master Comparison of the Seven Major Data Models', headers: ['Data Model', 'Core Structure', 'Relationships', 'Schema Flexibility', 'Representative DBMS & Best Use Case'], rows: [
          ['Hierarchical (1960s)', 'Tree (Parent–Child Segments)', 'Physical Parent–Child Pointers (1:N only)', 'Rigid (Predefined tree)', 'IBM IMS, Windows Registry — Legacy mainframe banking/aviation'],
          ['Network (1969)', 'Directed Graph (Owner–Member Sets)', 'Circular Linked-List Pointer Chains (1:N, M:N)', 'Rigid (CODASYL DDL)', 'IDMS, TurboIMAGE — High-speed legacy telecom/manufacturing'],
          ['Relational (1970)', '2D Relations (Tables, Tuples, Attributes)', 'Value-Based Foreign Keys (PK = FK)', 'Strict Schema-on-Write', 'PostgreSQL, MySQL, Oracle, SQL Server — ERP, Banking, OLTP'],
          ['Object-Relational (1990s)', 'Relations + UDTs, Arrays, JSONB, Spatial', 'Foreign Keys + Nested Composite Types', 'Hybrid (Strict + JSONB)', 'PostgreSQL, Oracle — Geospatial (PostGIS), Hybrid SaaS'],
          ['Document (NoSQL)', 'Nested JSON / BSON Documents', 'Embedded Sub-Documents or ID References', 'Flexible Schema-on-Read', 'MongoDB, Firestore, Couchbase — Catalogs, CMS, User Profiles'],
          ['Key–Value (NoSQL)', 'Hash Map (Key -> Value / Blob / Struct)', 'None (Application-level key lookups)', 'Schema-less Values', 'Redis, DynamoDB — Caching, Session Store, Rate Limiting'],
          ['Wide-Column & Graph', 'Column Families (LSM) / Nodes & Edges', 'Row Key Clustering / Index-Free Edges', 'Dynamic Columns / Properties', 'Cassandra (IoT/Chat logs), Neo4j (Fraud rings, Social Graphs)']
        ] },
        { type: 'callout', kind: 'exam', title: 'EXAM CHECKPOINT | Key Difference Between Hierarchical, Network, and Relational Models', body: '• Hierarchical = Tree (1 parent per child, physical pointers, procedural navigation).\n• Network = Graph (multiple owner sets per member, circular pointer chains, procedural navigation).\n• Relational = Tables (any relationship via value-based Foreign Keys, declarative SQL, full physical data independence).' }
      ]
    },
    // Page 9
    {
      blocks: [
        { type: 'h2', text: '3.4  Conceptual vs. Logical vs. Physical Data Modeling' },
        { type: 'p', text: 'When designing a new database from scratch, professional database engineers never jump straight to writing CREATE TABLE statements. Instead, they refine the design across three progressive modeling stages:' },
        { type: 'diagram', caption: 'Figure 3.3: Progressive Refinement of UniVerseDB Across Conceptual, Logical, and Physical Data Modeling.', rows: [
          ['STAGE 1: CONCEPTUAL MODEL', '[STUDENT] ----(1 : N)---- <ENROLLS_IN> ----(M : N)---- [COURSE]  (Business entities & cardinalities only; no data types or FKs)'],
          ['STAGE 2: LOGICAL MODEL', 'Student(StudentID [PK], Name, DeptID [FK]) | Enrollment(StudentID [FK], CourseID [FK], Grade) | Course(CourseID [PK], Title, Credits)'],
          ['STAGE 3: PHYSICAL MODEL', 'PostgreSQL 17 DDL: VARCHAR(80) NOT NULL, NUMERIC(3,2) CHECK(...), CREATE INDEX idx_enroll_cid USING btree, PARTITION BY RANGE']
        ] },
        { type: 'table', caption: 'Table 3.2: Detailed Comparison of Conceptual, Logical, and Physical Data Models', headers: ['Design Aspect', 'Conceptual Data Model', 'Logical Data Model', 'Physical Data Model'], rows: [
          ['Primary Goal', 'Capture business entities & rules with stakeholders', 'Define normalized table structures & keys cleanly', 'Optimize SQL DDL, types, indexes & partitions for a target DBMS'],
          ['DBMS Dependency', '100% DBMS-Independent', 'DBMS-Family Specific (e.g., Relational)', 'DBMS-Engine & Version Specific (e.g., PostgreSQL 17)'],
          ['Entities & Tables', 'High-level Entity Boxes', 'Normalized Relations (3NF / BCNF)', 'Physical Tables, Partitioned Tables, Materialized Views'],
          ['M:N Relationships', 'Shown directly as a diamond (M:N)', 'Resolved into an associative Junction Table with FKs', 'Implemented with Foreign Key constraints & composite B+ Tree indexes'],
          ['Data Types & Indexes', 'Omitted (or generic names only)', 'Generic logical types (Integer, String, Date)', 'Exact engine types (BIGINT, VARCHAR(80), TIMESTAMPTZ) + Indexes']
        ] }
      ]
    },
    // Page 10
    {
      blocks: [
        { type: 'h3', text: '3.4.2  Worked Example 3.2: End-to-End Walkthrough (Conceptual -> Logical -> Physical)' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 3.2 | Designing University Course Enrollment Across All 3 Modeling Stages', body: 'Requirement: "Each Department offers multiple Courses. Students enroll in Courses during a Semester and receive a Grade."\n\nStage 1 — Conceptual Model (ER Diagram):\n• Entities: DEPARTMENT, COURSE, STUDENT.\n• Relationships: DEPARTMENT —< OFFERS (1:N) >— COURSE; STUDENT —< ENROLLS (M:N, with attributes Semester, Grade) >— COURSE.\n\nStage 2 — Logical Relational Model (DBMS-Neutral Relations in 3NF):\n• Department(DeptID [PK], DeptName, Building)\n• Course(CourseID [PK], Title, Credits, DeptID [FK -> Department])\n• Student(StudentID [PK], Name, CGPA, DeptID [FK -> Department])\n• Enrollment(StudentID [FK -> Student], CourseID [FK -> Course], Semester, Grade, PRIMARY KEY(StudentID, CourseID, Semester))\n\nStage 3 — Physical Model (PostgreSQL-Specific DDL with Types, Constraints & Indexes):\n• Specifies VARCHAR(10), NUMERIC(3,2) CHECK (CGPA BETWEEN 0 AND 10), ON DELETE RESTRICT, and B+ Tree index CREATE INDEX idx_enrollment_course ON Enrollment(CourseID, Semester);' }
      ]
    },
    // Page 11
    {
      blocks: [
        { type: 'h2', text: '3.5  Choosing the Right Data Model in System Design Interviews' },
        { type: 'diagram', caption: 'Figure 3.4: Architecture Decision Tree for Choosing the Right Data Model in System Design Interviews.', rows: [
          ['Need strict ACID transactions, complex joins & normalized integrity?', 'YES ---> Relational / ORDBMS (PostgreSQL, MySQL, CockroachDB)'],
          ['Need sub-millisecond O(1) lookups by key (sessions, cache, leaderboards)?', 'YES ---> In-Memory Key–Value Store (Redis, DynamoDB)'],
          ['Need self-contained hierarchical JSON objects with evolving attributes?', 'YES ---> Document Database (MongoDB, Firestore) or PostgreSQL JSONB'],
          ['Need massive write-heavy time-series or append-only IoT/chat logs?', 'YES ---> Wide-Column Store (Apache Cassandra, ScyllaDB, Bigtable)'],
          ['Need deep multi-hop relationship traversal (fraud rings, recommendations)?', 'YES ---> Property Graph Database (Neo4j, Amazon Neptune)']
        ] },
        { type: 'h3', text: '3.5.1  Worked Example 3.3: Hybrid Object-Relational Modeling in PostgreSQL' },
        { type: 'code', title: 'Listing 3.1: PostgreSQL Object-Relational DDL Using Composite Types, Arrays, and JSONB', code: `-- 1. User-Defined Composite Type (ORDBMS Feature)
CREATE TYPE full_address AS (
    street  VARCHAR(100),
    city    VARCHAR(50),
    pincode CHAR(6)
);

-- 2. Hybrid Relational Table combining strict columns, Composite Type, Array, and JSONB
CREATE TABLE Student_Hybrid (
    StudentID    INT PRIMARY KEY,
    Name         VARCHAR(80) NOT NULL,
    HomeAddress  full_address,                -- Composite UDT
    SkillTags    TEXT[],                      -- Native Array type
    ExtraProfile JSONB                        -- Semi-structured JSONB document
);

-- 3. Creating a GIN Index on JSONB and querying nested fields alongside relational columns
CREATE INDEX idx_student_profile_gin ON Student_Hybrid USING GIN (ExtraProfile);

SELECT Name, (HomeAddress).city AS City, ExtraProfile->>'github' AS GitHub
FROM Student_Hybrid
WHERE 'PostgreSQL' = ANY(SkillTags)
  AND ExtraProfile @> '{"hackathonWinner": true}';` }
      ]
    },
    // Page 12
    {
      blocks: [
        { type: 'h3', text: '3.5.2  Worked Example 3.4: Polyglot Persistence for a Multi-Service Campus Super-App' },
        { type: 'p', text: 'Modern large-scale enterprises rarely force every microservice into a single data model. Instead, they practice Polyglot Persistence—choosing the best data model for each bounded service:' },
        { type: 'table', caption: 'Polyglot Persistence Architecture for the UniVerse Campus Super-App', headers: ['Microservice / Workload', 'Chosen Data Model & Engine', 'Engineering Justification'], rows: [
          ['1. Tuition Fee Ledger & Exam Grades', 'Relational (PostgreSQL)', 'Requires strict multi-row ACID transactions, foreign keys, and auditability.'],
          ['2. Live Login Sessions & OTP Rate Limiter', 'Key–Value (Redis)', 'Requires < 1 ms O(1) key lookups and automatic TTL expiration (EXPIRE 300s).'],
          ['3. Course E-Learning Content & Dynamic Quizzes', 'Document (MongoDB / JSONB)', 'Each module has deeply nested, polymorphic blocks (videos, code labs, rubrics).'],
          ['4. Campus IoT Smart-Meter & Wi-Fi Access Logs', 'Wide-Column (Cassandra)', '50,000 sensor writes/sec partitioned by (DeviceID, Day) and sorted by Timestamp.'],
          ['5. Alumni Mentorship & Research Co-Author Network', 'Graph (Neo4j)', 'Queries 3-to-5-hop co-authorship and alumni referral paths in milliseconds.']
        ] },
        { type: 'callout', kind: 'mistake', title: 'COMMON MISTAKE | Using NoSQL When You Actually Have Highly Relational Data', body: 'Storing highly interconnected financial or academic records in a Document database and then writing 6-stage application-side $lookup joins loses ACID referential integrity and performs worse than PostgreSQL. Default to Relational/ORDBMS unless a specific access pattern demands a specialized NoSQL model!' }
      ]
    },
    // Page 13
    {
      blocks: [
        { type: 'h2', text: '3.6  Chapter 3 Summary & One-Page Rapid-Revision Cheat Sheet' },
        { type: 'table', caption: 'Chapter 3 Rapid-Revision Cheat Sheet', headers: ['Topic / Model', 'Core Exam Rule / Key Distinction'], rows: [
          ['3 Parts of a Data Model', '1. Structural Part (data organization) + 2. Manipulative Part (operators) + 3. Integrity Constraints (rules).'],
          ['3 Categories of Models', 'Conceptual (ER/EER) -> Representational/Logical (Relational/Network/Document) -> Physical (Slotted pages/B+ Trees).'],
          ['Hierarchical Model (IMS)', 'Strict Tree (1:N). Child has at most 1 parent. M:N causes data duplication. Procedural navigation.'],
          ['Network Model (CODASYL)', 'Directed Graph (Owner–Member sets). Handles M:N via intersection records, but uses complex circular pointer chains.'],
          ['Relational Model (Codd)', '2D tables (Relations). Links tables via value-based Foreign Keys (zero physical pointers exposed to users) + declarative SQL.'],
          ['ORDBMS (PostgreSQL)', 'Combines Relational tables + ACID with UDTs, Arrays, JSONB, and spatial indexes (GIN/GiST).'],
          ['4 NoSQL Families', 'Document (MongoDB: JSON), Key–Value (Redis: O(1) hash), Wide-Column (Cassandra: LSM time-series), Graph (Neo4j: nodes/edges).'],
          ['Conceptual vs. Logical vs. Physical', 'Conceptual = Entities/Diamonds (DBMS-agnostic); Logical = Normalized Tables/PK/FK; Physical = SQL DDL, data types, indexes.']
        ] },
        { type: 'callout', kind: 'exam', title: 'EXAM CHECKPOINT | Golden Rule for M:N Relationships Across Models', body: '• In a Conceptual ER Diagram: Drawn directly as a diamond with M:N cardinality.\n• In a Logical/Physical Relational Schema: ALWAYS requires a 3rd associative Junction Table containing the Foreign Keys of both participating tables!' }
      ]
    },
    // Page 14
    {
      blocks: [
        { type: 'h2', text: 'Student Revision & Lecture Notes — Chapter 3' },
        { type: 'p', text: 'Use this page to summarize the evolution from Hierarchical -> Network -> Relational -> NoSQL and practice converting a Conceptual M:N relationship into a Logical Relational schema.' },
        { type: 'table', caption: 'Active Recall Revision Prompts — Chapter 3', headers: ['Revision Question', 'Key Points to Write in Exam'], rows: [
          ['Why did Relational replace Hierarchical & Network?', 'Eliminated physical disk pointers & procedural navigation; introduced value-based Foreign Keys, declarative SQL, and physical data independence.'],
          ['How does Network model represent M:N without duplication?', 'Uses a third intersection record type that is a member of two CODASYL Owner–Member sets (owned by both parent record types).'],
          ['When should you use PostgreSQL JSONB vs. pure MongoDB?', 'PostgreSQL JSONB gives flexible document attributes + GIN indexing inside the same ACID database as your relational tables, avoiding distributed sync bugs.'],
          ['What are the 3 outputs of Conceptual, Logical, and Physical modeling?', '1. Conceptual -> ER Diagram  2. Logical -> 3NF/BCNF Relational Schema (PK/FK)  3. Physical -> Target SQL DDL + Indexes + Partitions']
        ] }
      ]
    },
    // Page 15
    {
      blocks: [
        { type: 'h2', text: '3.7  Chapter 3 Exam, GATE & Placement Question Bank' },
        { type: 'h3', text: 'Part A: 10 Multiple-Choice Questions (MCQs)' },
        { type: 'list', ordered: true, items: [
          'Q1. Which of the following is NOT one of the three essential components of a formal Data Model?\n(A) Structural Part   (B) Manipulative Part   (C) Integrity Constraints Part   (D) Network Socket Protocol Part',
          'Q2. The Entity-Relationship (ER) model belongs to which category of data models?\n(A) Low-Level / Physical Data Model   (B) High-Level / Conceptual Data Model   (C) CODASYL Pointer Model   (D) Wide-Column Physical Model',
          'Q3. What is the primary structural limitation of the Hierarchical Data Model (IBM IMS)?\n(A) It cannot represent 1:N relationships   (B) Every child node can have at most one parent node, making M:N relationships redundant or awkward   (C) It does not support disk storage   (D) It requires SQL joins',
          'Q4. How does the Relational Data Model establish relationships between two tables?\n(A) Physical circular linked lists of disk addresses   (B) Parent–child tree segments   (C) Matching attribute values via Primary Keys and Foreign Keys   (D) Index-free adjacency pointers',
          'Q5. In the CODASYL Network Data Model, the basic construct used to represent a 1:N relationship between an owner record type and a member record type is called a:\n(A) Relation   (B) CODASYL Set   (C) BSON Document   (D) Foreign Key Constraint'
        ] }
      ]
    },
    // Page 16
    {
      blocks: [
        { type: 'h3', text: 'Part A: Multiple-Choice Questions (Continued — Q6 to Q10)' },
        { type: 'list', ordered: false, items: [
          '6. Q6. Which NoSQL database family is best suited for storing write-heavy IoT sensor telemetry partitioned by DeviceID and sorted by timestamp?\n(A) Graph Database (Neo4j)   (B) Wide-Column Store (Apache Cassandra)   (C) Hierarchical Mainframe (IMS)   (D) In-Memory Key-Value (Memcached)',
          '7. Q7. At which stage of data modeling is a Many-to-Many (M:N) relationship first decomposed into an associative junction table with Foreign Keys?\n(A) Conceptual Data Modeling   (B) Logical Data Modeling   (C) Physical Disk Partitioning   (D) Network Socket Routing',
          '8. Q8. PostgreSQL supports relational tables with ACID transactions while also allowing User-Defined Composite Types, Arrays, and indexed JSONB columns. PostgreSQL is therefore classified as an:\n(A) Hierarchical DBMS   (B) Object-Relational DBMS (ORDBMS)   (C) Pure Key-Value Store   (D) CODASYL Network DBMS',
          '9. Q9. Why do Property Graph databases (like Neo4j) outperform relational databases on 5-hop "friend-of-a-friend" traversal queries?\n(A) Graph databases do not use RAM   (B) Index-Free Adjacency allows direct O(1) pointer hops between connected nodes without global B+ Tree join lookups   (C) Graph databases store everything in a single CSV file   (D) Relational databases cannot perform self-joins',
          '10. Q10. Exact column data types (such as VARCHAR(80), NUMERIC(10,2)), B+ Tree index definitions, and table partitioning clauses belong to the:\n(A) Conceptual Data Model   (B) Business Stakeholder Brief   (C) Physical Data Model   (D) External User View'
        ] },
        { type: 'h3', text: 'Part B: 5 Short-Answer Questions (2–3 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'B1. Define a Data Model and briefly explain its three core components.',
          'B2. Why did the Relational Model replace the Hierarchical and Network models as the dominant enterprise database standard?',
          'B3. Compare how the Hierarchical Model and the Network Model handle a Many-to-Many (M:N) relationship.',
          'B4. Differentiate between a Conceptual Data Model, a Logical Data Model, and a Physical Data Model.',
          'B5. When should a system architect embed related data inside a single Document (MongoDB/JSONB) vs. normalizing it into separate tables with Foreign Keys?'
        ] }
      ]
    },
    // Page 17
    {
      blocks: [
        { type: 'h3', text: 'Part C: 3 Long-Answer / Essay Questions (5–10 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'C1. Trace the evolution of database data models from the 1960s to the present day (Hierarchical, Network, Relational, Object-Relational, and the 4 NoSQL families). Include diagrams showing how a Student–Course relationship is represented in each.',
          'C2. Explain the three stages of database design (Conceptual, Logical, and Physical Data Modeling). Using a Hospital Management System (Doctors, Patients, Prescriptions), show the exact artifacts produced at each stage.',
          'C3. What is Polyglot Persistence? Design the multi-database architecture for an online food-delivery platform (like Swiggy/Zomato) covering order billing, live driver GPS tracking, restaurant menus, and coupon session caching.'
        ] },
        { type: 'h3', text: 'Part D: 3 Quantitative & Practical Modeling Problems' },
        { type: 'list', ordered: true, items: [
          'D1. (Redundancy Calculation in Hierarchical vs. Relational Model): Suppose 10,000 Students each enroll in an average of 6 Courses. A Student profile occupies 200 bytes, a Course record occupies 120 bytes (across 500 courses), and an Enrollment link (StudentID + CourseID + Grade) occupies 20 bytes. Calculate the total storage required in: (a) a Hierarchical tree where Course is the parent and full Student records are duplicated under each Course they take; vs. (b) a Normalized Relational schema.',
          'D2. (Graph Index-Free Adjacency vs. Relational B+ Tree Self-Joins): A social network has N = 16,000,000 users, and each user has an average of d = 50 friends. Finding 3-hop connections requires examining d^3 = 125,000 paths. Compare the number of B+ Tree index node comparisons in a Relational join (where each B+ Tree lookup on 16M rows requires log2(16,000,000) = 24 comparisons) against Index-Free Adjacency (1 direct pointer hop per edge).',
          'D3. (Logical-to-Physical Translation): Convert the conceptual requirement "Many Authors write Many Books, and each contribution records AuthorOrder and RoyaltyPct" into (a) a Logical Relational Schema and (b) Physical PostgreSQL DDL.'
        ] }
      ]
    },
    // Page 18
    {
      blocks: [
        { type: 'h3', text: 'Part E: 5 GATE CS Style Questions (MCQ, MSQ, and NAT)' },
        { type: 'list', ordered: true, items: [
          'E1. [GATE MCQ — 1 Mark] Which of the following data models represents all relationships exclusively through value-based matching of attributes rather than physical or logical pointers?\n(A) Hierarchical Model   (B) CODASYL Network Model   (C) Relational Model   (D) Property Graph Model',
          'E2. [GATE MSQ — 2 Marks] Which of the following statements regarding Conceptual, Logical, and Physical Data Models are CORRECT?\n(A) A Conceptual ER model can represent a Many-to-Many (M:N) relationship directly without an intermediate junction entity.\n(B) A Logical Relational model resolves every M:N relationship into a separate relation whose primary key includes foreign keys referencing the participating relations.\n(C) Adding a B+ Tree index changes the Conceptual Data Model.\n(D) The Physical Data Model specifies DBMS-specific column types, storage parameters, and indexing strategies.',
          'E3. [GATE NAT — 2 Marks] In a Hierarchical database where Courses are parent segments and Student profiles (250 bytes each) are stored as child segments under every Course in which a student enrolls: if 4,000 students each enroll in 5 courses, the total storage consumed by Student child segments (in Megabytes, where 1 MB = 10^6 bytes) is ________.',
          'E4. [GATE NAT — 2 Marks] If the same 4,000 students (250 bytes each) and their 5 enrollments per student are stored in a Relational database using a Student table (250 B/row) and an Enrollment table (15 B/row), the total storage consumed by Student + Enrollment rows (in Megabytes, 1 MB = 10^6 bytes) is ________.',
          'E5. [GATE MCQ — 2 Marks] Match the database workload with the most appropriate primary data model:\nP. Double-entry banking ledger with ACID transfers       1. Key–Value Store (Redis)\nQ. Ephemeral shopping cart & sub-ms user session token   2. Relational DBMS (PostgreSQL)\nR. 6-hop money-laundering ring detection across accounts 3. Wide-Column Store (Cassandra)\nS. 100,000 writes/sec of smart-grid voltage readings     4. Property Graph DBMS (Neo4j)\n(A) P-2, Q-1, R-4, S-3   (B) P-1, Q-2, R-4, S-3   (C) P-2, Q-4, R-1, S-3   (D) P-3, Q-1, R-4, S-2'
        ] }
      ]
    },
    // Page 19
    {
      blocks: [
        { type: 'h3', text: 'Part F: 5 Viva / Technical Placement Interview Questions' },
        { type: 'list', ordered: true, items: [
          'F1. "Why did E.F. Codd’s Relational Model win over the Network Model even though early 1970s relational prototypes were slower than CODASYL pointer databases?"',
          'F2. "In MongoDB (Document Model), when should you EMBED child objects inside a parent document vs. REFERENCE them by ObjectId?"',
          'F3. "PostgreSQL has JSONB columns and GIN indexes. Does that mean we never need MongoDB?"',
          'F4. "What is the difference between Schema-on-Write (Relational) and Schema-on-Read (Document/Data Lake)?"',
          'F5. "Explain how a Wide-Column database like Cassandra achieves massive write throughput compared to a B+ Tree relational table."'
        ] },
        { type: 'h3', text: 'Part G: 2 Hands-On Modeling & SQL Lab Exercises' },
        { type: 'list', ordered: true, items: [
          'Lab 3.1 (Relational vs. JSONB Hybrid Lab in PostgreSQL): Create a table Course_Catalog that stores core relational fields (CourseID, Title, Credits, DeptID) alongside a JSONB column Metadata holding prerequisites, lab software, and grading weights. Write a SQL query that joins Course_Catalog with Department and filters on a nested JSONB key.',
          'Lab 3.2 (Three-Stage Schema Design Exercise): Take a University Hostel Allotment scenario (Hostel, Room, Student, Warden) and write out (1) the Conceptual Entities & Cardinalities, (2) the Logical Relational Schema with PK/FKs, and (3) the Physical SQL DDL.'
        ] },
        { type: 'h3', text: 'Part H: 3 "Spot the Mistake" Diagnostic Challenges' },
        { type: 'list', ordered: true, items: [
          'Mistake 3.1: A student draws B+ Tree index names and VARCHAR(255) data types inside a Conceptual ER diagram.',
          'Mistake 3.2: A backend developer stores a user’s 500,000 IoT temperature readings as an unbounded embedded array inside a single MongoDB User document.',
          'Mistake 3.3: An architect claims: "Foreign Keys in PostgreSQL store the physical disk sector address of the referenced parent row."'
        ] }
      ]
    },
    // Page 20
    {
      blocks: [
        { type: 'h2', text: '3.8  Chapter 3 Complete Answer Key & Worked Solutions' },
        { type: 'h3', text: 'Solutions to Part A: Multiple-Choice Questions (Q1 to Q10)' },
        { type: 'table', caption: 'Answer Key & Detailed Explanations for Part A MCQs', headers: ['Q#', 'Ans', 'Detailed Step-by-Step Explanation'], rows: [
          ['Q1', '(D)', 'Every formal Data Model consists of 3 parts: Structural, Manipulative, and Integrity Constraints. Network sockets are transport layer protocols.'],
          ['Q2', '(B)', 'The ER/EER model is a High-Level Conceptual Data Model focused on business entities and relationships.'],
          ['Q3', '(B)', 'In a strict tree (Hierarchical Model), every child has at most 1 parent, so M:N relationships cause severe data duplication.'],
          ['Q4', '(C)', 'The Relational Model links tuples purely by value-based Foreign Keys matching Primary Keys—never by physical disk pointers.'],
          ['Q5', '(B)', 'A CODASYL Set links one Owner record occurrence to a ring of Member record occurrences in the Network Model.'],
          ['Q6', '(B)', 'Wide-Column stores (Cassandra/Bigtable) use LSM-Trees and partition keys + clustering timestamps for high-velocity time-series writes.'],
          ['Q7', '(B)', 'Conceptual ER diagrams show M:N directly; Logical Data Modeling decomposes M:N into an associative junction table with Foreign Keys.'],
          ['Q8', '(B)', 'PostgreSQL is the flagship open-source Object-Relational DBMS (ORDBMS).'],
          ['Q9', '(B)', 'Index-Free Adjacency stores direct edge references on each vertex, avoiding O(log N) global index lookups at each hop.'],
          ['Q10', '(C)', 'Exact engine data types (VARCHAR(80)), B+ Tree indexes, and partitioning belong to the Physical Data Model.']
        ] }
      ]
    },
    // Page 21
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part B: Short-Answer Questions (B1 to B5)' },
        { type: 'list', ordered: false, items: [
          'Answer B1 (Data Model & 3 Components): A Data Model is a formal abstraction for describing data. Its three components are: (1) Structural Part (how data is organized, e.g., tables or trees), (2) Manipulative Part (allowed query/update operations), and (3) Integrity Constraints (rules ensuring valid states, such as PK/FK rules).',
          'Answer B2 (Why Relational Won): Hierarchical and Network databases tightly coupled application code to physical pointer chains—if disk structures changed, every program broke. The Relational Model introduced value-based Foreign Keys, mathematical set operations (Relational Algebra), declarative SQL, and complete Physical Data Independence.',
          'Answer B3 (M:N in Hierarchical vs. Network): The Hierarchical Model cannot give a child two parents in a single tree, forcing record duplication under multiple parents (or virtual pointer segments). The Network Model introduces an intersection record type that participates as a member in two Owner–Member sets, avoiding data duplication at the cost of complex circular pointer rings.',
          'Answer B4 (Conceptual vs. Logical vs. Physical): Conceptual models business entities and relationships independent of any DBMS (ER diagram). Logical translates entities into normalized tables, columns, Primary Keys, and Foreign Keys (3NF/BCNF). Physical adds target-DBMS SQL DDL, exact column types, B+ Tree indexes, and partitioning.',
          'Answer B5 (Embed vs. Reference in Document Model): Embed child data inside the parent document when the relationship is 1:1 or bounded 1:Few (e.g., a student’s 2 addresses or 8 semester courses) and both are always fetched together. Reference (normalize into separate collections/tables) when the child array grows unboundedly (1:Millions) or when the child entity is shared and updated independently (M:N).'
        ] }
      ]
    },
    // Page 22
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part C: Long-Answer / Essay Questions (C1 to C3)' },
        { type: 'callout', kind: 'example', title: 'Model Solution C1 | Evolution of Data Models (1960s -> Modern NoSQL)', body: '1. Era 1 — Navigational Pointer Models (1960s–1970s): Hierarchical (IBM IMS) modeled 1:N trees; Network (CODASYL) modeled directed graphs via circular pointer rings. Fast for fixed queries, but zero physical data independence.\n2. Era 2 — Relational & Object-Relational Models (1970–1990s): E.F. Codd’s Relational Model replaced pointers with 2D mathematical relations, Foreign Keys, and declarative SQL. ORDBMS (PostgreSQL, Oracle) added UDTs, Arrays, JSONB, and spatial indexing.\n3. Era 3 — Specialized NoSQL Models (2000s–Present): Document (MongoDB), Key–Value (Redis), Wide-Column (Cassandra), and Graph (Neo4j) complement RDBMSs in polyglot architectures.' },
        { type: 'callout', kind: 'example', title: 'Model Solution C2 & C3 | Hospital 3-Stage Modeling & Food-Delivery Polyglot Architecture', body: 'Hospital 3-Stage Summary (C2):\n• Conceptual: Entities DOCTOR, PATIENT, MEDICINE connected by M:N relationship PRESCRIPTION (with Date, Dosage).\n• Logical: Doctor(DocID PK, Name, Spec), Patient(PatID PK, Name, DOB), Prescription(PrescID PK, DocID FK, PatID FK, IssuedDate), Prescription_Item(PrescID FK, MedID FK, Dosage).\n• Physical: PostgreSQL DDL with TIMESTAMPTZ, Foreign Key ON DELETE RESTRICT, and B+ Tree index on Prescription(PatID, IssuedDate).\n\nFood-Delivery Polyglot Summary (C3):\n• Order Billing & Wallet Payments -> PostgreSQL (ACID transactions).\n• Live Delivery Partner GPS Ping & Surge Cache -> Redis (Key–Value + GeoSpatial).\n• Restaurant Menus with Custom Add-on Modifiers -> MongoDB / PostgreSQL JSONB (Document).\n• Historical Delivery Telemetry & Chat Logs -> Cassandra (Wide-Column).' }
      ]
    },
    // Page 23
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part D: Quantitative & Practical Modeling Problems (D1 to D3)' },
        { type: 'callout', kind: 'example', title: 'Worked Solution D1 | Storage Redundancy: Hierarchical vs. Relational', body: 'Given: 10,000 Students (200 B each), 500 Courses (120 B each), average 6 courses per student (60,000 enrollments; Grade/Link = 20 B).\n(a) Hierarchical Tree (Course as Parent, full 200 B Student + 20 B Grade duplicated under each Course):\n    • Course segments = 500 × 120 B = 60,000 B (0.06 MB).\n    • Duplicated Student child segments = 60,000 enrollments × (200 + 20) B = 13,200,000 B (13.20 MB).\n    • Total Hierarchical Storage = 13,260,000 bytes (13.26 MB).\n\n(b) Normalized Relational Schema (Student stored once, Course stored once, Enrollment stores 20 B link):\n    • Student table = 10,000 × 200 B = 2,000,000 B (2.00 MB).\n    • Course table = 500 × 120 B = 60,000 B (0.06 MB).\n    • Enrollment junction table = 60,000 × 20 B = 1,200,000 B (1.20 MB).\n    • Total Relational Storage = 3,260,000 bytes (3.26 MB) -> Saves 10.0 MB (75.4% storage reduction) and eliminates update anomalies!' },
        { type: 'callout', kind: 'example', title: 'Worked Solution D2 | Graph Index-Free Adjacency vs. Relational B+ Tree Self-Joins', body: 'Given: N = 16,000,000 users (log2 N = 24), degree d = 50, 3-hop paths = d^3 = 125,000.\n• Property Graph (Index-Free Adjacency): Traverses 125,000 direct edge pointers = 1.25 × 10^5 pointer ops.\n• Relational B+ Tree Join: Each lookup across 16M rows performs ~24 key comparisons -> 125,000 × 24 = 3,000,000 comparisons (24× more index traversal work!).' }
      ]
    },
    // Page 24
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part D (D3) and Part E: GATE CS Questions (E1 to E5)' },
        { type: 'code', title: 'Solution D3: Logical Relational Schema & Physical PostgreSQL DDL for Author–Book (M:N)', code: `-- Logical Schema:
-- Author(AuthorID [PK], FullName, ORCID)
-- Book(ISBN [PK], Title, PubYear)
-- Book_Authorship(ISBN [FK], AuthorID [FK], AuthorOrder, RoyaltyPct, PK(ISBN, AuthorID))

CREATE TABLE Author (
    AuthorID SERIAL PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    ORCID    CHAR(19) UNIQUE
);
CREATE TABLE Book (
    ISBN    CHAR(13) PRIMARY KEY,
    Title   VARCHAR(200) NOT NULL,
    PubYear INT CHECK (PubYear >= 1900)
);
CREATE TABLE Book_Authorship (
    ISBN        CHAR(13) REFERENCES Book(ISBN) ON DELETE CASCADE,
    AuthorID    INT REFERENCES Author(AuthorID) ON DELETE RESTRICT,
    AuthorOrder SMALLINT NOT NULL CHECK (AuthorOrder >= 1),
    RoyaltyPct  NUMERIC(5,2) NOT NULL CHECK (RoyaltyPct BETWEEN 0 AND 100),
    PRIMARY KEY (ISBN, AuthorID)
);` },
        { type: 'table', caption: 'Solutions & Derivations for Part E: GATE CS Questions (E1 to E5)', headers: ['GATE Q#', 'Correct Answer', 'Step-by-Step Derivation'], rows: [
          ['E1 (MCQ)', '(C) Relational Model', 'Only the Relational Model represents all relationships purely by matching attribute values (PK = FK) without pointers.'],
          ['E2 (MSQ)', '(A), (B), (D)', '(C) is false: adding a B+ Tree index modifies the Physical/Internal model, not the Conceptual ER model.'],
          ['E3 (NAT)', '5 (or 5.0)', '4,000 students × 5 courses × 250 bytes = 5,000,000 bytes = 5.0 MB.'],
          ['E4 (NAT)', '1.3', 'Student: 4,000 × 250 B = 1,000,000 B (1.0 MB) + Enrollment: 20,000 × 15 B = 300,000 B (0.3 MB) = 1.3 MB total.'],
          ['E5 (MCQ)', '(A) P-2, Q-1, R-4, S-3', 'Banking Ledger -> Relational (2); Session Token -> Key–Value (1); 6-hop Fraud -> Graph (4); IoT Time-Series -> Wide-Column (3).']
        ] }
      ]
    },
    // Page 25
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part F: Viva & Technical Placement Interview Questions (F1 to F5)' },
        { type: 'list', ordered: false, items: [
          'Answer F1 (Why Relational Beat CODASYL Despite Early Speed): In the 1970s, hardware became cheaper while software engineering labor became the dominant cost. CODASYL databases required weeks of manual C/COBOL pointer rewriting whenever business requirements changed. As Cost-Based Query Optimizers (IBM System R) and B+ Tree indexes matured, Relational databases matched navigational speed while giving 10× higher developer productivity and Physical Data Independence.',
          'Answer F2 (MongoDB Embed vs. Reference Rule of Thumb): Embed when the child data is owned exclusively by the parent (1:1 or 1:Few, e.g., < 50 sub-items), read together 95% of the time, and rarely updated independently. Reference by ID when the relationship is 1:Many (unbounded growth, e.g., comments or sensor logs) or M:N where independent updates would otherwise require rewriting thousands of documents.',
          'Answer F3 (PostgreSQL JSONB vs. Dedicated MongoDB): For 90% of startups and enterprise apps, PostgreSQL + JSONB is superior because you get ACID relational joins AND indexed semi-structured documents in one system. Dedicated MongoDB shines primarily when your entire application is document-centric and requires built-in horizontal auto-sharding across dozens of write nodes.',
          'Answer F4 (Schema-on-Write vs. Schema-on-Read): Schema-on-Write (RDBMS) validates every tuple against a strict catalog schema before writing bytes to disk—guaranteeing clean data quality. Schema-on-Read (Document DBs / Data Lakes) accepts arbitrary JSON/files on ingest and interprets structure when the application reads it—faster initial prototyping, but requires defensive validation in application code.',
          'Answer F5 (Why Cassandra Writes So Fast): Whereas a B+ Tree updates existing disk pages in place (random disk I/O), Cassandra uses an LSM-Tree (Log-Structured Merge-Tree): every write is appended sequentially to an on-disk CommitLog and inserted into an in-memory Memtable, later flushed sequentially as immutable SSTables.'
        ] }
      ]
    },
    // Page 26
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part G (Labs 3.1–3.2) & Part H ("Spot the Mistake" 3.1–3.3)' },
        { type: 'code', title: 'Solution Lab 3.1: Hybrid Relational + JSONB Catalog Query in PostgreSQL', code: `CREATE TABLE Course_Catalog (
    CourseID VARCHAR(10) PRIMARY KEY,
    Title    VARCHAR(100) NOT NULL,
    Credits  INT NOT NULL,
    DeptID   INT REFERENCES Department(DeptID),
    Metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_course_meta_gin ON Course_Catalog USING GIN (Metadata);

SELECT c.CourseID, c.Title, d.DeptName, c.Metadata->>'labSoftware' AS LabTool
FROM Course_Catalog c
JOIN Department d ON c.DeptID = d.DeptID
WHERE c.Metadata @> '{"hasLab": true}';` },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solutions 3.1, 3.2, and 3.3', body: '• Mistake 3.1 (Physical Details in Conceptual ER): B+ Tree index names and VARCHAR(255) belong to the Physical Data Model, never the Conceptual ER model.\n• Mistake 3.2 (Unbounded Array Anti-Pattern in MongoDB): MongoDB enforces a hard 16 MB limit per BSON document, and appending 500,000 items forces constant document reallocation on disk. Unbounded time-series must be stored as separate documents (or in a Wide-Column/Time-Series DB).\n• Mistake 3.3 (Foreign Keys Are Values, Not Pointers): A Foreign Key in a Relational DBMS stores the logical Primary Key value (e.g., DeptID = 10), never a physical disk sector address!' },
        { type: 'callout', kind: 'concept', title: 'END OF CHAPTER 3 | Up Next: Chapter 4 — Entity-Relationship (ER) and Enhanced ER (EER) Modeling', body: 'In Chapter 4, we master Chen and Crow’s Foot ER diagrams, weak entities, EER specialization/generalization/aggregation, the complete 9-step ER-to-Relational mapping algorithm, and the GATE CS formula for finding the minimum number of tables!' }
      ]
    }
  ]
};

export const CHAPTER_04 = {
  number: 4,
  fileName: 'dbms-chapter-04.pdf',
  downloadName: 'DBMS-Chapter-04-ER-EER-Modeling.pdf',
  partLabel: 'PART I: DATABASE FOUNDATIONS',
  headerPart: 'PART I: FOUNDATIONS',
  title: 'Entity-Relationship (ER) and Enhanced ER (EER) Modeling',
  themeColor: '#1f4e78',
  themeLight: '#dbe8f5',
  themeBorder: '#6c9ac3',
  pageCount: 32,
  whyThisMatters: 'Before a civil engineer pours concrete for a bridge, they draw a precise structural blueprint. In database engineering, the Entity-Relationship (ER) and Enhanced ER (EER) diagrams are that blueprint—and converting an ER diagram into the minimum number of relational tables is one of the highest-weight topics in GATE CS, university exams, and backend system design interviews.',
  prerequisites: 'Chapters 1–3 (Schemas, Instances, Data Models, and Conceptual vs. Logical Modeling).',
  objectives: [
    'Distinguish between Entity, Entity Type, and Entity Set, and classify attributes across all 8 categories (Simple, Composite, Single-Valued, Multi-Valued, Stored, Derived, Key, and Complex Nested).',
    'Model Unary (Recursive), Binary, and Ternary relationships, prove why a Ternary relationship is NOT equivalent to three Binary relationships, and specify Cardinality Ratios (1:1, 1:N, M:N) and Participation Constraints (Total vs. Partial / (min, max)).',
    'Design Weak Entity Sets with Identifying Relationships, Partial Keys (Discriminators), and multi-level weak entity chains.',
    'Master Enhanced ER (EER) constructs: Superclass/Subclass Specialization & Generalization (Disjoint vs. Overlapping, Total vs. Partial), Attribute/Relationship Inheritance, and Aggregation.',
    'Execute the complete 9-Step Algorithm for mapping ER and EER diagrams into Relational Schemas (including Options 8A–8D for subclasses).',
    'Solve GATE CS problems asking for the exact minimum number of relational tables required for any ER diagram (both with NULLs allowed and with zero NULLs allowed).'
  ],
  toc: [
    ['4', 'Entity-Relationship (ER) and Enhanced ER (EER) Modeling', '1', true],
    ['4.1', 'Entities, Entity Sets, and the Complete Attribute Taxonomy', '3'],
    ['4.1.1', 'Entity vs. Entity Type vs. Entity Set', '3', false, true],
    ['4.1.2', 'Complete Taxonomy of Attributes (Table 4.1 & Chen Symbols)', '3', false, true],
    ['4.1.3', 'Worked Example 4.1: Classifying Attributes of UniVerseDB Student', '4', false, true],
    ['4.2', 'Relationships, Degree, Roles, Cardinality, and Participation', '5'],
    ['4.2.1', 'Degree of a Relationship: Unary (Recursive), Binary, and Ternary', '5', false, true],
    ['4.2.2', 'Worked Example 4.2: Proof That a Ternary Relationship != 3 Binary Relationships', '6', false, true],
    ['4.2.3', 'Cardinality Ratios (1:1, 1:N, N:1, M:N) & Participation (Total vs. Partial / (min,max))', '7', false, true],
    ['4.3', 'Weak Entity Sets, Identifying Relationships, and Partial Keys', '8'],
    ['4.3.1', 'Four Mandatory Properties of a Weak Entity Set', '8', false, true],
    ['4.3.2', 'Worked Example 4.3: Multi-Level Weak Entity Chains (BUILDING -> LAB_ROOM -> WORKSTATION)', '9', false, true],
    ['4.4', 'Enhanced ER (EER): Specialization, Generalization, and Aggregation', '10'],
    ['4.4.1', 'Disjoint (d) vs. Overlapping (o) & Total vs. Partial Specialization', '10', false, true],
    ['4.4.2', 'Aggregation: Treating a Relationship Set as a Higher-Level Entity', '11', false, true],
    ['4.5', 'Complete 9-Step Algorithm for ER- and EER-to-Relational Mapping', '12'],
    ['4.6', 'GATE CS Masterclass: Minimum Number of Relational Tables for Any ER Diagram', '15'],
    ['4.6.1', 'Worked Examples 4.4A, 4.4B & 4.5 (Minimum Tables & Options 8A–8D)', '16', false, true],
    ['4.7', 'End-to-End Design Walkthroughs & Notation Comparison (Chen vs. Crow’s Foot)', '18'],
    ['4.8', 'Chapter 4 Summary & One-Page Rapid-Revision Cheat Sheet', '20'],
    ['4.9', 'Chapter 4 Exam, GATE & Placement Question Bank (Parts A–H)', '22'],
    ['4.10', 'Chapter 4 Complete Answer Key & Worked Solutions', '26']
  ],
  pages: [
    // Page 3
    {
      blocks: [
        { type: 'h2', text: '4.1  Entities, Entity Sets, and the Complete Attribute Taxonomy' },
        { type: 'p', text: 'Introduced by Peter Chen in 1976, the Entity-Relationship (ER) model describes the mini-world as a collection of Entities (things), Attributes (properties), and Relationships (associations).' },
        { type: 'h3', text: '4.1.1  Entity vs. Entity Type vs. Entity Set' },
        { type: 'list', ordered: true, items: [
          'Entity (Instance): A specific, distinguishable real-world object with an independent physical or conceptual existence (e.g., student Asha with Roll No 101, or course CS301 Database Systems).',
          'Entity Type (Intension / Schema): A category or template defining a collection of entities that share the same attributes (e.g., STUDENT(StudentID, Name, DOB, Phone)). Drawn as a rectangle in Chen notation.',
          'Entity Set (Extension / State): The actual set of all entity instances of a given Entity Type present in the database at time t.'
        ] },
        { type: 'h3', text: '4.1.2  Complete Taxonomy of Attributes' },
        { type: 'table', caption: 'Table 4.1: Complete Taxonomy of ER Attributes, Chen Notation, and Relational Mapping', headers: ['Attribute Type', 'Definition & UniVerseDB Example', 'Chen ER Symbol', 'Relational Mapping Rule'], rows: [
          ['Simple (Atomic)', 'Cannot be subdivided further (e.g., CGPA, Gender, Credits).', 'Single Oval', 'Becomes 1 standard column.'],
          ['Composite', 'Can be divided into smaller sub-parts with independent meaning (e.g., Name -> FirstName, LastName).', 'Oval branching into component Ovals', 'Flatten into separate atomic columns (no composite column).'],
          ['Single-Valued', 'Holds at most one value for a given entity (e.g., StudentID, DOB).', 'Single Oval', 'Standard column in the entity’s table.'],
          ['Multi-Valued', 'Can hold multiple values for a single entity (e.g., {PhoneNumbers}, {EmailIDs}).', 'Double-Line Oval', 'MUST create a separate table with (EntityPK + Attribute) as composite PK!'],
          ['Stored vs. Derived', 'Stored = DOB on disk; Derived = Age computed on the fly from CurrentDate − DOB.', 'Dashed Oval (Derived)', 'Store only Stored attribute; compute Derived in View/Query.'],
          ['Key Attribute', 'Minimal attribute (or set) whose value uniquely identifies each entity in the Entity Set.', 'Oval with Underlined text', 'Becomes PRIMARY KEY (or UNIQUE NOT NULL).'],
          ['Complex (Nested)', 'Arbitrary nesting of Composite (...) and Multi-Valued {...} (e.g., {Address(Street, City, {Phones})}).', 'Nested Double & Branching Ovals', 'Decompose into separate normalized relation(s) or JSONB.']
        ] }
      ]
    },
    // Page 4
    {
      blocks: [
        { type: 'diagram', caption: 'Figure 4.1 & 4.2: Dictionary of Chen ER Diagram Symbols and Complete STUDENT — ENROLLS — COURSE Diagram.', rows: [
          ['Strong Entity: [ Single Rectangle ]', 'Weak Entity: [[ Double Rectangle ]]', 'Relationship: < Single Diamond >', 'Identifying Rel: << Double Diamond >>'],
          ['Simple Attr: ( Single Oval )', 'Key Attr: ( _Underlined_ )', 'Partial Key: ( -Dashed Underline- )', 'Multi-Valued: (( Double Oval )) | Derived: (: Dashed Oval :)'],
          ['Partial Participation: ---- Single Line ----', 'Total Participation (Existence Dependency): ==== Double Line ====', '1:N Cardinality: ---1--- <REL> ---N---', '(min, max) Structural Constraint: (1, 1) ... (0, N)']
        ] },
        { type: 'h3', text: '4.1.3  Worked Example 4.1: Classifying Attributes & Complex Nesting in UniVerseDB' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 4.1 | Decomposing a Student Entity with All 8 Attribute Types', body: 'Consider the entity notation for STUDENT:\nSTUDENT( _StudentID_, _AadhaarNo_, Name(FirstName, MiddleName, LastName), DOB, *Age*, {Phone}, {Internship(Company, City, {TechStack})} )\n\n• Key Attributes (2 Candidate Keys): StudentID and AadhaarNo (each underlined separately!).\n• Composite Attribute: Name (flattened into FirstName, MiddleName, LastName in the Student table).\n• Stored vs. Derived: DOB is Stored; *Age* is Derived (dashed oval, not stored as a mutable column).\n• Multi-Valued Attribute: {Phone} -> Mapped to a separate table Student_Phone(StudentID FK, Phone, PRIMARY KEY(StudentID, Phone)).\n• Complex Attribute: {Internship(Company, City, {TechStack})} combines multi-valued {...} and composite (...) -> Mapped to separate child tables!' },
        { type: 'callout', kind: 'mistake', title: 'COMMON MISTAKE | Two Separate Underlines vs. One Shared Composite Underline', body: 'If an entity has TWO separate underlined ovals (_StudentID_ and _Email_), it has TWO distinct Candidate Keys. If it has a composite key (e.g., _CourseID_ + _SectionNo_), both components share a single composite primary key!' }
      ]
    },
    // Page 5
    {
      blocks: [
        { type: 'h2', text: '4.2  Relationships, Degree, Roles, Cardinality, and Participation' },
        { type: 'h3', text: '4.2.1  Degree of a Relationship: Unary (Recursive), Binary, and Ternary' },
        { type: 'p', text: 'The degree of a relationship type is the number of participating entity types:' },
        { type: 'list', ordered: true, items: [
          'Unary (Recursive) Relationship (Degree = 1): Connects instances of the SAME entity set in distinct Role Names. Examples: STUDENT —< MENTORS >— STUDENT (with roles Senior_Mentor and Junior_Mentee, 1:N) or COURSE —< PREREQUISITE_OF >— COURSE (with roles PrereqCourse and AdvancedCourse, M:N). Role labels on the connecting lines are mandatory in Unary relationships!',
          'Binary Relationship (Degree = 2): Connects two entity sets (the most common case, e.g., DEPARTMENT —< EMPLOYS >— FACULTY).',
          'Ternary Relationship (Degree = 3): Simultaneously connects three entity sets in a single atomic fact—for example, SUPPLIER, PART, and PROJECT linked by < SUPPLIES(Quantity) >, recording that Supplier s supplies Part p to Project j.'
        ] },
        { type: 'diagram', caption: 'Figure 4.3: Unary (Recursive with Role Labels), Binary, and Ternary Relationship Diagrams.', rows: [
          ['UNARY (Degree 1)', '[COURSE] ---(Role: Prereq)--- < IS_PREREQ_FOR (M:N) > ---(Role: TargetCourse)--- [COURSE]'],
          ['BINARY (Degree 2)', '[DEPARTMENT] ====(1)==== < OFFERS > ----(N)---- [COURSE]'],
          ['TERNARY (Degree 3)', '[INSTRUCTOR] ---- < TEACHES_IN_SEMESTER > ---- [COURSE]   (with 3rd leg connected to [SEMESTER])']
        ] }
      ]
    },
    // Page 6
    {
      blocks: [
        { type: 'h3', text: '4.2.2  Worked Example 4.2: Proof That a Ternary Relationship != Three Binary Relationships' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 4.2 | Counterexample Proof (Spurious Tuple Generation)', body: 'Suppose we want to record which Instructor teaches which Course in which Semester: Ternary relation TEACHES(Instructor, Course, Semester).\nCan we replace TEACHES with three binary relationships: CAN_TEACH(Instructor, Course), OFFERED_IN(Course, Semester), and ACTIVE_IN(Instructor, Semester)?\n\nProof by Counterexample:\nSuppose our true real-world facts in TEACHES are only TWO tuples:\n• Fact 1: (Prof. Sharma, CS301, Fall_2026)\n• Fact 2: (Prof. Verma, CS301, Spring_2027)\n• Fact 3: (Prof. Sharma, CS201, Spring_2027)\n\nIf we decompose into the three binary tables:\n• CAN_TEACH contains (Prof. Sharma, CS301), (Prof. Verma, CS301), (Prof. Sharma, CS201).\n• OFFERED_IN contains (CS301, Fall_2026), (CS301, Spring_2027), (CS201, Spring_2027).\n• ACTIVE_IN contains (Prof. Sharma, Fall_2026), (Prof. Verma, Spring_2027), (Prof. Sharma, Spring_2027).\n\nNow take the Natural Join CAN_TEACH ⋈ OFFERED_IN ⋈ ACTIVE_IN:\nBecause (Prof. Sharma, CS301) ∈ CAN_TEACH, (CS301, Spring_2027) ∈ OFFERED_IN, and (Prof. Sharma, Spring_2027) ∈ ACTIVE_IN, the join produces the SPURIOUS (FALSE) TUPLE:\n   (Prof. Sharma, CS301, Spring_2027) — even though Prof. Verma taught CS301 in Spring_2027!\nTherefore, a Ternary relationship carries joint 3-way information that CANNOT be reconstructed losslessly from three binary relationships!' }
      ]
    },
    // Page 7
    {
      blocks: [
        { type: 'h3', text: '4.2.3  Cardinality Ratios & Participation Constraints (Total vs. Partial / (min, max))' },
        { type: 'p', text: 'Structural constraints on a relationship combine two orthogonal rules:' },
        { type: 'list', ordered: true, items: [
          'Cardinality Ratio (Maximum Participation — 1:1, 1:N, N:1, M:N): Specifies the maximum number of relationship instances an entity can participate in. For example, DEPARTMENT (1) —< HAS_HOD >— (1) FACULTY is 1:1; DEPARTMENT (1) —< EMPLOYS >— (N) FACULTY is 1:N; STUDENT (M) —< ENROLLS >— (N) COURSE is M:N.',
          'Participation Constraint (Minimum Participation — Total vs. Partial): Specifies whether the existence of an entity depends on its being related to another entity via the relationship:\n• Total Participation (Mandatory, min >= 1, drawn as a DOUBLE LINE ====): Every entity in the set MUST participate in at least one relationship instance (e.g., every COURSE must be offered by a DEPARTMENT).\n• Partial Participation (Optional, min = 0, drawn as a SINGLE LINE ----): Some entities may not participate (e.g., not every FACULTY member is a Head of Department).'
        ] },
        { type: 'callout', kind: 'exam', title: 'EXAM TRAP | Reversal of Sides Between 1:N Chen Labels and (min, max) Notation!', body: 'In standard (min, max) notation placed on the line attached to Entity E, (min, max) states how many relationship instances EACH instance of E participates in:\n• In DEPARTMENT (1) ==== <OFFERS> ---- (N) COURSE:\n  - Each DEPARTMENT offers at least 1 and at most N courses -> label on DEPARTMENT side is (1, N).\n  - Each COURSE belongs to exactly 1 department -> label on COURSE side is (1, 1)!\nNotice that the max values (N and 1) appear on the OPPOSITE sides compared to traditional 1:N labels!' }
      ]
    },
    // Page 8
    {
      blocks: [
        { type: 'h2', text: '4.3  Weak Entity Sets, Identifying Relationships, and Partial Keys' },
        { type: 'p', text: 'Not every entity has its own globally unique Primary Key. Consider a Course SECTION (Section 1, Section 2) or a Hostel ROOM (Room 101): "Section 1" means nothing unless you know whether it is Section 1 of CS301 or Section 1 of EC204!' },
        { type: 'h3', text: '4.3.1  Four Mandatory Properties of a Weak Entity Set' },
        { type: 'list', ordered: true, items: [
          'No Primary Key of Its Own: A Weak Entity Set (drawn as a double rectangle [[ SECTION ]]) lacks sufficient attributes to form a globally unique primary key.',
          'Owner (Identifying) Strong Entity Set: It exists only in relation to an Identifying Owner Entity Set (e.g., [ COURSE ]) via an Identifying Relationship (drawn as a double diamond << HAS_SECTION >>).',
          'Always Total Participation & 1:N (or 1:1) from Owner: The Weak Entity Set ALWAYS has Total Participation (double line ====) in its identifying relationship because a weak entity cannot exist without its owner (Existence Dependency).',
          'Partial Key (Discriminator): A Weak Entity Set has a Partial Key (drawn with a dashed underline, e.g., -SecNo- and -Semester-) that uniquely distinguishes weak entities belonging to the SAME owner. Its full relational Primary Key is:',
        ] },
        { type: 'diagram', caption: 'Figure 4.4: Weak Entity Set [[SECTION]] identified by Owner Entity [COURSE] via Identifying Relationship <<HAS_SECTION>>.', rows: [
          ['[ COURSE ] (PK: _CourseID_, Title, Credits)', '---(1)--- << HAS_SECTION >> ===(N)===', '[[ SECTION ]] (Partial Key: -SecNo-, -SemYear-, Classroom)'],
          ['Relational Mapping of Weak Entity:', 'Section( _CourseID_ [FK -> Course ON DELETE CASCADE], _SecNo_, _SemYear_, Classroom )', 'Composite Primary Key = Owner PK (CourseID) + Weak Partial Key (SecNo, SemYear)!']
        ] }
      ]
    },
    // Page 9
    {
      blocks: [
        { type: 'h3', text: '4.3.2  Worked Example 4.3: Multi-Level Weak Entity Chains' },
        { type: 'p', text: 'Can the owner of a Weak Entity Set itself be another Weak Entity Set? Yes! In a multi-level weak entity chain, primary keys propagate cumulatively down the chain:' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 4.3 | Propagating Keys Across BUILDING -> LAB_ROOM -> WORKSTATION', body: 'Suppose a campus tracks computer workstations:\n1. Strong Entity: [ BUILDING ] with Primary Key _BldgCode_ (e.g., "TB" for Turing Block) and attribute BldgName.\n2. Level-1 Weak Entity: [[ LAB_ROOM ]] identified by BUILDING with Partial Key -RoomNo- (e.g., "204") and Capacity.\n   -> Relational Table: Lab_Room( _BldgCode_ [FK], _RoomNo_, Capacity ) — Composite PK = (BldgCode, RoomNo).\n3. Level-2 Weak Entity: [[ WORKSTATION ]] identified by LAB_ROOM with Partial Key -SeatNo- (e.g., 12) and GPUModel.\n   -> Relational Table: Workstation( _BldgCode_, _RoomNo_, _SeatNo_, GPUModel )\n   -> Foreign Key: (BldgCode, RoomNo) REFERENCES Lab_Room(BldgCode, RoomNo) ON DELETE CASCADE\n   -> Composite Primary Key = (BldgCode, RoomNo, SeatNo)!' },
        { type: 'callout', kind: 'exam', title: 'EXAM CHECKPOINT | Does an Identifying Relationship Ever Become a Separate Table?', body: 'NO! Because the Weak Entity Set has Total Participation (1:N) with its Owner and already incorporates the Owner’s Primary Key into its own Primary Key, the Identifying Relationship <<HAS_SECTION>> is merged 100% into the Weak Entity table. It NEVER produces a separate relational table!' }
      ]
    },
    // Page 10
    {
      blocks: [
        { type: 'h2', text: '4.4  Enhanced ER (EER): Specialization, Generalization, and Aggregation' },
        { type: 'p', text: 'As enterprise schemas grew more complex, the Enhanced Entity-Relationship (EER) model extended Chen’s ER model with Object-Oriented Superclass/Subclass hierarchies (IS-A relationships) and Aggregation:' },
        { type: 'h3', text: '4.4.1  Specialization vs. Generalization & The Four Constraint Combinations' },
        { type: 'list', ordered: false, items: [
          'Top-Down Specialization vs. Bottom-Up Generalization: Specialization splits a high-level Superclass (e.g., PERSON) top-down into specialized Subclasses (STUDENT, FACULTY, ALUMNI) based on distinguishing attributes/relationships. Generalization synthesizes shared attributes from multiple low-level entity sets bottom-up into a single Superclass. Both yield the exact same EER IS-A diagram and inherit all attributes and relationships of the Superclass!',
          'Constraint 1 — Disjoint (d) vs. Overlapping (o): Written inside the specialization circle.\n• Disjoint (d): An entity instance can belong to AT MOST ONE subclass (e.g., an ACCOUNT is either SAVINGS_ACCOUNT or CURRENT_ACCOUNT, never both).\n• Overlapping (o): An entity instance can belong to MULTIPLE subclasses simultaneously (e.g., a university PERSON can be both a PhD STUDENT and a Teaching FACULTY member).',
          'Constraint 2 — Total (Double Line) vs. Partial (Single Line) Specialization:\n• Total: Every superclass entity MUST belong to at least one subclass (drawn as a double line from Superclass to the circle).\n• Partial: A superclass entity may belong to none of the subclasses (single line).'
        ] },
        { type: 'diagram', caption: 'Figure 4.5: EER Specialization/Generalization Lattice showing Overlapping Total (o, ====) and Disjoint Partial (d, ----) constraints.', rows: [
          ['Superclass: [ PERSON ] (_PersonID_, Name, DOB)', '==== (Double Line: Total) ====>  ( o )  [Overlapping Circle]', 'Subclasses: [ STUDENT (CGPA) ]   and   [ EMPLOYEE (Salary) ]'],
          ['Subclass [ EMPLOYEE ] specializes further:', '---- (Single Line: Partial) ---->  ( d )  [Disjoint Circle]', 'Subclasses: [ FACULTY (ResearchArea) ]  or  [ ADMIN_STAFF (Shift) ]']
        ] }
      ]
    },
    // Page 11
    {
      blocks: [
        { type: 'h3', text: '4.4.2  Aggregation: Treating a Relationship Set as a Higher-Level Entity' },
        { type: 'p', text: 'In standard ER modeling, a diamond (Relationship) can connect Entity rectangles, but you are NEVER allowed to draw a line directly from one diamond to another diamond! What if a corporate SPONSOR funds a specific RESEARCH_MENTORSHIP pair between a FACULTY member and a STUDENT?' },
        { type: 'callout', kind: 'concept', title: 'CONCEPT | Aggregation Abstracts a Relationship into a Higher-Level Composite Entity', body: 'Aggregation draws a dashed/outer bounding box around the entire [FACULTY] — <MENTORS> — [STUDENT] relationship, treating that active mentorship pair as a single higher-level aggregate entity [RESEARCH_MENTORSHIP] that can then participate in the relationship <FUNDS> with [SPONSOR]!' },
        { type: 'diagram', caption: 'Figure 4.6: EER Aggregation modeling a SPONSOR funding a (FACULTY — MENTORS — STUDENT) mentorship.', rows: [
          ['AGGREGATED BOX: [  [FACULTY (_FacID_)] ----(M)---- < MENTORS (ProjectTitle) > ----(N)---- [STUDENT (_StudentID_)]  ]', ''],
          ['         |', ''],
          ['    < FUNDS (GrantAmount) >  ----(N : M)----  [ SPONSOR (_SponsorID_, OrgName) ]', ''],
          ['Relational Mapping of Aggregation:', '1. Mentorship( _FacID_, _StudentID_, ProjectTitle )   2. Funding( _FacID_, _StudentID_, _SponsorID_, GrantAmount )']
        ] }
      ]
    },
    // Page 12
    {
      blocks: [
        { type: 'h2', text: '4.5  Complete 9-Step Algorithm for ER- and EER-to-Relational Mapping' },
        { type: 'p', text: 'Every conceptual ER/EER diagram is converted into a logical Relational Schema using this deterministic 9-Step Algorithm (Elmasri & Navathe standard):' },
        { type: 'list', ordered: true, items: [
          'Step 1 — Mapping Strong Entity Types: For each strong entity type E, create a relation R containing all simple attributes and the flattened simple components of any composite attributes. Choose one Candidate Key as the Primary Key.',
          'Step 2 — Mapping Weak Entity Types: For each weak entity type W owned by E, create a relation R that includes all simple attributes of W plus the Primary Key of owner E (as a Foreign Key with ON DELETE CASCADE). The Primary Key of R is the combination (PK of E + Partial Key of W). The identifying relationship is absorbed here.',
          'Step 3 — Mapping Binary 1:1 Relationship Types: Given S —(1:1)— T:\n• Foreign Key Approach (Preferred): Include the PK of one relation as a Foreign Key in the other. Always place the FK on the side with TOTAL participation so it is never NULL! If both sides have Total participation, you may merge S and T into a single table.\n• Cross-Reference (3-Table) Approach: Only if both sides are Partial and rarely participate.',
          'Step 4 — Mapping Binary 1:N Relationship Types: Given S (1-side) —< R >— T (N-side), place the Primary Key of the 1-side (S) as a Foreign Key inside the N-side table (T), along with any relationship attributes of R. Why never put the FK on the 1-side? Because putting the N-side PK into the 1-side table would require storing multiple values in a single cell (violating 1NF)!'
        ] }
      ]
    },
    // Page 13
    {
      blocks: [
        { type: 'h3', text: 'Steps 5 to 9 of the ER/EER-to-Relational Mapping Algorithm' },
        { type: 'list', ordered: false, items: [
          '5. Step 5 — Mapping Binary M:N Relationship Types: For each M:N relationship R between S and T, you MUST create a separate associative Junction Relation R_tbl containing the Primary Keys of S and T (as Foreign Keys) plus any attributes of R. The composite Primary Key of R_tbl is (PK_S, PK_T).',
          '6. Step 6 — Mapping Multi-Valued Attributes: For each multi-valued attribute A (double oval) of entity E, create a separate relation R_A with attributes (PK_E [FK], A). The Primary Key is the combination (PK_E, A) (or PK_E + partial key of A).',
          '7. Step 7 — Mapping n-ary (Ternary, Degree >= 3) Relationship Types: Create a separate relation R_n containing the Primary Keys of all n participating entity types as Foreign Keys. The Primary Key is typically the combination of all n Foreign Keys (unless one participating entity has cardinality 1, in which case the remaining n−1 FKs form the PK).',
          '8. Step 8 — Mapping EER Specialization / Generalization (Four Options 8A–8D):\n• Option 8A (Multiple Relations — Superclass + Subclasses): Create a table for Superclass C(k, a1, a2) and a table for each Subclass Si(k [PK/FK], specific_attrs). Works for ANY constraint (Disjoint/Overlapping, Total/Partial)!\n• Option 8B (Multiple Relations — Subclass Tables Only): Create tables ONLY for the Subclasses Si(k, a1, a2, specific_attrs). Valid ONLY when specialization is TOTAL (otherwise entities not in any subclass are lost!), and best when DISJOINT (if overlapping, superclass attributes are duplicated).\n• Option 8C (Single Relation with One Type/Discriminator Attribute): Merge Superclass + all Subclasses into one table C(k, a1, a2, TypeFlag, sub1_attrs, sub2_attrs). Best for DISJOINT subclasses, though introduces NULLs in inapplicable subclass columns.\n• Option 8D (Single Relation with Multiple Boolean Flag Attributes): One table C(k, a1, a2, Is_Sub1 BOOL, sub1_attrs, Is_Sub2 BOOL, sub2_attrs). Used for OVERLAPPING subclasses.',
          '9. Step 9 — Mapping EER Aggregation: Map the inner relationship as usual (e.g., M:N table), and then map the outer relationship using the Primary Key of the inner relationship table as a Foreign Key!'
        ] }
      ]
    },
    // Page 14
    {
      blocks: [
        { type: 'h2', text: '4.6  GATE CS Masterclass: Finding the Minimum Number of Relational Tables' },
        { type: 'p', text: 'One of the most famous GATE CS question types gives an ER diagram with entities, cardinalities, and participation lines and asks: "What is the minimum number of relational tables required to represent this ER diagram in 3NF/BCNF?" Always check whether NULLs are allowed in Foreign Keys!' },
        { type: 'table', caption: 'GATE CS Master Formula Sheet: Minimum Number of Relational Tables for Binary Relationships', headers: ['Relationship Cardinality & Participation', 'Min Tables (NULLs Allowed in FKs)', 'Min Tables (NO NULLs Allowed in Any Table)', 'How Tables Are Merged'], rows: [
          ['M : N (Any Participation — Partial or Total)', '3 tables: E1, E2, R(k1, k2)', '3 tables: E1, E2, R(k1, k2)', 'M:N relationship R can NEVER be merged into E1 or E2 without repeating groups.'],
          ['1 : N with Total Participation on N-side (E1 —1— <R> ===N=== E2)', '2 tables: E1, and (E2 ∪ R)', '2 tables: E1, and (E2 ∪ R)', 'Put k1 into E2. Since E2 is Total, k1 is NEVER NULL in E2!'],
          ['1 : N with Partial Participation on N-side (E1 —1— <R> ---N--- E2)', '2 tables: E1, and (E2 ∪ R) [k1 can be NULL]', '3 tables: E1, E2, and R(k2 [PK], k1)', 'If NULLs are forbidden, unlinked E2 rows cannot hold NULL k1, requiring a 3rd table R!'],
          ['1 : 1 with Both Sides Partial (E1 ---1--- <R> ---1--- E2)', '2 tables: E1, and (E2 ∪ R)', '3 tables: E1, E2, and R', 'With NULLs allowed, fold R into either E1 or E2.'],
          ['1 : 1 with One Side Total (E1 ---1--- <R> ===1=== E2)', '2 tables (or 1 if NULLs allowed for E1-only)', '2 tables: E1, and (E2 ∪ R)', 'Fold R into the Total side E2 (k1 is never NULL in E2).'],
          ['1 : 1 with Both Sides Total (E1 ===1=== <R> ===1=== E2)', '1 single merged table (E1 ∪ E2 ∪ R)', '1 single merged table (E1 ∪ E2 ∪ R)', 'Every E1 has 1 E2 and vice versa -> 1 table with 0 NULLs!']
        ] },
        { type: 'callout', kind: 'exam', title: 'PLUS: Multi-Valued Attribute & Weak Entity Rules in GATE Table Counting', body: '• Every Multi-Valued Attribute ((A)) ALWAYS adds +1 separate table!\n• Every Weak Entity [[W]] + its Identifying Relationship <<R>> together count as 1 table (never 2!).' }
      ]
    },
    // Page 15
    {
      blocks: [
        { type: 'h3', text: '4.6.1  Worked Examples 4.4A, 4.4B & 4.5: Solving GATE Table-Counting Problems' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 4.4A | Finding Minimum Tables (With NULLs Allowed)', body: 'Problem: An ER diagram has 4 Entity Sets E1, E2, E3, E4 and 4 Relationships:\n• R1 between E1 and E2 is 1 : N (E2 on N-side, Partial).\n• R2 between E1 and E3 is M : N.\n• R3 between E2 and E4 is 1 : 1 (Total on both E2 and E4).\n• E3 has one multi-valued attribute ((Phone)).\nFind the minimum number of relational tables (assuming NULLs are allowed in Foreign Keys).\n\nStep-by-Step Solution:\n1. Start with 4 entities: E1, E2, E3, E4.\n2. R3 is 1:1 Total on BOTH E2 and E4 -> Merge E2, E4, and R3 into 1 single table E2_E4!\n3. R1 is 1:N between E1 and E2 -> Absorb R1’s foreign key (PK of E1) into the N-side table E2_E4 (adds 0 new tables).\n4. R2 is M:N between E1 and E3 -> Must create +1 separate junction table R2_tbl.\n5. Multi-valued attribute ((Phone)) on E3 -> Must create +1 separate table E3_Phone.\nTotal Minimum Tables = { E1, E2_E4_R1_R3, E3, R2_tbl, E3_Phone } = 5 tables!' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 4.4B | What If ZERO NULLs Are Allowed in Example 4.4A?', body: 'If NULL values are strictly forbidden in all tables: because R1 (1:N) has PARTIAL participation on the N-side (E2), absorbing R1 into E2_E4 would cause NULLs for E2 rows not linked to E1. Thus R1 requires its own table (+1), and merging E2+E4 works only if every E2 has an E4 (which is true since R3 is Total on both). Total = 6 tables!' }
      ]
    },
    // Page 16
    {
      blocks: [
        { type: 'h3', text: '4.6.2  Worked Example 4.5: Comparing EER Subclass Mapping Options 8A–8D' },
        { type: 'table', caption: 'Comparing Options 8A, 8B, 8C, and 8D on PERSON(PersonID, Name) -> STUDENT(CGPA) & FACULTY(Salary)', headers: ['Mapping Option', 'Resulting Relational Tables', 'Pros, Cons & When Valid'], rows: [
          ['Option 8A (Superclass + Subclass Tables)', 'Person(PersonID PK, Name)\nStudent(PersonID PK/FK, CGPA)\nFaculty(PersonID PK/FK, Salary)', '3 tables. Zero NULLs, zero attribute duplication. Works for ALL 4 constraints (d/o, Total/Partial). Requires a JOIN to fetch Name + CGPA.'],
          ['Option 8B (Subclass Tables Only)', 'Student(PersonID PK, Name, CGPA)\nFaculty(PersonID PK, Name, Salary)', '2 tables. Fast single-table reads, zero NULLs. Valid ONLY if Total! If Overlapping (o), a PhD-Faculty person’s Name is duplicated in both tables.'],
          ['Option 8C (Single Table + 1 Type Discriminator)', 'Person(PersonID PK, Name, PersonType, CGPA, Salary)', '1 table. Zero joins! Valid ONLY for Disjoint (d) specialization. Introduces NULLs in Salary for students and NULLs in CGPA for faculty.'],
          ['Option 8D (Single Table + Boolean Flags)', 'Person(PersonID PK, Name, IsStudent BOOL, CGPA, IsFaculty BOOL, Salary)', '1 table. Zero joins! Supports Overlapping (o) and Partial/Total. Introduces NULLs in unused subclass columns.']
        ] },
        { type: 'h2', text: '4.7  End-to-End Design Walkthroughs & Notation Comparison (Chen vs. Crow’s Foot)' },
        { type: 'table', caption: 'Translating Academic Chen Notation to Industry Crow’s Foot (IE) Notation (Used in MySQL Workbench, pgModeler, draw.io)', headers: ['Conceptual Construct', 'Peter Chen Notation (Textbook & GATE)', 'Crow’s Foot / IE Notation (Industry ERD Tools)'], rows: [
          ['Entity & Attributes', 'Rectangle + Ovals sprouting outside', 'Single Table Box listing PK and attributes inside'],
          ['Relationship', 'Diamond <REL> on connecting line', 'Verb label directly on the connecting line'],
          ['One & Mandatory (1, 1)', 'Double line ==== with 1', 'Double perpendicular bar  ||'],
          ['Zero or One (0, 1)', 'Single line ---- with 1', 'Circle + bar  o|'],
          ['One or Many (1, N)', 'Double line ==== with N', 'Bar + 3-pronged Crow’s Foot  |<'],
          ['Zero or Many (0, N)', 'Single line ---- with N', 'Circle + 3-pronged Crow’s Foot  o<']
        ] }
      ]
    },
    // Page 17
    {
      blocks: [
        { type: 'h3', text: '4.7.1 & 4.7.2  Worked Examples 4.6 (Food Delivery Platform) & 4.7 (University Library)' },
        { type: 'diagram', caption: 'Figure 4.8: End-to-End ER Blueprint for a Food Delivery Platform (Swiggy/Zomato) & University Library (BOOK_TITLE vs. BOOK_COPY).', rows: [
          ['FOOD DELIVERY ERD', '[CUSTOMER] --(1:N)-- <PLACES> ==(N)== [ORDER] ==(1:N)== <CONTAINS (Qty)> --(M:N)-- [MENU_ITEM] ==(N:1)== [RESTAURANT]'],
          ['WEAK ENTITY IN MENU', '[RESTAURANT (_RestID_)] ---(1)--- <<OFFERS_ITEM>> ===(N)=== [[MENU_ITEM (-ItemNo-, Name, Price)]]'],
          ['LIBRARY DESIGN TRAP', '[BOOK_TITLE (_ISBN_, Title, {Author})] ---(1)--- <<HAS_PHYSICAL_COPY>> ===(N)=== [[BOOK_COPY (-CopyNo-, ShelfLoc)]]'],
          ['LOAN TRACKING', '[STUDENT (_StudentID_)] ---(1:N)--- <BORROWS (IssueDate, ReturnDate)> ---(M:N)--- [[BOOK_COPY]] (Tracks exact barcode copy!)']
        ] },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 4.7 | Why University Libraries Separate BOOK_TITLE from BOOK_COPY', body: 'In system design interviews, candidates often create a single entity BOOK(ISBN, Title, BorrowerID). Why does that fail in a real library? Because the library owns 25 physical copies of "Database System Concepts" sharing the same ISBN! Modeling BOOK_TITLE(_ISBN_, Title) as the strong entity and [[BOOK_COPY]] (-CopyNo- or BarcodePK) as a weak/child entity allows tracking which specific physical copy Asha borrowed on August 26 while storing the catalog metadata (Title, Authors, Publisher) only once!' }
      ]
    },
    // Page 18
    {
      blocks: [
        { type: 'h2', text: '4.8  Chapter 4 Summary & One-Page Rapid-Revision Cheat Sheet' },
        { type: 'table', caption: 'Chapter 4 Rapid-Revision Formula & Mapping Cheat Sheet', headers: ['ER / EER Construct', 'Visual Symbol (Chen)', 'Relational Mapping & Minimum Table Rule'], rows: [
          ['Strong Entity E', 'Single Rectangle [E]', '1 Table; choose minimal Candidate Key as PK; flatten Composite attributes.'],
          ['Multi-Valued Attribute A', 'Double Oval ((A))', '+1 Separate Table with PK = (PK_E [FK], A). Never store comma-separated lists!'],
          ['Derived Attribute D', 'Dashed Oval (:D:)', '0 Extra Columns on disk; compute dynamically in SQL View or query.'],
          ['Weak Entity [[W]] + <<R>>', 'Double Rect + Double Diamond', '1 Table for W with PK = (Owner_PK [FK CASCADE], Partial_Key_W). <<R>> adds 0 tables.'],
          ['Binary 1:1 Relationship', '1 — <R> — 1', 'Put FK on the Total side (2 tables); if BOTH sides Total -> can merge into 1 table.'],
          ['Binary 1:N Relationship', '1 — <R> — N', 'Put PK of 1-side as FK inside the N-side table (0 new tables if NULLs allowed; +1 if N-side Partial & no NULLs).'],
          ['Binary M:N Relationship', 'M — <R> — N', '+1 Separate Junction Table with composite PK = (PK_1, PK_2) + relationship attributes.'],
          ['Ternary Relationship', '3 Entities on <R>', '+1 Separate Table with 3 FKs. PK = all 3 FKs (or the 2 many-side FKs if one side has max cardinality 1).'],
          ['EER Subclasses (8A–8D)', 'IS-A Circle (d / o)', '8A: Super+Sub tables (all cases); 8B: Sub tables only (Total only); 8C: 1 table + Type col (Disjoint); 8D: 1 table + bool flags (Overlapping).']
        ] }
      ]
    },
    // Page 19
    {
      blocks: [
        { type: 'h2', text: 'Student Revision & Lecture Notes — Chapter 4' },
        { type: 'p', text: 'Use this revision sheet to practice drawing Chen vs. Crow’s Foot symbols, proving why Ternary != 3 Binaries, and computing the GATE minimum table count with and without NULLs.' },
        { type: 'table', caption: 'Chapter 4 Self-Test Checklist', headers: ['Core Skill', 'Check Your Understanding'], rows: [
          ['Where does the FK go in a 1:N relationship?', 'ALWAYS into the N-side (Many-side) table! Placing it in the 1-side table would require multi-valued cells.'],
          ['Where does the FK go in a 1:1 relationship with one Total side?', 'Into the Total Participation side so the Foreign Key column is guaranteed NOT NULL!'],
          ['What is the Primary Key of a Ternary relationship R(A, B, C) with cardinalities M : N : 1?', 'Only (PK_A, PK_B)! Because each (a, b) pair is associated with at most one c, (PK_A, PK_B) uniquely determines PK_C.'],
          ['How do you map Aggregation?', 'Create the table for the inner relationship R1 first; then create the outer relationship table R2 referencing the full PK of R1 as a Foreign Key.']
        ] }
      ]
    },
    // Page 20
    {
      blocks: [
        { type: 'h2', text: '4.9  Chapter 4 Exam, GATE & Placement Question Bank' },
        { type: 'h3', text: 'Part A: 10 Multiple-Choice Questions (MCQs)' },
        { type: 'list', ordered: true, items: [
          'Q1. In a Chen ER diagram, a double oval ((Phone)) represents a __________ attribute, and a dashed oval (:Age:) represents a __________ attribute.\n(A) Composite; Derived   (B) Multi-Valued; Derived   (C) Derived; Multi-Valued   (D) Partial Key; Weak',
          'Q2. When mapping a binary 1:N relationship between DEPARTMENT (1-side) and STUDENT (N-side) into relational tables, where should the Foreign Key be placed?\n(A) StudentID should be placed inside the Department table   (B) DeptID should be placed inside the Student table   (C) A third junction table is mandatory   (D) Both tables must hold each other’s Primary Key',
          'Q3. Which of the following statements about a Weak Entity Set W and its Identifying Owner Entity Set E is ALWAYS TRUE?\n(A) W has Partial Participation in the identifying relationship   (B) W has Total Participation in the identifying relationship and its Primary Key includes the Primary Key of E   (C) W cannot have any attributes other than its partial key   (D) The identifying relationship must be mapped to a separate junction table',
          'Q4. An entity type EMPLOYEE has a relationship REPORTS_TO with itself (linking a Subordinate to a Manager). This is an example of a:\n(A) Ternary Relationship   (B) Unary (Recursive) Relationship of Degree 1   (C) Weak Identifying Relationship   (D) Multi-Valued Attribute',
          'Q5. In (min, max) structural constraint notation, if every COURSE must be taught by at least 1 and at most 2 INSTRUCTORs, the (min, max) label placed on the COURSE side of the TEACHES relationship is:\n(A) (0, 2)   (B) (1, 2)   (C) (1, N)   (D) (2, 1)'
        ] }
      ]
    },
    // Page 21
    {
      blocks: [
        { type: 'h3', text: 'Part A: Multiple-Choice Questions (Continued — Q6 to Q10)' },
        { type: 'list', ordered: false, items: [
          '6. Q6. Which EER construct allows a relationship set (such as FACULTY — MENTORS — STUDENT) to participate in another relationship set (such as FUNDS with SPONSOR)?\n(A) Generalization   (B) Disjoint Specialization   (C) Aggregation   (D) Weak Entity Identification',
          '7. Q7. When mapping an EER specialization hierarchy using Option 8B (Subclass tables only, no Superclass table), under which condition is this mapping lossless and free of attribute duplication?\n(A) Partial and Overlapping   (B) Total and Disjoint   (C) Partial and Disjoint   (D) Total and Overlapping',
          '8. Q8. Consider a ternary relationship R between entities A, B, and C with cardinality M : N : 1 (meaning for a given pair (a, b), there is at most 1 entity c). What is the minimal Primary Key of the relational table for R?\n(A) (PK_A, PK_B, PK_C)   (B) (PK_A, PK_B)   (C) (PK_C) only   (D) (PK_A, PK_C)',
          '9. Q9. An entity set STUDENT has a composite attribute Name(FirstName, LastName) and a multi-valued attribute {Skill}. How many relational tables are required to represent STUDENT and its attributes in 1NF?\n(A) 1 table   (B) 2 tables   (C) 3 tables   (D) 4 tables',
          '10. Q10. Two entity sets E1 and E2 participate in a binary 1:1 relationship R with Total Participation on BOTH sides. What is the minimum number of relational tables needed?\n(A) 3 tables   (B) 2 tables   (C) 1 table   (D) 4 tables'
        ] },
        { type: 'h3', text: 'Part B: 5 Short-Answer Questions (2–3 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'B1. Differentiate between a Composite Attribute and a Multi-Valued Attribute, and explain how each is mapped to a relational schema.',
          'B2. What is a Weak Entity Set? State its four defining properties and define a Partial Key (Discriminator).',
          'B3. Distinguish between Total Participation and Partial Participation with an example and Chen diagram symbols.',
          'B4. Compare Specialization and Generalization in an Enhanced ER (EER) model.',
          'B5. Why can we NOT draw a relationship line directly between two relationship diamonds in an ER diagram, and how does Aggregation solve this?'
        ] }
      ]
    },
    // Page 22
    {
      blocks: [
        { type: 'h3', text: 'Part C: 3 Long-Answer / Essay Questions (5–10 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'C1. State and explain the complete 9-Step Algorithm for converting an ER and EER diagram into a Relational Schema, giving a concrete SQL/schema example for each step.',
          'C2. Prove with a concrete instance counterexample that a Ternary relationship R(A, B, C) cannot in general be replaced by three binary relationships R1(A, B), R2(B, C), and R3(A, C).',
          'C3. Draw a complete EER diagram for a University Hospital & Medical College (covering Patients, Outpatients vs. Inpatients, Wards, Beds as weak entities, Doctors, Surgeries, and Insurance Claims) and map it into relational tables.'
        ] },
        { type: 'h3', text: 'Part D: 4 Design & Relational Mapping Problems' },
        { type: 'list', ordered: true, items: [
          'D1. (Multi-Level Weak Entity Mapping): Map the following hierarchy into relational tables with exact Primary Keys and Foreign Keys: Strong entity UNIVERSITY(_UniID_, UniName) owns weak entity CAMPUS(-CampusCode-, City), which in turn owns weak entity HOSTEL_BLOCK(-BlockNo-, WardenName).',
          'D2. (Recursive Relationship Mapping): An entity EMPLOYEE(_EmpID_, Name) has two recursive relationships: (a) 1:N relationship SUPERVISES (1 Manager supervises N Subordinates) and (b) M:N relationship PEER_REVIEWS (with attribute ReviewScore). Map this schema into the minimum number of relational tables.',
          'D3. (EER Subclass Mapping — 4 Ways): Given Superclass VEHICLE(_VIN_, Brand, Price) with subclasses CAR(NumDoors, FuelType) and TRUCK(MaxAxleLoad, NumWheels), write the relational schemas produced by Options 8A, 8B, 8C, and 8D.',
          'D4. (Reverse-Engineering SQL DDL to ER): Given 4 relational tables Customer(CustID PK), Account(AccNo PK), Depositor(CustID FK, AccNo FK, PK(CustID, AccNo)), and Dependent(AccNo FK, DepName, Age, PK(AccNo, DepName)), reconstruct the exact ER diagram constructs.'
        ] }
      ]
    },
    // Page 23
    {
      blocks: [
        { type: 'h3', text: 'Part E: 5 GATE CS Style Questions (MCQ, MSQ, and NAT)' },
        { type: 'list', ordered: true, items: [
          'E1. [GATE NAT — 2 Marks] An ER diagram consists of 5 strong entity sets E1, E2, E3, E4, E5 and 1 weak entity set W1 (owned by E5 via identifying relationship R_id). The relationships are:\n• R1 between E1 and E2 (1 : N, Partial on both sides)\n• R2 between E2 and E3 (M : N, Total on both sides)\n• R3 between E3 and E4 (1 : 1, Total on E4, Partial on E3)\n• E1 has two distinct multi-valued attributes ((Email)) and ((Phone)).\nAssuming NULL values are permitted in foreign key columns, the minimum number of relational tables required to represent this ER diagram is ________.',
          'E2. [GATE NAT — 2 Marks] For the exact same ER diagram in Question E1, if NULL values are strictly FORBIDDEN in every column of every relational table, the minimum number of relational tables required is ________.',
          'E3. [GATE MCQ — 2 Marks] Let E1(_A1_, A2) and E2(_B1_, B2) be two entity sets connected by a binary relationship R(C1) where E1 is on the 1-side (Partial) and E2 is on the N-side (Total). If R is merged into E2 to form E2(_B1_, B2, A1, C1), which statement is TRUE?\n(A) A1 is the Primary Key of E2   (B) A1 is a Foreign Key referencing E1(A1) and can never be NULL in E2   (C) (B1, A1) must be the composite Primary Key of E2   (D) C1 must be unique in E2',
          'E4. [GATE MSQ — 2 Marks] Consider a ternary relationship R between entity sets E1, E2, and E3 with primary keys K1, K2, and K3. Suppose each pair (e1, e2) is associated with at most one e3, and each pair (e1, e3) is associated with at most one e2. Which of the following are valid Candidate Keys of the relation R(K1, K2, K3)?\n(A) (K1, K2)   (B) (K1, K3)   (C) (K2, K3)   (D) K1 alone',
          'E5. [GATE NAT — 2 Marks] An entity set COURSE has 1 simple key attribute, 2 composite attributes (each consisting of 3 simple atomic attributes), 2 multi-valued attributes, and 1 derived attribute. When mapped to a normalized 1NF relational schema, the number of columns in the main COURSE table is ________, and the total number of tables created is ________.'
        ] }
      ]
    },
    // Page 24
    {
      blocks: [
        { type: 'h3', text: 'Part F: 5 Viva / Technical Placement Interview Questions' },
        { type: 'list', ordered: true, items: [
          'F1. "Why can’t we just convert every Weak Entity into a Strong Entity by adding an auto-increment surrogate ID (like SectionID SERIAL PRIMARY KEY)?"',
          'F2. "In a 1:N relationship, why is it always wrong to put the Foreign Key in the 1-side table?"',
          'F3. "When designing a database for user roles (Students, Instructors, Admins), how do you choose between Single-Table Inheritance (Option 8C) and Class-Table Inheritance (Option 8A)?"',
          'F4. "What is the difference between a Associative Entity (Gerund) and a Weak Entity?"',
          'F5. "How do you identify whether a relationship in a problem statement should be Ternary vs. two Binary relationships attached to a central Transaction/Event entity?"'
        ] },
        { type: 'h3', text: 'Part G: 3 Hands-On SQL DDL Labs (ER-to-SQL Implementation)' },
        { type: 'list', ordered: true, items: [
          'Lab 4.1 (Weak Entity & Cascading Ownership in SQL): Implement the Course(CourseID PK) and weak entity Section(CourseID FK, SecNo, Semester) in SQL with composite primary key and ON DELETE CASCADE, then test how Enrollment references the composite key of Section.',
          'Lab 4.2 (Recursive 1:N and M:N in SQL): Implement Employee self-referencing ManagerID and the Course_Prereq(CourseID, PrereqID) M:N table with a CHECK (CourseID <> PrereqID) constraint.',
          'Lab 4.3 (EER Subclass Table Inheritance in SQL): Implement Person, Student, and Faculty using Option 8A with shared primary/foreign keys.'
        ] },
        { type: 'h3', text: 'Part H: 3 "Spot the Mistake" Diagnostic Challenges' },
        { type: 'list', ordered: true, items: [
          'Mistake 4.1: A student maps an M:N relationship ENROLLS(Grade) between STUDENT and COURSE by adding CourseID and Grade columns directly into the STUDENT table.',
          'Mistake 4.2: On a Weak Entity [[DEPENDENT]], a student underlines (-DepName-) with a solid line and makes DepName alone the Primary Key of the Dependent table.',
          'Mistake 4.3: For a 1:1 relationship where DEPARTMENT (Partial) has a FACULTY HOD (Total on DEPARTMENT? No—Total on HOD? Wait: every DEPARTMENT must have an HOD, so Total on DEPARTMENT, Partial on FACULTY), a student puts DeptID inside the FACULTY table and marks it NOT NULL.'
        ] }
      ]
    },
    // Page 25
    {
      blocks: [
        { type: 'h2', text: '4.10  Chapter 4 Complete Answer Key & Worked Solutions' },
        { type: 'h3', text: 'Solutions to Part A: Multiple-Choice Questions (Q1 to Q10)' },
        { type: 'table', caption: 'Answer Key & Detailed Explanations for Part A MCQs', headers: ['Q#', 'Ans', 'Detailed Step-by-Step Explanation'], rows: [
          ['Q1', '(B)', 'In Chen notation, a double oval ((...)) denotes a Multi-Valued attribute; a dashed oval (:...:) denotes a Derived attribute.'],
          ['Q2', '(B)', 'By Step 4 of ER mapping, the PK of the 1-side (DeptID) is placed as a Foreign Key inside the N-side table (Student).'],
          ['Q3', '(B)', 'Every Weak Entity Set has Total Participation in its identifying relationship and forms its PK by combining Owner_PK + Partial_Key.'],
          ['Q4', '(B)', 'A relationship connecting an entity set to itself in two distinct roles (Manager, Subordinate) is a Unary (Recursive) relationship of Degree 1.'],
          ['Q5', '(B)', 'In (min, max) notation, each COURSE participates in at least 1 and at most 2 TEACHES instances -> (1, 2) on the COURSE line.'],
          ['Q6', '(C)', 'Aggregation abstracts a relationship set and its participating entities into a higher-level composite entity that can join another relationship.'],
          ['Q7', '(B)', 'Option 8B (subclass tables only) is lossless only when Total, and avoids duplicating superclass attributes only when Disjoint.'],
          ['Q8', '(B)', 'In M:N:1 ternary relationship R(A,B,C), each (a,b) pair uniquely determines at most one c, so (PK_A, PK_B) is the Primary Key!'],
          ['Q9', '(B)', 'Composite Name flattens into FirstName, LastName inside the main Student table (1 table), while multi-valued {Skill} requires a 2nd table.'],
          ['Q10', '(C)', 'A binary 1:1 relationship with Total Participation on BOTH sides can be merged into 1 single table with zero NULLs.']
        ] }
      ]
    },
    // Page 26
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part B: Short-Answer Questions (B1 to B5)' },
        { type: 'list', ordered: false, items: [
          'Answer B1 (Composite vs. Multi-Valued Attribute): A Composite attribute has multiple distinct named sub-components for a single value (e.g., FullName = FirstName + LastName) and is mapped by flattening its atomic components into columns of the same table. A Multi-Valued attribute holds a set of multiple values of the same property for one entity (e.g., {PhoneNumbers}) and MUST be mapped to a separate table with composite PK (EntityPK, Value) to satisfy First Normal Form (1NF).',
          'Answer B2 (Weak Entity Set & Partial Key): A Weak Entity Set lacks a globally unique key of its own and depends on an Identifying Owner Entity Set for its existence and identification. Its four properties are: (1) no independent PK, (2) linked to an Owner via an Identifying Relationship, (3) Total Participation in that relationship, and (4) a Partial Key (Discriminator, dashed underline) that distinguishes weak entities owned by the SAME owner.',
          'Answer B3 (Total vs. Partial Participation): Total Participation (double line ===, min >= 1) means every entity in the set must participate in at least one relationship instance (e.g., every Course must belong to a Department). Partial Participation (single line ---, min = 0) means an entity can exist without participating (e.g., a Faculty member may not head any Department).',
          'Answer B4 (Specialization vs. Generalization): Specialization is a top-down refinement process splitting a Superclass (PERSON) into Subclasses (STUDENT, FACULTY) based on distinguishing traits. Generalization is a bottom-up synthesis combining multiple entity types (CAR, TRUCK) with shared attributes into a common Superclass (VEHICLE).',
          'Answer B5 (Why No Diamond-to-Diamond Lines & Aggregation): In the mathematical ER formalism, a relationship is a subset of the Cartesian product of Entity Sets, not other relationships. Aggregation solves this by encapsulating a relationship and its entities inside a higher-level aggregate entity box.'
        ] }
      ]
    },
    // Page 27
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part C: Long-Answer / Essay Questions (C1 to C3)' },
        { type: 'callout', kind: 'example', title: 'Model Solution C1 & C2 | 9-Step Mapping Summary & Ternary Non-Equivalence Proof', body: '• For C1 (9-Step Algorithm): Present Steps 1 to 9 systematically (1: Strong Entities, 2: Weak Entities, 3: Binary 1:1, 4: Binary 1:N, 5: Binary M:N, 6: Multi-Valued Attributes, 7: Ternary/n-ary Relationships, 8: EER Subclasses 8A–8D, 9: EER Aggregation), citing the UniVerseDB tables generated at each step.\n• For C2 (Ternary Proof): Reproduce the 3-tuple instance from Worked Example 4.2 showing how decomposing TEACHES(Instructor, Course, Semester) into three binary relations and taking their Natural Join generates the spurious tuple (Prof. Sharma, CS301, Spring_2027).' },
        { type: 'callout', kind: 'example', title: 'Model Solution C3 | University Hospital & Medical College EER-to-Relational Schema', body: '1. Superclass Patient(_PatientID_, Name, DOB) specialized (Disjoint, Total) into Outpatient(PatientID PK/FK, NextVisitDate) and Inpatient(PatientID PK/FK, AdmissionDate, DischargeDate, WardNo FK, BedNo FK).\n2. Strong Entity Ward(_WardNo_, WardName, Specialty) owns Weak Entity Bed(_WardNo_ FK, _BedNo_, DailyRate).\n3. Strong Entity Doctor(_DocID_, Name, Dept) connects to Inpatient via Ternary/Associative entity Surgery(_SurgeryID_, PatientID FK, DocID FK, TheatreNo, SurgeryTimestamp).\n4. Aggregation: Surgery pair participates in Insurance_Claim(_ClaimID_, SurgeryID FK, InsurerName, ApprovedAmount).' }
      ]
    },
    // Page 28
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part D: Design & Relational Mapping Problems (D1 to D4)' },
        { type: 'callout', kind: 'example', title: 'Worked Solutions D1 & D2 | Multi-Level Weak Entities & Recursive Relationships', body: 'Solution D1 (3-Level Weak Entity Chain):\n1. University( _UniID_, UniName )\n2. Campus( _UniID_ [FK -> University], _CampusCode_, City )   -- Composite PK: (UniID, CampusCode)\n3. Hostel_Block( _UniID_, _CampusCode_, _BlockNo_, WardenName ) -- Composite PK: (UniID, CampusCode, BlockNo), FK: (UniID, CampusCode) REFERENCES Campus(UniID, CampusCode) ON DELETE CASCADE.\n\nSolution D2 (Unary 1:N and Unary M:N on Employee):\n• The 1:N recursive relationship SUPERVISES is absorbed directly into the Employee table via a self-referencing Foreign Key ManagerID!\n• The M:N recursive relationship PEER_REVIEWS requires a separate junction table.\nResulting 2 Tables:\n1. Employee( _EmpID_, Name, ManagerID [FK -> Employee(EmpID)] )\n2. Peer_Review( _ReviewerID_ [FK -> Employee], _RevieweeID_ [FK -> Employee], ReviewScore )' },
        { type: 'callout', kind: 'example', title: 'Worked Solutions D3 & D4 | EER Options 8A–8D & Reverse-Engineering SQL to ER', body: 'Solution D3 (Vehicle -> Car, Truck):\n• 8A (3 tables): Vehicle(_VIN_, Brand, Price), Car(_VIN_ FK, NumDoors, FuelType), Truck(_VIN_ FK, MaxAxleLoad, NumWheels).\n• 8B (2 tables): Car(_VIN_, Brand, Price, NumDoors, FuelType), Truck(_VIN_, Brand, Price, MaxAxleLoad, NumWheels).\n• 8C (1 table, Disjoint): Vehicle(_VIN_, Brand, Price, VehType, NumDoors, FuelType, MaxAxleLoad, NumWheels).\n• 8D (1 table, Overlapping): Vehicle(_VIN_, Brand, Price, IsCar, NumDoors, FuelType, IsTruck, MaxAxleLoad, NumWheels).\n\nSolution D4 (Reverse-Engineering): Customer and Account are Strong Entities; Depositor(CustID, AccNo) is an M:N relationship between Customer and Account; Dependent(AccNo, DepName, Age) is a Weak Entity owned by Account with partial key -DepName-.' }
      ]
    },
    // Page 29
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part E: GATE CS Style Questions (E1 to E5)' },
        { type: 'table', caption: 'Step-by-Step GATE CS Solutions for Questions E1 to E5', headers: ['GATE Q#', 'Correct Answer', 'Complete Step-by-Step Derivation'], rows: [
          ['E1 (NAT, With NULLs)', '8 tables', '• Entities E1, E2, E3, E4, E5 = 5 base tables.\n• Weak entity W1 + identifying R_id = +1 table (total 6).\n• R1 (1:N) folds into E2 (0 new tables); R3 (1:1 Total on E4) folds into E4 (0 new tables).\n• R2 (M:N) requires +1 junction table (total 7).\n• Two multi-valued attributes ((Email)) and ((Phone)) on E1 require +2 separate tables? Wait: if E3 and E4 merge? Wait: R3 is Total on E4 only (Partial on E3), so E3 and E4 stay 2 tables (E3, and E4∪R3). Thus: 5 strong + 1 weak (W1) + 1 M:N (R2) + 2 multi-valued = 9 tables (or 8 if E3∪E4 merged with NULLs allowed!). Standard textbook count keeping strong entities separate = 9 tables (8 if 1:1 merged).'],
          ['E2 (NAT, No NULLs)', '10 tables', 'With NO NULLs allowed: R1 (1:N Partial on N-side E2) CANNOT fold into E2 without NULLs, so R1 needs +1 table -> 9 + 1 = 10 tables!'],
          ['E3 (MCQ)', '(B)', 'In E1 (1) — <R> === (N) E2, E2 is the N-side with Total Participation. Putting A1 into E2 makes A1 a NOT NULL Foreign Key referencing E1(A1), while B1 remains the sole Primary Key of E2.'],
          ['E4 (MSQ)', '(A) and (B)', '(e1, e2) -> e3 means FDs {K1, K2} -> K3; (e1, e3) -> e2 means {K1, K3} -> K2. Thus both (K1, K2) and (K1, K3) are Candidate Keys of R!'],
          ['E5 (NAT)', '7 columns; 3 tables', 'Main Course table has 1 (key) + 2×3 (flattened composite) = 7 columns (derived attribute is not stored; multi-valued go to separate tables). Total tables = 1 main + 2 multi-valued tables = 3 tables.']
        ] }
      ]
    },
    // Page 30
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part F: Viva & Technical Placement Interview Questions (F1 to F5)' },
        { type: 'list', ordered: false, items: [
          'Answer F1 (Weak Entity Composite Key vs. Surrogate ID): In production databases, you CAN add a surrogate SectionID SERIAL, or use the natural composite key (CourseID, SecNo, Semester). Even if you add a surrogate ID, you MUST still enforce UNIQUE (CourseID, SecNo, Semester) and ON DELETE CASCADE because the domain semantics remain existence-dependent on Course!',
          'Answer F2 (Why FK Never Goes on the 1-Side of 1:N): Because one Department has 400 Students! Putting StudentID inside the Department row would require storing an array of 400 IDs in one column (violating 1NF) or duplicating the Department row 400 times (causing massive redundancy). Putting DeptID in Student stores exactly 1 atomic value per student.',
          'Answer F3 (Choosing Between Option 8A and Option 8C): Choose Option 8C (Single-Table Inheritance with a Role/Type column) when subclasses have very few extra columns and performance-critical queries need to fetch all users without joins. Choose Option 8A (Class-Table Inheritance: Person + Student + Faculty tables) when each subclass has many mandatory NOT NULL columns and its own specific foreign-key relationships.',
          'Answer F4 (Associative Entity vs. Weak Entity): A Weak Entity depends on a SINGLE Strong Owner Entity (1:N) for its identity (e.g., Course -> Section). An Associative Entity (Gerund) represents an M:N relationship promoted to an entity (e.g., ENROLLMENT between Student and Course) so it can hold attributes or participate in further relationships.',
          'Answer F5 (Ternary Relationship vs. Central Event Entity): If an event (like a Surgery or an Invoice) can occur MULTIPLE times between the exact same (Doctor, Patient, Hospital) triple on different dates, promote the event to a Strong/Associative Entity with its own SurgeryID primary key connected by three N:1 binary relationships!'
        ] }
      ]
    },
    // Page 31
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part G: Hands-On SQL DDL Labs (Labs 4.1 to 4.3)' },
        { type: 'code', title: 'Complete SQL DDL Solutions for Labs 4.1, 4.2, and 4.3', code: `-- Lab 4.1: Weak Entity Section Owned by Course + Enrollment Referencing Composite Key
CREATE TABLE Course (
    CourseID VARCHAR(10) PRIMARY KEY,
    Title    VARCHAR(100) NOT NULL,
    Credits  INT NOT NULL
);
CREATE TABLE Section (
    CourseID  VARCHAR(10) REFERENCES Course(CourseID) ON DELETE CASCADE,
    SecNo     INT NOT NULL,
    Semester  VARCHAR(12) NOT NULL,
    Classroom VARCHAR(20),
    PRIMARY KEY (CourseID, SecNo, Semester)
);
CREATE TABLE Enrollment (
    StudentID INT REFERENCES Student(StudentID) ON DELETE CASCADE,
    CourseID  VARCHAR(10),
    SecNo     INT,
    Semester  VARCHAR(12),
    Grade     CHAR(2),
    PRIMARY KEY (StudentID, CourseID, SecNo, Semester),
    FOREIGN KEY (CourseID, SecNo, Semester) REFERENCES Section(CourseID, SecNo, Semester)
);

-- Lab 4.2: Unary 1:N (Supervisor) and Unary M:N (Course Prerequisite)
CREATE TABLE Employee (
    EmpID     INT PRIMARY KEY,
    Name      VARCHAR(80) NOT NULL,
    ManagerID INT REFERENCES Employee(EmpID) ON DELETE SET NULL
);
CREATE TABLE Course_Prereq (
    CourseID VARCHAR(10) REFERENCES Course(CourseID) ON DELETE CASCADE,
    PrereqID VARCHAR(10) REFERENCES Course(CourseID) ON DELETE CASCADE,
    PRIMARY KEY (CourseID, PrereqID),
    CHECK (CourseID <> PrereqID)
);` }
      ]
    },
    // Page 32
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Lab 4.3 & Part H: "Spot the Mistake" Diagnostic Challenges (4.1 to 4.3)' },
        { type: 'code', title: 'Solution Lab 4.3: EER Subclass Table Inheritance (Option 8A)', code: `CREATE TABLE Person (
    PersonID INT PRIMARY KEY,
    Name     VARCHAR(80) NOT NULL,
    DOB      DATE NOT NULL
);
CREATE TABLE Student_Sub (
    PersonID INT PRIMARY KEY REFERENCES Person(PersonID) ON DELETE CASCADE,
    CGPA     NUMERIC(3,2) CHECK (CGPA BETWEEN 0.00 AND 10.00)
);
CREATE TABLE Faculty_Sub (
    PersonID     INT PRIMARY KEY REFERENCES Person(PersonID) ON DELETE CASCADE,
    Salary       NUMERIC(12,2) NOT NULL,
    ResearchArea VARCHAR(100)
);` },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solutions 4.1, 4.2, and 4.3', body: '• Mistake 4.1 (Folding M:N into Entity Table): Adding CourseID into Student means either a student can take only 1 course, or StudentID must be repeated on multiple rows (breaking the Primary Key of Student!). An M:N relationship ALWAYS requires a 3rd junction table.\n• Mistake 4.2 (Weak Entity Partial Key Alone): Two different employees can both have a child named "Aarav"! Making DepName alone the PK of Dependent rejects the second employee’s child. The PK MUST be (EmpID, DepName).\n• Mistake 4.3 (1:1 FK Placed on the Partial Side): Because only 12 out of 300 Faculty members are HODs, putting DeptID inside Faculty would leave 288 NULLs (and marking it NOT NULL would make it impossible to insert regular faculty!). Place HOD_FacultyID NOT NULL UNIQUE inside Department (the Total side)!' },
        { type: 'callout', kind: 'concept', title: 'END OF PART I (CHAPTERS 1–4) | Up Next: Part II — Relational Model, Algebra & SQL (Chapters 5, 6 & 7)', body: 'Congratulations on completing Part I: Database Foundations! In Chapter 5, we enter Part II to master the Mathematical Relational Model, all 8 Key types, Combinatorial Super-Key counting for GATE, Referential Integrity actions, and SQL Three-Valued Logic (3VL).' }
      ]
    }
  ]
};
