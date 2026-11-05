const STORE_PRODUCTS = {
    "dbms-notes": {
        id: "dbms-notes",
        title: "DBMS Complete Notes",
        price: 0,
        priceLabel: "Free",
        pdfUrl: "/assets/study-materials/dbms-chapter-01.pdf",
        downloadName: "DBMS-Chapter-01-Fundamentals.pdf",
        image: "/assets/previews/dbms/page-01.webp",
        url: "/products/dbms-notes",
        pageCount: 199,
        format: "PDF",
        description: "Free chapter-wise DBMS study materials for college studies — Chapters 1 to 7 (199 pages total) covering Database Foundations, Architecture, Data Models, ER/EER Modeling, Relational Model & Keys, Relational Algebra & Calculus, and SQL Fundamentals with GATE/Viva question banks and complete worked solutions.",
        includes: [
            "Part I (Ch. 1–4): DBMS Fundamentals, Three-Schema Architecture, Data Models & ER/EER Modeling",
            "Part II (Ch. 5–7): Relational Model & Keys, Relational Algebra & Calculus, and SQL DDL/DML/Aggregates/3VL",
            "Worked Numerical & Combinatorial Examples (Little's Law, Super-Key Counting, Cardinality Bounds)",
            "Production PostgreSQL, MySQL InnoDB, Python/Java JDBC & SQL Code Listings",
            "Complete GATE CS, Semester Exam & Technical Viva Question Banks with Step-by-Step Solutions"
        ],
        chapters: [
            {
                number: 1,
                id: "chapter-01",
                badge: "CHAPTER 01",
                part: "PART I · DATABASE FOUNDATIONS",
                title: "Data, Databases, and DBMS Fundamentals",
                shortTopic: "Data vs. Information · File Systems vs. DBMS · Codd's Rules · Python & Java JDBC",
                summary: "Complete 30-page textbook chapter covering raw data vs. metadata, UniVerseDB schema, the 7 classic file-system pitfalls with storage math, DBMS subsystems, Codd's rules, Python/Java connectivity, and full solved question bank.",
                pageCount: 30,
                status: "available",
                pdfUrl: "/assets/study-materials/dbms-chapter-01.pdf",
                downloadName: "DBMS-Chapter-01-Fundamentals.pdf"
            },
            {
                number: 2,
                id: "chapter-02",
                badge: "CHAPTER 02",
                part: "PART I · DATABASE FOUNDATIONS",
                title: "DBMS Architecture and Data Independence",
                shortTopic: "Schema vs. Instance · ANSI/SPARC 3-Schema · Logical & Physical Independence · Little's Law",
                summary: "Complete 29-page textbook chapter covering Schema vs. Instance, ANSI/SPARC Three-Schema Architecture, Logical vs. Physical Data Independence with SQL Views, 8 internal DBMS engine modules, 1/2/3-Tier connection pool math, and solved question bank.",
                pageCount: 29,
                status: "available",
                pdfUrl: "/assets/study-materials/dbms-chapter-02.pdf",
                downloadName: "DBMS-Chapter-02-Architecture-Data-Independence.pdf"
            },
            {
                number: 3,
                id: "chapter-03",
                badge: "CHAPTER 03",
                part: "PART I · DATABASE FOUNDATIONS",
                title: "Data Models: Evolution, Comparison, and Modeling Levels",
                shortTopic: "Hierarchical & Network · Relational & ORDBMS · 4 NoSQL Families · Conceptual/Logical/Physical",
                summary: "Complete 26-page textbook chapter covering the 3 parts of a Data Model, evolution from IBM IMS & CODASYL pointers to Relational, ORDBMS, and NoSQL (Document, Key-Value, Wide-Column, Graph), 3-stage modeling, and solved question bank.",
                pageCount: 26,
                status: "available",
                pdfUrl: "/assets/study-materials/dbms-chapter-03.pdf",
                downloadName: "DBMS-Chapter-03-Data-Models.pdf"
            },
            {
                number: 4,
                id: "chapter-04",
                badge: "CHAPTER 04",
                part: "PART I · DATABASE FOUNDATIONS",
                title: "Entity-Relationship (ER) and Enhanced ER (EER) Modeling",
                shortTopic: "Attribute Taxonomy · Ternary Proof · Weak Entities · EER Subclasses · 9-Step Mapping & GATE Min Tables",
                summary: "Complete 32-page textbook chapter covering all 8 attribute types, Unary/Binary/Ternary relationships, Weak Entities, EER Specialization/Generalization/Aggregation, the 9-Step Relational Mapping Algorithm, GATE minimum-table formulas, and solved question bank.",
                pageCount: 32,
                status: "available",
                pdfUrl: "/assets/study-materials/dbms-chapter-04.pdf",
                downloadName: "DBMS-Chapter-04-ER-EER-Modeling.pdf"
            },
            {
                number: 5,
                id: "chapter-05",
                badge: "CHAPTER 05",
                part: "PART II · RELATIONAL MODEL, ALGEBRA & SQL",
                title: "The Relational Model, Keys, and Integrity Constraints",
                shortTopic: "Degree & Cardinality · All 8 Key Types · GATE Super-Key Combinatorics · Referential Actions · 3VL",
                summary: "Complete 27-page textbook chapter covering mathematical relations, Set vs. Bag semantics, all 8 Key types, GATE CS Super-Key counting formulas & Sperner's Theorem, Entity & Referential Integrity actions, Three-Valued Logic (3VL), and solved question bank.",
                pageCount: 27,
                status: "available",
                pdfUrl: "/assets/study-materials/dbms-chapter-05.pdf",
                downloadName: "DBMS-Chapter-05-Relational-Model-Keys-Constraints.pdf"
            },
            {
                number: 6,
                id: "chapter-06",
                badge: "CHAPTER 06",
                part: "PART II · RELATIONAL MODEL, ALGEBRA & SQL",
                title: "Relational Algebra and Relational Calculus",
                shortTopic: "6 Fundamental & 6 Derived Operators · Joins & Division (÷) · GATE Cardinality Bounds · TRC & DRC",
                summary: "Complete 27-page textbook chapter covering Selection, Projection, Set operations, finding Max without aggregation, Theta/Natural/Outer/Semijoin/Antijoin, Division (÷) universal quantification, 12-row GATE Cardinality Bounds, TRC/DRC, and solved question bank.",
                pageCount: 27,
                status: "available",
                pdfUrl: "/assets/study-materials/dbms-chapter-06.pdf",
                downloadName: "DBMS-Chapter-06-Relational-Algebra-Calculus.pdf"
            },
            {
                number: 7,
                id: "chapter-07",
                badge: "CHAPTER 07",
                part: "PART II · RELATIONAL MODEL, ALGEBRA & SQL",
                title: "SQL Fundamentals: DDL, DML, Constraints, Aggregates, and NULL Logic",
                shortTopic: "8-Stage Execution Order · DELETE vs. TRUNCATE vs. DROP · 7 Deadly NULL Traps · GROUP BY & HAVING",
                summary: "Complete 28-page textbook chapter covering SQL's 8-stage logical execution pipeline, production DDL/DML, Set vs. Bag multiplicities, the 7 Deadly SQL NULL Traps, COALESCE/NULLIF, GROUP BY, HAVING, Conditional Aggregation, and solved question bank.",
                pageCount: 28,
                status: "available",
                pdfUrl: "/assets/study-materials/dbms-chapter-07.pdf",
                downloadName: "DBMS-Chapter-07-SQL-Fundamentals-DDL-DML-Aggregates-NULLs.pdf"
            }
        ],
        deliveryNote: "100% Free chapter-wise PDFs for college studies — view online or download instantly. No sign-in required.",
        disclosure: "Free chapter-wise study material for college studies, semester exams, GATE CS, and technical placement preparation.",
        previewPages: [
            "/assets/previews/dbms/page-01.webp",
            "/assets/previews/dbms/page-02.webp",
            "/assets/previews/dbms/page-03.webp",
            "/assets/previews/dbms/page-04.webp",
            "/assets/previews/dbms/page-05.webp"
        ]
    }
};

function viewStudyPdf(productId) {
    const product = STORE_PRODUCTS[productId];
    if (!product) return false;
    window.location.href = product.url || "/products/dbms-notes";
    return true;
}

function downloadStudyPdf(productId) {
    const product = STORE_PRODUCTS[productId];
    if (!product || !product.pdfUrl) return false;
    const link = document.createElement("a");
    link.href = product.pdfUrl;
    link.download = product.downloadName || `${product.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
}

window.STORE_PRODUCTS = STORE_PRODUCTS;
window.viewStudyPdf = viewStudyPdf;
window.downloadStudyPdf = downloadStudyPdf;
