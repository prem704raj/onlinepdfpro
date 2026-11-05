// Exact page-by-page textbook content for DBMS Chapters 5, 6, and 7 (Part II: Relational Model, Algebra & SQL)

export const CHAPTER_05 = {
  number: 5,
  fileName: 'dbms-chapter-05.pdf',
  downloadName: 'DBMS-Chapter-05-Relational-Model-Keys-Constraints.pdf',
  partLabel: 'PART II: RELATIONAL MODEL, ALGEBRA & SQL',
  headerPart: 'PART II: RELATIONAL & SQL',
  title: 'The Relational Model, Keys, and Integrity Constraints',
  themeColor: '#0f6e56',
  themeLight: '#dcf2ec',
  themeBorder: '#4aa38b',
  pageCount: 27,
  whyThisMatters: 'Why does a relational table reject duplicate Primary Keys, forbid orphan Foreign Keys, and behave counterintuitively when NULL values appear in WHERE or NOT IN clauses? This chapter builds the mathematical foundation of E.F. Codd’s Relational Model—covering Degree vs. Cardinality, all 8 Key types, GATE CS combinatorial formulas for counting Super Keys, Referential Triggered Actions, and Kleene’s Three-Valued Logic (3VL).',
  prerequisites: 'Chapters 1–4 (DBMS Fundamentals, Schemas vs. Instances, and ER-to-Relational Mapping).',
  objectives: [
    'Define Relation Schema, Relation Instance, Tuple, Attribute, Domain, Degree (Arity), and Cardinality mathematically, and contrast Set Semantics with SQL Bag (Multiset) Semantics.',
    'Master all 8 Key types (Super Key, Candidate Key, Primary Key, Alternate/Secondary Key, Composite Key, Prime vs. Non-Prime Attributes, Foreign Key, and Surrogate vs. Natural Key).',
    'Derive and apply the exact GATE CS combinatorial formulas (including Inclusion–Exclusion and Sperner’s Theorem) to count Super Keys for any Candidate Key configuration.',
    'Enforce Domain Constraints, Key Constraints, Entity Integrity (PK never NULL), and Referential Integrity (FK matches PK or is NULL), and debunk the 5 classic Foreign Key myths.',
    'Trace DML operations (INSERT, DELETE, UPDATE) across Parent and Child tables under all 5 SQL Referential Actions (RESTRICT, NO ACTION, CASCADE, SET NULL, SET DEFAULT).',
    'Evaluate complex predicates under SQL Three-Valued Logic (TRUE, FALSE, UNKNOWN) and distinguish how WHERE (passes TRUE only) differs from CHECK constraints (passes TRUE or UNKNOWN).'
  ],
  toc: [
    ['5', 'The Relational Model, Keys, and Integrity Constraints', '1', true],
    ['5.1', 'Mathematical Foundation: Relation, Tuple, Attribute, Domain, Degree & Cardinality', '3'],
    ['5.1.1', 'Formal Mathematical Definitions & Visual Anatomy of a Relation', '3', false, true],
    ['5.1.2', 'Three-Way Vocabulary Translation & Four Properties of Mathematical Relations', '4', false, true],
    ['5.2', 'Complete Taxonomy of Keys in the Relational Model', '5'],
    ['5.2.1', 'Formal Definitions of All Eight Key Types & Set Inclusion Hierarchy', '5', false, true],
    ['5.2.2', 'GATE CS Masterclass: Combinatorial Formulas for Counting Super Keys', '7', false, true],
    ['5.2.3', 'Worked Example 5.1: Solving Four GATE Super-Key Counting Problems', '8', false, true],
    ['5.3', 'Relational Integrity Constraints (Domain, Entity & Referential Integrity)', '9'],
    ['5.3.1', 'Domain, Key, and Entity Integrity Constraints', '9', false, true],
    ['5.3.2', 'Referential Integrity (Foreign Key Rules) & 5 Classic Foreign Key Myths', '10', false, true],
    ['5.4', 'Referential Triggered Actions (ON DELETE and ON UPDATE)', '11'],
    ['5.4.1', 'Table 5.2: DML Violation Matrix & The 5 Standard SQL Referential Actions', '11', false, true],
    ['5.4.2', 'Worked Examples 5.2 & 5.3: Multi-Level Cascade Trace & Complete UniVerseDB DDL', '12', false, true],
    ['5.5', 'NULL Semantics and Three-Valued Logic (3VL: TRUE, FALSE, UNKNOWN)', '14'],
    ['5.5.1', 'Complete Truth Tables for SQL 3VL (AND = min, OR = max, NOT = 1 − P)', '14', false, true],
    ['5.5.2', 'Worked Example 5.4: Tracing 3VL Queries & The WHERE vs. CHECK Asymmetry', '15', false, true],
    ['5.6', 'Chapter 5 Summary & One-Page Rapid-Revision Cheat Sheet', '16'],
    ['5.7', 'Chapter 5 Exam, GATE & Placement Question Bank (Parts A–H)', '18'],
    ['5.8', 'Chapter 5 Complete Answer Key & Worked Solutions', '22']
  ],
  pages: [
    // Page 3
    {
      blocks: [
        { type: 'h2', text: '5.1  Mathematical Foundation: Relation, Tuple, Attribute, Domain, Degree & Cardinality' },
        { type: 'p', text: 'In 1970, E.F. Codd grounded database management in set theory and first-order predicate logic. What programmers casually call a "table" is formally a mathematical Relation—a subset of the Cartesian product of attribute domains.' },
        { type: 'h3', text: '5.1.1  Formal Mathematical Definitions' },
        { type: 'list', ordered: true, items: [
          'Domain (D_i): A pool of atomic (indivisible) values of a specific data type and semantic meaning from which attribute values are drawn (e.g., D_CGPA = real numbers in [0.00, 10.00] with 2 decimal places).',
          'Relation Schema R(A_1, A_2, ..., A_n): The structural intension consisting of a relation name R and a list of attributes A_1, ..., A_n, where each A_i is the name of a role played by domain dom(A_i).',
          'Degree (or Arity, n): The total number of attributes (columns) in the relation schema R. A relation of degree 1 is unary, degree 2 is binary, degree 3 is ternary, and degree n is n-ary.',
          'Tuple (t): An ordered list of n values t = <v_1, v_2, ..., v_n>, where each v_i ∈ dom(A_i) or is the special NULL marker.',
          'Relation Instance r(R): A finite set of m tuples r(R) = {t_1, t_2, ..., t_m}, which is a subset of the Cartesian product: r(R) ⊆ dom(A_1) × dom(A_2) × ... × dom(A_n).',
          'Cardinality (m or |r|): The total number of tuples (rows) present in the relation instance r(R) at a given moment.'
        ] },
        { type: 'diagram', caption: 'Figure 5.1: Visual Anatomy of the Student Relation showing Degree (Arity n = 5 columns) and Cardinality (m = 4 tuples).', rows: [
          ['Relation Schema: Student( _StudentID_, Name, DeptID, CGPA, City )', ' <--- Degree (Arity) n = 5 Attributes (Columns)'],
          ['Tuple t1: < 1, "Asha",  10,   8.42, "Patna"  >  |  Tuple t2: < 2, "Ravi",  10, 7.25, "Delhi" >', 'Cardinality m = 4 Tuples (Rows)'],
          ['Tuple t3: < 3, "Meera", 20,   9.01, "Patna"  >  |  Tuple t4: < 4, "Kabir", NULL, 6.80, "Jaipur" >', 'Domains: INT, VARCHAR(80), DECIMAL(3,2)']
        ] }
      ]
    },
    // Page 4
    {
      blocks: [
        { type: 'table', caption: 'Table 5.1: Three-Way Vocabulary Translation Across Relational Theory, SQL, and File Systems', headers: ['Formal Relational Model Term', 'SQL / Commercial RDBMS Term', 'Traditional File-System Term'], rows: [
          ['Relation (or Relation Instance)', 'Table', 'File / Dataset'],
          ['Tuple (n-tuple)', 'Row', 'Record'],
          ['Attribute', 'Column', 'Field'],
          ['Domain', 'Data Type + CHECK Constraint', 'Field Format / Value Pool'],
          ['Degree (Arity, n)', 'Number of Columns', 'Number of Fields per Record'],
          ['Cardinality (m)', 'Number of Rows', 'Number of Records in File']
        ] },
        { type: 'h3', text: '5.1.2  Four Mathematical Characteristics of Relations (Set vs. Bag Semantics)' },
        { type: 'list', ordered: true, items: [
          '1. No Duplicate Tuples (Set Semantics): Because a formal relation r(R) is a mathematical SET of tuples, duplicate rows cannot exist in a pure relation. (Note: Commercial SQL tables without a Primary Key/UNIQUE constraint use Bag/Multiset semantics and allow duplicate rows unless SELECT DISTINCT is used).',
          '2. Ordering of Tuples Is Immaterial: A set {t1, t2, t3} is identical to {t3, t1, t2}. Rows in a relation have no inherent positional order unless sorted explicitly via ORDER BY.',
          '3. Ordering of Attributes Is Logically Immaterial: When tuples are defined as functions mapping attribute names to values (t[A_i] = v_i), column order does not affect relational semantics.',
          '4. First Normal Form (1NF — Atomicity of Values): Every value v_i in every tuple must be atomic (indivisible). Composite values, nested tables, and multi-valued sets inside a single cell are forbidden in the pure Relational Model.'
        ] }
      ]
    },
    // Page 5
    {
      blocks: [
        { type: 'h2', text: '5.2  Complete Taxonomy of Keys in the Relational Model' },
        { type: 'p', text: 'Because duplicate tuples are forbidden in a mathematical relation, we need a formal mechanism to uniquely identify every tuple across all possible valid instances of a schema:' },
        { type: 'h3', text: '5.2.1  Formal Definitions of All Eight Key Types' },
        { type: 'list', ordered: true, items: [
          'Super Key (SK): Any attribute or set of attributes SK ⊆ R that uniquely identifies every tuple in any valid instance of R: for all distinct tuples t1 ≠ t2, t1[SK] ≠ t2[SK]. Note: The entire attribute set R is always a (trivial) Super Key; adding ANY extra attribute to a Super Key still yields a Super Key!',
          'Candidate Key (CK — Minimal Super Key): A Super Key from which NO proper subset is also a Super Key (Uniqueness + Irreducibility/Minimality). A relation can have multiple Candidate Keys (e.g., {StudentID}, {AadhaarNo}, {RollNo}).',
          'Primary Key (PK): The single Candidate Key chosen by the database designer as the principal identifier of tuples in R. In SQL, the Primary Key is additionally constrained to be NOT NULL.',
          'Alternate Key (Secondary Key): Any Candidate Key that was NOT chosen as the Primary Key: Alternate Keys = Candidate Keys − {Primary Key}. Implemented in SQL using UNIQUE.',
          'Composite Key (Compound Key): Any key (Candidate, Primary, or Foreign) consisting of two or more attributes (e.g., (StudentID, SectionID) in Enrollment).',
          'Prime vs. Non-Prime Attribute: An attribute A is a Prime Attribute if A is a member of AT LEAST ONE Candidate Key of R (even an Alternate Key!). Otherwise, A is a Non-Prime Attribute.',
          'Foreign Key (FK): A set of attributes in a referencing (child) relation R1 that references the Primary Key (or UNIQUE key) of a referenced (parent) relation R2.',
          'Surrogate Key vs. Natural (Business) Key: A Natural Key is a real-world attribute (e.g., ISBN, AadhaarNo, PAN). A Surrogate Key is a system-generated artificial identifier (e.g., SERIAL, IDENTITY, UUID) with no business meaning.'
        ] }
      ]
    },
    // Page 6
    {
      blocks: [
        { type: 'diagram', caption: 'Figure 5.2: Set Inclusion Hierarchy of Keys — Every Primary Key is a Candidate Key, and Every Candidate Key is a Super Key.', rows: [
          ['ALL ATTRIBUTE SUBSETS (2^n − 1 non-empty subsets of R)', ''],
          ['  └── SUPER KEYS (Uniqueness Property: uniquely identifies tuples)', 'e.g., {StudentID}, {Email}, {StudentID, Name}, {StudentID, Name, CGPA}'],
          ['        └── CANDIDATE KEYS (Minimal Super Keys: no proper subset is a Super Key)', 'e.g., {StudentID} [Chosen as PRIMARY KEY],  {Email} [ALTERNATE KEY]']
        ] },
        { type: 'h3', text: '5.2.2  GATE CS Masterclass: Combinatorial Formulas for Counting Super Keys' },
        { type: 'p', text: 'Given a relation R(A_1, A_2, ..., A_n) with n attributes, every Superset of any Candidate Key is a Super Key! Use these exact combinatorial formulas in GATE CS:' },
        { type: 'table', caption: 'Exact Combinatorial Formulas for Counting the Number of Super Keys of R(A_1, ..., A_n)', headers: ['Candidate Key Configuration on n Attributes', 'Exact Formula for Total Number of Super Keys', 'Derivation / Explanation'], rows: [
          ['Case 1: Exactly 1 Simple Candidate Key {A_1} (size k = 1)', '2^(n − 1)', 'A_1 must be present (1 choice); each of the remaining (n − 1) attributes can be included or excluded (2 choices each).'],
          ['Case 2: Exactly 1 Composite Candidate Key of size k', '2^(n − k)', 'All k attributes of the CK must be present; the remaining (n − k) attributes have 2^(n−k) combinations.'],
          ['Case 3: Two Disjoint Candidate Keys K1 (size p) and K2 (size q) with K1 ∩ K2 = ∅', '2^(n − p) + 2^(n − q) − 2^(n − (p + q))', 'By Principle of Inclusion–Exclusion: |S(K1) ∪ S(K2)| = |S(K1)| + |S(K2)| − |S(K1 ∪ K2)|.'],
          ['Case 4: Two Overlapping Candidate Keys K1, K2 with |K1| = p, |K2| = q, and |K1 ∪ K2| = u', '2^(n − p) + 2^(n − q) − 2^(n − u)', 'In the intersection term, any superset of BOTH K1 and K2 must contain all u = |K1 ∪ K2| distinct attributes!'],
          ['Case 5: m Simple (1-Attribute) Candidate Keys {A_1}, {A_2}, ..., {A_m}', '2^n − 2^(n − m) = 2^(n − m) × (2^m − 1)', 'Complement Counting: Total subsets (2^n) minus subsets containing NONE of the m key attributes (2^(n−m)).'],
          ['Max Possible Candidate Keys on n Attributes (Sperner’s Theorem)', 'C(n, floor(n / 2))', 'Because no CK can be a subset of another CK (antichain), max CKs occurs when all CKs have size floor(n/2).']
        ] }
      ]
    },
    // Page 7
    {
      blocks: [
        { type: 'h3', text: '5.2.3  Worked Example 5.1: Solving Four GATE Super-Key Counting Problems' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 5.1 | Four Classic GATE CS Super-Key Counting Problems', body: 'Problem 1 (Disjoint Composite CKs): R(A, B, C, D, E, F) has n = 6 attributes and two Candidate Keys: {A, B} (size 2) and {C, D} (size 2).\n• Solution: |SK| = 2^(6−2) + 2^(6−2) − 2^(6−4) = 2^4 + 2^4 − 2^2 = 16 + 16 − 4 = 28 Super Keys.\n\nProblem 2 (Overlapping Composite CKs): R(A, B, C, D, E, F) has n = 6 attributes and two Candidate Keys: {A, B} and {B, C}.\n• Solution: Here p = 2, q = 2, and K1 ∪ K2 = {A, B, C} has size u = 3.\n  |SK| = 2^(6−2) + 2^(6−2) − 2^(6−3) = 16 + 16 − 8 = 24 Super Keys.\n\nProblem 3 (Three Simple CKs — Complement Method): R(A, B, C, D, E) has n = 5 attributes and three simple Candidate Keys: {A}, {B}, and {C} (m = 3).\n• Solution: A subset is a Super Key iff it contains at least one of {A, B, C}. Number of subsets containing NONE of {A, B, C} is 2^(5−3) = 2^2 = 4.\n  |SK| = 2^5 − 2^2 = 32 − 4 = 28 Super Keys.\n\nProblem 4 (Sperner’s Theorem): What is the maximum number of Candidate Keys possible for a relation with n = 6 attributes?\n• Solution: By Sperner’s Theorem, max CKs = C(6, floor(6/2)) = C(6, 3) = (6 × 5 × 4) / (3 × 2 × 1) = 20 Candidate Keys!' },
        { type: 'callout', kind: 'mistake', title: 'COMMON MISTAKE | Inferring Candidate Keys from a Single Snapshot of 4 Rows!', body: 'Looking at a 4-row table where all 4 students happen to have different names ("Asha", "Ravi", "Meera", "Kabir") does NOT prove Name is a Candidate Key! You can only prove from an instance that an attribute is NOT a Super Key (if two rows share the same City = "Patna"); proving it IS a key requires schema-level Functional Dependencies.' }
      ]
    },
    // Page 8
    {
      blocks: [
        { type: 'h2', text: '5.3  Relational Integrity Constraints' },
        { type: 'p', text: 'Relational Integrity Constraints are formal conditions specified on a database schema that restrict the data values that can be stored in any valid instance of the database:' },
        { type: 'h3', text: '5.3.1  Domain Constraints, Key Constraints, and Entity Integrity Rule' },
        { type: 'list', ordered: true, items: [
          'Domain Constraint: Every attribute value t[A_i] in every tuple must be an atomic value from dom(A_i) (enforced via SQL data types, NOT NULL, and CHECK predicates such as CHECK (CGPA BETWEEN 0.00 AND 10.00)).',
          'Key Constraint (Uniqueness): No two distinct tuples in any valid relation instance r(R) can have identical values across all attributes of a Candidate Key.',
          'Entity Integrity Constraint: No attribute participating in the PRIMARY KEY of a base relation is ever allowed to be NULL! Even if a Primary Key is composite—such as (StudentID, SectionID) in Enrollment—NEITHER StudentID NOR SectionID can be NULL. Why? Because if part of a Primary Key were NULL (unknown), we could not uniquely identify the entity or distinguish two tuples!'
        ] },
        { type: 'h3', text: '5.3.2  Referential Integrity Constraint (Foreign Key Rules)' },
        { type: 'p', text: 'Specified between two relations—the Referencing (Child) relation R1 and the Referenced (Parent) relation R2—Referential Integrity states that for every tuple t1 in R1, the Foreign Key value t1[FK] must satisfy one of two conditions:' },
        { type: 'list', ordered: false, items: [
          'Condition 1: Either t1[FK] matches the Primary Key value t2[PK] of some existing tuple t2 in parent relation R2, OR',
          'Condition 2: t1[FK] is wholly NULL (provided the Foreign Key column is not declared NOT NULL and is not part of R1’s Primary Key).'
        ] }
      ]
    },
    // Page 9
    {
      blocks: [
        { type: 'diagram', caption: 'Figure 5.3: Referential Integrity Arrows in UniVerseDB (Child Referencing Tables -> Parent Referenced Tables).', rows: [
          ['Student( _StudentID_, Name, DeptID [FK], CGPA )', '---- DeptID references ---->  Department( _DeptID_, DeptName )  [Kabir has DeptID = NULL -> Valid!]'],
          ['Enrollment( _StudentID_ [FK], _SectionID_ [FK], Grade )', '---- StudentID references ->  Student(_StudentID_)  &  SectionID references -> Section(_SectionID_)'],
          ['Employee( _EmpID_, Name, ManagerID [FK] )', '---- Self-Referencing FK --->  Employee(_EmpID_)  [Top CEO has ManagerID = NULL -> Valid!]']
        ] },
        { type: 'callout', kind: 'exam', title: 'EXAM MASTERCLASS | Debunking the 5 Classic Foreign Key Myths in GATE & Vivas', body: 'Myth 1: "A Foreign Key cannot be NULL." -> FALSE! A Foreign Key CAN be NULL unless explicitly constrained with NOT NULL (e.g., Student Kabir with undeclared department has DeptID = NULL).\nMyth 2: "A Foreign Key cannot have duplicate values." -> FALSE! In a 1:N relationship, 400 students in CSE all have DeptID = 10 in the Student table!\nMyth 3: "A Foreign Key must have the same column name as the referenced Primary Key." -> FALSE! Only the underlying Domain (data type) must match (e.g., ManagerID references EmpID).\nMyth 4: "A Foreign Key must reference a different table." -> FALSE! A Foreign Key can reference the Primary Key of the SAME table (Self-Referencing Foreign Key).\nMyth 5: "An Alternate Key (UNIQUE) cannot be NULL." -> FALSE! Unlike Primary Keys, SQL UNIQUE columns allow NULL values (and in standard PostgreSQL/SQL, allow multiple NULLs!).' }
      ]
    },
    // Page 10
    {
      blocks: [
        { type: 'h2', text: '5.4  Referential Triggered Actions (ON DELETE and ON UPDATE)' },
        { type: 'p', text: 'Which DML operations on a Parent table (Department) or Child table (Student) can violate Referential Integrity, and how does the DBMS respond?' },
        { type: 'table', caption: 'Table 5.2: Complete DML Referential Integrity Violation Matrix (Parent Department vs. Child Student)', headers: ['DML Operation', 'On Parent Table (Department)', 'On Child Table (Student)'], rows: [
          ['INSERT', 'SAFE (Never violates Referential Integrity — a new parent simply has 0 children initially).', 'MAY VIOLATE! If inserted Student has DeptID = 99 and 99 does not exist in Department -> REJECTED!'],
          ['DELETE', 'MAY VIOLATE! Deleting DeptID = 10 while Students still reference DeptID = 10 would leave orphans -> Triggers ON DELETE action!', 'SAFE (Deleting a child row never leaves orphans in the parent table).'],
          ['UPDATE (PK / FK)', 'MAY VIOLATE! Changing DeptID = 10 to 15 while Students reference 10 -> Triggers ON UPDATE action!', 'MAY VIOLATE! Updating Student.DeptID to 99 (non-existent in Department) -> REJECTED!']
        ] },
        { type: 'h3', text: '5.4.1  The Five Standard SQL Referential Actions (ON DELETE / ON UPDATE)' },
        { type: 'list', ordered: true, items: [
          'RESTRICT (or NO ACTION — Default in SQL): Rejects the parent DELETE/UPDATE if any matching child rows exist. (RESTRICT checks immediately; NO ACTION checks at the end of the statement/constraint deferral boundary).',
          'CASCADE: Automatically propagates the parent change to all matching child rows (e.g., ON DELETE CASCADE deletes all matching child rows; ON UPDATE CASCADE updates the child Foreign Key to the new parent PK).',
          'SET NULL: Automatically sets the Foreign Key column in all matching child rows to NULL (valid only if the child FK column is nullable!).',
          'SET DEFAULT: Sets the Foreign Key column in matching child rows to its declared DEFAULT value (which must exist in the parent table).'
        ] }
      ]
    },
    // Page 11
    {
      blocks: [
        { type: 'h3', text: '5.4.2  Worked Example 5.2: Multi-Level Cascading Delete & Self-Referencing Trace' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 5.2 | Tracing Multi-Table Referential Actions (GATE Favorite!)', body: 'Suppose we have three tables:\n• Department(DeptID PK) with rows {10, 20}.\n• Student(StudentID PK, DeptID FK REFERENCES Department ON DELETE SET NULL) with rows: (1, 10), (2, 10), (3, 20).\n• Enrollment(StudentID FK REFERENCES Student ON DELETE CASCADE, CourseID, PK(StudentID, CourseID)) with rows: (1, "CS301"), (2, "CS301"), (3, "EC204").\n\nQuestion A: What happens when we execute DELETE FROM Department WHERE DeptID = 10;?\n• Trace: Department 10 is deleted. Because Student.DeptID has ON DELETE SET NULL, Students 1 and 2 are NOT deleted—their DeptID simply becomes NULL! Because no Student row was deleted, Enrollment is completely unaffected (all 3 enrollment rows remain!).\n\nQuestion B: What if Student.DeptID instead had ON DELETE CASCADE and we executed DELETE FROM Department WHERE DeptID = 10;?\n• Trace: Deleting Department 10 cascades and deletes Students 1 and 2 from Student; deleting Students 1 and 2 in turn triggers Enrollment’s ON DELETE CASCADE, deleting (1, "CS301") and (2, "CS301")! Only Student 3 and (3, "EC204") survive!' },
        { type: 'diagram', caption: 'Figure 5.4: Visual Comparison of RESTRICT (Aborts), CASCADE (Deletes Children), and SET NULL (Unlinks Children) on Parent Delete.', rows: [
          ['DELETE Department(10) + ON DELETE RESTRICT', '---> Transaction ABORTED with Foreign Key Violation Error (All rows unchanged)'],
          ['DELETE Department(10) + ON DELETE CASCADE', '---> Deletes Department(10) AND automatically deletes Student(1) and Student(2)'],
          ['DELETE Department(10) + ON DELETE SET NULL', '---> Deletes Department(10) AND updates Student(1).DeptID = NULL, Student(2).DeptID = NULL']
        ] }
      ]
    },
    // Page 12
    {
      blocks: [
        { type: 'h3', text: '5.4.3  Worked Example 5.3: Complete SQL DDL for UniVerseDB with All Constraint Types' },
        { type: 'code', title: 'Listing 5.1: Production SQL DDL Demonstrating Domain, Primary Key, Alternate Key, and Referential Actions', code: `CREATE TABLE Department (
    DeptID   INT PRIMARY KEY,
    DeptName VARCHAR(60) NOT NULL UNIQUE,               -- Alternate Key
    Building VARCHAR(60) NOT NULL,
    Budget   NUMERIC(12,2) NOT NULL CHECK (Budget > 0)  -- Domain Constraint
);

CREATE TABLE Student (
    StudentID INT PRIMARY KEY,                          -- Entity Integrity (PK)
    RollNo    CHAR(9) NOT NULL UNIQUE,                  -- Alternate Key
    Name      VARCHAR(80) NOT NULL,
    DeptID    INT REFERENCES Department(DeptID)
              ON DELETE SET NULL                        -- Keep student if dept closes
              ON UPDATE CASCADE,                        -- Cascade DeptID renumbering
    CGPA      NUMERIC(3,2) CHECK (CGPA BETWEEN 0.00 AND 10.00),
    City      VARCHAR(50) DEFAULT 'Patna'
);

CREATE TABLE Enrollment (
    StudentID INT REFERENCES Student(StudentID) ON DELETE CASCADE,
    CourseID  VARCHAR(10) NOT NULL,
    Semester  VARCHAR(12) NOT NULL,
    Grade     CHAR(2) CHECK (Grade IN ('A+','A','B','C','D','F','I')),
    PRIMARY KEY (StudentID, CourseID, Semester)         -- Composite Primary Key
);` }
      ]
    },
    // Page 13
    {
      blocks: [
        { type: 'h2', text: '5.5  NULL Semantics and Three-Valued Logic (3VL: TRUE, FALSE, UNKNOWN)' },
        { type: 'p', text: 'In the Relational Model, NULL is NOT zero, NOT an empty string "", and NOT a space—it is a special marker indicating that a value is Unknown, Missing, or Inapplicable. Because comparing anything with an unknown value (=, <>, <, >) yields neither TRUE nor FALSE, SQL uses Kleene’s Three-Valued Logic (3VL) with truth values TRUE (1), FALSE (0), and UNKNOWN (0.5):' },
        { type: 'h3', text: '5.5.1  Complete Truth Tables for SQL 3VL (Memory Trick: T = 1, U = 0.5, F = 0)' },
        { type: 'p', text: 'You never need to memorize 27 truth-table cells! Just assign FALSE = 0, UNKNOWN = 0.5, TRUE = 1 and apply three simple formulas:\n• P AND Q = min(P, Q)\n• P OR Q = max(P, Q)\n• NOT P = 1 − P  (so NOT UNKNOWN = 1 − 0.5 = 0.5 = UNKNOWN!)' },
        { type: 'table', caption: 'Table 5.3: Master Truth Table for SQL Three-Valued Logic (3VL)', headers: ['P', 'Q', 'P AND Q  [min(P, Q)]', 'P OR Q  [max(P, Q)]', 'NOT P  [1 − P]'], rows: [
          ['TRUE (1)', 'TRUE (1)', 'TRUE', 'TRUE', 'FALSE'],
          ['TRUE (1)', 'UNKNOWN (0.5)', 'UNKNOWN', 'TRUE  (Short-circuits to TRUE!)', 'FALSE'],
          ['FALSE (0)', 'UNKNOWN (0.5)', 'FALSE  (Short-circuits to FALSE!)', 'UNKNOWN', 'TRUE'],
          ['UNKNOWN (0.5)', 'UNKNOWN (0.5)', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN  (NOT UNKNOWN is UNKNOWN!)']
        ] }
      ]
    },
    // Page 14
    {
      blocks: [
        { type: 'h3', text: '5.5.2  Worked Example 5.4: Tracing 3VL Queries & The Golden WHERE vs. CHECK Asymmetry' },
        { type: 'callout', kind: 'exam', title: 'GOLDEN EXAM RULE | How WHERE / HAVING vs. CHECK Constraints Treat UNKNOWN', body: '• In a SELECT ... WHERE (or HAVING / JOIN ON) clause: A row is returned ONLY if the predicate evaluates to strictly TRUE! Rows evaluating to FALSE or UNKNOWN are rejected.\n• In a CREATE TABLE ... CHECK (...) constraint: A row is accepted unless the predicate evaluates to strictly FALSE! Therefore, a row evaluating to TRUE or UNKNOWN (due to NULL) PASSES a CHECK constraint!' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 5.4 | Tracing 4 Tricky 3VL Queries on Student (Kabir has DeptID = NULL, CGPA = 6.80)', body: '1. Query: SELECT Name FROM Student WHERE DeptID = 10 OR DeptID <> 10;\n   • For Kabir (DeptID = NULL): (NULL = 10) is UNKNOWN, and (NULL <> 10) is UNKNOWN. UNKNOWN OR UNKNOWN = UNKNOWN!\n   • Since WHERE requires strictly TRUE, Kabir is EXCLUDED! (The Law of the Excluded Middle P ∨ ¬P fails in 3VL!).\n\n2. Query: SELECT Name FROM Student WHERE DeptID = 10 OR CGPA < 7.00;\n   • For Kabir: (NULL = 10) is UNKNOWN, (6.80 < 7.00) is TRUE. UNKNOWN OR TRUE = max(0.5, 1) = TRUE! Kabir IS returned!\n\n3. Query: SELECT Name FROM Student WHERE DeptID NOT IN (10, 20, NULL);\n   • Expands to: DeptID <> 10 AND DeptID <> 20 AND DeptID <> NULL.\n   • For Asha (DeptID = 10): FALSE AND TRUE AND UNKNOWN = min(0, 1, 0.5) = FALSE.\n   • For a student in Dept 30: TRUE AND TRUE AND UNKNOWN = min(1, 1, 0.5) = UNKNOWN!\n   • Result: Returns ZERO rows for the entire table! Never use NOT IN with a nullable list—use NOT EXISTS!\n\n4. CHECK Constraint: CHECK (CGPA >= 5.00) when inserting a student with CGPA = NULL:\n   • (NULL >= 5.00) evaluates to UNKNOWN. Because CHECK rejects only FALSE, the insert SUCCEEDS unless NOT NULL is also specified!' }
      ]
    },
    // Page 15
    {
      blocks: [
        { type: 'h2', text: '5.6  Chapter 5 Summary & One-Page Rapid-Revision Cheat Sheet' },
        { type: 'table', caption: 'Chapter 5 Rapid-Revision Formula & Rule Sheet', headers: ['Concept / Rule', 'Formula / Key Exam Takeaway'], rows: [
          ['Degree vs. Cardinality', 'Degree (Arity, n) = number of columns (schema property). Cardinality (m) = number of rows (instance property).'],
          ['Super Key vs. Candidate Key', 'Super Key = any unique identifier subset. Candidate Key = MINIMAL Super Key (no proper subset is a Super Key).'],
          ['Prime vs. Non-Prime Attribute', 'Prime = belongs to AT LEAST ONE Candidate Key. Non-Prime = belongs to NO Candidate Key.'],
          ['Super Key Count (1 CK of size k)', '2^(n − k) Super Keys.'],
          ['Super Key Count (2 CKs of size p, q)', '2^(n − p) + 2^(n − q) − 2^(n − |K1 ∪ K2|) Super Keys.'],
          ['Max Candidate Keys (Sperner)', 'C(n, floor(n / 2)) maximum possible Candidate Keys on n attributes.'],
          ['Entity Integrity Rule', 'No attribute of a PRIMARY KEY can ever be NULL (not even one column of a composite PK).'],
          ['Referential Integrity Rule', 'Every Foreign Key value must either match an existing parent PK value OR be NULL (if nullable).'],
          ['3VL Truth Formulas', 'Set F = 0, U = 0.5, T = 1. Then P AND Q = min(P, Q); P OR Q = max(P, Q); NOT P = 1 − P.'],
          ['WHERE vs. CHECK with UNKNOWN', 'WHERE keeps only TRUE (rejects UNKNOWN). CHECK rejects only FALSE (accepts UNKNOWN/NULL!).']
        ] }
      ]
    },
    // Page 16
    {
      blocks: [
        { type: 'h2', text: 'Student Revision & Lecture Notes — Chapter 5' },
        { type: 'p', text: 'Use this page to practice Inclusion–Exclusion Super Key counting, the DML Referential Integrity violation matrix, and 3VL truth table evaluations.' },
        { type: 'table', caption: 'Active Recall Practice Grid — Chapter 5', headers: ['Prompt', 'Your Recall Solution'], rows: [
          ['Count Super Keys of R(A,B,C,D,E) with CKs {A} and {B,C}', '2^(5−1) + 2^(5−2) − 2^(5−3) = 16 + 8 − 4 = 20 Super Keys.'],
          ['Which DML operations on Parent & Child can violate FK?', 'Parent: DELETE or UPDATE of PK. Child: INSERT or UPDATE of FK.'],
          ['What does WHERE Col = NULL return?', 'Always 0 rows (UNKNOWN)! Always write WHERE Col IS NULL.'],
          ['What does NOT IN (1, 2, NULL) return?', 'Always 0 rows! Because X <> 1 AND X <> 2 AND UNKNOWN is never TRUE.']
        ] }
      ]
    },
    // Page 17
    {
      blocks: [
        { type: 'h2', text: '5.7  Chapter 5 Exam, GATE & Placement Question Bank' },
        { type: 'h3', text: 'Part A: 10 Multiple-Choice Questions (MCQs)' },
        { type: 'list', ordered: true, items: [
          'Q1. A relation R has 8 attributes and 250 tuples. What are the Degree (Arity) and Cardinality of R, respectively?\n(A) 250 and 8   (B) 8 and 250   (C) 8 and 2^8   (D) 250 and 2000',
          'Q2. Which of the following statements about Keys in the Relational Model is ALWAYS TRUE?\n(A) Every Super Key is a Candidate Key   (B) Every Candidate Key is a Primary Key   (C) Every Candidate Key is a minimal Super Key   (D) A relation can have at most one Candidate Key',
          'Q3. An attribute that is part of an Alternate Key (a Candidate Key not chosen as the Primary Key) is classified as a:\n(A) Non-Prime Attribute   (B) Prime Attribute   (C) Foreign Attribute   (D) Derived Attribute',
          'Q4. Which integrity constraint states that no attribute participating in the Primary Key of a base relation may accept a NULL value?\n(A) Domain Integrity   (B) Referential Integrity   (C) Entity Integrity   (D) Semantic Trigger Integrity',
          'Q5. Which of the following statements about a Foreign Key in a relational table is FALSE?\n(A) A Foreign Key may contain duplicate values across rows   (B) A Foreign Key may contain NULL values if not declared NOT NULL   (C) A Foreign Key can reference the Primary Key of the same table   (D) A Foreign Key must always be the Primary Key of the child table'
        ] }
      ]
    },
    // Page 18
    {
      blocks: [
        { type: 'h3', text: 'Part A: Multiple-Choice Questions (Continued — Q6 to Q10)' },
        { type: 'list', ordered: false, items: [
          '6. Q6. Which pair of DML operations can NEVER cause a Referential Integrity violation?\n(A) INSERT into Child; DELETE from Parent   (B) INSERT into Parent; DELETE from Child   (C) UPDATE PK in Parent; UPDATE FK in Child   (D) DELETE from Parent; INSERT into Child',
          '7. Q7. In SQL Three-Valued Logic (3VL), what is the truth value of the expression: (TRUE AND UNKNOWN) OR (NOT UNKNOWN)?\n(A) TRUE   (B) FALSE   (C) UNKNOWN   (D) Syntax Error',
          '8. Q8. Suppose table T(X INT CHECK (X > 100)) has NO NOT NULL constraint on X. What happens when we run INSERT INTO T VALUES (NULL);?\n(A) Rejected because NULL > 100 is FALSE   (B) Accepted because NULL > 100 is UNKNOWN, and CHECK only rejects FALSE   (C) Rejected by Entity Integrity   (D) X is automatically converted to 101',
          '9. Q9. If a parent row in Department is deleted and the child table Student defines DeptID INT REFERENCES Department(DeptID) ON DELETE SET NULL, what happens to the matching students?\n(A) The DELETE is aborted   (B) The matching Student rows are deleted   (C) The matching Student rows remain, with their DeptID set to NULL   (D) The Student table is dropped',
          '10. Q10. A relation R(A, B, C, D) has a single Candidate Key {A, B}. How many Super Keys does R have?\n(A) 2   (B) 4   (C) 8   (D) 16'
        ] },
        { type: 'h3', text: 'Part B: 5 Short-Answer Questions (2–3 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'B1. Define Degree (Arity) and Cardinality of a relation. If 50 new rows are inserted and 1 new column is added via ALTER TABLE, how do Degree and Cardinality change?',
          'B2. Differentiate clearly between a Super Key, a Candidate Key, a Primary Key, and an Alternate Key with an example.',
          'B3. Explain the Entity Integrity Rule and why even a single attribute of a Composite Primary Key cannot be NULL.',
          'B4. Compare the five SQL Referential Triggered Actions: RESTRICT, NO ACTION, CASCADE, SET NULL, and SET DEFAULT.',
          'B5. Why does SELECT * FROM Student WHERE City = "Patna" OR City <> "Patna" fail to return students whose City is NULL?'
        ] }
      ]
    },
    // Page 19
    {
      blocks: [
        { type: 'h3', text: 'Part C: 3 Long-Answer / Essay Questions (5–10 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'C1. Explain the four mathematical properties of a Relation and compare formal Relational Set Semantics with commercial SQL Bag (Multiset) Semantics.',
          'C2. Discuss Domain Integrity, Entity Integrity, and Referential Integrity in detail. Construct the complete 2×3 DML Violation Matrix (INSERT, DELETE, UPDATE on Parent vs. Child) and explain how the DBMS handles each case.',
          'C3. Explain Kleene’s Three-Valued Logic (3VL) in SQL. Present the truth tables for AND, OR, and NOT, prove why NOT IN with a NULL returns an empty set, and contrast how WHERE and CHECK handle UNKNOWN.'
        ] },
        { type: 'h3', text: 'Part D: 4 Combinatorial & Trace Problems' },
        { type: 'list', ordered: true, items: [
          'D1. (Super-Key Counting Suite): Find the exact number of Super Keys for a relation R(A, B, C, D, E, F, G) with n = 7 attributes under each scenario:\n(a) Only one Candidate Key {A, B, C}.\n(b) Two Candidate Keys {A, B} and {C, D, E}.\n(c) Two overlapping Candidate Keys {A, B, C} and {B, C, D}.\n(d) Three simple Candidate Keys {A}, {B}, and {C}.',
          'D2. (Cascading Self-Referencing Delete Trace): Table Emp(EmpID PK, MgrID FK REFERENCES Emp(EmpID) ON DELETE CASCADE) contains 5 rows: (1, NULL), (2, 1), (3, 1), (4, 2), (5, 4). Which rows remain in Emp after executing DELETE FROM Emp WHERE EmpID = 2;?',
          'D3. (3VL Expression Evaluation): Given A = 10, B = 20, C = NULL, evaluate the exact 3VL truth value (TRUE, FALSE, or UNKNOWN) of:\n(i) (A < B) AND (C = 10)   (ii) (A < B) OR (C = 10)   (iii) NOT (A > B OR C IS NULL)   (iv) (C = C)',
          'D4. (Deduction from Instance): Given a 4-row relation instance R(A, B, C) with rows (1, 10, 5), (2, 10, 6), (3, 20, 5), (4, 30, 7), list which single attributes CANNOT be a Candidate Key and explain why.'
        ] }
      ]
    },
    // Page 20
    {
      blocks: [
        { type: 'h3', text: 'Part E: 5 GATE CS Style Questions (MCQ, MSQ, and NAT)' },
        { type: 'list', ordered: true, items: [
          'E1. [GATE NAT — 2 Marks] A relation R(A1, A2, A3, A4, A5, A6) has 6 attributes. If {A1, A2} and {A2, A3} are the only two Candidate Keys of R, the total number of Super Keys of R is ________.',
          'E2. [GATE NAT — 2 Marks] Consider three tables R1(_A_, B), R2(_C_, A, D), and R3(_E_, C) with the following foreign keys:\n• In R2: A REFERENCES R1(A) ON DELETE CASCADE\n• In R3: C REFERENCES R2(C) ON DELETE SET NULL\nSuppose R1 contains {(1,10), (2,20)}; R2 contains {(100,1,5), (101,1,6), (102,2,7)}; and R3 contains {(500,100), (501,101), (502,102)}. When DELETE FROM R1 WHERE A = 1; is executed, the number of rows deleted from R2 is ________, and the number of rows deleted from R3 is ________.',
          'E3. [GATE MSQ — 2 Marks] Let R(A, B, C, D, E) have Candidate Keys {A, B} and {C}. Which of the following statements are TRUE?\n(A) A, B, and C are Prime Attributes, while D and E are Non-Prime Attributes.\n(B) {A, C} is a Super Key of R, but NOT a Candidate Key.\n(C) The total number of Super Keys of R is 20.\n(D) Attribute C can accept NULL values if {A, B} is chosen as the Primary Key and C is not declared NOT NULL.',
          'E4. [GATE NAT — 2 Marks] Using Sperner’s Theorem, the maximum number of Candidate Keys that any relation schema R with n = 5 attributes can possibly have is ________.',
          'E5. [GATE MCQ — 2 Marks] Table T(id INT PRIMARY KEY, val INT) contains 3 rows: (1, 10), (2, 20), (3, NULL). How many rows are returned by the query:\nSELECT id FROM T WHERE val NOT IN (SELECT val FROM T WHERE id >= 2);\n(A) 3   (B) 2   (C) 1   (D) 0'
        ] }
      ]
    },
    // Page 21
    {
      blocks: [
        { type: 'h3', text: 'Part F: 5 Viva / Technical Placement Interview Questions' },
        { type: 'list', ordered: true, items: [
          'F1. "In PostgreSQL or MySQL, if I create a column Email VARCHAR(100) UNIQUE (without NOT NULL), how many rows can have Email = NULL?"',
          'F2. "When should you use a Surrogate Primary Key (like BIGINT GENERATED ALWAYS AS IDENTITY or UUIDv7) vs. a Natural Business Key?"',
          'F3. "Why is UUIDv4 bad for B+ Tree Primary Key performance compared to auto-increment BIGINT or time-ordered UUIDv7?"',
          'F4. "What is the exact difference between ON DELETE RESTRICT and ON DELETE NO ACTION in SQL?"',
          'F5. "How do you safely rewrite a SQL query that uses NOT IN (subquery) so it never silently returns 0 rows when the subquery contains a NULL?"'
        ] },
        { type: 'h3', text: 'Part G: 3 Hands-On SQL Labs & Part H: 3 "Spot the Mistake" Challenges' },
        { type: 'list', ordered: true, items: [
          'Lab 5.1: Write SQL to test ON DELETE SET NULL vs. ON DELETE CASCADE between Department and Student.',
          'Lab 5.2: Write a query using IS DISTINCT FROM (or COALESCE) to safely compare nullable columns where NULL = NULL should be treated as true.',
          'Lab 5.3: Demonstrate how CHECK (Bonus <= Salary) behaves when Bonus is NULL vs. when Salary is NULL.',
          'Mistake 5.1: A developer writes WHERE ManagerID = NULL to find top-level executives.',
          'Mistake 5.2: A student claims that because {StudentID} is a Candidate Key, {StudentID, Name} is also a Candidate Key.',
          'Mistake 5.3: A student claims that deleting a child row from Enrollment can cause a Foreign Key violation in Student.'
        ] }
      ]
    },
    // Page 22
    {
      blocks: [
        { type: 'h2', text: '5.8  Chapter 5 Complete Answer Key & Worked Solutions' },
        { type: 'h3', text: 'Solutions to Part A: Multiple-Choice Questions (Q1 to Q10)' },
        { type: 'table', caption: 'Answer Key & Detailed Explanations for Part A MCQs', headers: ['Q#', 'Ans', 'Detailed Step-by-Step Explanation'], rows: [
          ['Q1', '(B)', 'Degree (Arity) = number of attributes (8); Cardinality = number of tuples (250).'],
          ['Q2', '(C)', 'By definition, a Candidate Key is a minimal Super Key (no proper subset is a Super Key).'],
          ['Q3', '(B)', 'Any attribute belonging to ANY Candidate Key (including Alternate Keys) is a Prime Attribute.'],
          ['Q4', '(C)', 'Entity Integrity states that no attribute of a Primary Key can be NULL.'],
          ['Q5', '(D)', 'A Foreign Key does NOT need to be the Primary Key of the child table (e.g., DeptID in Student is a non-key attribute).'],
          ['Q6', '(B)', 'Inserting a new Parent row and Deleting an existing Child row can NEVER leave orphan Foreign Keys!'],
          ['Q7', '(C)', '(TRUE AND UNKNOWN) = UNKNOWN; (NOT UNKNOWN) = UNKNOWN; UNKNOWN OR UNKNOWN = UNKNOWN.'],
          ['Q8', '(B)', 'In SQL, CHECK constraints only reject rows where the predicate evaluates to strictly FALSE. UNKNOWN passes!'],
          ['Q9', '(C)', 'ON DELETE SET NULL retains the child Student rows and sets their DeptID foreign key to NULL.'],
          ['Q10', '(B)', 'With n = 4 and 1 CK of size k = 2, number of Super Keys = 2^(4 − 2) = 2^2 = 4 ({AB}, {ABC}, {ABD}, {ABCD}).']
        ] }
      ]
    },
    // Page 23
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part B: Short-Answer Questions (B1 to B5)' },
        { type: 'list', ordered: false, items: [
          'Answer B1 (Degree vs. Cardinality): Degree is the number of columns in the schema; Cardinality is the number of rows in the current instance. Inserting 50 rows increases Cardinality by 50 (Degree unchanged); adding 1 column via ALTER TABLE increases Degree by 1 (Cardinality unchanged).',
          'Answer B2 (SK, CK, PK, Alternate Key): In Student(StudentID, RollNo, Name, City): {StudentID, Name} is a Super Key; {StudentID} and {RollNo} are minimal Super Keys (Candidate Keys); if {StudentID} is chosen as the Primary Key, then {RollNo} becomes an Alternate Key.',
          'Answer B3 (Entity Integrity & Composite PKs): Entity Integrity forbids NULL in any Primary Key attribute because the PK serves as the unique tuple address. If (StudentID, SectionID) allowed (101, NULL), we could not determine which section student 101 enrolled in or whether two (101, NULL) rows represent the same enrollment.',
          'Answer B4 (5 Referential Actions): RESTRICT rejects parent delete/update immediately if children exist; NO ACTION rejects at the end of the statement/deferred check; CASCADE propagates the delete/update to children; SET NULL sets child FKs to NULL; SET DEFAULT sets child FKs to their default parent key.',
          'Answer B5 (Why City = "Patna" OR City <> "Patna" Misses NULLs): When City is NULL, both comparisons evaluate to UNKNOWN, and UNKNOWN OR UNKNOWN = UNKNOWN. Since WHERE filters out UNKNOWN, rows with NULL City are omitted (unless OR City IS NULL is added).'
        ] }
      ]
    },
    // Page 24
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part C (C1–C3) & Part D: Combinatorial & Trace Problems (D1 to D4)' },
        { type: 'callout', kind: 'example', title: 'Worked Solutions D1 | Super-Key Counting Suite on n = 7 Attributes', body: '(a) Single CK {A,B,C} (k = 3): |SK| = 2^(7−3) = 2^4 = 16 Super Keys.\n(b) Disjoint CKs {A,B} (p = 2) and {C,D,E} (q = 3), union size u = 5:\n    |SK| = 2^(7−2) + 2^(7−3) − 2^(7−5) = 32 + 16 − 4 = 44 Super Keys.\n(c) Overlapping CKs {A,B,C} (p = 3) and {B,C,D} (q = 3), union {A,B,C,D} has size u = 4:\n    |SK| = 2^(7−3) + 2^(7−3) − 2^(7−4) = 16 + 16 − 8 = 24 Super Keys.\n(d) Three simple CKs {A}, {B}, {C} (m = 3): |SK| = 2^7 − 2^(7−3) = 128 − 16 = 112 Super Keys.' },
        { type: 'callout', kind: 'example', title: 'Worked Solutions D2, D3, and D4', body: 'Solution D2 (Self-Referencing Cascade Trace):\n• Deleting EmpID = 2 cascades to its direct child (4, 2) [EmpID = 4], which in turn cascades to EmpID = 4’s child (5, 4) [EmpID = 5]!\n• Surviving rows in Emp: (1, NULL) and (3, 1) (2 rows remain; 3 rows deleted).\n\nSolution D3 (3VL Expressions with A=10, B=20, C=NULL):\n• (i) (10 < 20) AND (NULL = 10) -> TRUE AND UNKNOWN = UNKNOWN.\n• (ii) (10 < 20) OR (NULL = 10) -> TRUE OR UNKNOWN = TRUE.\n• (iii) NOT (10 > 20 OR NULL IS NULL) -> NOT (FALSE OR TRUE) = NOT (TRUE) = FALSE.\n• (iv) (NULL = NULL) -> UNKNOWN!\n\nSolution D4 (Deduction from Instance): Attribute B has duplicates (10 appears twice) and Attribute C has duplicates (5 appears twice). Therefore, neither {B} nor {C} can be a Candidate Key! ({A} has distinct values 1,2,3,4 so it is consistent with being a key, though schema FDs are needed to prove it).' }
      ]
    },
    // Page 25
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part E: GATE CS Questions (E1 to E5)' },
        { type: 'table', caption: 'Step-by-Step GATE CS Solutions for Questions E1 to E5', headers: ['GATE Q#', 'Correct Answer', 'Complete Step-by-Step Derivation'], rows: [
          ['E1 (NAT)', '24', 'n = 6, K1 = {A1,A2} (p=2), K2 = {A2,A3} (q=2), K1 ∪ K2 = {A1,A2,A3} (u=3). |SK| = 2^(6−2) + 2^(6−2) − 2^(6−3) = 16 + 16 − 8 = 24.'],
          ['E2 (NAT)', '2 from R2; 0 from R3', 'Deleting A=1 from R1 cascades to R2, deleting rows C=100 and C=101 (2 rows deleted from R2). Because R3 has ON DELETE SET NULL, rows 500 and 501 in R3 are NOT deleted—their C column is simply set to NULL! So 0 rows are deleted from R3.'],
          ['E3 (MSQ)', '(A), (B), (C), (D)', 'All four statements are TRUE! |SK| = 2^(5−2) + 2^(5−1) − 2^(5−3) = 8 + 16 − 4 = 20. And an Alternate Key (UNIQUE) allows NULLs unless declared NOT NULL.'],
          ['E4 (NAT)', '10', 'By Sperner’s Theorem, for n = 5, max Candidate Keys = C(5, floor(5/2)) = C(5, 2) = (5 × 4)/2 = 10.'],
          ['E5 (MCQ)', '(D) 0 rows', 'The subquery returns (20, NULL). For id=1 (val=10): 10 NOT IN (20, NULL) <=> (10 <> 20) AND (10 <> NULL) <=> TRUE AND UNKNOWN = UNKNOWN! Thus 0 rows are returned.']
        ] }
      ]
    },
    // Page 26
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part F: Viva & Technical Placement Interview Questions (F1 to F5)' },
        { type: 'list', ordered: false, items: [
          'Answer F1 (Multiple NULLs in a UNIQUE Column): In standard SQL and PostgreSQL/MySQL, a UNIQUE constraint allows MULTIPLE rows to contain NULL! Why? Because in 3VL, NULL = NULL is UNKNOWN (not TRUE), so two NULLs are not considered equal duplicates! (Note: PostgreSQL 15+ added UNIQUE NULLS NOT DISTINCT if you want at most one NULL).',
          'Answer F2 (Surrogate Key vs. Natural Key): Natural keys (like Email or Phone) can change over a user’s lifetime, forcing expensive ON UPDATE CASCADE updates across all child tables. A compact immutable Surrogate PK (BIGINT IDENTITY) keeps Foreign Keys small (8 bytes) and immune to business changes—while you still place a UNIQUE constraint on the Natural Key!',
          'Answer F3 (Why Random UUIDv4 Hurts B+ Tree Inserts): UUIDv4 values are completely random across the 128-bit space, so every new INSERT lands in a random leaf page of the B+ Tree—causing frequent page splits, buffer pool churn, and random disk I/O. Sequential BIGINT or timestamp-prefixed UUIDv7 always appends to the rightmost B+ Tree leaf page!',
          'Answer F4 (RESTRICT vs. NO ACTION): Both reject deleting/updating a parent row that has children. However, RESTRICT checks immediately before the row change, whereas NO ACTION can be declared DEFERRABLE INITIALLY DEFERRED so constraint checking waits until COMMIT.',
          'Answer F5 (Fixing NOT IN): Replace WHERE x NOT IN (SELECT y FROM S) with either WHERE NOT EXISTS (SELECT 1 FROM S WHERE S.y = x) or filter out NULLs explicitly inside the subquery: WHERE x NOT IN (SELECT y FROM S WHERE y IS NOT NULL).'
        ] }
      ]
    },
    // Page 27
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part G (Labs 5.1–5.3) & Part H ("Spot the Mistake" 5.1–5.3)' },
        { type: 'code', title: 'SQL Solutions for Labs 5.1, 5.2, and 5.3', code: `-- Lab 5.2: Null-Safe Equality Comparison Using IS NOT DISTINCT FROM
SELECT s1.StudentID, s2.StudentID
FROM Student s1
JOIN Student s2 ON s1.StudentID < s2.StudentID
WHERE s1.DeptID IS NOT DISTINCT FROM s2.DeptID;
-- Treats (NULL, NULL) as TRUE (both students have undeclared department)!

-- Safe NOT EXISTS replacement for NOT IN:
SELECT Name FROM Student s
WHERE NOT EXISTS (
    SELECT 1 FROM Department d WHERE d.DeptID = s.DeptID
);` },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solutions 5.1, 5.2, and 5.3', body: '• Mistake 5.1 (WHERE ManagerID = NULL): Always evaluates to UNKNOWN and returns 0 rows! Must write WHERE ManagerID IS NULL.\n• Mistake 5.2 (Confusing Super Key with Candidate Key): Because {StudentID} alone is already a Super Key, {StudentID, Name} is a non-minimal Super Key, NOT a Candidate Key!\n• Mistake 5.3 (Deleting a Child Row Never Violates FK): Deleting from the referencing (child) table Enrollment only removes a reference; it can never create an orphan in the parent Student table.' },
        { type: 'callout', kind: 'concept', title: 'END OF CHAPTER 5 | Up Next: Chapter 6 — Relational Algebra and Relational Calculus', body: 'In Chapter 6, we master the formal query languages behind SQL: Procedural Relational Algebra (σ, π, ∪, −, ×, ρ, Joins, and Division ÷), GATE Cardinality Bounds, and Declarative Tuple/Domain Relational Calculus!' }
      ]
    }
  ]
};

