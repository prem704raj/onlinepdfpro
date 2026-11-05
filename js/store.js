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
        pageCount: 30,
        format: "PDF",
        description: "Free chapter-wise DBMS study materials for college studies — starting with Chapter 1: Data, Databases, and DBMS Fundamentals (30-page textbook chapter with Python/Java code, GATE/Viva question bank, and complete worked solutions).",
        includes: [
            "Data vs. Information vs. Knowledge vs. Metadata",
            "File-Processing Systems vs. DBMS (7 Classic Problems & Storage Math)",
            "DBMS vs. RDBMS & E.F. Codd's Relational Rules",
            "PostgreSQL, MySQL InnoDB, Oracle, SQLite & Python/Java Connectivity",
            "Complete GATE, Semester Exam & Viva Question Bank with Worked Solutions"
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
                title: "DBMS Architecture & Data Independence",
                shortTopic: "Schema vs. Instance · ANSI/SPARC 3-Schema · Logical & Physical Independence",
                summary: "Three-Schema Architecture (External, Conceptual, Internal levels), Logical vs. Physical Data Independence, Query Processor and Storage Manager internals, and 1/2/3-Tier client-server architectures.",
                pageCount: null,
                status: "upcoming",
                pdfUrl: null,
                downloadName: null
            },
            {
                number: 3,
                id: "chapter-03",
                badge: "CHAPTER 03",
                part: "PART I · CONCEPTUAL DESIGN",
                title: "Entity-Relationship (ER) & Enhanced ER Modeling",
                shortTopic: "Entities & Attributes · Cardinality & Participation · Weak Entities · 7 Mapping Rules",
                summary: "Conceptual database modeling with strong/weak entities, composite and multivalued attributes, total vs. partial participation, EER specialization/generalization, and step-by-step ER-to-Relational table mapping.",
                pageCount: null,
                status: "upcoming",
                pdfUrl: null,
                downloadName: null
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
