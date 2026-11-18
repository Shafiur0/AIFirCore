# AI BUILDERS HACKATHON 2026 — PRELIMINARY PROJECT PROPOSAL
**Challenge Track:** 1. HealthTech & Healthcare AI  
**Project Title:** **AI Fitness Brain (AIFitCore): Autonomous Biomechanical Kinematics, Metabolic Nutrition Intelligence & Preventive Musculoskeletal Health Platform**  
**Team Leader GitHub:** https://github.com/Shafiur0  
**Target Submission Format:** 3-Page Executive PDF  

---

<!-- PAGE 1: PROBLEM STATEMENT & TARGET AUDIENCE -->

## 1. Problem Identification and Healthcare Importance

### 1.1 The Global & Regional Musculoskeletal Health Crisis
Physical inactivity, poor posture, and improper exercise execution are leading drivers of chronic lifestyle diseases and musculoskeletal injuries. Globally, over **1.8 billion adults** do not meet recommended physical activity levels (WHO, 2024). In Bangladesh and developing South Asian economies, rapid urbanization and sedentary white-collar routines have caused a massive surge in:
- **Repetitive Strain & Lumbar Spine Disorders:** Over 68% of desk workers and novice gym trainees experience avoidable lower-back, patellar, and rotator-cuff injuries caused by unmonitored exercise form (e.g., knee valgus, lumbar hyperextension, asymmetrical loading).
- **Metabolic Syndrome & Nutritional Illiteracy:** Type 2 diabetes and hypertension rates in South Asia are escalating rapidly. Most individuals lack access to personalized, culturally aligned dietary guidance that accounts for local staple foods (e.g., rice, lentils, freshwater fish) versus Western-centric meal plans.
- **Economic Inequity in Preventative Care:** Personal trainers and clinical exercise physiologists charge between BDT 15,000 to BDT 40,000 per month, pricing out over 92% of the university and working-class population.

### 1.2 The Failure of Existing Digital Health & Fitness Apps
Commercial fitness apps on the market suffer from three critical flaws:
1. **One-Size-Fits-All Static Prescriptions:** Every user receives identical workout splits, ignoring distinct injury histories, bone lever lengths, and daily recovery capacities.
2. **Hallucinated "Black-Box" AI Nutrition:** Generic generative AI chatbots frequently hallucinate arbitrary calorie and macro numbers without verifying clinical BMR/TDEE metabolic formulas.
3. **Absence of Real-Time Biomechanical Guidance:** Existing apps provide pre-recorded workout videos without feedback. Users cannot tell if their knee angle is reaching parallel depth or if their lumbar spine is dangerously rounding under load.

---

## 2. Target Users and Population Impact

| User Cohort | Primary Pain Points | Direct Value Proposition Delivered |
|---|---|---|
| **Undergraduate & University Students** | Low disposable income, academic burnout, lack of gym equipment or guidance. | Free, equipment-aware home & calisthenics training with camera-based real-time form coaching. |
| **Desk Workers & Sedentary Professionals** | Forward head posture, lower-back stiffness, metabolic stagnation, tight schedules. | Micro-recovery routines, postural alignment audits, and time-efficient 15–30 min HIIT/calisthenics sessions. |
| **Rehabilitation & Novice Trainees** | Fear of reinjury, intimidation by commercial gyms, inability to afford human physiotherapists. | Real-time joint angle alerts, zero-penalty regression safety nets, and deterministic recovery scoring. |
| **South Asian & Cultural Demographics** | Commercial apps lack local nutritional databases (e.g., Rohu fish, Masoor dal, Lal chal, Tok doi). | Standardized nutritional catalog indexing authentic South Asian staples alongside international foods. |

---

<!-- PAGE 2: PROPOSED AI-POWERED SOLUTION & WORKFLOW -->

## 3. Proposed AI-Powered Solution: AI Fitness Brain (AIFitCore)

**AIFitCore** is an autonomous personal health and movement intelligence platform designed to bridge the gap between clinical biomechanics, metabolic science, and accessible AI computing.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        AIFitCore PREVENTATIVE HEALTH ECOSYSTEM                         │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ Local Computer Vision    │ Deterministic Metabolism │ Grounded Conversational AI       │
│ Real-time MediaPipe pose │ Clinical Mifflin-St Jeor │ Injected with live athlete logs, │
│ kinematic tracking. Zero │ & Katch-McArdle math. No │ remaining macros, and recovery   │
│ video streamed to cloud. │ hallucinated calories.   │ readiness scores.                │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### 3.1 Key Architectural Modules
1. **Browser-Based Computer Vision Pose Kinematics Engine:**
   - Powered locally by **MediaPipe Pose Landmarker** (33 3D skeletal landmarks at 30+ FPS).
   - Trigonometric joint angle calculation (Hip-Knee-Ankle for Squats/Lunges, Shoulder-Elbow-Wrist for Push-Ups/Presses, Ear-Shoulder-Hip-Ankle for Planks).
   - Real-time auditory synthesized voice feedback (*"Go a little deeper"*, *"Keep chest proud"*) and debounced repetition state machines.
   - **100% Privacy-Preserving:** Operates strictly on client WebAssembly/WebGL memory; raw video never leaves the user's device.