export const CHAPTER_06 = {
  number: 6,
  fileName: 'dbms-chapter-06.pdf',
  downloadName: 'DBMS-Chapter-06-Relational-Algebra-Calculus.pdf',
  partLabel: 'PART II: RELATIONAL MODEL, ALGEBRA & SQL',
  headerPart: 'PART II: RELATIONAL & SQL',
  title: 'Relational Algebra and Relational Calculus',
  themeColor: '#0f6e56',
  themeLight: '#dcf2ec',
  themeBorder: '#4aa38b',
  pageCount: 27,
  whyThisMatters: 'Every time you run a SQL query in PostgreSQL, Oracle, or MySQL, the Query Compiler immediately translates your declarative SQL into a Relational Algebra expression tree so the Query Optimizer can apply algebraic equivalence rules! Mastering Relational Algebra and Relational Calculus gives you X-ray vision into query optimization and is a guaranteed multi-question topic in GATE CS and university exams.',
  prerequisites: 'Chapter 5 (Mathematical Relations, Set Semantics, Keys, and Foreign Keys).',
  objectives: [
    'Contrast Procedural Relational Algebra with Declarative Relational Calculus (TRC and DRC), and explain the Closure Property of Relational Algebra.',
    'Distinguish the 6 Fundamental Operators {σ, π, ∪, −, ×, ρ} from the Derived Operators {∩, ⋈_θ, ⋈, ⋉, ▷, ÷} and express every derived operator using only fundamental operators.',
    'Master Unary operators (Selection σ, Projection π, Rename ρ), Set-Theoretic operators (∪, −, ∩, ×), and write the classic GATE query to find the Maximum and Second-Highest value without aggregate functions!',
    'Analyze Theta Join, Equijoin, Natural Join (including edge cases R ∩ S = ∅ and R = S), Outer Joins, Semijoin (⋉), Antijoin (▷), and the Division Operator (÷) for Universal Quantification ("For All").',
    'Memorize and apply the 12-row GATE CS Master Table of Minimum and Maximum Cardinality Bounds for all relational operations.',
    'Write safe Tuple Relational Calculus (TRC) and Domain Relational Calculus (DRC) formulas and apply Codd’s Theorem.'
  ],
  toc: [
    ['6', 'Relational Algebra and Relational Calculus', '1', true],
    ['6.1', 'Why Learn Relational Algebra and Calculus? (Procedural vs. Declarative)', '3'],
    ['6.1.1', 'The Closure Property & The 6 Fundamental vs. 6 Derived Operators (Table 6.1)', '3', false, true],
    ['6.2', 'Unary Operations: Selection (σ), Projection (π), and Rename (ρ)', '4'],
    ['6.2.1', 'Algebraic Properties of σ and π (Commutativity, Cascade & Duplicate Elimination)', '4', false, true],
    ['6.3', 'Set-Theoretic Operations and Cartesian Product (∪, −, ∩, ×)', '5'],
    ['6.3.1', 'Union Compatibility & Worked Examples 6.1–6.6 (Finding Maximum Without MAX()!)', '5', false, true],
    ['6.4', 'Join Operations: Theta, Equijoin, Natural, Outer, Semijoin (⋉) & Antijoin (▷)', '7'],
    ['6.4.1', 'Natural Join Edge Cases & Semijoin / Antijoin identities', '7', false, true],
    ['6.5', 'The Division Operator (÷): Universal Quantification ("For All")', '9'],
    ['6.5.1', 'Worked Example 6.7: Expressing R ÷ S Using Only {π, ×, −}', '9', false, true],
    ['6.6', 'GATE CS Masterclass: Minimum and Maximum Cardinality Bounds (Table 6.2)', '10'],
    ['6.6.1', 'Worked Example 6.8: Solving GATE Cardinality Bound Problems', '11', false, true],
    ['6.7', 'Extended Relational Algebra (γ, τ, δ) and Query Optimizer Expression Trees', '12'],
    ['6.8', 'Tuple Relational Calculus (TRC) and Domain Relational Calculus (DRC)', '13'],
    ['6.8.1', 'Free vs. Bound Variables, Universal Quantification (∀), Safe Expressions & Codd’s Theorem', '13', false, true],
    ['6.9', 'Master Gallery: Side-by-Side Algebra, TRC, and DRC Worked Examples', '15'],
    ['6.10', 'Chapter 6 Summary & One-Page Rapid-Revision Cheat Sheet', '16'],
    ['6.11', 'Chapter 6 Exam, GATE & Placement Question Bank (Parts A–H)', '18'],
    ['6.12', 'Chapter 6 Complete Answer Key & Worked Solutions', '22']
  ],
  pages: [
    // Page 3
    {
      blocks: [
        { type: 'h2', text: '6.1  Why Learn Relational Algebra and Calculus? (Procedural vs. Declarative)' },
        { type: 'p', text: 'Formal relational query languages fall into two paradigms: Relational Algebra (Procedural—specifies a step-by-step sequence of operator applications to construct the result) and Relational Calculus (Declarative—specifies the logical predicate that result tuples must satisfy).' },
        { type: 'h3', text: '6.1.1  The Closure Property & Fundamental vs. Derived Operators' },
        { type: 'p', text: 'Closure Property: Both the inputs and the output of every Relational Algebra operator are Relations (Sets of Tuples)! Because the output of one operator is a valid relation, operators can be nested arbitrarily into complex Algebraic Expression Trees.' },
        { type: 'table', caption: 'Table 6.1: Complete Reference of the 6 Fundamental Operators and 6 Derived Operators in Relational Algebra', headers: ['Category', 'Operator & Symbol', 'Syntax & Exact Expressive Equivalence'], rows: [
          ['1. Fundamental (Unary)', 'Selection (σ)', 'σ_p(R) — Filters rows satisfying predicate p. Degree = deg(R); 0 <= |σ_p(R)| <= |R|.'],
          ['2. Fundamental (Unary)', 'Projection (π)', 'π_L(R) — Keeps columns in list L and automatically eliminates duplicate tuples!'],
          ['3. Fundamental (Unary)', 'Rename (ρ)', 'ρ_{S(B1..Bn)}(R) — Renames relation R to S and/or aliases attributes (essential for self-joins).'],
          ['4. Fundamental (Set)', 'Union (∪)', 'R ∪ S — Tuples in R or S (requires Union Compatibility; eliminates duplicates).'],
          ['5. Fundamental (Set)', 'Set Difference (−)', 'R − S — Tuples present in R but NOT in S (requires Union Compatibility).'],
          ['6. Fundamental (Binary)', 'Cartesian Product (×)', 'R × S — Pairs every tuple of R with every tuple of S. deg = deg(R)+deg(S); |R × S| = |R|·|S|.'],
          ['Derived Operator 1', 'Intersection (∩)', 'R ∩ S  ≡  R − (R − S)   [Expressed using Set Difference only!]'],
          ['Derived Operator 2', 'Theta Join (⋈_θ)', 'R ⋈_θ S  ≡  σ_θ(R × S)   [Cartesian Product followed by Selection]'],
          ['Derived Operator 3', 'Natural Join (⋈)', 'R ⋈ S  ≡  π_{unique_attrs}(σ_{R.A1=S.A1 ∧ ...}(R × S))   [Equijoin on common columns]'],
          ['Derived Operator 4', 'Left Semijoin (⋉)', 'R ⋉ S  ≡  π_{attrs(R)}(R ⋈ S)   [Tuples of R that have at least one match in S]'],
          ['Derived Operator 5', 'Antijoin (▷ or −⋉)', 'R ▷ S  ≡  R − (R ⋉ S)  ≡  R − π_{attrs(R)}(R ⋈ S)   [Tuples of R with ZERO matches in S]'],
          ['Derived Operator 6', 'Division (÷)', 'R(X,Y) ÷ S(Y)  ≡  π_X(R) − π_X((π_X(R) × S) − R)   ["For All" Universal Quantification!]']
        ] }
      ]
    },
    // Page 4
    {
      blocks: [
        { type: 'h2', text: '6.2  Unary Operations: Selection (σ), Projection (π), and Rename (ρ)' },
        { type: 'diagram', caption: 'Figure 6.1: Visualizing Selection σ (Horizontal Row Slicing), Projection π (Vertical Column Slicing + Deduplication), and Pipelining π(σ(R)).', rows: [
          ['Selection σ_{CGPA > 8.0}(Student)', 'Slices HORIZONTALLY: Keeps all 5 columns, returns only rows where CGPA > 8.0 (Asha, Meera).'],
          ['Projection π_{City}(Student)', 'Slices VERTICALLY: Keeps only City column AND removes duplicate "Patna" -> {"Patna", "Delhi", "Jaipur"} (3 rows, not 4!).'],
          ['Composed Pipeline π_{Name, CGPA}(σ_{DeptID = 10}(Student))', 'First filters CSE students (Asha, Ravi), then projects (Name, CGPA).']
        ] },
        { type: 'h3', text: '6.2.1  Key Algebraic Properties of σ and π (Used by Query Optimizers)' },
        { type: 'list', ordered: true, items: [
          'Selection Is Commutative: σ_{p1}(σ_{p2}(R)) ≡ σ_{p2}(σ_{p1}(R)) ≡ σ_{p1 ∧ p2}(R).',
          'Cascade of Projections: π_{L1}(π_{L2}(R)) ≡ π_{L1}(R) provided L1 ⊆ L2. Note: Projection is NOT commutative!',
          'Pushing Selection Below Projection: σ_p(π_L(R)) ≡ π_L(σ_p(R)) ONLY IF every attribute referenced in predicate p is present in the projection list L!',
          'Duplicate Elimination in Pure π vs. SQL SELECT: Pure Relational Algebra π_L(R) ALWAYS eliminates duplicate tuples (Set semantics) and therefore corresponds to SQL SELECT DISTINCT L FROM R, NOT plain SELECT L FROM R!'
        ] }
      ]
    },
    // Page 5
    {
      blocks: [
        { type: 'h2', text: '6.3  Set-Theoretic Operations and Cartesian Product (∪, −, ∩, ×)' },
        { type: 'h3', text: '6.3.1  Union Compatibility (Type Compatibility) Requirement' },
        { type: 'p', text: 'For R ∪ S, R − S, and R ∩ S to be valid, relations R and S MUST be Union-Compatible: (1) They must have the exact same Degree deg(R) = deg(S), and (2) For every column position i (1 <= i <= n), dom(A_i) of R must be compatible with dom(B_i) of S.' },
        { type: 'list', ordered: false, items: [
          'Commutativity & Associativity: Union (∪) and Intersection (∩) are both commutative (R ∪ S = S ∪ R) and associative. Set Difference (−) is NEITHER commutative (R − S ≠ S − R) NOR associative!',
          'Cartesian Product (×): Does NOT require Union Compatibility. If R has n1 columns and m1 rows, and S has n2 columns and m2 rows, then R × S has (n1 + n2) columns and (m1 × m2) rows.'
        ] },
        { type: 'h3', text: '6.3.2  Worked Examples 6.1–6.6: Finding Maximum & Second-Highest Without Aggregation!' },
        { type: 'callout', kind: 'example', title: 'GATE CLASSIC (Worked Example 6.5) | Finding the Maximum CGPA in Pure Relational Algebra (Without MAX()!)', body: 'How do you find the highest CGPA in Student(StudentID, Name, CGPA) when standard Relational Algebra has NO aggregate functions (MAX, MIN, COUNT)?\n\nKey Insight: We CAN easily find all CGPAs that are NOT the maximum—namely, any CGPA that is strictly smaller than some other student’s CGPA in a self-Cartesian product! Subtracting the "non-maximum" CGPAs from "all CGPAs" leaves the Maximum CGPA!\n\nStep 1 (All CGPAs):  A = π_{CGPA}(Student)\nStep 2 (Strictly Smaller / Non-Max CGPAs via Rename ρ):  B = π_{s1.CGPA}( σ_{s1.CGPA < s2.CGPA}( ρ_{s1}(Student) × ρ_{s2}(Student) ) )\nStep 3 (Maximum CGPA = All − Non-Max):\n   Max_CGPA = π_{CGPA}(Student) − π_{s1.CGPA}( σ_{s1.CGPA < s2.CGPA}( ρ_{s1}(Student) × ρ_{s2}(Student) ) )\n\nExtension (Worked Example 6.6 — Finding the Second-Highest CGPA):\nLet Student_Rem = σ_{CGPA < Max_CGPA}(Student) (or subtract Max_CGPA from all CGPAs: C_rem = A − Max_CGPA), and apply the exact same "All − Strictly Smaller" pattern to C_rem!' }
      ]
    },
    // Page 6
    {
      blocks: [
        { type: 'h2', text: '6.4  Join Operations: Theta, Equijoin, Natural, Outer, Semijoin & Antijoin' },
        { type: 'h3', text: '6.4.1  Theta Join (⋈_θ), Equijoin, and Natural Join (⋈)' },
        { type: 'list', ordered: true, items: [
          'Theta Join (R ⋈_θ S ≡ σ_θ(R × S)): Combines tuples from R and S satisfying an arbitrary comparison condition θ. Retains all deg(R) + deg(S) columns.',
          'Equijoin: A Theta Join where the condition θ consists exclusively of equality (=) comparisons. Still retains duplicate join columns (both R.DeptID and S.DeptID appear).',
          'Natural Join (R ⋈ S): An Equijoin on ALL attributes that have the SAME NAME in both R and S, followed by projecting out the duplicate common columns so each common attribute appears only once! Degree of R ⋈ S = deg(R) + deg(S) − |attrs(R) ∩ attrs(S)|.'
        ] },
        { type: 'callout', kind: 'exam', title: 'TWO FAMOUS GATE TRAPS ON NATURAL JOIN (R ⋈ S)', body: 'Trap 1 (Disjoint Schemas — Zero Common Attributes): If attrs(R) ∩ attrs(S) = ∅ (R and S share NO column names), what is R ⋈ S?\n• Answer: It degenerates into the full Cartesian Product R × S (NOT an empty set)!\n\nTrap 2 (Identical Schemas — All Attributes in Common): If attrs(R) = attrs(S) (R and S have the exact same columns), what is R ⋈ S?\n• Answer: It equals the Set Intersection R ∩ S!' },
        { type: 'h3', text: '6.4.2  Outer Joins, Left Semijoin (⋉), and Antijoin (▷)' },
        { type: 'list', ordered: false, items: [
          'Left / Right / Full Outer Join (⟕, ⟖, ⟗): Preserves "dangling tuples" (rows that have no match in the other table) by padding missing attributes with NULL.',
          'Left Semijoin (R ⋉ S ≡ π_{attrs(R)}(R ⋈ S)): Returns tuples of R that match at least one tuple in S, without duplicating R tuples even if S has 50 matching rows! Used in distributed query optimization and SQL WHERE EXISTS.',
          'Antijoin (R ▷ S ≡ R − (R ⋉ S)): Returns tuples of R that match ZERO tuples in S (equivalent to SQL WHERE NOT EXISTS). Note: R ⋉ S ≠ S ⋉ R!'
        ] }
      ]
    },
    // Page 7
    {
      blocks: [
        { type: 'diagram', caption: 'Figure 6.2: Tuple-by-Tuple Behavior of Inner Join, Left Outer Join, Semijoin (⋉), and Antijoin (▷) on Student and Enrollment.', rows: [
          ['Input R = Student {(1,Asha), (2,Ravi), (4,Kabir)}', 'Input S = Enrollment {(1,CS301), (1,CS201), (2,CS301)}  [Kabir has 0 enrollments; Asha has 2]'],
          ['Inner Natural Join (R ⋈ S)', 'Returns 3 rows: (1,Asha,CS301), (1,Asha,CS201), (2,Ravi,CS301)  [Kabir dropped; Asha duplicated]'],
          ['Left Outer Join (R ⟕ S)', 'Returns 4 rows: (1,Asha,CS301), (1,Asha,CS201), (2,Ravi,CS301), (4,Kabir,NULL)'],
          ['Left Semijoin (R ⋉ S)  vs.  Antijoin (R ▷ S)', 'R ⋉ S = {(1,Asha), (2,Ravi)} (Asha appears ONCE!)  |  R ▷ S = {(4,Kabir)} (Unenrolled students!)']
        ] },
        { type: 'h2', text: '6.5  The Division Operator (÷): Universal Quantification ("For All")' },
        { type: 'p', text: 'Whenever an English query contains the words "Find students who have taken ALL courses offered by CSE" or "Find suppliers who supply EVERY part," the Relational Algebra operator is Division (R ÷ S)!' },
        { type: 'callout', kind: 'concept', title: 'CONCEPT | Formal Definition of Division R(X, Y) ÷ S(Y)', body: 'Let R(X, Y) be a relation over attribute sets X and Y, and let S(Y) be a relation over Y. The division R ÷ S returns a relation over attribute set X containing every x-value such that for EVERY tuple y ∈ S, the pair (x, y) is present in R:\n   R ÷ S = { t[X] | t ∈ R  ∧  ∀ s ∈ S,  <t[X], s[Y]> ∈ R }\nWhy is it called Division? Because it is the inverse of Cartesian Product: (R × S) ÷ S = R, and for any Q = R ÷ S, Q is the largest relation satisfying Q × S ⊆ R (just like integer division q = a ÷ b satisfies q × b <= a)!' }
      ]
    },
    // Page 8
    {
      blocks: [
        { type: 'diagram', caption: 'Figure 6.3: Visual Trace of Division R(StudentID, CourseID) ÷ S(CourseID) to find Students Enrolled in ALL Required Courses.', rows: [
          ['Dividend R(StudentID, CourseID):', '{ (1, CS301), (1, CS201), (1, CS101),  (2, CS301),  (3, CS301), (3, CS201) }'],
          ['Divisor S(CourseID):', '{ (CS301), (CS201) }   <--- Must match BOTH CS301 and CS201'],
          ['Quotient Result R ÷ S (over StudentID):', '{ (1), (3) }   [Student 1 has {CS301,CS201,CS101} ⊇ S; Student 3 has {CS301,CS201} ⊇ S; Student 2 misses CS201]']
        ] },
        { type: 'h3', text: '6.5.1  Worked Example 6.7: Expressing Division (R ÷ S) Using Only {π, ×, −}' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 6.7 | 3-Step Derivation of R(X, Y) ÷ S(Y) Using Fundamental Operators', body: 'How do we express R(X, Y) ÷ S(Y) using only Projection (π), Cartesian Product (×), and Set Difference (−)?\n\nStep 1 (All Candidate X-Values and All Ideal (X, Y) Pairs):\n• Candidates = π_X(R)\n• Ideal_Pairs = π_X(R) × S   (Every candidate student paired with EVERY required course in S).\n\nStep 2 (Find the "Disqualified" X-Values that Are MISSING at Least One Y in S):\n• Missing_Pairs = (π_X(R) × S) − R   (Pairs that SHOULD exist if x took all courses, but are missing from R).\n• Disqualified_X = π_X( (π_X(R) × S) − R )   (Students who missed at least one course in S).\n\nStep 3 (Subtract Disqualified X-Values from All Candidate X-Values):\n   R ÷ S  ≡  π_X(R) − π_X( (π_X(R) × S) − R )\n\nNotice how this double Set Difference (− ... −) mirrors the SQL double NOT EXISTS pattern for "For All" queries!' }
      ]
    },
    // Page 9
    {
      blocks: [
        { type: 'h2', text: '6.6  GATE CS Masterclass: Minimum and Maximum Cardinality Bounds' },
        { type: 'p', text: 'Let relation R have m tuples (|R| = m) and relation S have n tuples (|S| = n). Memorize this 12-row GATE CS Master Table of exact minimum and maximum output cardinalities:' },
        { type: 'table', caption: 'Table 6.2: GATE CS Master Reference Table — Minimum and Maximum Cardinality Bounds (|R| = m, |S| = n)', headers: ['Relational Operation', 'Minimum Cardinality (Min Rows)', 'Maximum Cardinality (Max Rows)', 'Condition for Min / Max'], rows: [
          ['1. Selection σ_p(R)', '0', 'm', 'Min when 0 rows match p; Max when all m rows match p.'],
          ['2. Projection π_L(R) (Non-Key L, m >= 1)', '1', 'm', 'Min = 1 if all m rows share the exact same value on L; Max = m if all distinct (or L contains a Super Key -> always m!).'],
          ['3. Union R ∪ S', 'max(m, n)', 'm + n', 'Min when one relation is a subset of the other; Max when R and S are completely disjoint.'],
          ['4. Intersection R ∩ S', '0', 'min(m, n)', 'Min when R and S are disjoint; Max when the smaller relation is a subset of the larger.'],
          ['5. Set Difference R − S', 'max(0, m − n)', 'm', 'Min when as many tuples of S as possible belong to R; Max when R and S are disjoint.'],
          ['6. Cartesian Product R × S', 'm × n', 'm × n', 'Always exactly m × n tuples.'],
          ['7. Natural / Theta Join R ⋈ S (No Key/FK)', '0', 'm × n', 'Min = 0 (no matching join values); Max = m × n (all tuples of R and S share the same join value!).'],
          ['8. Join R ⋈ S where Join Attr is PK of S', '0', 'm', 'Each of the m tuples in R can match at most 1 tuple in S (if FK is nullable/unconstrained).'],
          ['9. Join R ⋈ S where R.FK (NOT NULL) -> S.PK', 'm', 'm', 'Every tuple of R MUST match exactly 1 tuple of S -> output is ALWAYS exactly m!'],
          ['10. Left Outer Join R ⟕ S (General)', 'm', 'm × n', 'All m rows of R are preserved at minimum; Max = m × n if all rows match every row of S.'],
          ['11. Full Outer Join R ⟗ S (General)', 'max(m, n)', 'm × n  (or m + n if 0 matches)', 'If 0 rows match, yields m + n padded rows; if all m rows match all n rows, yields m × n rows.'],
          ['12. Division R(X,Y) ÷ S(Y) (|S| = n >= 1)', '0', 'floor(m / n)', 'Each winning x-value requires at least n distinct tuples in R -> at most floor(m / n) winners!']
        ] }
      ]
    },
    // Page 10
    {
      blocks: [
        { type: 'h3', text: '6.6.1  Worked Example 6.8: Solving GATE Cardinality Bound Problems' },
        { type: 'callout', kind: 'example', title: 'WORKED EXAMPLE 6.8 | Three High-Yield GATE Cardinality Calculations', body: 'Case 1: Let |R| = 40 and |S| = 30 (Union-Compatible). Find the Min and Max cardinality of R ∪ S, R ∩ S, and R − S.\n• R ∪ S: Min = max(40, 30) = 40;  Max = 40 + 30 = 70.\n• R ∩ S: Min = 0;                 Max = min(40, 30) = 30.\n• R − S: Min = max(0, 40 − 30) = 10; Max = 40.\n\nCase 2 (Foreign Key Join): Student has m = 500 rows and Department has n = 12 rows. Student.DeptID is a Foreign Key referencing Department.DeptID:\n• Subcase 2A (DeptID is NOT NULL): Every student matches exactly 1 department -> Min = 500, Max = 500!\n• Subcase 2B (DeptID allows NULLs): If all 500 students have DeptID = NULL, 0 rows match -> Min = 0, Max = 500!\n\nCase 3 (Division Bound): Enrollment(StudentID, CourseID) has m = 85 rows, and Required_Courses(CourseID) has n = 6 rows. What is the maximum number of rows in Enrollment ÷ Required_Courses?\n• Max rows = floor(85 / 6) = 14 students!' }
      ]
    },
    // Page 11
    {
      blocks: [
        { type: 'h2', text: '6.7  Extended Relational Algebra (γ, τ, δ) and Expression Trees' },
        { type: 'p', text: 'To model modern SQL features (GROUP BY, aggregate functions, ORDER BY, and bag deduplication), database engines use three Extended Relational Algebra operators:' },
        { type: 'list', ordered: true, items: [
          'Grouping and Aggregation Operator ( _{G1, G2} γ _{F1(A1), F2(A2)} (R) ): Partition tuples of R into groups sharing the same values on grouping attributes (G1, G2), and compute aggregate functions (COUNT, SUM, AVG, MIN, MAX) per group. If the left subscript G is omitted, the entire relation is treated as a single group.',
          'Sorting Operator ( τ_{A1 ASC, A2 DESC}(R) ): Orders tuples for final display or Merge-Join pipelines.',
          'Duplicate Elimination Operator ( δ(R) ): Converts a Bag (Multiset) into a Set (models SQL DISTINCT).'
        ] },
        { type: 'diagram', caption: 'Figure 6.4: Query Optimizer Heuristic Pushdown — Unoptimized Algebra Tree vs. Optimized Tree (Selection & Projection Pushdown).', rows: [
          ['UNOPTIMIZED TREE (Canonical Parse Tree):', 'π_{Name}( σ_{DeptName="CSE" ∧ CGPA > 8.5}( Student × Department ) )  --> Computes full 50,000 × 20 = 1,000,000 Cartesian product first!'],
          ['OPTIMIZED TREE (After Selection & Projection Pushdown):', 'π_{Name}( (π_{Name,DeptID}(σ_{CGPA > 8.5}(Student)))  ⋈_{DeptID}  (π_{DeptID}(σ_{DeptName="CSE"}(Department))) )  --> Filters tiny sets BEFORE join!']
        ] }
      ]
    },
    // Page 12
    {
      blocks: [
        { type: 'h2', text: '6.8  Tuple Relational Calculus (TRC) and Domain Relational Calculus (DRC)' },
        { type: 'p', text: 'Unlike Procedural Relational Algebra (which specifies how to apply operators in order), Relational Calculus is a Declarative language based on First-Order Predicate Logic—the direct theoretical inspiration for SQL!' },
        { type: 'h3', text: '6.8.1  Tuple Relational Calculus (TRC): { t | P(t) }' },
        { type: 'p', text: 'In TRC, variables range over Tuples (rows). A query has the form { t | P(t) }, meaning "the set of all tuples t such that predicate P(t) is true":' },
        { type: 'list', ordered: true, items: [
          'Free vs. Bound Tuple Variables: The variable t to the left of the bar "|" is the only FREE variable! Every other tuple variable introduced inside P(t) MUST be bound by an Existential Quantifier (∃s ∈ R) or a Universal Quantifier (∀s ∈ R).',
          'Logical Equivalence for Universal Quantification (∀) and Implication (⇒): In TRC/DRC and GATE exams, remember:\n• P ⇒ Q  ≡  ¬P ∨ Q   (Material Implication)\n• ∀x (P(x))  ≡  ¬∃x (¬P(x))   (De Morgan’s Quantifier Law — "All courses are passed" ≡ "There does NOT exist a course that is NOT passed").',
          'Safe vs. Unsafe TRC Expressions (Domain Independence): An expression like { t | ¬Student(t) } ("all tuples in the universe that are NOT students") is UNSAFE because it returns an infinite set! A TRC expression is SAFE iff every value in the result tuples comes from the Active Domain DOM(P) of constants and relations appearing in P.',
          'Domain Relational Calculus (DRC): Variables range over individual Attribute Domains (columns) rather than whole tuples: { <x1, x2, ..., xn> | P(x1, x2, ..., xn) }. Mirrors QBE (Query-By-Example).'
        ] },
        { type: 'callout', kind: 'concept', title: 'CODD’S THEOREM (1972) | Relational Completeness', body: 'E.F. Codd proved that Relational Algebra (using the 6 fundamental operators), Safe Tuple Relational Calculus (TRC), and Safe Domain Relational Calculus (DRC) have the EXACT SAME expressive power! Any query expressible in one can be translated into the other two. Any query language at least as expressive as these three is called Relationally Complete.' }
      ]
    },
    // Page 13
    {
      blocks: [
        { type: 'h2', text: '6.9  Master Gallery: Side-by-Side Algebra, TRC, and DRC Worked Examples' },
        { type: 'table', caption: 'Side-by-Side Translation of Core Queries Across Relational Algebra, TRC, and DRC', headers: ['English Query on UniVerseDB', 'Relational Algebra Expression', 'Tuple Relational Calculus (TRC) & Domain Calculus (DRC)'], rows: [
          ['1. Names of students in Dept 10 with CGPA > 8.5', 'π_{Name}(σ_{DeptID=10 ∧ CGPA>8.5}(Student))', 'TRC: { t.Name | Student(t) ∧ t.DeptID = 10 ∧ t.CGPA > 8.5 }\nDRC: { <n> | ∃id,d,c,city (Student(id,n,d,c,city) ∧ d=10 ∧ c>8.5) }'],
          ['2. Names of students enrolled in course "CS301"', 'π_{Name}(Student ⋈ σ_{CourseID="CS301"}(Enrollment))', 'TRC: { t.Name | Student(t) ∧ ∃e (Enrollment(e) ∧ e.StudentID = t.StudentID ∧ e.CourseID = "CS301") }'],
          ['3. Names of students NOT enrolled in ANY course (Antijoin)', 'π_{Name}(Student ▷ Enrollment)\n≡ π_{Name}(Student) − π_{Name}(Student ⋈ Enrollment)', 'TRC: { t.Name | Student(t) ∧ ¬∃e (Enrollment(e) ∧ e.StudentID = t.StudentID) }'],
          ['4. Students enrolled in ALL courses of Dept 10 (Division ÷)', 'π_{StudentID,CourseID}(Enrollment) ÷ π_{CourseID}(σ_{DeptID=10}(Course))', 'TRC: { t.StudentID | Student(t) ∧ ∀c ( (Course(c) ∧ c.DeptID=10) ⇒ ∃e (Enrollment(e) ∧ e.StudentID=t.StudentID ∧ e.CourseID=c.CourseID) ) }']
        ] },
        { type: 'callout', kind: 'exam', title: 'EXAM CHECKPOINT | Why Universal Quantification Always Uses Implication (⇒), Never AND (∧)!', body: 'In Query 4 ("for all courses c in Dept 10, the student is enrolled in c"), students often write:\n   ∀c ( Course(c) ∧ c.DeptID = 10 ∧ ∃e (...) )   <-- WRONG!\nWhy is AND wrong with ∀c? Because ∀c requires the formula to be true for EVERY course c in the database—and as soon as c is an ECE course (DeptID = 20), (c.DeptID = 10) is FALSE, making the entire AND expression FALSE! Always use:\n   • Existential (∃):  ∃c ( Condition(c) ∧ Action(c) )\n   • Universal (∀):    ∀c ( Condition(c) ⇒ Action(c) )' }
      ]
    },
    // Page 14
    {
      blocks: [
        { type: 'h2', text: '6.10  Chapter 6 Summary & One-Page Rapid-Revision Cheat Sheet' },
        { type: 'table', caption: 'Chapter 6 Rapid-Revision Formula & Equivalence Sheet', headers: ['Topic / Operator', 'Core Exam Formula / Equivalence'], rows: [
          ['6 Fundamental Operators', '{ σ (Select), π (Project), ∪ (Union), − (Set Diff), × (Cartesian Product), ρ (Rename) }.'],
          ['6 Derived Operators', '{ ∩ (Intersect), ⋈_θ (Theta Join), ⋈ (Natural Join), ⋉ (Semijoin), ▷ (Antijoin), ÷ (Division) }.'],
          ['Intersection Identity', 'R ∩ S  ≡  R − (R − S)'],
          ['Division Identity (R ÷ S)', 'R(X,Y) ÷ S(Y)  ≡  π_X(R) − π_X( (π_X(R) × S) − R )'],
          ['Finding Max Value in Algebra', 'π_A(R) − π_{r1.A}( σ_{r1.A < r2.A}( ρ_{r1}(R) × ρ_{r2}(R) ) )'],
          ['Natural Join Edge Cases', 'If attrs(R) ∩ attrs(S) = ∅ => R ⋈ S = R × S. If attrs(R) = attrs(S) => R ⋈ S = R ∩ S.'],
          ['Cardinality of R ⋈ S (FK -> PK)', 'If R.FK (NOT NULL) references S.PK: Min = |R|, Max = |R|. If R.FK is nullable: Min = 0, Max = |R|.'],
          ['TRC Universal Quantification', '∀x (P(x) ⇒ Q(x))  ≡  ∀x (¬P(x) ∨ Q(x))  ≡  ¬∃x (P(x) ∧ ¬Q(x)).'],
          ['Safe TRC / DRC Expression', 'Guarantees a finite output set whose values come exclusively from the Active Domain DOM(P).']
        ] }
      ]
    },
    // Page 15
    {
      blocks: [
        { type: 'h2', text: 'Student Revision & Lecture Notes — Chapter 6' },
        { type: 'p', text: 'Use this page to practice writing the Division identity, the Maximum-without-aggregation expression, and the 12-row GATE Cardinality Bound formulas.' },
        { type: 'table', caption: 'Active Recall Practice Grid — Chapter 6', headers: ['Question Prompt', 'Your Recall Formula'], rows: [
          ['Write R ∩ S using only fundamental operators', 'R − (R − S)'],
          ['Write R(A,B) ÷ S(B) using only {π, ×, −}', 'π_A(R) − π_A((π_A(R) × S) − R)'],
          ['Min & Max rows of R(40) − S(15)', 'Min = max(0, 40 − 15) = 25;  Max = 40.'],
          ['Why must ∀x use (P(x) ⇒ Q(x)) while ∃x uses (P(x) ∧ Q(x))?', '∀x (P ∧ Q) fails as soon as any tuple does not satisfy P; P ⇒ Q is vacuously true when P is false!']
        ] }
      ]
    },
    // Page 16
    {
      blocks: [
        { type: 'h2', text: '6.11  Chapter 6 Exam, GATE & Placement Question Bank' },
        { type: 'h3', text: 'Part A: 10 Multiple-Choice Questions (MCQs)' },
        { type: 'list', ordered: true, items: [
          'Q1. Which of the following sets of Relational Algebra operators is a minimal complete (fundamental) set from which all other standard relational algebra operators can be derived?\n(A) {σ, π, ∪, ∩, ×}   (B) {σ, π, ∪, −, ×, ρ}   (C) {σ, π, ⋈, ÷}   (D) {σ, π, ∪, ÷}',
          'Q2. Which of the following Relational Algebra operators is NOT commutative?\n(A) Selection: σ_p1(σ_p2(R))   (B) Natural Join: R ⋈ S   (C) Set Difference: R − S   (D) Set Intersection: R ∩ S',
          'Q3. Let R(A, B) and S(C, D) be two relations with no common attribute names (attrs(R) ∩ attrs(S) = ∅). If |R| = 10 and |S| = 20, how many tuples are in the Natural Join R ⋈ S?\n(A) 0   (B) 10   (C) 20   (D) 200',
          'Q4. Which Relational Algebra expression correctly represents the Division operation R(X, Y) ÷ S(Y)?\n(A) π_X(R) − π_X(R × S)   (B) π_X(R) − π_X((π_X(R) × S) − R)   (C) π_X(R × S) − π_X(R)   (D) R − (π_X(R) × S)',
          'Q5. Let R have m = 50 tuples and S have n = 35 tuples, where R and S are union-compatible. What are the minimum and maximum possible number of tuples in R − S?\n(A) 0 and 50   (B) 15 and 50   (C) 15 and 35   (D) 0 and 15'
        ] }
      ]
    },
    // Page 17
    {
      blocks: [
        { type: 'h3', text: 'Part A: Multiple-Choice Questions (Continued — Q6 to Q10)' },
        { type: 'list', ordered: false, items: [
          '6. Q6. What does the Relational Algebra expression π_A(R) − π_{r1.A}(σ_{r1.A < r2.A}(ρ_{r1}(R) × ρ_{r2}(R))) compute?\n(A) The minimum value of attribute A in R   (B) The maximum value of attribute A in R   (C) All duplicate values of A in R   (D) An empty set',
          '7. Q7. For any two relations R and S, the Left Semijoin R ⋉ S is defined as:\n(A) π_{attrs(S)}(R ⋈ S)   (B) π_{attrs(R)}(R ⋈ S)   (C) R − π_{attrs(R)}(R ⋈ S)   (D) R ⟕ S',
          '8. Q8. Which of the following Tuple Relational Calculus (TRC) expressions is UNSAFE (not domain-independent)?\n(A) { t | Student(t) ∧ t.CGPA > 9.0 }   (B) { t | ¬Student(t) }   (C) { t | Student(t) ∧ ¬∃e (Enrollment(e) ∧ e.StudentID = t.StudentID) }   (D) { t | Department(t) }',
          '9. Q9. According to Codd’s Theorem, a relational query language is said to be Relationally Complete if it is at least as expressive as:\n(A) CODASYL Network Pointers   (B) Safe Tuple Relational Calculus / Standard Relational Algebra   (C) Regular Expressions   (D) Key-Value Hash Lookups',
          '10. Q10. Let R(A, B, C) have 100 tuples, where {A, B} is a Candidate Key. How many tuples are returned by π_{A, B}(R)?\n(A) Between 1 and 100   (B) Exactly 100   (C) At most 50   (D) 0'
        ] },
        { type: 'h3', text: 'Part B: 5 Short-Answer Questions (2–3 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'B1. Explain the Closure Property of Relational Algebra and why it is essential for query optimization.',
          'B2. State the two conditions required for two relations R and S to be Union-Compatible.',
          'B3. Compare Theta Join, Equijoin, and Natural Join with an example, noting the degree (column count) of each.',
          'B4. Why is Projection π_L(R) in Relational Algebra NOT identical to SELECT L FROM R in SQL?',
          'B5. Define a Safe TRC expression and explain why { t | ¬(t ∈ Student) } is unsafe.'
        ] }
      ]
    },
    // Page 18
    {
      blocks: [
        { type: 'h3', text: 'Part C: 3 Long-Answer / Essay Questions (5–10 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'C1. List the 6 Fundamental Operators and 6 Derived Operators of Relational Algebra. Show step-by-step how Intersection (∩), Theta Join (⋈_θ), Semijoin (⋉), Antijoin (▷), and Division (÷) are rewritten using only the 6 fundamental operators.',
          'C2. Explain the Division Operator (R ÷ S) in detail with a full numerical trace on Enrollment(StudentID, CourseID) and CoreCourses(CourseID). Derive its fundamental identity and show its equivalent SQL query.',
          'C3. Compare Tuple Relational Calculus (TRC) and Domain Relational Calculus (DRC) with Relational Algebra. Write 4 UniVerseDB queries (Filter, Join, Antijoin, and Universal Quantification) across all three formalisms.'
        ] },
        { type: 'h3', text: 'Part D: 4 Algebraic Expression & Cardinality Problems' },
        { type: 'list', ordered: true, items: [
          'D1. (Writing 4 UniVerseDB Queries in Relational Algebra): Given Student(_SID_, Name, DeptID, CGPA), Course(_CID_, Title, DeptID), and Enrollment(_SID_, _CID_, Grade), write Relational Algebra expressions for:\n(a) Names of students who earned Grade "A+" in course "CS301".\n(b) Names of students who have enrolled in at least one course offered by DeptID = 10 AND at least one course offered by DeptID = 20.\n(c) Names of students who have NEVER received Grade "F" in any course.\n(d) StudentIDs of students who have taken EVERY course offered by DeptID = 10.',
          'D2. (Finding Minimum and Maximum Without Aggregate Operators): Write pure Relational Algebra expressions to find: (a) the lowest (minimum) CGPA in Student, and (b) the names of students who hold the highest CGPA.',
          'D3. (Cardinality Bounds Suite): Let |R| = 120 and |S| = 40. Compute [Min, Max] cardinality for: (i) R ∪ S, (ii) R ∩ S, (iii) R − S, (iv) S − R, (v) R ⋈ S (unconstrained), and (vi) R(X,Y) ÷ S(Y).',
          'D4. (Query Tree Optimization): Draw the canonical Relational Algebra tree for SELECT s.Name FROM Student s, Enrollment e WHERE s.SID = e.SID AND e.CID = "CS301" AND s.CGPA > 9.0; and transform it into an optimized tree using heuristic pushdown rules.'
        ] }
      ]
    },
    // Page 19
    {
      blocks: [
        { type: 'h3', text: 'Part E: 5 GATE CS Style Questions (MCQ, MSQ, and NAT)' },
        { type: 'list', ordered: true, items: [
          'E1. [GATE NAT — 2 Marks] Let R(A, B) have 80 tuples and S(B, C) have 25 tuples. Suppose B is the Primary Key of S, and R.B is a Foreign Key referencing S.B that allows NULL values. If exactly 15 tuples in R have B = NULL, the number of tuples in the Natural Join R ⋈ S is ________.',
          'E2. [GATE NAT — 2 Marks] Let R(A, B, C) have 200 tuples and S(B, C) have 8 tuples (all distinct). What is the maximum possible number of tuples in the division result R ÷ S? ________.',
          'E3. [GATE MCQ — 2 Marks] Consider the Relational Algebra expression:\nE = π_A(R) − π_A( (π_A(R) × S) − R )\nwhere R(A, B) and S(B) are relations. Which of the following TRC queries is equivalent to E?\n(A) { t.A | R(t) ∧ ∃s ∈ S ( <t.A, s.B> ∈ R ) }\n(B) { t.A | R(t) ∧ ∀s ∈ S ( <t.A, s.B> ∈ R ) }\n(C) { t.A | R(t) ∧ ∀s ∈ S ( <t.A, s.B> ∉ R ) }\n(D) { t.A | ¬∃s ∈ S ( <t.A, s.B> ∈ R ) }',
          'E4. [GATE MSQ — 2 Marks] Let R and S be two relations with identical schemas attrs(R) = attrs(S). Which of the following algebraic equivalences hold for ALL instances of R and S?\n(A) R ⋈ S ≡ R ∩ S\n(B) R − (R − S) ≡ R ∩ S\n(C) R ⋉ S ≡ R ∩ S\n(D) π_L(R − S) ≡ π_L(R) − π_L(S) for any proper subset of attributes L ⊂ attrs(R)',
          'E5. [GATE NAT — 2 Marks] Let R(A, B) contain the tuples {(1, 10), (1, 20), (2, 10), (2, 30), (3, 10), (3, 20), (3, 30)} and let S(B) contain {(10), (20)}. The number of tuples in R ÷ S is ________.'
        ] }
      ]
    },
    // Page 20
    {
      blocks: [
        { type: 'h3', text: 'Part F: 5 Viva / Technical Placement Interview Questions' },
        { type: 'list', ordered: true, items: [
          'F1. "Why does a DBMS compiler translate SQL into a Relational Algebra tree instead of executing the SQL text directly?"',
          'F2. "Why doesn’t SQL have a direct DIVIDE BY keyword for Relational Algebra Division (÷), and how do you write Division in SQL?"',
          'F3. "Why is π_L(R − S) NOT equivalent to π_L(R) − π_L(S)?"',
          'F4. "When does a Query Optimizer use a Left Semijoin (⋉) or Antijoin (▷) physical operator during SQL execution?"',
          'F5. "Explain why pushing Selection (σ) and Projection (π) down below Joins (⋈) is the #1 heuristic optimization rule in every RDBMS."'
        ] },
        { type: 'h3', text: 'Part G: 3 Hands-On Algebra-to-SQL Labs & Part H: 3 "Spot the Mistake" Challenges' },
        { type: 'list', ordered: true, items: [
          'Lab 6.1: Implement Relational Division R ÷ S in SQL using two different patterns: (a) Double NOT EXISTS and (b) GROUP BY ... HAVING COUNT(DISTINCT CourseID) = (SELECT COUNT(*) FROM S).',
          'Lab 6.2: Implement the Relational Algebra "Maximum CGPA Without MAX()" self-join query in SQL and compare its result with SELECT MAX(CGPA).',
          'Lab 6.3: Demonstrate Left Semijoin (WHERE EXISTS) vs. Inner Join on Student and Enrollment to show why Inner Join duplicates students with multiple courses.',
          'Mistake 6.1: A student claims that π_{DeptID}(Student − Alumni) = π_{DeptID}(Student) − π_{DeptID}(Alumni).',
          'Mistake 6.2: To find students enrolled in BOTH CS301 and CS201, a student writes σ_{CourseID="CS301" ∧ CourseID="CS201"}(Enrollment).',
          'Mistake 6.3: A student claims that if R(A,B) and S(C,D) have no common attributes, the Natural Join R ⋈ S returns 0 rows.'
        ] }
      ]
    },
    // Page 21
    {
      blocks: [
        { type: 'h2', text: '6.12  Chapter 6 Complete Answer Key & Worked Solutions' },
        { type: 'h3', text: 'Solutions to Part A: Multiple-Choice Questions (Q1 to Q10)' },
        { type: 'table', caption: 'Answer Key & Detailed Explanations for Part A MCQs', headers: ['Q#', 'Ans', 'Detailed Step-by-Step Explanation'], rows: [
          ['Q1', '(B)', 'The 6 fundamental operators of Relational Algebra are {σ, π, ∪, −, ×, ρ}.'],
          ['Q2', '(C)', 'Set Difference is NOT commutative: R − S ≠ S − R.'],
          ['Q3', '(D)', 'When attrs(R) ∩ attrs(S) = ∅, Natural Join R ⋈ S degenerates into R × S -> 10 × 20 = 200 tuples!'],
          ['Q4', '(B)', 'R(X,Y) ÷ S(Y) ≡ π_X(R) − π_X((π_X(R) × S) − R).'],
          ['Q5', '(B)', 'For |R| = 50, |S| = 35: Min(R − S) = max(0, 50 − 35) = 15; Max(R − S) = 50.'],
          ['Q6', '(B)', 'Subtracting all values strictly smaller than some other value from all values leaves the Maximum value!'],
          ['Q7', '(B)', 'Left Semijoin R ⋉ S projects the Natural Join back onto the attributes of R: π_{attrs(R)}(R ⋈ S).'],
          ['Q8', '(B)', '{ t | ¬Student(t) } is UNSAFE because an infinite number of tuples in the universe are not in Student.'],
          ['Q9', '(B)', 'Codd’s Theorem defines Relational Completeness as equivalence to Safe TRC / Safe DRC / Relational Algebra.'],
          ['Q10', '(B)', 'Because {A, B} is a Candidate Key, all 100 tuples have distinct (A, B) pairs -> π_{A,B}(R) has 100 tuples!']
        ] }
      ]
    },
    // Page 22
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part B: Short-Answer Questions (B1 to B5)' },
        { type: 'list', ordered: false, items: [
          'Answer B1 (Closure Property): Every Relational Algebra operator takes one or two relations as input and produces a valid relation as output. This allows operators to be composed arbitrarily into expression trees that the Query Optimizer can rewrite using algebraic equivalences.',
          'Answer B2 (Union Compatibility): Two relations R and S are Union-Compatible iff (1) they have the same degree (number of attributes), and (2) corresponding attributes have compatible data domains.',
          'Answer B3 (Theta vs. Equijoin vs. Natural Join): Theta Join (R ⋈_θ S) joins on any condition θ and keeps deg(R)+deg(S) columns; Equijoin uses only equality (=) conditions and still keeps deg(R)+deg(S) columns; Natural Join (R ⋈ S) equates all identically named attributes and drops duplicate join columns.',
          'Answer B4 (Pure π vs. SQL SELECT): Pure Relational Algebra operates on mathematical Sets, so π_L(R) automatically removes duplicates (equivalent to SELECT DISTINCT L FROM R). Standard SQL SELECT L FROM R operates on Bags and retains duplicates.',
          'Answer B5 (Safe TRC Expression): A TRC expression { t | P(t) } is safe if every component of every result tuple t is drawn from the finite Active Domain of constants and relation instances appearing in P. { t | ¬Student(t) } is unsafe because its output depends on an infinite universe outside the database.'
        ] }
      ]
    },
    // Page 23
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part C (C1–C3) & Part D: Algebraic Expression Problems (D1 & D2)' },
        { type: 'callout', kind: 'example', title: 'Worked Solutions D1 | Four UniVerseDB Relational Algebra Queries', body: '(a) Students with Grade "A+" in "CS301":\n    π_{Name}( Student ⋈ σ_{CID="CS301" ∧ Grade="A+"}(Enrollment) )\n\n(b) Students enrolled in at least one Dept 10 course AND at least one Dept 20 course:\n    π_{Name}( Student ⋈ ( π_{SID}(Enrollment ⋈ σ_{DeptID=10}(Course))  ∩  π_{SID}(Enrollment ⋈ σ_{DeptID=20}(Course)) ) )\n\n(c) Students who have NEVER received Grade "F" in any course:\n    π_{Name}( Student ⋈ ( π_{SID}(Student) − π_{SID}(σ_{Grade="F"}(Enrollment)) ) )\n\n(d) StudentIDs of students who have taken EVERY course offered by DeptID = 10 (Division):\n    π_{SID, CID}(Enrollment)  ÷  π_{CID}(σ_{DeptID=10}(Course))' },
        { type: 'callout', kind: 'example', title: 'Worked Solutions D2 | Minimum Value & Names of Top-CGPA Students Without Aggregation', body: '(a) Lowest (Minimum) CGPA in Student (All CGPAs minus CGPAs strictly GREATER than some other CGPA):\n    Min_CGPA = π_{CGPA}(Student) − π_{s1.CGPA}( σ_{s1.CGPA > s2.CGPA}( ρ_{s1}(Student) × ρ_{s2}(Student) ) )\n\n(b) Names of Students holding the Maximum CGPA:\n    Max_CGPA = π_{CGPA}(Student) − π_{s1.CGPA}( σ_{s1.CGPA < s2.CGPA}( ρ_{s1}(Student) × ρ_{s2}(Student) ) )\n    Result   = π_{Name}( Student ⋈ Max_CGPA )' }
      ]
    },
    // Page 24
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part D (D3 & D4) and Part E: GATE CS Questions (E1 to E5)' },
        { type: 'callout', kind: 'example', title: 'Worked Solutions D3 & D4 | Cardinality Bounds Suite & Heuristic Pushdown', body: 'Solution D3 (|R| = 120, |S| = 40):\n• (i) R ∪ S: [max(120,40), 120+40] = [120, 160]\n• (ii) R ∩ S: [0, min(120,40)] = [0, 40]\n• (iii) R − S: [max(0, 120−40), 120] = [80, 120]\n• (iv) S − R: [max(0, 40−120), 40] = [0, 40]\n• (v) R ⋈ S (unconstrained): [0, 120 × 40] = [0, 4800]\n• (vi) R(X,Y) ÷ S(Y): [0, floor(120 / 40)] = [0, 3]\n\nSolution D4 (Optimized Algebra Expression after Pushdown):\nπ_{Name}( (π_{SID, Name}(σ_{CGPA > 9.0}(Student)))  ⋈_{SID}  (π_{SID}(σ_{CID = "CS301"}(Enrollment))) )' },
        { type: 'table', caption: 'Step-by-Step GATE CS Solutions for Questions E1 to E5', headers: ['GATE Q#', 'Correct Answer', 'Complete Step-by-Step Derivation'], rows: [
          ['E1 (NAT)', '65', 'Of the 80 tuples in R, 15 have B = NULL (which never match in an inner join). The remaining 80 − 15 = 65 tuples have non-null Foreign Keys referencing S.B (PK of S), so each matches exactly 1 tuple of S -> 65 tuples!'],
          ['E2 (NAT)', '25', 'Max cardinality of R ÷ S = floor(|R| / |S|) = floor(200 / 8) = 25 tuples.'],
          ['E3 (MCQ)', '(B)', 'The expression E is the exact fundamental expansion of Division R(A,B) ÷ S(B), which corresponds to Universal Quantification ∀s ∈ S (<t.A, s.B> ∈ R).'],
          ['E4 (MSQ)', '(A), (B), (C)', 'When attrs(R) = attrs(S), Natural Join, R − (R − S), and Semijoin all equal R ∩ S! (D) is FALSE because projection does NOT distribute over set difference.'],
          ['E5 (NAT)', '2', 'S = {(10), (20)}. In R: A=1 has {10, 20} (matches S!); A=2 has {10, 30} (misses 20); A=3 has {10, 20, 30} (matches S!). Thus R ÷ S = {(1), (3)} -> 2 tuples!']
        ] }
      ]
    },
    // Page 25
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part F: Viva & Technical Placement Interview Questions (F1 to F5)' },
        { type: 'list', ordered: false, items: [
          'Answer F1 (Why Translate SQL into Relational Algebra): SQL is declarative and allows writing the same logical query in dozens of syntactically different ways. Translating SQL into a canonical Relational Algebra tree lets the Optimizer apply provably correct algebraic rewrite laws (selection pushdown, join reordering via associativity/commutativity) before binding physical operators.',
          'Answer F2 (Why SQL Lacks DIVIDE BY & Two Ways to Write It): SQL designers omitted DIVIDE BY because real-world queries often need slight variations (e.g., "at least 90% of courses"). In SQL, you write Division either using Double NOT EXISTS (exact mirror of π_X(R) − π_X((π_X(R)×S) − R)) or using GROUP BY StudentID HAVING COUNT(DISTINCT CourseID) = (SELECT COUNT(*) FROM RequiredCourses).',
          'Answer F3 (Counterexample Proving π_L(R − S) ≠ π_L(R) − π_L(S)): Let R(A,B) = {(1, 10)} and S(A,B) = {(1, 20)}. Then R − S = {(1, 10)}, so π_A(R − S) = {(1)}. However, π_A(R) = {(1)} and π_A(S) = {(1)}, so π_A(R) − π_A(S) = ∅! Projection NEVER distributes over Set Difference!',
          'Answer F4 (When Optimizers Use Semijoin & Antijoin): Whenever you write WHERE EXISTS (...) or WHERE col IN (SELECT ...), the Optimizer compiles it into a physical Hash Semijoin or Merge Semijoin (⋉) so it stops scanning the inner table on the VERY FIRST match (avoiding duplicate rows!). WHERE NOT EXISTS compiles into an Antijoin (▷).',
          'Answer F5 (Why Selection/Projection Pushdown Is #1): Joins (⋈) are the most CPU- and memory-intensive operations in a database. Filtering rows (σ) and dropping unused wide columns (π) BEFORE the join shrinks intermediate hash tables and sort buffers by orders of magnitude!'
        ] }
      ]
    },
    // Page 26
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part G: Hands-On Algebra-to-SQL Labs (Labs 6.1 to 6.3)' },
        { type: 'code', title: 'Complete SQL Implementations of Division (÷), Max Without MAX(), and Semijoin (⋉)', code: `-- Lab 6.1 (Method A): Relational Division R ÷ S via Double NOT EXISTS
SELECT s.StudentID, s.Name
FROM Student s
WHERE NOT EXISTS (
    SELECT c.CourseID
    FROM Course c
    WHERE c.DeptID = 10
      AND NOT EXISTS (
          SELECT 1 FROM Enrollment e
          WHERE e.StudentID = s.StudentID AND e.CourseID = c.CourseID
      )
);

-- Lab 6.1 (Method B): Relational Division via GROUP BY + HAVING COUNT
SELECT e.StudentID
FROM Enrollment e
JOIN Course c ON e.CourseID = c.CourseID
WHERE c.DeptID = 10
GROUP BY e.StudentID
HAVING COUNT(DISTINCT e.CourseID) = (SELECT COUNT(*) FROM Course WHERE DeptID = 10);

-- Lab 6.2: Finding Maximum CGPA Without MAX() (Mirroring Relational Algebra)
SELECT DISTINCT CGPA FROM Student
EXCEPT
SELECT s1.CGPA
FROM Student s1
JOIN Student s2 ON s1.CGPA < s2.CGPA;` }
      ]
    },
    // Page 27
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part H: "Spot the Mistake" Diagnostic Challenges (6.1 to 6.3)' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 6.1 | Projection Does Not Distribute Over Set Difference', body: 'Writing π_{DeptID}(Student − Alumni) = π_{DeptID}(Student) − π_{DeptID}(Alumni) is a classic algebraic fallacy. If Dept 10 has both current Students and Alumni, π_{DeptID}(Student) − π_{DeptID}(Alumni) removes Dept 10 completely, whereas π_{DeptID}(Student − Alumni) rightly keeps Dept 10!' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 6.2 | Using AND Instead of Intersection (∩) on a Single Column', body: 'Writing σ_{CourseID="CS301" ∧ CourseID="CS201"}(Enrollment) ALWAYS returns 0 rows (∅), because in any single tuple of Enrollment, the atomic attribute CourseID cannot simultaneously equal "CS301" and "CS201"! To find students enrolled in BOTH courses, you must intersect two projections:\n   π_{StudentID}(σ_{CourseID="CS301"}(Enrollment))  ∩  π_{StudentID}(σ_{CourseID="CS201"}(Enrollment))!' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 6.3 | Natural Join with Zero Common Attributes Is R × S, Not ∅', body: 'When R(A,B) and S(C,D) share no attribute names, the vacuous equality condition on common attributes is trivially satisfied for every pair of tuples, so R ⋈ S = R × S (|R| × |S| rows, never 0 rows unless R or S is empty).' },
        { type: 'callout', kind: 'concept', title: 'END OF CHAPTER 6 | Up Next: Chapter 7 — SQL Fundamentals: DDL, DML, Constraints, Aggregates, and NULL Logic', body: 'In Chapter 7, we transition from formal Relational Algebra and Calculus to production SQL—mastering the 8-stage Logical Query Execution Order, DDL/DML, Pattern Matching, Set vs. Bag operators, the 7 Deadly SQL NULL Traps, and GROUP BY / HAVING / Conditional Aggregation!' }
      ]
    }
  ]
};

