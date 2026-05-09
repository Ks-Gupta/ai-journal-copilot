from urllib.parse import quote_plus

from app.services.embedding_service import get_embedding


def _scholar_url(name: str) -> str:
    return f"https://scholar.google.com/scholar?q={quote_plus(name + ' journal submission')}"


JOURNAL_DB = [
    # --- AI / ML / Vision ---
    {
        "name": "IEEE Transactions on Medical Imaging",
        "domains": ["medical imaging", "healthcare ai"],
        "keywords": ["deep learning", "computer vision", "segmentation"],
        "methods": ["cnn", "transformer"],
        "description": "Medical imaging using AI, deep learning and computer vision",
        "impact_factor": 9.0,
        "quartile": "Q1",
        "publisher": "IEEE",
    },
    {
        "name": "Pattern Recognition",
        "domains": ["machine learning", "pattern recognition"],
        "keywords": ["classification", "image processing"],
        "methods": ["ml", "deep learning"],
        "description": "Pattern recognition, ML, and image analysis",
        "impact_factor": 7.5,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },
    {
        "name": "IEEE Transactions on Neural Networks and Learning Systems",
        "domains": ["deep learning", "neural networks"],
        "keywords": ["transformer", "neural network", "ai"],
        "methods": ["cnn", "rnn", "transformer"],
        "description": "Neural networks, deep learning architectures and AI models",
        "impact_factor": 10.2,
        "quartile": "Q1",
        "publisher": "IEEE",
    },

    # --- Mechanical / Thermal / Energy ---
    {
        "name": "Applied Thermal Engineering",
        "domains": ["mechanical engineering", "thermal engineering", "energy systems"],
        "keywords": [
            "heat transfer", "thermal management", "combustion engine",
            "energy efficiency", "cooling systems", "heat dissipation"
        ],
        "methods": ["experimental validation", "simulation", "optimization", "cfd"],
        "description": "Thermal engineering, heat transfer, combustion, cooling and energy systems",
        "impact_factor": 6.4,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },
    {
        "name": "International Journal of Engine Research",
        "domains": ["mechanical engineering", "automotive", "combustion"],
        "keywords": [
            "internal combustion engine", "engine efficiency", "fuel injection",
            "emissions", "powertrain", "thermodynamics"
        ],
        "methods": ["experimental", "simulation", "engine testing"],
        "description": "Internal combustion engines, automotive powertrains and engine efficiency research",
        "impact_factor": 3.0,
        "quartile": "Q2",
        "publisher": "SAGE",
    },
    {
        "name": "Energy Conversion and Management",
        "domains": ["energy systems", "renewable energy", "thermal engineering"],
        "keywords": [
            "energy efficiency", "renewable energy", "solar", "wind",
            "thermal storage", "power generation"
        ],
        "methods": ["modeling", "simulation", "experimental validation"],
        "description": "Energy conversion, management, renewables and efficiency",
        "impact_factor": 10.4,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },
    {
        "name": "Journal of Mechanical Design",
        "domains": ["mechanical engineering", "design optimization"],
        "keywords": ["mechanical design", "optimization", "structural", "manufacturing"],
        "methods": ["fea", "topology optimization", "experimental"],
        "description": "Mechanical design, structural optimization and product engineering",
        "impact_factor": 3.4,
        "quartile": "Q2",
        "publisher": "ASME",
    },

    # --- Materials Science ---
    {
        "name": "Acta Materialia",
        "domains": ["materials science", "metallurgy"],
        "keywords": [
            "alloys", "microstructure", "mechanical properties",
            "composites", "nanomaterials"
        ],
        "methods": ["characterization", "experimental", "simulation"],
        "description": "Materials science, metallurgy, alloys and microstructure",
        "impact_factor": 9.4,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },

    # --- Civil / Structural ---
    {
        "name": "Engineering Structures",
        "domains": ["civil engineering", "structural engineering"],
        "keywords": [
            "structural analysis", "concrete", "steel", "seismic",
            "bridge", "load testing"
        ],
        "methods": ["fea", "experimental testing", "modeling"],
        "description": "Civil and structural engineering, structural analysis and seismic design",
        "impact_factor": 5.6,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },

    # --- IoT / Networking / Cloud ---
    {
        "name": "IEEE Internet of Things Journal",
        "domains": ["iot", "networking", "embedded systems"],
        "keywords": [
            "iot", "sensor networks", "edge computing", "wireless",
            "smart devices", "low power"
        ],
        "methods": ["protocol design", "simulation", "prototype"],
        "description": "Internet of Things, sensor networks, edge computing and embedded systems",
        "impact_factor": 10.6,
        "quartile": "Q1",
        "publisher": "IEEE",
    },
    {
        "name": "IEEE Transactions on Cloud Computing",
        "domains": ["cloud computing", "distributed systems"],
        "keywords": [
            "cloud", "virtualization", "containers", "scheduling",
            "scalability", "distributed"
        ],
        "methods": ["systems design", "benchmarking", "simulation"],
        "description": "Cloud computing, virtualization and distributed systems",
        "impact_factor": 5.3,
        "quartile": "Q1",
        "publisher": "IEEE",
    },

    # --- Cybersecurity ---
    {
        "name": "IEEE Transactions on Information Forensics and Security",
        "domains": ["cybersecurity", "information security"],
        "keywords": [
            "encryption", "intrusion detection", "malware", "privacy",
            "authentication", "forensics"
        ],
        "methods": ["cryptanalysis", "experimental", "formal analysis"],
        "description": "Information security, cryptography, intrusion detection and digital forensics",
        "impact_factor": 6.8,
        "quartile": "Q1",
        "publisher": "IEEE",
    },

    # --- Robotics ---
    {
        "name": "IEEE Transactions on Robotics",
        "domains": ["robotics", "control systems"],
        "keywords": [
            "robot", "manipulation", "slam", "motion planning",
            "control", "autonomous"
        ],
        "methods": ["control theory", "experimental robot", "simulation"],
        "description": "Robotics, manipulation, motion planning and autonomous systems",
        "impact_factor": 9.4,
        "quartile": "Q1",
        "publisher": "IEEE",
    },

    # --- NLP ---
    {
        "name": "Computational Linguistics",
        "domains": ["nlp", "natural language processing", "computational linguistics"],
        "keywords": [
            "language model", "machine translation", "syntax", "semantics",
            "text generation", "tokenization"
        ],
        "methods": ["transformer", "statistical nlp", "evaluation"],
        "description": "Natural language processing, computational linguistics and language models",
        "impact_factor": 9.3,
        "quartile": "Q1",
        "publisher": "MIT Press",
    },

    # --- Bioinformatics / Healthcare ---
    {
        "name": "Bioinformatics",
        "domains": ["bioinformatics", "computational biology"],
        "keywords": [
            "genomics", "sequencing", "protein", "rna",
            "biological data", "phylogenetics"
        ],
        "methods": ["sequence analysis", "ml", "statistical"],
        "description": "Bioinformatics, computational biology and genomic data analysis",
        "impact_factor": 5.8,
        "quartile": "Q1",
        "publisher": "Oxford University Press",
    },
    {
        "name": "The Lancet Digital Health",
        "domains": ["healthcare", "digital health", "clinical research"],
        "keywords": [
            "clinical", "patient outcomes", "ehr", "telemedicine",
            "public health", "health informatics"
        ],
        "methods": ["clinical study", "retrospective analysis", "ml"],
        "description": "Digital health, clinical informatics and patient-centered research",
        "impact_factor": 30.8,
        "quartile": "Q1",
        "publisher": "Elsevier (The Lancet)",
    },

    # --- Finance / Economics / Quantitative Analytics ---
    {
        "name": "Journal of Finance",
        "domains": ["finance", "economics", "asset pricing"],
        "keywords": [
            "asset pricing", "stock market", "portfolio", "risk",
            "equity", "corporate finance", "market efficiency"
        ],
        "methods": ["empirical analysis", "econometrics", "regression"],
        "description": "Finance, asset pricing, corporate finance and capital markets",
        "impact_factor": 7.6,
        "quartile": "Q1",
        "publisher": "Wiley",
    },
    {
        "name": "Quantitative Finance",
        "domains": ["finance", "quantitative finance", "financial engineering"],
        "keywords": [
            "stock market prediction", "trading", "volatility", "derivatives",
            "time series", "financial forecasting", "market trends",
            "sentiment analysis"
        ],
        "methods": ["machine learning", "time series modeling", "monte carlo"],
        "description": "Quantitative finance, algorithmic trading, financial forecasting and predictive analytics on market data",
        "impact_factor": 1.7,
        "quartile": "Q2",
        "publisher": "Taylor & Francis",
    },
    {
        "name": "Journal of Banking & Finance",
        "domains": ["finance", "banking", "economics"],
        "keywords": [
            "banking", "credit risk", "financial markets", "regulation",
            "monetary policy", "lending"
        ],
        "methods": ["empirical analysis", "econometrics"],
        "description": "Banking, financial intermediation, credit risk and financial markets",
        "impact_factor": 3.6,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },
    {
        "name": "Expert Systems with Applications",
        "domains": ["applied ai", "decision support", "predictive analytics"],
        "keywords": [
            "machine learning", "prediction", "forecasting",
            "stock market", "sentiment analysis", "natural language processing",
            "deep learning", "applied"
        ],
        "methods": ["ml", "deep learning", "feature engineering", "evaluation"],
        "description": "Applied AI, machine learning and predictive analytics for finance, business and decision-making problems",
        "impact_factor": 8.5,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },
    {
        "name": "Decision Support Systems",
        "domains": ["decision support", "business analytics", "applied ai"],
        "keywords": [
            "decision support", "business intelligence", "analytics",
            "forecasting", "text mining", "sentiment analysis"
        ],
        "methods": ["ml", "data mining", "empirical study"],
        "description": "Decision support systems, business analytics and applied data-driven decision-making",
        "impact_factor": 6.7,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },
    {
        "name": "International Journal of Forecasting",
        "domains": ["forecasting", "econometrics", "statistics"],
        "keywords": [
            "forecasting", "time series", "prediction", "demand",
            "stock market", "economic forecasting"
        ],
        "methods": ["statistical forecasting", "ml", "evaluation"],
        "description": "Forecasting methodology, time series prediction and economic forecasting",
        "impact_factor": 7.0,
        "quartile": "Q1",
        "publisher": "Elsevier",
    },
]

# 🔥 ADD EMBEDDINGS + derived submission URL
for j in JOURNAL_DB:
    j["embedding"] = get_embedding(j["description"])
    j.setdefault("submission_url", _scholar_url(j["name"]))
