# 🚀 AI Journal Copilot

<p align="center">
  <b>AI-powered system to analyze research abstracts, recommend journals, and predict acceptance probability.</b>
</p>

<p align="center">
  Built for researchers, students, and developers to accelerate academic publishing decisions.
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js"/>
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi"/>
  <img src="https://img.shields.io/badge/AI-Groq_LLM-purple?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Styling-TailwindCSS-38BDF8?style=for-the-badge&logo=tailwindcss"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge"/>
</p>

---

## 🌐 Live Demo

🚧 Coming Soon (Vercel + Render Deployment)

---

## 🎯 Problem Statement

Choosing the right journal for a research paper is:
- Time-consuming  
- Subjective  
- Lacks data-driven insights  

---

## 💡 Solution

**AI Journal Copilot** automates this process by:

- Analyzing your research abstract  
- Identifying domain and subfield  
- Recommending relevant journals  
- Predicting acceptance probability  
- Suggesting improvements  

---

## ⚡ Key Features

### 🔍 Intelligent Abstract Analysis
- NLP-based understanding of research content  
- Detects methodology, results, and validation signals  

### 🎯 Journal Recommendation Engine
- Suggests top journals with match scores  
- Ranked output for decision-making  

### 📊 Acceptance Probability Prediction
- Custom scoring system (not raw AI output)  
- Deterministic + explainable logic  

### 💡 AI Improvement Suggestions
- Highlights missing components  
- Improves clarity and structure  

### 🧠 Dynamic Scoring System
- Evaluates:
  - Length  
  - Methodology  
  - Results  
  - Experimental validation  

### 📁 History Tracking
- Saves past analyses  
- Real-time updates  
- Click to reload results  

---

## 🧠 System Architecture

```mermaid
flowchart TD
A[User Input Abstract] --> B[FastAPI Backend]
B --> C[Groq LLM Analysis]
B --> D[Custom Scoring Engine]
C --> E[Structured JSON Output]
D --> E
E --> F[Next.js Frontend Dashboard]
F --> G[Visualization + Insights]
````

---

## 🛠 Tech Stack

### Frontend

* Next.js (React)
* Tailwind CSS
* shadcn/ui
* Lucide Icons

### Backend

* FastAPI
* Groq LLM API
* Python

### Core Logic

* Custom scoring algorithm
* Regex-based JSON parsing
* AI + deterministic hybrid system

---

## ⚙️ Setup Guide

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Ks-Gupta/ai-journal-copilot.git
cd ai-journal-copilot
```

---

### 2️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `.env`:

```env
GROQ_API_KEY=your_api_key_here
```

Run:

```bash
uvicorn main:app --reload
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Design

### Analyze Abstract

```
POST /analyze
```

### Improve Abstract

```
POST /improve
```

---

## 📸 Screenshots

> Add screenshots here:

* Landing Page
* Results Dashboard
* History Page

---

## 🔐 Security

* API keys stored using `.env`
* Secrets excluded via `.gitignore`
* GitHub secret scanning compliance

---

## 🚀 Engineering Highlights

* ⚡ Hybrid AI + deterministic scoring system
* 🧠 Explainable outputs (not black-box AI)
* 🔄 Resilient JSON parsing with fallback
* 📊 Real-time UI updates
* 🧩 Modular frontend + backend architecture

---

## 📈 Future Roadmap

* 🌍 Real journal API integration
* 📄 PDF export of results
* 🔎 Semantic research search
* 👤 Authentication system
* 📊 ML-based acceptance prediction

---

## 🤝 Contributing

Contributions are welcome!

1. Fork repo
2. Create branch
3. Commit changes
4. Open PR

---

## 👩‍💻 Author

**Khushi Gupta**
Tech Graduate Trainee @ Taylor & Francis
Backend & AI Systems Enthusiast

---

<p align="center">
  ⭐ Star this repo if you found it useful!
</p>

---