export const CHAPTER_07 = {
  number: 7,
  fileName: 'dbms-chapter-07.pdf',
  downloadName: 'DBMS-Chapter-07-SQL-Fundamentals-DDL-DML-Aggregates-NULLs.pdf',
  partLabel: 'PART II: RELATIONAL MODEL, ALGEBRA & SQL',
  headerPart: 'PART II: RELATIONAL & SQL',
  title: 'SQL Fundamentals: DDL, DML, Constraints, Aggregates, and NULL Logic',
  themeColor: '#0f6e56',
  themeLight: '#dcf2ec',
  themeBorder: '#4aa38b',
  pageCount: 28,
  whyThisMatters: 'Why does referencing a SELECT column alias inside a WHERE clause fail with a syntax error, while referencing it in ORDER BY succeeds? Why does AVG(Marks) disagree with SUM(Marks)/COUNT(*)? And why does NOT IN return zero rows when a single NULL enters a subquery? This chapter gives you mastery over SQL’s true 8-stage execution pipeline, DDL/DML engineering, the 7 Deadly NULL Traps, and GROUP BY / HAVING aggregation.',
  prerequisites: 'Chapters 5 & 6 (Relational Model, Keys, Integrity Constraints, 3VL, and Relational Algebra).',
  objectives: [
    'Contrast SQL’s Lexical (Written) Order with its true 8-Stage Logical Query Evaluation Pipeline (FROM/JOIN -> WHERE -> GROUP BY -> Aggregates -> HAVING -> Window -> SELECT -> DISTINCT -> ORDER BY -> LIMIT/OFFSET).',
    'Design production SQL DDL using exact financial/temporal data types (why money must use NUMERIC/DECIMAL, never FLOAT), ALTER TABLE evolution, and compare DELETE vs. TRUNCATE vs. DROP across 7 engineering dimensions.',
    'Write DML queries with LIKE / ESCAPE pattern matching and contrast Set vs. Bag operators (UNION vs. UNION ALL, INTERSECT vs. INTERSECT ALL, EXCEPT vs. EXCEPT ALL) with exact row-count formulas.',
    'Identify and defeat all 7 Deadly SQL NULL Traps (including COUNT(*) vs. COUNT(col) vs. AVG(col), empty-table aggregate returns, and how UNIQUE, GROUP BY, DISTINCT, and ORDER BY treat multiple NULLs).',
    'Master GROUP BY, the Single-Value Aggregation Rule, the SQL:1999 Primary Key Functional Dependency Exception, WHERE vs. HAVING, and Conditional Aggregation (CASE inside aggregates & FILTER).'
  ],
  toc: [
    ['7', 'SQL Fundamentals: DDL, DML, Constraints, Aggregates, and NULL Logic', '1', true],
    ['7.1', 'SQL Architecture, Standards, and Logical Execution Order', '3'],
    ['7.1.1', 'Evolution of ANSI/ISO SQL Standards & The Four SQL Sub-Languages', '3', false, true],
    ['7.1.2', 'Lexical Order vs. The 8-Stage Logical Query Evaluation Pipeline (Figure 7.1)', '4', false, true],
    ['7.2', 'Data Definition Language (DDL), Data Types, and Schema Evolution', '5'],
    ['7.2.1', 'Choosing the Right SQL Data Types (Why Money Must Never Use FLOAT!)', '5', false, true],
    ['7.2.2', 'Complete Production DDL for UniVerseDB (Listing 7.1)', '6', false, true],
    ['7.2.3', 'Schema Evolution (ALTER TABLE) & Table 7.1: DELETE vs. TRUNCATE vs. DROP', '7', false, true],
    ['7.3', 'Data Manipulation Language (DML), Pattern Matching, and Set Operations', '8'],
    ['7.3.1', 'Table 7.2: Running UniVerseDB Instance (Student & Enrollment with NULLs)', '8', false, true],
    ['7.3.2', 'Pattern Matching with LIKE and ESCAPE & Set vs. Bag Operations', '9', false, true],
    ['7.4', 'Three-Valued Logic (3VL), NULL Semantics, and the 7 Deadly SQL Traps', '10'],
    ['7.4.1', 'Kleene’s 3VL & Figure 7.2: The Golden WHERE vs. CHECK Asymmetry', '10', false, true],
    ['7.4.2', 'The 7 Deadly SQL NULL Traps (Traps 1 to 7 + Table 7.4)', '11', false, true],
    ['7.4.3', 'Taming NULLs with COALESCE and NULLIF', '13', false, true],
    ['7.5', 'Aggregation, Grouping (GROUP BY), and Group Filtering (HAVING)', '14'],
    ['7.5.1', 'Single-Value Rule, SQL:1999 PK Exception & Figure 7.3 Visual Pipeline Trace', '14', false, true],
    ['7.5.2', 'Conditional Aggregation (CASE / FILTER) & HashAggregate vs. GroupAggregate', '16', false, true],
    ['7.6', 'Chapter 7 Summary & One-Page Cheat Sheet (Table 7.5)', '17'],
    ['7.7', 'Chapter 7 Practice Question Bank (Parts A–H)', '19'],
    ['7.8', 'Complete Answer Key & Worked Solutions for Chapter 7', '23']
  ],
  pages: [
    // Page 3
    {
      blocks: [
        { type: 'h2', text: '7.1  SQL Architecture, Standards, and Logical Execution Order' },
        { type: 'p', text: 'Originally developed at IBM Research in the early 1970s as SEQUEL (Structured English Query Language) for the System R prototype, SQL became an ANSI/ISO standard in 1986 and has evolved through SQL-89, SQL-92, SQL:1999 (recursive CTEs, triggers, functional-dependency GROUP BY), SQL:2003 (window functions), SQL:2011 (temporal tables), SQL:2016 (JSON), and SQL:2023 (Property Graph Queries SQL/PGQ).' },
        { type: 'h3', text: '7.1.1  The Four SQL Sub-Languages' },
        { type: 'list', ordered: true, items: [
          'DDL (Data Definition Language): CREATE, ALTER, DROP, TRUNCATE, RENAME — Defines and modifies catalog schemas.',
          'DML (Data Manipulation Language): SELECT, INSERT, UPDATE, DELETE, MERGE — Queries and modifies relation instances.',
          'DCL (Data Control Language): GRANT, REVOKE — Enforces role-based authorization privileges.',
          'TCL (Transaction Control Language): BEGIN, COMMIT, ROLLBACK, SAVEPOINT — Controls atomic ACID transaction boundaries.'
        ] },
        { type: 'h3', text: '7.1.2  Lexical (Written) Order vs. Logical Query Evaluation Order' },
        { type: 'p', text: 'SQL is unique because the order in which you WRITE clauses (SELECT first, FROM second) is NOT the order in which the DBMS logically evaluates them! Understanding the 8-Stage Logical Evaluation Pipeline explains 90% of SQL scoping rules:' }
      ]
    },
    // Page 4
    {
      blocks: [
        { type: 'diagram', caption: 'Figure 7.1: The 8-Stage Logical Query Evaluation Pipeline in SQL (Why SELECT Aliases Work in ORDER BY But Fail in WHERE/GROUP BY).', rows: [
          ['STAGE 1: FROM & JOIN ON', 'Loads base tables, evaluates ON predicates, and forms the initial virtual working table.'],
          ['STAGE 2: WHERE', 'Filters individual rows BEFORE grouping ( keeps strictly TRUE rows; cannot see SELECT aliases or aggregates! ).'],
          ['STAGE 3: GROUP BY', 'Partitions surviving rows into buckets sharing identical grouping column values (all NULLs form ONE bucket!).'],
          ['STAGE 4: AGGREGATES & HAVING', 'Computes COUNT, SUM, AVG, MIN, MAX per bucket, then filters whole groups via HAVING (keeps strictly TRUE groups).'],
          ['STAGE 5 & 6: WINDOW & SELECT', 'Evaluates OVER(...) window functions, projects expressions, and CREATES column aliases (AS alias_name)!'],
          ['STAGE 7 & 8: DISTINCT -> ORDER BY -> LIMIT / OFFSET', 'Eliminates duplicate output rows, sorts result (CAN use SELECT aliases!), and slices top N rows.']
        ] },
        { type: 'callout', kind: 'exam', title: 'EXAM & INTERVIEW TRAP | Why WHERE Cannot Reference a SELECT Alias or an Aggregate!', body: 'Consider: SELECT Name, CGPA * 10 AS Pct FROM Student WHERE Pct > 80;  --> ERROR: column "pct" does not exist!\nWhy? Because Stage 2 (WHERE) executes LONG BEFORE Stage 6 (SELECT), so the alias Pct has not been created yet! Only Stage 7 (ORDER BY Pct DESC) executes after Stage 6 and can legally reference SELECT aliases.\nSimilarly, WHERE COUNT(*) > 2 is always a syntax error because aggregates are not computed until Stage 4 (use HAVING COUNT(*) > 2)!' }
      ]
    },
    // Page 5
    {
      blocks: [
        { type: 'h2', text: '7.2  Data Definition Language (DDL), Data Types, and Schema Evolution' },
        { type: 'h3', text: '7.2.1  Choosing the Right SQL Data Types & Why Money Must NEVER Use FLOAT!' },
        { type: 'p', text: 'In IEEE 754 binary floating-point (FLOAT / REAL / DOUBLE PRECISION), base-10 fractions like 0.1 and 0.2 have infinite repeating binary representations—so 0.1 + 0.2 evaluates to 0.30000000000000004! In financial or grading databases, rounding drift across 1 million fee receipts loses thousands of rupees.' },
        { type: 'list', ordered: false, items: [
          'Exact Fixed-Point Decimal (NUMERIC(p, s) or DECIMAL(p, s)): Stores exact base-10 digits with precision p (total digits) and scale s (digits after the decimal point). Always use NUMERIC(12, 2) for currency and NUMERIC(4, 2) for CGPA!',
          'CHAR(n) vs. VARCHAR(n) vs. TEXT: CHAR(n) is fixed-length (right-padded with spaces; use for fixed codes like CHAR(6) Pincode or CHAR(13) ISBN). VARCHAR(n) is variable-length up to n characters (stores only actual length + 1–4 byte header).',
          'TIMESTAMPTZ vs. TIMESTAMP: Always store event timestamps as TIMESTAMPTZ (TIMESTAMP WITH TIME ZONE, stored internally in UTC) to avoid daylight-saving and multi-region bugs.'
        ] },
        { type: 'code', title: 'Listing 7.1: Production SQL DDL for UniVerseDB with Composite Keys and Named Constraints', code: `CREATE TABLE Department (
    DeptID   INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    DeptName VARCHAR(60)  NOT NULL CONSTRAINT uq_dept_name UNIQUE,
    Budget   NUMERIC(14,2) NOT NULL DEFAULT 1000000.00
             CONSTRAINT chk_dept_budget CHECK (Budget >= 0.00)
);

CREATE TABLE Student (
    StudentID INT PRIMARY KEY,
    Name      VARCHAR(80) NOT NULL,
    DeptID    INT REFERENCES Department(DeptID) ON DELETE SET NULL,
    CGPA      NUMERIC(4,2) CONSTRAINT chk_cgpa CHECK (CGPA BETWEEN 0.00 AND 10.00),
    Scholar   NUMERIC(10,2) DEFAULT NULL,
    Email     VARCHAR(120) UNIQUE
);` }
      ]
    },
    // Page 6
    {
      blocks: [
        { type: 'h3', text: '7.2.3  Schema Evolution (ALTER TABLE) & Comparing DELETE, TRUNCATE, and DROP' },
        { type: 'code', title: 'Listing 7.2: Schema Evolution with ALTER TABLE (Adding, Modifying, and Dropping Constraints)', code: `-- 1. Add a new column with a DEFAULT value
ALTER TABLE Student ADD COLUMN AdmissionYear SMALLINT NOT NULL DEFAULT 2026;

-- 2. Add a named CHECK constraint to an existing table
ALTER TABLE Student ADD CONSTRAINT chk_adm_year CHECK (AdmissionYear >= 2000);

-- 3. Drop a constraint or column
ALTER TABLE Student DROP CONSTRAINT chk_adm_year;
ALTER TABLE Student DROP COLUMN AdmissionYear;` },
        { type: 'table', caption: 'Table 7.1: Complete 7-Dimension Engineering Comparison of DELETE, TRUNCATE, and DROP', headers: ['Dimension', 'DELETE FROM tbl [WHERE ...]', 'TRUNCATE TABLE tbl', 'DROP TABLE tbl'], rows: [
          ['1. SQL Sub-Language', 'DML (Data Manipulation Language)', 'DDL (Data Definition Language)', 'DDL (Data Definition Language)'],
          ['2. What It Removes', 'Selected rows (or all rows if no WHERE); Schema stays intact.', 'All rows (resets table to Empty State); Schema stays intact.', 'Removes ALL rows, indexes, triggers AND the Schema from Catalog!'],
          ['3. Supports WHERE Clause?', 'YES (Row-by-row filtering)', 'NO (Always removes all rows)', 'NO (Destroys entire table)'],
          ['4. Execution Speed & WAL Logging', 'Slowest on large tables (logs every deleted row individually in WAL).', 'Ultra-Fast O(1) (deallocates data pages/files in bulk).', 'Ultra-Fast O(1) (deallocates files + removes catalog metadata).'],
          ['5. Fires Row-Level Triggers?', 'YES (Fires BEFORE/AFTER DELETE triggers per row).', 'NO (Does not fire row-level ON DELETE triggers).', 'NO (Drops triggers along with the table).'],
          ['6. Space Reclamation & Identity', 'Leaves dead tuples (needs VACUUM in PG); keeps sequence counter.', 'Reclaims disk pages immediately; optional RESTART IDENTITY.', 'Reclaims all disk files and drops owned sequences/indexes.'],
          ['7. Can Be Rolled Back (ACID)?', 'YES (Inside an uncommitted BEGIN ... ROLLBACK transaction).', 'YES in PostgreSQL & SQL Server; auto-commits in MySQL/Oracle.', 'YES in PostgreSQL & SQL Server; auto-commits in MySQL/Oracle.']
        ] }
      ]
    },
    // Page 7
    {
      blocks: [
        { type: 'h2', text: '7.3  Data Manipulation Language (DML), Pattern Matching, and Set Operations' },
        { type: 'p', text: 'To trace every query, NULL trap, and GROUP BY calculation in this chapter with 100% precision, we use the following 6-row Student instance and 7-row Enrollment instance:' },
        { type: 'table', caption: 'Table 7.2: Running UniVerseDB Instance — Student (6 Rows) and Enrollment (7 Rows) with Strategic NULLs', headers: ['StudentID', 'Name', 'DeptID', 'CGPA', 'Scholar (Rs.)', 'Enrollment Rows (StudentID, CourseID, Marks, Grade)'], rows: [
          ['1', 'Asha', '10', '8.50', '50000', '(1, "CS301", 90, "A+"),  (1, "CS201", 80, "A")'],
          ['2', 'Ravi', '10', '7.50', 'NULL', '(2, "CS301", 70, "B"),   (2, "CS201", NULL, NULL)  <-- Exam pending!'],
          ['3', 'Meera', '20', '9.00', '60000', '(3, "EC204", 95, "A+"),  (3, "CS301", 85, "A")'],
          ['4', 'Kabir', 'NULL', '6.50', 'NULL', 'No rows in Enrollment (0 enrollments)'],
          ['5', 'Divya', '20', '8.00', '40000', '(5, "EC204", 75, "B")'],
          ['6', 'Rohan', '10', 'NULL', '10000', 'No rows in Enrollment (First-semester transfer, CGPA = NULL)']
        ] },
        { type: 'h3', text: '7.3.2  Pattern Matching with LIKE and ESCAPE' },
        { type: 'list', ordered: false, items: [
          'Percent Wildcard (%): Matches ANY sequence of zero or more characters (e.g., LIKE \'A%\' matches "A", "Asha", "Ananya").',
          'Underscore Wildcard (_): Matches EXACTLY ONE character (e.g., LIKE \'____\' (4 underscores) matches "Asha" and "Ravi", but not "Meera").',
          'Matching Literal % or _ with ESCAPE: How do you find strings containing a literal underscore "_" or "100%"? Specify an escape character:\n  WHERE PromoCode LIKE \'100\\%%\' ESCAPE \'\\\'   (Matches strings starting with literal "100%").\n  WHERE TableName LIKE \'stu\\_%\_v1\' ESCAPE \'\\\'  (Matches "stu_" followed by anything and ending in "_v1").'
        ] }
      ]
    },
    // Page 8
    {
      blocks: [
        { type: 'h3', text: '7.3.3  Set vs. Bag Operations in SQL: UNION, INTERSECT, and EXCEPT' },
        { type: 'p', text: 'Suppose query Q1 returns a bag of m copies of tuple t, and query Q2 returns a bag of n copies of tuple t. How many copies of tuple t appear in the output of SQL’s Set vs. Bag operators?' },
        { type: 'table', caption: 'Exact Multiplicity Formulas for SQL Set Operations vs. Bag (ALL) Operations (Given m copies in Q1, n copies in Q2)', headers: ['SQL Operator', 'Semantics', 'Exact Copies of Tuple t in Output', 'Example (m = 3 in Q1, n = 2 in Q2)'], rows: [
          ['Q1 UNION Q2', 'Set Union (Deduplicated)', '1 (if m > 0 or n > 0)', '1 copy of t'],
          ['Q1 UNION ALL Q2', 'Bag Union (Concatenation)', 'm + n', '3 + 2 = 5 copies of t (Zero sort/hash overhead!)'],
          ['Q1 INTERSECT Q2', 'Set Intersection', '1 (if m > 0 and n > 0, else 0)', '1 copy of t'],
          ['Q1 INTERSECT ALL Q2', 'Bag Intersection', 'min(m, n)', 'min(3, 2) = 2 copies of t'],
          ['Q1 EXCEPT Q2  (or MINUS)', 'Set Difference', '1 (if m > 0 and n = 0, else 0)', '0 copies (since n = 2 > 0 in Q2!)'],
          ['Q1 EXCEPT ALL Q2', 'Bag Difference', 'max(0, m − n)', 'max(0, 3 − 2) = 1 copy of t survives!']
        ] },
        { type: 'callout', kind: 'exam', title: 'GATE NAT FAVORITE | Counting Duplicates in EXCEPT vs. EXCEPT ALL', body: 'If Q1 returns (10, 10, 10, 20, 20) and Q2 returns (10, 20, 20, 20):\n• Q1 EXCEPT Q2 returns 0 rows (both 10 and 20 appear in Q2).\n• Q1 EXCEPT ALL Q2 returns (10, 10) — 2 rows! Because for value 10: max(0, 3 − 1) = 2 copies; for value 20: max(0, 2 − 3) = 0 copies!' }
      ]
    },
    // Page 9
    {
      blocks: [
        { type: 'h2', text: '7.4  Three-Valued Logic (3VL), NULL Semantics, and the 7 Deadly SQL Traps' },
        { type: 'diagram', caption: 'Figure 7.2: The Golden Asymmetry Between WHERE / HAVING / ON (Passes Strictly TRUE) and CHECK Constraints (Passes TRUE or UNKNOWN).', rows: [
          ['Predicate Evaluation on Row:', '---> TRUE (1.0)    ---> [WHERE / HAVING: ACCEPTED]  |  [CHECK Constraint: ACCEPTED]'],
          ['Predicate Evaluation on Row:', '---> UNKNOWN (0.5) ---> [WHERE / HAVING: REJECTED]  |  [CHECK Constraint: ACCEPTED!]'],
          ['Predicate Evaluation on Row:', '---> FALSE (0.0)   ---> [WHERE / HAVING: REJECTED]  |  [CHECK Constraint: REJECTED]']
        ] },
        { type: 'h3', text: '7.4.1  The 7 Deadly SQL NULL Traps (Traps 1 to 4)' },
        { type: 'list', ordered: true, items: [
          'Trap 1 — Comparing with = NULL or <> NULL: Writing WHERE Scholar = NULL or WHERE Scholar <> NULL evaluates to UNKNOWN for every row and returns 0 rows! Always use IS NULL, IS NOT NULL, or IS [NOT] DISTINCT FROM.',
          'Trap 2 — The NOT IN (Subquery with NULL) Disaster: x NOT IN (10, 20, NULL) expands to (x <> 10) AND (x <> 20) AND (x <> NULL). Because (x <> NULL) is UNKNOWN, the entire AND expression is either FALSE or UNKNOWN—never TRUE! Result: 0 rows returned! (Whereas x IN (10, 20, NULL) expands with OR, so x = 10 evaluates to TRUE OR FALSE OR UNKNOWN = TRUE!).',
          'Trap 3 — Failure of the Law of the Excluded Middle: On Table 7.2, SELECT COUNT(*) FROM Student WHERE Scholar > 20000 OR Scholar <= 20000 returns only 4 rows (Asha, Meera, Divya, Rohan), silently dropping Ravi and Kabir whose Scholar is NULL!',
          'Trap 4 — The Aggregate Asymmetry: COUNT(*) vs. COUNT(col) vs. AVG(col): Every SQL aggregate function EXCEPT COUNT(*) completely ignores NULL values before computing!'
        ] }
      ]
    },
    // Page 10
    {
      blocks: [
        { type: 'table', caption: 'Table 7.4: Tracing Aggregate Functions on Table 7.2 Student (6 Rows: Scholar = {50000, NULL, 60000, NULL, 40000, 10000})', headers: ['Aggregate Expression on Student', 'How NULLs Are Handled', 'Exact Value on Table 7.2 (6 Rows)'], rows: [
          ['COUNT(*)', 'Counts ALL rows regardless of NULLs.', '6'],
          ['COUNT(Scholar)', 'Ignores the 2 NULL rows (Ravi, Kabir); counts non-null values.', '4'],
          ['COUNT(DISTINCT DeptID)', 'Ignores NULL (Kabir), then deduplicates {10,10,20,20,10} -> {10, 20}.', '2'],
          ['SUM(Scholar)', 'Sums the 4 non-null values: 50000 + 60000 + 40000 + 10000.', '160000'],
          ['AVG(Scholar)', 'Divides SUM(Scholar) by COUNT(Scholar) (4, NOT 6!): 160000 / 4.', '40000.00  (NOT 160000/6 = 26666.67!)'],
          ['AVG(COALESCE(Scholar, 0))', 'Converts NULLs to 0 first, dividing by all 6 students: 160000 / 6.', '26666.67']
        ] },
        { type: 'h3', text: '7.4.2  The 7 Deadly SQL NULL Traps (Traps 5, 6, and 7)' },
        { type: 'list', ordered: false, items: [
          '5. Trap 5 — Aggregate Functions on an Empty Set (0 Matching Rows): If WHERE 1 = 0 matches 0 rows (and there is no GROUP BY), what do aggregates return?\n• COUNT(*) and COUNT(col) return 0.\n• SUM(col), AVG(col), MIN(col), and MAX(col) all return NULL (NOT 0)!\n(Wait: what if there IS a GROUP BY clause and the WHERE clause matches 0 rows? Then the query returns 0 rows total, because 0 groups are formed!).',
          '6. Trap 6 — Contagious NULLs in Scalar Arithmetic (+, −, *, /) vs. Aggregate SUM():\n• Scalar row arithmetic: 50000 + NULL evaluates to NULL! (In standard SQL, \'Asha\' || NULL also evaluates to NULL).\n• Aggregate vertical sum: SUM() ignores NULL rows and sums the remaining numbers!',
          '7. Trap 7 — Where SQL Treats Multiple NULLs as EQUAL vs. DISTINCT:\n• In WHERE / JOIN ON: NULL = NULL is UNKNOWN (do NOT match).\n• In UNIQUE constraints: Multiple NULLs are treated as DISTINCT (allowed).\n• In GROUP BY, SELECT DISTINCT, UNION/INTERSECT/EXCEPT, and ORDER BY: All NULLs are grouped together into ONE single bucket!'
        ] }
      ]
    },
    // Page 11
    {
      blocks: [
        { type: 'h3', text: '7.4.3  Taming NULLs with COALESCE and NULLIF' },
        { type: 'code', title: 'Defensive SQL Patterns Using COALESCE and NULLIF', code: `-- 1. COALESCE(v1, v2, ..., vn) returns the FIRST non-null argument:
SELECT Name,
       COALESCE(Scholar, 0) AS EffectiveScholar,
       5000 + COALESCE(Scholar, 0) AS TotalGrant  -- Prevents 5000 + NULL = NULL!
FROM Student;

-- 2. NULLIF(a, b) returns NULL if a = b, otherwise returns a (prevents Division-by-Zero!):
SELECT CourseID,
       PassedCount * 100.0 / NULLIF(TotalEnrolled, 0) AS PassPercentage
FROM Course_Stats;` },
        { type: 'h2', text: '7.5  Aggregation, Grouping (GROUP BY), and Group Filtering (HAVING)' },
        { type: 'h3', text: '7.5.1  The Single-Value Rule & The SQL:1999 Primary Key Exception' },
        { type: 'list', ordered: true, items: [
          'The Single-Value Rule of GROUP BY: When a query contains a GROUP BY clause (or an aggregate function), every unaggregated column appearing in the SELECT or HAVING clause MUST also appear in the GROUP BY clause! Why? Because there is only one output row per group—if you group by DeptID (which has 3 students: Asha, Ravi, Rohan) and write SELECT DeptID, Name, COUNT(*), the DBMS cannot pick which of the 3 names to display!',
          'The SQL:1999 Functional Dependency Exception (Supported by PostgreSQL & MySQL): If you group by the PRIMARY KEY of a table (e.g., GROUP BY s.StudentID), you ARE allowed to select s.Name and s.CGPA in the SELECT clause without listing them in GROUP BY! Why? Because StudentID -> {Name, CGPA} is a functional dependency (each StudentID uniquely determines a single Name and CGPA).'
        ] }
      ]
    },
    // Page 12
    {
      blocks: [
        { type: 'h3', text: '7.5.2  Step-by-Step Visual Trace of WHERE vs. GROUP BY vs. HAVING' },
        { type: 'code', title: 'Listing 7.3: Tracing WHERE, GROUP BY, and HAVING on Table 7.2 Student', code: `SELECT DeptID,
       COUNT(*)        AS TotalStudents,
       COUNT(CGPA)     AS GradedStudents,
       AVG(CGPA)       AS AvgCGPA
FROM Student
WHERE Scholar IS NULL OR Scholar >= 10000
GROUP BY DeptID
HAVING COUNT(*) >= 1
ORDER BY AvgCGPA DESC NULLS LAST;` },
        { type: 'diagram', caption: 'Figure 7.3: Step-by-Step Execution Trace of Listing 7.3 on Table 7.2 (Showing the NULL Group Bucket!).', rows: [
          ['Stage 1 & 2 (FROM + WHERE)', 'All 6 rows of Student satisfy (Scholar IS NULL OR Scholar >= 10000).'],
          ['Stage 3 (GROUP BY DeptID)', 'Forms 3 buckets:  Bucket DeptID=10: {Asha(8.5), Ravi(7.5), Rohan(NULL)}  |  Bucket DeptID=20: {Meera(9.0), Divya(8.0)}  |  Bucket DeptID=NULL: {Kabir(6.5)}'],
          ['Stage 4 (Aggregates + HAVING)', 'Dept 10: COUNT(*)=3, COUNT(CGPA)=2, AVG(CGPA)=(8.5+7.5)/2 = 8.00  |  Dept 20: COUNT(*)=2, AVG=8.50  |  Dept NULL: COUNT(*)=1, AVG=6.50'],
          ['Stage 6 & 7 (SELECT + ORDER BY)', 'Returns 3 rows ordered by AvgCGPA DESC:  (20, 2, 2, 8.50),  (10, 3, 2, 8.00),  (NULL, 1, 1, 6.50)']
        ] }
      ]
    },
    // Page 13
    {
      blocks: [
        { type: 'h3', text: '7.5.3  Conditional Aggregation (CASE Inside Aggregates & SQL:2003 FILTER)' },
        { type: 'p', text: 'In placement interviews and reporting dashboards, you often need to pivot multiple filtered counts or sums in a single table scan (e.g., counting Honours students vs. Scholarship students per department without running 3 separate subqueries):' },
        { type: 'code', title: 'Listing 7.4: Conditional Aggregation Using CASE WHEN Inside SUM/COUNT and PostgreSQL FILTER', code: `SELECT DeptID,
       COUNT(*) AS TotalStudents,
       -- Pattern 1: SUM(CASE WHEN ... THEN 1 ELSE 0 END)
       SUM(CASE WHEN CGPA >= 8.50 THEN 1 ELSE 0 END) AS DistinctionCount,
       -- Pattern 2: COUNT(CASE WHEN ... THEN 1 END)  [ELSE NULL is implicit and ignored by COUNT!]
       COUNT(CASE WHEN Scholar IS NOT NULL THEN 1 END) AS ScholarshipHolders,
       -- Pattern 3: Modern SQL:2003 / PostgreSQL FILTER clause
       AVG(CGPA) FILTER (WHERE Scholar IS NOT NULL) AS AvgScholarCGPA
FROM Student
GROUP BY DeptID;` },
        { type: 'callout', kind: 'mistake', title: 'INTERVIEW TRAP | Why COUNT(CASE WHEN cond THEN 1 ELSE 0 END) Is a Bug!', body: 'In SQL, COUNT(expr) counts every row where expr is NOT NULL—including 0 and FALSE! Therefore, COUNT(CASE WHEN CGPA >= 8.5 THEN 1 ELSE 0 END) counts the 0s too and returns COUNT(*)! Either use SUM(CASE WHEN ... THEN 1 ELSE 0 END) OR omit ELSE 0 so unmatched rows default to NULL: COUNT(CASE WHEN CGPA >= 8.5 THEN 1 END)!' }
      ]
    },
    // Page 14
    {
      blocks: [
        { type: 'h3', text: '7.5.4  DBMS Engine Internals: HashAggregate vs. GroupAggregate' },
        { type: 'list', ordered: true, items: [
          'HashAggregate (O(N) In-Memory Hash Table): The Execution Engine scans the input rows once, hashes the GROUP BY key (DeptID), and updates running accumulators (count, sum) in an in-memory hash bucket. Fast when the number of distinct groups fits in work_mem.',
          'GroupAggregate / SortAggregate (O(N log N) Sort or O(N) via B+ Tree Index): First sorts rows by the GROUP BY columns (or reads them in order from an existing B+ Tree index) and emits one aggregate row each time the group key changes. Uses almost zero RAM!'
        ] },
        { type: 'h2', text: '7.6  Chapter 7 Summary & One-Page Cheat Sheet' },
        { type: 'table', caption: 'Table 7.5: Chapter 7 Master SQL Cheat Sheet', headers: ['SQL Feature / Clause', 'Core Execution Rule & Exam Trap'], rows: [
          ['Logical Execution Order', '1. FROM/JOIN -> 2. WHERE -> 3. GROUP BY -> 4. Aggregates/HAVING -> 5. Window -> 6. SELECT -> 7. DISTINCT -> 8. ORDER BY -> 9. LIMIT.'],
          ['SELECT Alias Scope', 'Created at Stage 6 (SELECT). Invisible in WHERE, GROUP BY, and HAVING; visible in ORDER BY!'],
          ['DELETE vs. TRUNCATE vs. DROP', 'DELETE = DML (row-logged, WHERE allowed, triggers fire). TRUNCATE = DDL (bulk page dealloc, keeps schema). DROP = DDL (destroys table & schema).'],
          ['Set vs. Bag Multiplicities', 'UNION ALL = m+n; INTERSECT ALL = min(m,n); EXCEPT ALL = max(0, m−n). Plain UNION/INTERSECT/EXCEPT deduplicate.'],
          ['COUNT(*) vs. COUNT(col) vs. AVG', 'COUNT(*) counts all rows including NULLs; COUNT(col), SUM(col), AVG(col) ignore NULLs! AVG(col) = SUM(col)/COUNT(col) ≠ SUM(col)/COUNT(*).'],
          ['Aggregates on 0 Rows (No GROUP BY)', 'COUNT returns 0; SUM, AVG, MIN, MAX all return NULL!'],
          ['How SQL Groups NULLs', 'WHERE/JOIN treat NULL=NULL as UNKNOWN; GROUP BY, DISTINCT, and Set ops group all NULLs into ONE bucket!'],
          ['WHERE vs. HAVING', 'WHERE filters individual rows BEFORE GROUP BY (no aggregates allowed). HAVING filters groups AFTER GROUP BY.']
        ] }
      ]
    },
    // Page 15
    {
      blocks: [
        { type: 'h2', text: 'Student Revision & Lecture Notes — Chapter 7' },
        { type: 'p', text: 'Use this revision page to practice the 8-stage execution order, the 7 Deadly NULL Traps, and tracing GROUP BY / HAVING queries on Table 7.2.' },
        { type: 'table', caption: 'Active Recall Checklist — Chapter 7', headers: ['Prompt', 'Your Recall Answer'], rows: [
          ['Why must financial amounts use NUMERIC(12,2) instead of FLOAT?', 'IEEE 754 binary floating-point cannot represent base-10 decimals like 0.10 exactly, causing rounding errors.'],
          ['What does SELECT SUM(Marks), COUNT(*) FROM Enrollment WHERE 1=0 return?', 'Returns 1 row: (NULL, 0).'],
          ['How many groups does GROUP BY DeptID form on {10, 10, 20, NULL, NULL}?', '3 groups: Dept 10, Dept 20, and one combined group for all NULLs!'],
          ['Fix COUNT(CASE WHEN Grade="A" THEN 1 ELSE 0 END)', 'Use SUM(CASE WHEN Grade="A" THEN 1 ELSE 0 END) or COUNT(CASE WHEN Grade="A" THEN 1 END).']
        ] }
      ]
    },
    // Page 16
    {
      blocks: [
        { type: 'h2', text: '7.7  Chapter 7 Practice Question Bank' },
        { type: 'h3', text: 'Part A: 10 Multiple-Choice Questions (MCQs)' },
        { type: 'list', ordered: true, items: [
          'Q1. In what logical order does an SQL engine evaluate the following clauses of a query?\n1. SELECT   2. WHERE   3. FROM   4. GROUP BY   5. HAVING   6. ORDER BY\n(A) 1 -> 3 -> 2 -> 4 -> 5 -> 6   (B) 3 -> 2 -> 4 -> 5 -> 1 -> 6   (C) 3 -> 4 -> 2 -> 5 -> 1 -> 6   (D) 2 -> 3 -> 4 -> 5 -> 6 -> 1',
          'Q2. On the 6-row Student table in Table 7.2 (where Scholar values are 50000, NULL, 60000, NULL, 40000, 10000), what does SELECT COUNT(*), COUNT(Scholar), AVG(Scholar) FROM Student; return?\n(A) 6, 6, 26666.67   (B) 6, 4, 40000.00   (C) 4, 4, 40000.00   (D) 6, 4, NULL',
          'Q3. Which SQL pattern matches any string that contains at least 3 characters and ends with the letter "a"?\n(A) LIKE \'___a\'   (B) LIKE \'__%a\'   (C) LIKE \'%___a%\'   (D) LIKE \'3%a\'',
          'Q4. What is returned by SELECT COUNT(*), SUM(CGPA) FROM Student WHERE 1 = 2; (assuming Student has 6 rows)?\n(A) 0 rows returned   (B) 1 row: (0, 0)   (C) 1 row: (0, NULL)   (D) 1 row: (NULL, NULL)',
          'Q5. Suppose Query A returns the bag {5, 5, 5, 8, 8} and Query B returns the bag {5, 8, 8, 8}. How many total rows are returned by (Query A) EXCEPT ALL (Query B)?\n(A) 0   (B) 1   (C) 2   (D) 3'
        ] }
      ]
    },
    // Page 17
    {
      blocks: [
        { type: 'h3', text: 'Part A: Multiple-Choice Questions (Continued — Q6 to Q10)' },
        { type: 'list', ordered: false, items: [
          '6. Q6. Which of the following SQL queries will fail with a compilation/syntax error in standard SQL?\n(A) SELECT DeptID, COUNT(*) FROM Student GROUP BY DeptID HAVING COUNT(*) > 1;\n(B) SELECT Name, CGPA * 10 AS Score FROM Student ORDER BY Score DESC;\n(C) SELECT DeptID, AVG(CGPA) FROM Student WHERE AVG(CGPA) > 8.0 GROUP BY DeptID;\n(D) SELECT DeptID, MAX(CGPA) FROM Student WHERE CGPA IS NOT NULL GROUP BY DeptID;',
          '7. Q7. On Table 7.2 Student (where DeptID values are 10, 10, 20, NULL, 20, 10), how many output rows are returned by SELECT DeptID, COUNT(*) FROM Student GROUP BY DeptID;?\n(A) 2 rows   (B) 3 rows   (C) 4 rows   (D) 6 rows',
          '8. Q8. What is the output of SELECT COALESCE(NULL, NULLIF(10, 10), 25, 40);?\n(A) NULL   (B) 10   (C) 25   (D) 40',
          '9. Q9. Which statement accurately contrasts DELETE FROM Student; and TRUNCATE TABLE Student;?\n(A) TRUNCATE fires row-level ON DELETE triggers whereas DELETE does not\n(B) DELETE allows a WHERE clause and logs individual row deletions, whereas TRUNCATE removes all rows by deallocating data pages\n(C) TRUNCATE drops the Student schema from the System Catalog\n(D) DELETE resets the column data types',
          '10. Q10. What does SELECT COUNT(CASE WHEN CGPA >= 8.50 THEN 1 ELSE 0 END) FROM Student; compute on the 6-row Student table?\n(A) The number of students with CGPA >= 8.50 (2)   (B) The total number of rows in Student (6), because both 1 and 0 are non-NULL   (C) 0   (D) NULL'
        ] },
        { type: 'h3', text: 'Part B: 5 Short-Answer Questions (2–3 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'B1. Explain why a column alias defined in the SELECT clause cannot be used in the WHERE or GROUP BY clause, but CAN be used in the ORDER BY clause.',
          'B2. Compare DELETE, TRUNCATE, and DROP across DML/DDL classification, WHERE filtering, trigger execution, and catalog schema impact.',
          'B3. Why is AVG(Col) generally NOT equal to SUM(Col) / COUNT(*) when Col contains NULL values, and how can you write an expression that treats NULLs as 0 in the average?',
          'B4. State the Single-Value Rule of GROUP BY and explain the SQL:1999 Primary Key Functional Dependency exception.',
          'B5. Explain how SQL treats multiple NULL values in (a) a WHERE equality join, (b) a UNIQUE constraint, and (c) a GROUP BY clause.'
        ] }
      ]
    },
    // Page 18
    {
      blocks: [
        { type: 'h3', text: 'Part C: 3 Long-Answer / Essay Questions (5–10 Marks Semester Exam Style)' },
        { type: 'list', ordered: true, items: [
          'C1. Draw and explain the 8-Stage Logical Query Evaluation Pipeline in SQL. Using a concrete multi-clause query on UniVerseDB, trace how the working table transforms at each stage from FROM to LIMIT.',
          'C2. Present and explain the 7 Deadly SQL NULL Traps with concrete SQL examples and outputs on the Student and Enrollment tables, and show the defensive SQL pattern that fixes each trap.',
          'C3. Compare WHERE and HAVING in detail. Explain when predicates can be pushed from HAVING into WHERE for query optimization, and demonstrate Conditional Aggregation using CASE expressions inside SUM/COUNT.'
        ] },
        { type: 'h3', text: 'Part D: 4 Query Output Trace & Debugging Problems' },
        { type: 'list', ordered: true, items: [
          'D1. (Exact Output Trace on Table 7.2): Trace the exact output rows and columns of the following 3 queries on Table 7.2:\n(a) SELECT DeptID, COUNT(*), COUNT(Scholar), SUM(Scholar) FROM Student GROUP BY DeptID;\n(b) SELECT CourseID, COUNT(*), COUNT(Marks), AVG(Marks) FROM Enrollment GROUP BY CourseID;\n(c) SELECT Name FROM Student WHERE DeptID NOT IN (SELECT DeptID FROM Student WHERE CGPA < 7.00);',
          'D2. (Bag Multiplicity Calculation): Let Table R(X) contain {1, 1, 1, 2, 2, 3} (6 rows) and Table S(X) contain {1, 2, 2, 2, 4} (5 rows). Compute the exact multiset of rows and total row count for: (i) R UNION S, (ii) R UNION ALL S, (iii) R INTERSECT S, (iv) R INTERSECT ALL S, (v) R EXCEPT S, and (vi) R EXCEPT ALL S.',
          'D3. (Pattern Matching with ESCAPE): Write a SQL WHERE predicate using LIKE and ESCAPE to match strings in column Code that: (a) start with literal "CS_", followed by exactly 2 characters, and end with literal "%"; (b) contain at least two "a" characters anywhere.',
          'D4. (Conditional Aggregation Report): Write a single-scan SQL query on Enrollment(StudentID, CourseID, Marks, Grade) that outputs per CourseID: TotalEnrolled, PassedCount (Grade <> "F" and Grade IS NOT NULL), PendingExamCount (Marks IS NULL), and PassRatePct.'
        ] }
      ]
    },
    // Page 19
    {
      blocks: [
        { type: 'h3', text: 'Part E: 5 GATE CS Style Questions (MCQ, MSQ, and NAT)' },
        { type: 'list', ordered: true, items: [
          'E1. [GATE NAT — 2 Marks] Consider a table T(A INT, B INT) containing the following 5 rows:\n(1, 10), (1, NULL), (2, 20), (2, 30), (NULL, 40).\nWhen the query SELECT A, COUNT(B), SUM(B) FROM T GROUP BY A HAVING COUNT(*) >= 1; is executed, the sum of the values in the third column (SUM(B)) across all output rows is ________, and the number of output rows is ________.',
          'E2. [GATE NAT — 2 Marks] Let R(A) have 4 copies of value 10 and 2 copies of value 20. Let S(A) have 1 copy of value 10 and 5 copies of value 20. The number of rows returned by the SQL query:\n(SELECT A FROM R INTERSECT ALL SELECT A FROM S) UNION ALL (SELECT A FROM R EXCEPT ALL SELECT A FROM S)\nis ________.',
          'E3. [GATE MCQ — 2 Marks] Consider the following SQL query on Student(_StudentID_, Name, DeptID, CGPA):\nSELECT DeptID, AVG(CGPA) FROM Student WHERE CGPA >= 7.0 GROUP BY DeptID HAVING COUNT(*) >= 2;\nWhich sequence of operations correctly describes its logical evaluation?\n(A) Group by DeptID -> Filter groups with COUNT(*) >= 2 -> Filter rows with CGPA >= 7.0 -> Compute AVG(CGPA)\n(B) Filter rows with CGPA >= 7.0 -> Group surviving rows by DeptID -> Keep groups with at least 2 surviving rows -> Project DeptID and AVG(CGPA)\n(C) Compute AVG(CGPA) over entire table -> Filter by WHERE -> Group by DeptID\n(D) Filter groups by HAVING -> Filter rows by WHERE -> Group by DeptID',
          'E4. [GATE MSQ — 2 Marks] Which of the following SQL queries on Student(StudentID PK, Name, DeptID, CGPA) are VALID in SQL:1999 / PostgreSQL?\n(A) SELECT StudentID, Name, COUNT(*) FROM Student GROUP BY StudentID;\n(B) SELECT DeptID, Name, COUNT(*) FROM Student GROUP BY DeptID;\n(C) SELECT DeptID, COUNT(*) AS Cnt FROM Student GROUP BY DeptID ORDER BY Cnt DESC;\n(D) SELECT DeptID, COUNT(*) FROM Student GROUP BY DeptID HAVING MAX(CGPA) > 8.5;',
          'E5. [GATE NAT — 2 Marks] On the 6-row Student table in Table 7.2 (CGPAs: 8.50, 7.50, 9.00, 6.50, 8.00, NULL), what numerical value is returned by:\nSELECT AVG(COALESCE(CGPA, 6.50)) - AVG(CGPA) FROM Student;  (Round to 2 decimal places): ________.'
        ] }
      ]
    },
    // Page 20
    {
      blocks: [
        { type: 'h3', text: 'Part F: 5 Viva / Technical Placement Interview Questions' },
        { type: 'list', ordered: true, items: [
          'F1. "What is the difference between WHERE and HAVING, and can a condition ever be written in either clause?"',
          'F2. "In a production PostgreSQL database with 50 million rows, why is TRUNCATE TABLE instant while DELETE FROM tbl takes 4 minutes and bloats disk space?"',
          'F3. "Why should you always prefer UNION ALL over UNION when you know the two input sets are disjoint (or when duplicates don’t matter)?"',
          'F4. "What happens when a Python (psycopg2) or Java (JDBC) backend fetches a SQL NULL value—and what is the classic JDBC getInt() trap?"',
          'F5. "Explain how GROUP BY and HAVING work together when finding duplicate emails in a Users table."'
        ] },
        { type: 'h3', text: 'Part G: 3 Hands-On SQL Labs & Part H: 3 "Spot the Mistake" Challenges' },
        { type: 'list', ordered: true, items: [
          'Lab 7.1: Write a SQL query to find all duplicate (Name, City) pairs in a table and keep only the lowest StudentID.',
          'Lab 7.2: Write a Department KPI dashboard query using GROUP BY, COALESCE, and CASE WHEN / FILTER.',
          'Lab 7.3: Verify the Empty-Set Aggregate trap by running SELECT COUNT(*), SUM(CGPA), COALESCE(SUM(CGPA), 0) on an empty filter.',
          'Mistake 7.1: A developer writes SELECT DeptID, AVG(CGPA) AS AvgG FROM Student WHERE AvgG > 8.0 GROUP BY DeptID;.',
          'Mistake 7.2: To calculate total compensation (Salary + Bonus) where Bonus can be NULL, a developer writes SELECT Name, Salary + Bonus AS TotalComp FROM Employee;.',
          'Mistake 7.3: A developer writes SELECT DeptID, Name, AVG(CGPA) FROM Student GROUP BY DeptID; expecting it to return the name of the student with the highest CGPA in each department.'
        ] }
      ]
    },
    // Page 21
    {
      blocks: [
        { type: 'h2', text: '7.8  Complete Answer Key & Worked Solutions for Chapter 7' },
        { type: 'h3', text: 'Solutions to Part A: Multiple-Choice Questions (Q1 to Q10)' },
        { type: 'table', caption: 'Answer Key & Detailed Explanations for Part A MCQs', headers: ['Q#', 'Ans', 'Detailed Step-by-Step Explanation'], rows: [
          ['Q1', '(B)', 'Logical order: FROM (3) -> WHERE (2) -> GROUP BY (4) -> HAVING (5) -> SELECT (1) -> ORDER BY (6).'],
          ['Q2', '(B)', 'COUNT(*) = 6 rows; COUNT(Scholar) = 4 non-null rows; AVG(Scholar) = 160000 / 4 = 40000.00.'],
          ['Q3', '(B)', 'Two underscores (__) require at least 2 characters + % (0 or more) + "a" = at least 3 characters ending in "a".'],
          ['Q4', '(C)', 'On 0 matching rows without GROUP BY, COUNT(*) returns 0 and SUM(CGPA) returns NULL -> 1 row: (0, NULL).'],
          ['Q5', '(C)', 'In EXCEPT ALL: for 5, max(0, 3 − 1) = 2 copies; for 8, max(0, 2 − 3) = 0 copies -> 2 rows total!'],
          ['Q6', '(C)', 'Aggregate functions like AVG(CGPA) are never allowed inside a WHERE clause (must be in HAVING).'],
          ['Q7', '(B)', 'GROUP BY DeptID forms 3 groups: DeptID = 10, DeptID = 20, and DeptID = NULL (all NULLs form 1 bucket!).'],
          ['Q8', '(C)', 'NULLIF(10, 10) evaluates to NULL; COALESCE(NULL, NULL, 25, 40) returns the first non-null value: 25.'],
          ['Q9', '(B)', 'DELETE is row-logged DML supporting WHERE and triggers; TRUNCATE is bulk page-deallocating DDL without WHERE.'],
          ['Q10', '(B)', 'COUNT(expr) counts every non-null value. Since CASE returns either 1 or 0 (neither is NULL!), it counts all 6 rows!']
        ] }
      ]
    },
    // Page 22
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part B: Short-Answer Questions (B1 to B5)' },
        { type: 'list', ordered: false, items: [
          'Answer B1 (SELECT Alias Scope): In the 8-stage logical execution pipeline, WHERE (Stage 2) and GROUP BY (Stage 3) are evaluated BEFORE the SELECT projection list (Stage 6), so aliases created in SELECT do not exist yet. ORDER BY (Stage 8) executes AFTER SELECT, so it can reference SELECT aliases.',
          'Answer B2 (DELETE vs. TRUNCATE vs. DROP): DELETE is DML, supports WHERE, fires row triggers, logs each deleted row, and keeps the schema. TRUNCATE is DDL, removes all rows by deallocating data pages in O(1), does not fire row triggers, and keeps the schema. DROP is DDL and destroys both data files and the catalog schema.',
          'Answer B3 (Why AVG(Col) ≠ SUM(Col)/COUNT(*)): AVG(Col) ignores NULL rows and divides SUM(Col) by COUNT(Col) (the number of non-null rows). To treat NULLs as 0 across all rows, write AVG(COALESCE(Col, 0)) or SUM(Col) / COUNT(*).',
          'Answer B4 (Single-Value Rule & PK Exception): Every unaggregated column in SELECT/HAVING must appear in GROUP BY so it has a single well-defined value per group. Under SQL:1999, if you group by a table’s Primary Key, functionally dependent columns of that same table may appear in SELECT without being listed in GROUP BY.',
          'Answer B5 (How SQL Treats Multiple NULLs): (a) In WHERE/JOIN equality (a = b), NULL = NULL is UNKNOWN (rows do not match). (b) In a UNIQUE constraint, multiple NULLs are treated as distinct (allowed). (c) In GROUP BY, DISTINCT, and UNION, all NULLs are grouped together into a single bucket.'
        ] }
      ]
    },
    // Page 23
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part C: Long-Answer / Essay Questions (C1 to C3)' },
        { type: 'callout', kind: 'example', title: 'Model Solutions C1, C2 & C3 | Execution Pipeline, 7 NULL Traps & WHERE vs. HAVING Pushdown', body: '• Model Solution C1 (8-Stage Pipeline): Walk through Stages 1 to 8 (FROM/JOIN -> WHERE -> GROUP BY -> Aggregates/HAVING -> Window -> SELECT -> DISTINCT -> ORDER BY -> LIMIT), illustrating each stage on Listing 7.3.\n• Model Solution C2 (7 NULL Traps): Present Traps 1–7 (= NULL, NOT IN with NULL, Excluded Middle failure, COUNT(*) vs. AVG(col), Empty-Set aggregates returning NULL, Contagious arithmetic NULLs, and GROUP BY/DISTINCT bucketing NULLs) along with COALESCE/NOT EXISTS fixes.\n• Model Solution C3 (WHERE vs. HAVING Optimization): Predicates that filter only on grouping columns (e.g., HAVING DeptID = 10) can and should be pushed into WHERE DeptID = 10 so rows are discarded BEFORE sorting/hashing for GROUP BY. Predicates involving aggregates (HAVING AVG(CGPA) > 8.0) cannot be pushed to WHERE.' }
      ]
    },
    // Page 24
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part D: Query Output Trace & Debugging Problems (D1 & D2)' },
        { type: 'callout', kind: 'example', title: 'Worked Solution D1 | Exact Output Traces on Table 7.2', body: '(a) SELECT DeptID, COUNT(*), COUNT(Scholar), SUM(Scholar) FROM Student GROUP BY DeptID;\n    • DeptID = 10:   COUNT(*) = 3, COUNT(Scholar) = 2, SUM(Scholar) = 60000\n    • DeptID = 20:   COUNT(*) = 2, COUNT(Scholar) = 2, SUM(Scholar) = 100000\n    • DeptID = NULL: COUNT(*) = 1, COUNT(Scholar) = 0, SUM(Scholar) = NULL  <-- All NULLs in group => SUM is NULL!\n\n(b) SELECT CourseID, COUNT(*), COUNT(Marks), AVG(Marks) FROM Enrollment GROUP BY CourseID;\n    • "CS301": COUNT(*) = 3, COUNT(Marks) = 3, AVG(Marks) = (90+70+85)/3 = 81.67\n    • "CS201": COUNT(*) = 2, COUNT(Marks) = 1, AVG(Marks) = 80/1 = 80.00  <-- Ravi’s NULL mark ignored!\n    • "EC204": COUNT(*) = 2, COUNT(Marks) = 2, AVG(Marks) = (95+75)/2 = 85.00\n\n(c) SELECT Name FROM Student WHERE DeptID NOT IN (SELECT DeptID FROM Student WHERE CGPA < 7.00);\n    • In Table 7.2, Kabir has CGPA = 6.50 (< 7.00) and DeptID = NULL! So the subquery returns (NULL).\n    • DeptID NOT IN (NULL) evaluates to UNKNOWN for every student -> Returns 0 rows!' },
        { type: 'callout', kind: 'example', title: 'Worked Solution D2 | Bag vs. Set Multiplicities on R = {1,1,1,2,2,3} and S = {1,2,2,2,4}', body: '• (i) R UNION S: {1, 2, 3, 4} (4 rows)\n• (ii) R UNION ALL S: 6 + 5 = 11 rows\n• (iii) R INTERSECT S: {1, 2} (2 rows)\n• (iv) R INTERSECT ALL S: min(3,1)=1 copy of 1; min(2,3)=2 copies of 2 -> {1, 2, 2} (3 rows)\n• (v) R EXCEPT S: {3} (1 row)\n• (vi) R EXCEPT ALL S: max(0, 3−1)=2 copies of 1; max(0, 2−3)=0 copies of 2; max(0, 1−0)=1 copy of 3 -> {1, 1, 3} (3 rows)!' }
      ]
    },
    // Page 25
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part D (D3 & D4) and Part E: GATE CS Questions (E1 to E5)' },
        { type: 'code', title: 'Worked Solutions D3 (LIKE with ESCAPE) & D4 (Conditional Aggregation Report)', code: `-- Solution D3 (a): Start with literal "CS_", followed by 2 chars, ending with literal "%"
WHERE Code LIKE 'CS\\___\\%%' ESCAPE '\\'   -- Wait: ends with literal %: 'CS\\___\\%' ESCAPE '\\'
-- Solution D3 (b): Contains at least two 'a' characters anywhere
WHERE Code LIKE '%a%a%'

-- Solution D4: Single-Scan Course Exam & Pass Rate Report
SELECT CourseID,
       COUNT(*) AS TotalEnrolled,
       SUM(CASE WHEN Grade IS NOT NULL AND Grade <> 'F' THEN 1 ELSE 0 END) AS PassedCount,
       SUM(CASE WHEN Marks IS NULL THEN 1 ELSE 0 END) AS PendingExamCount,
       ROUND(
           SUM(CASE WHEN Grade IS NOT NULL AND Grade <> 'F' THEN 1 ELSE 0 END) * 100.0
           / NULLIF(COUNT(Marks), 0), 2
       ) AS PassRatePct
FROM Enrollment
GROUP BY CourseID;` },
        { type: 'table', caption: 'Step-by-Step GATE CS Solutions for Questions E1 to E5', headers: ['GATE Q#', 'Correct Answer', 'Complete Step-by-Step Derivation'], rows: [
          ['E1 (NAT)', '100; 3 rows', 'Groups formed by A: A=1 -> COUNT(B)=1, SUM(B)=10; A=2 -> COUNT(B)=2, SUM(B)=50; A=NULL -> COUNT(B)=1, SUM(B)=40. Total output rows = 3; sum of SUM(B) = 10 + 50 + 40 = 100.'],
          ['E2 (NAT)', '6', 'Notice the algebraic identity: min(m,n) + max(0, m−n) = m for every element! Thus (R INTERSECT ALL S) UNION ALL (R EXCEPT ALL S) reconstructs bag R exactly -> 4 + 2 = 6 rows!'],
          ['E3 (MCQ)', '(B)', 'WHERE filters rows (CGPA >= 7.0) BEFORE GROUP BY; HAVING filters groups (COUNT(*) >= 2) AFTER GROUP BY.'],
          ['E4 (MSQ)', '(A), (C), (D)', '(A) is valid by the SQL:1999 Primary Key FD rule (StudentID is PK). (B) is INVALID because Name is not functionally dependent on DeptID. (C) and (D) are valid.'],
          ['E5 (NAT)', '-0.23', 'AVG(CGPA) over 5 non-nulls = (8.5+7.5+9.0+6.5+8.0)/5 = 39.5/5 = 7.90. With COALESCE(CGPA, 6.50) over all 6 rows = (39.5+6.5)/6 = 46.0/6 = 7.6667. Difference = 7.67 − 7.90 = -0.23!']
        ] }
      ]
    },
    // Page 26
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part F: Viva & Technical Placement Interview Questions (F1 to F5)' },
        { type: 'list', ordered: false, items: [
          'Answer F1 (WHERE vs. HAVING): WHERE filters individual rows at Stage 2 before grouping and cannot contain aggregate functions. HAVING filters entire groups at Stage 4 after grouping and typically tests aggregate conditions (e.g., HAVING COUNT(*) > 5). A condition on a grouping column (like DeptID = 10) works in both, but placing it in WHERE is much faster because it prunes rows before hashing/sorting.',
          'Answer F2 (Why DELETE Is Slow & Bloats Disk vs. Instant TRUNCATE): Under MVCC (PostgreSQL), DELETE visits every row, writes a WAL log record, and marks the tuple header xmax as dead without freeing disk space until VACUUM runs. TRUNCATE simply unlinks the physical data files in O(1) time and allocates a fresh empty 8 KB file.',
          'Answer F3 (Why Prefer UNION ALL Over UNION): Plain UNION forces the database engine to run an expensive Sort or HashAggregate pass over the combined result set to eliminate duplicates. UNION ALL simply streams the second query’s rows after the first with zero memory or sorting overhead.',
          'Answer F4 (Python/JDBC NULL Handling Trap): In Python (psycopg2/sqlite3), SQL NULL maps cleanly to Python None. In Java JDBC, however, primitive rs.getInt("DeptID") returns 0 when the SQL column is NULL! You must call rs.wasNull() or use rs.getObject("DeptID", Integer.class) so NULL maps to a null Integer reference.',
          'Answer F5 (Finding Duplicate Emails): Write SELECT Email, COUNT(*) FROM Users GROUP BY Email HAVING COUNT(*) > 1; — GROUP BY buckets identical emails together, and HAVING keeps only buckets with 2 or more rows.'
        ] }
      ]
    },
    // Page 27
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part G: Hands-On SQL Labs (Labs 7.1 to 7.3)' },
        { type: 'code', title: 'Complete SQL Solutions for Labs 7.1, 7.2, and 7.3', code: `-- Lab 7.1: Finding Duplicate (Name, City) Pairs and Deleting Duplicates Keeping Lowest StudentID
SELECT Name, City, COUNT(*) AS DupCount, MIN(StudentID) AS KeepID
FROM Student
GROUP BY Name, City
HAVING COUNT(*) > 1;

DELETE FROM Student s1
WHERE EXISTS (
    SELECT 1 FROM Student s2
    WHERE s2.Name = s1.Name
      AND s2.City IS NOT DISTINCT FROM s1.City
      AND s2.StudentID < s1.StudentID
);

-- Lab 7.2: Department KPI Dashboard Query
SELECT COALESCE(d.DeptName, 'Undeclared Department') AS DeptName,
       COUNT(s.StudentID)                            AS StudentCount,
       ROUND(AVG(s.CGPA), 2)                         AS MeanCGPA,
       COALESCE(SUM(s.Scholar), 0.00)                AS TotalScholarshipDisbursed
FROM Student s
LEFT JOIN Department d ON s.DeptID = d.DeptID
GROUP BY d.DeptID, d.DeptName
ORDER BY TotalScholarshipDisbursed DESC;` }
      ]
    },
    // Page 28
    {
      blocks: [
        { type: 'h3', text: 'Solutions to Part H: "Spot the Mistake" Diagnostic Challenges (7.1 to 7.3)' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 7.1 | Using Aggregate Alias Inside WHERE', body: 'Writing SELECT DeptID, AVG(CGPA) AS AvgG FROM Student WHERE AvgG > 8.0 GROUP BY DeptID fails for TWO reasons: (1) WHERE executes at Stage 2 before aggregates (Stage 4) and SELECT aliases (Stage 6) exist, and (2) filtering groups by an aggregate requires HAVING AVG(CGPA) > 8.0!' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 7.2 | Unprotected Scalar Addition with Nullable Column', body: 'Writing Salary + Bonus produces NULL for every employee whose Bonus is NULL (Trap 6: Contagious NULL arithmetic)! Always wrap nullable numeric columns in COALESCE: Salary + COALESCE(Bonus, 0).' },
        { type: 'callout', kind: 'mistake', title: 'Diagnostic Solution 7.3 | Violating the Single-Value Rule of GROUP BY', body: 'Writing SELECT DeptID, Name, AVG(CGPA) FROM Student GROUP BY DeptID is rejected by standard SQL and PostgreSQL because Name is neither aggregated nor functionally dependent on DeptID. Even in legacy MySQL (with ONLY_FULL_GROUP_BY disabled), it returns an arbitrary student’s name—NOT the student with the highest/average CGPA!' },
        { type: 'callout', kind: 'concept', title: 'END OF CHAPTER 7 | Complete DBMS Study Series (Chapters 1 to 7 Ready)', body: 'You have now mastered Part I (Chapters 1–4: DBMS Fundamentals, Architecture, Data Models, ER & EER Modeling) and Part II (Chapters 5–7: The Relational Model, Keys, Constraints, Relational Algebra/Calculus, and SQL DDL/DML/Aggregates/3VL)!' }
      ]
    }
  ]
};