2. **Deterministic Metabolic & Nutrition Intelligence Engine:**
   - Implements verified clinical algorithms (**Mifflin-St Jeor** and **Katch-McArdle LBM**) with strict deficit/surplus safety guardrails. Underage athletes ($<18$ years) and underweight users ($\text{BMI} < 18.5$) are safeguarded against aggressive deficits.
   - Synthesizes culturally harmonized 4-meal daily plans (Breakfast, Lunch, Snack, Dinner).
   - Multi-modal calorie logging: Natural Text NLP Parser, Local/Global Catalog, and Computer Vision Food Scanning with mandatory user verification.
3. **Per-Exercise Progressive Overload & Adaptive Difficulty Engine:**
   - Evaluates exercise performance independently (Level 1 Foundation $\rightarrow$ Level 5 Elite).
   - Requires multi-session evidence ($\ge 2$ consecutive sessions at $\ge 82\%$ form score + full rep completion + adequate recovery readiness) before progressing, preventing premature overload and injury.
4. **Context-Grounded Conversational Health Coach:**
   - Server-side LLM gateway (OpenRouter API) running structured reasoning grounded in live database metrics (remaining daily calories, protein deficits, and recovery logs).

### 3.2 End-to-End User Journey Workflow
```
[1. Onboarding & Health Screen] 
   └── Input biometrics, injury disclosures, gear, and dietary restrictions
       └── Deterministic BMR/TDEE calculation & baseline macro target generation
[2. Daily Workout Execution]
   ├── Category Selection: Gym, Home, or Calisthenics
   └── Launch AI Camera Trainer: Live joint angles, depth validation, rep counting & voice cues
[3. Post-Workout Nutrition & Food Tracking]
   └── Log meals via natural text, verified food catalog, or photo scan (requires confirmation)
       └── Real-time remaining calorie & macronutrient progress reconciliation
[4. Sleep & Recovery Evaluation]
   └── Daily readiness scoring (sleep duration, quality, muscle soreness, fatigue)
       └── Automatic workout volume scaling for the next session
[5. Continuous Adaptive Overload Audit]
   └── Long-term memory records form trends, unlocks next skill tier, and feeds AI coach
```

---

<!-- PAGE 3: INNOVATION, FEASIBILITY, BUSINESS MODEL & SUSTAINABILITY -->

## 4. Innovation and Technical Feasibility

### 4.1 Core Technical Innovations
- **Edge-Based Kinematic Analysis:** Unlike competitors that require expensive wearable sensors or high-latency cloud video streaming, AIFitCore runs high-frequency kinematic angle analysis entirely inside the browser using standard webcams and smartphone cameras.
- **Separation of Deterministic Calculations vs. Generative Reasoning:** Eliminates the dangerous risk of LLM hallucinations in health metrics by isolating metabolic arithmetic in validated TypeScript functions while leveraging LLMs strictly for qualitative coaching and structured synthesis.
- **Culturally Inclusive Nutrition Architecture:** Overcomes the geographic bias of Western health applications by providing first-class database indexing for South Asian and Bangladeshi dietary staples with verified macronutrient breakdowns.

### 4.2 Engineering Feasibility & Production Readiness
The core technology is not a theoretical concept; a fully functional production application has been engineered, validated, and deployed:
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts.
- **Computer Vision:** Google MediaPipe Pose Landmarker (`@mediapipe/tasks-vision`).
- **Database & Security:** Supabase PostgreSQL 17 with 25 normalized tables and 100% Row Level Security (RLS) isolation.
- **Verification:** 12/12 automated Vitest unit & integration tests covering metabolic formulas, pose state machines, and RLS boundaries.
- **Live Deployment:** Actively deployed in production on Vercel at `https://aifitcore.vercel.app`.

---

## 5. Business Model and Long-Term Sustainability

### 5.1 Value Delivery & Revenue Model
AIFitCore operates on a scalable **Freemium & B2B Institutional Health** model:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                     REVENUE STREAMS                                    │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. Free Community Tier   │ 2. Pro Athletic Tier     │ 3. Institutional & Corporate B2B │
│ • Complete BMR/TDEE math │ • Unlimited Camera Vision│ • Corporate wellness dashboards  │
│ • Home & Gym planners    │ • Advanced Biomechanics  │ • University sports analytics    │
│ • Daily food logging     │ • Custom LLM Health Coach│ • Preventive healthcare data for │
│ • Basic Calisthenics     │ • BDT 499/month ($4.50)  │   health insurance providers     │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### 5.2 Unit Economics & Infrastructure Efficiency
- **Zero Server GPU Overhead:** By offloading computer vision processing to client-side WebAssembly/WebGL on the user's browser, server operational costs remain near zero.
- **Scalable Serverless Architecture:** Next.js Edge Functions and Supabase PostgreSQL support thousands of concurrent users at negligible infrastructure cost per active athlete.

### 5.3 Long-Term Vision & Road Map
- **Phase 1 (Immediate):** Mobile PWA offline caching, expanded physical therapy exercises (post-stroke gait and ACL recovery monitoring).
- **Phase 2 (6 Months):** Wearable integration (Apple Health, Google Health Connect, Garmin) for heart-rate variability (HRV) recovery synchronization.
- **Phase 3 (12 Months):** Multi-modal computer vision model fine-tuned for clinical orthopedic posture assessments and university sports biomechanics.
