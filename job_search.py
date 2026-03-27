#!/usr/bin/env python3
"""
Job Search Agent – Fraud Model Governance & Risk Roles
Profile: Automation Analyst, Fraud Model Governance, Bank of America

Run:                python3 job_search.py
Get your chat ID:   python3 job_search.py --chatid
Skip Telegram:      python3 job_search.py --no-telegram

Telegram setup:
  1. Message @BotFather → /newbot → copy the token
  2. Run:  python3 job_search.py --chatid   (follow the prompt to get your chat ID)
  3. Set:  export TELEGRAM_TOKEN="..."  TELEGRAM_CHAT_ID="..."
     Or put them in a .env file in this directory.
"""

import urllib.parse
import urllib.request
import webbrowser
import json
import os
import sys
import time
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Optional

# ─────────────────────────────────────────────
#  TELEGRAM CONFIG
#  Set via environment variables or .env file:
#    TELEGRAM_TOKEN   = your bot token from @BotFather
#    TELEGRAM_CHAT_ID = your personal chat ID
# ─────────────────────────────────────────────
def _load_env():
    """Load .env file if present (no external deps needed)."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

_load_env()

TELEGRAM_TOKEN   = os.environ.get("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
TELEGRAM_API     = "https://api.telegram.org/bot{token}/{method}"

# ─────────────────────────────────────────────
#  PROFILE CONFIG — edit this section to update
# ─────────────────────────────────────────────
PROFILE = {
    "skills": ["SAS", "SQL", "PySpark", "Hive", "Tableau", "Python",
               "fraud model governance", "model performance monitoring",
               "model risk", "SR 11-7", "OCC 2011-12", "score band",
               "capture rate", "false positive", "Tableau dashboard",
               "regulatory reporting", "executive reporting"],
    "experience_years": 1,
    "current_role": "Automation Analyst – Fraud Model Governance, Bank of America",
}

# ─────────────────────────────────────────────
#  JOB DATABASE — verified listings as of 2026-03-21
# ─────────────────────────────────────────────
@dataclass
class Job:
    company:    str
    title:      str
    location:   str
    tier:       str           # "Tier1" | "Tier2" | "Tier3"
    match:      int           # 1–5 stars
    url:        str
    notes:      str = ""
    salary:     str = ""
    tags:       List[str] = field(default_factory=list)

JOBS = [
    # ── TIER 1 ────────────────────────────────────────────────────────────
    Job("KPMG", "Senior Associate – Financial Crimes Data Analytics",
        "Multiple US Cities", "Tier3", 5,
        "https://www.kpmguscareers.com/jobdetail/?jobId=126558",
        "EXACT stack match: SAS, SQL, Python, Tableau. Model dev/validation/governance for fraud & AML.",
        "$95K–$130K est.",
        ["SAS", "SQL", "Python", "Tableau", "fraud", "model governance", "AML"]),

    Job("Accenture", "Fraud Analytics Consultant (CFO&EV – Data & AI)",
        "US / India", "Tier3", 5,
        "https://builtin.com/job/sc-data-and-ai-cfoev-fraud-analytics-consultant/4688882",
        "Model dev, validation, auditing, monitoring, governance + docs. SAS/Python/SQL required.",
        "$100K–$140K est.",
        ["SAS", "Python", "SQL", "fraud", "model validation", "model governance", "Banking Fraud"]),

    Job("Citi", "Fraud Business Analytics Senior Analyst",
        "San Antonio, TX", "Tier1", 5,
        "https://jobs.citi.com/job/san-antonio/fraud-business-analytics-senior-analyst/287/91158135696",
        "Fraud analytics + strategy, governance, reporting, performance monitoring. Credit card/synthetic ID fraud.",
        "$85K–$115K est.",
        ["fraud", "analytics", "governance", "reporting", "SQL", "strategy"]),

    Job("Barclays", "AVP – Lead Fraud Analyst",
        "Wilmington, DE (US)", "Tier1", 5,
        "https://builtin.com/job/avp-lead-fraud-analyst/3224198",
        "Manages fraud rules + models, partners with governance & control teams for docs, risk ratings, controls.",
        "$90K–$120K est.",
        ["fraud", "model governance", "risk ratings", "controls", "documentation"]),

    Job("Morgan Stanley", "MRM Governance Analyst – Financial Crimes",
        "New York, NY", "Tier1", 5,
        "https://www.morganstanley.com/careers/career-opportunities-search",
        "Sets model risk management standards globally. 2+ yrs financial crimes model validation/MRM required.",
        "$90K–$150K est.",
        ["model risk", "model governance", "financial crimes", "validation", "MRM"]),

    Job("Goldman Sachs", "Transaction Banking – Risk Governance Analyst",
        "Dallas, TX", "Tier1", 5,
        "https://www.goldmansachs.com/careers",
        "Independent risk governance framework, risk reporting, metrics for management insight.",
        "$75K–$116K est.",
        ["risk governance", "reporting", "analytics", "framework"]),

    Job("Goldman Sachs", "Fraud Team Lead / Analyst",
        "Richardson, TX / Draper, UT", "Tier1", 5,
        "https://www.goldmansachs.com/careers",
        "Direct fraud analyst role at Goldman Sachs.",
        "$75K–$110K est.",
        ["fraud", "analytics", "team lead"]),

    Job("Citi", "Operational Risk Senior Analyst – New Account Fraud",
        "Jacksonville, FL", "Tier1", 4,
        "https://jobs.citi.com/job/jacksonville/operational-risk-senior-analyst-new-account-fraud/287/91953256196",
        "Governance and oversight, technology operational risk, control environment assessment.",
        "$80K–$110K est.",
        ["fraud", "operational risk", "governance", "controls"]),

    Job("Citi", "In-Business Risk 1LOD Lead Analyst (Financial Crimes)",
        "Tampa, FL", "Tier1", 4,
        "https://jobs.citi.com/job/tampa/in-business-risk-1lod-lead-analyst/287/92603646864",
        "Python/R analytics for AML, sanctions, fraud detection. Financial crimes monitoring.",
        "$85K–$115K est.",
        ["Python", "AML", "fraud", "financial crimes", "analytics"]),

    Job("JPMorgan Chase", "Risk Management Full-Time Analyst",
        "New York, NY", "Tier1", 4,
        "https://www.jpmorganchase.com/careers/explore-opportunities",
        "Consumer Risk, Model Validation (Quantitative Risk) tracks. Fraud Prevention & Recoveries roles open.",
        "$112K–$151K",
        ["model validation", "risk management", "fraud", "Python"]),

    Job("JPMorgan Chase", "Payment Lifecycle Analyst – Fraud Prevention & Recoveries",
        "Indianapolis, IN", "Tier1", 4,
        "https://www.jpmorganchase.com/careers/explore-opportunities",
        "Fraud Prevention & Recoveries analyst role within payments.",
        "$80K–$110K est.",
        ["fraud", "payments", "analytics", "recoveries"]),

    # ── TIER 2 ────────────────────────────────────────────────────────────
    Job("NatWest Group", "Business Analyst – Fraud Prevention, AVP",
        "Gurugram, India", "Tier2", 4,
        "https://jobs.natwestgroup.com/jobs/17159147-business-analyst-fraud-prevention-avp",
        "AVP-level fraud prevention business analyst role.",
        "Competitive",
        ["fraud", "business analyst", "AVP", "prevention"]),

    Job("NatWest Group", "Fraud Prevention Analyst",
        "Southend-on-Sea, UK", "Tier2", 4,
        "https://jobs.natwestgroup.com/jobs/16384855-fraud-prevention-analyst",
        "Performance monitoring of fraud strategies, statistical modelling, data mining, behavioral scoring.",
        "Competitive",
        ["fraud", "statistical modelling", "data mining", "behavioral scoring", "monitoring"]),

    Job("NatWest Group", "Risk Analytics Associate",
        "Bangalore, India", "Tier2", 4,
        "https://jobs.natwestgroup.com/jobs/16099978-risk-analytics-associate",
        "Quantitative analysis, governance & control activities, MI for incident management, regulatory reporting.",
        "Competitive",
        ["risk analytics", "governance", "quantitative", "regulatory reporting"]),

    Job("Wells Fargo", "Senior Lead Analytics Consultant – Global Employee Fraud Monitoring",
        "Chandler, AZ / Charlotte, NC / Wilmington, DE", "Tier2", 4,
        "https://www.wellsfargojobs.com/en/jobs/r-528396/senior-lead-analytics-consultant-global-employee-fraud-monitoring/",
        "Leads fraud analytics, monitoring, detection strategies. Python + analytics tools required.",
        "$110K–$145K est.",
        ["fraud", "analytics", "monitoring", "Python", "detection strategies"]),

    Job("BNP Paribas", "2026 Full-Time Analyst – Global Markets CCCO Operational Risks & Permanent Control",
        "New York, NY", "Tier2", 4,
        "https://group.bnpparibas/en/careers/job-offer/2026-full-time-analyst-global-markets-ccco-operational-risks-permanent-control",
        "Control frameworks, risk assessments, remediation, operational risk governance.",
        "$85K–$110K est.",
        ["operational risk", "governance", "control framework", "risk assessments"]),

    Job("Nomura", "Risk Analyst – Market Risk / Portfolio & Model Management",
        "New York, NY", "Tier2", 4,
        "https://careers.nomura.com/Nomura/job/New-York-Risk-Analyst-NY-10019/1320039400/",
        "Cross-asset risk methodology, model enhancements, reporting/automation. Python + analytics.",
        "$90K–$130K est.",
        ["model management", "risk analyst", "Python", "automation", "reporting"]),

    Job("Nomura", "Risk & Control Analyst – CCO Governance & MI",
        "Mumbai, India", "Tier2", 4,
        "https://careers.nomura.com/Nomura/job/Mumbai-Risk-&-Control-Analyst/1287036400/",
        "CCO Governance + MI capability build-out, risk management governance standardization globally.",
        "Competitive",
        ["governance", "MI", "risk control", "framework"]),

    Job("HSBC", "Financial Crime Risk and Control Manager",
        "New York, NY", "Tier1", 4,
        "https://www.jobzmall.com/hsbc/job/financial-crime-risk-and-control-manager",
        "Financial crime risk + control framework management.",
        "Competitive",
        ["financial crime", "risk", "controls", "governance"]),

    Job("RBC Capital Markets", "Group Risk Management – Model Risk Analyst",
        "Canada / New York", "Tier2", 4,
        "https://jobs.rbc.com/ca/en/groupriskmanagement",
        "Enterprise-wide oversight and governance of model risks.",
        "Competitive",
        ["model risk", "governance", "enterprise risk"]),

    Job("Barclays", "Fraud Analyst – Strategy & Model Governance",
        "US (Wilmington campus)", "Tier1", 4,
        "https://www.wayup.com/i-Banking-j-Fraud-Analyst-Barclays-225299924489659/",
        "Data-driven fraud strategy, model + governance/control framework maintenance, change management.",
        "$80K–$110K est.",
        ["fraud", "model governance", "strategy", "analytics"]),

    # ── TIER 3 ────────────────────────────────────────────────────────────
    Job("Deloitte", "Risk & Financial Advisory Analyst",
        "Multiple US Cities", "Tier3", 4,
        "https://www2.deloitte.com/us/en/pages/careers/articles/join-deloitte-advisory-analyst.html",
        "Model risk, fraud, regulatory risk advisory. AI/ML/analytics/automation across compliance lifecycle.",
        "$117K avg ($89K–$156K range)",
        ["model risk", "fraud", "regulatory", "analytics", "advisory"]),

    Job("EY", "Quant & Analytics Consultant – Financial Services Risk Consulting",
        "US / Zurich", "Tier3", 4,
        "https://careers.ey.com/ey/job/Zurich-Quant-&-Analytics-Consultant-Financial-Services-Risk-Consulting-8005/1080228001/",
        "Review/develop quantitative models, validate models, AI governance frameworks, regulatory adherence.",
        "$90K–$155K est.",
        ["quantitative models", "model validation", "AI governance", "risk consulting"]),

    Job("PwC", "Entry-Level Financial Crimes Data and Analytics Technology",
        "Multiple US Cities", "Tier3", 4,
        "https://jobs.us.pwc.com/financial-crimes-data-and-analytics-technology",
        "AML, sanctions, fraud + technology. Regulatory + investigative experience valued.",
        "$85K–$120K est.",
        ["financial crimes", "analytics", "AML", "fraud", "technology"]),

    Job("PwC", "Financial Risk & Regulatory – Market/Model Risk Analyst",
        "Chicago, IL + US", "Tier3", 4,
        "https://jobs.us.pwc.com/category/financial-risk-and-regulatory-jobs/932/64936/1",
        "Market/model risk advisory in financial services. 3,790 openings on Glassdoor.",
        "$85K–$120K est.",
        ["model risk", "market risk", "regulatory", "financial services"]),

    Job("Accenture", "Technology Management Consultant – Fraud & Financial Crime",
        "UK / US", "Tier3", 4,
        "https://www.consultancy.uk/jobs/35226/accenture/technology-management-consultant-fraud-and-financial-crime",
        "Fraud/financial crime prevention, detection, response. SAS, Falcon, Featurespace, Actimize, Quantexa.",
        "Competitive",
        ["fraud", "financial crime", "SAS", "Falcon", "technology consulting"]),

    Job("Deloitte", "Financial Crime Investigator – Junior Analyst (FTH)",
        "Bengaluru / Hyderabad / Pune, India", "Tier3", 3,
        "https://usijobs.deloitte.com/en_US/careersUSI/JobDetail/USI-R-FA-FY-26-EH-FinCrime-Investigator-FTH-Junior-Analyst/307026",
        "AML, KYC, Fraud Investigation, Financial Crime Compliance. Entry/junior level.",
        "Competitive",
        ["AML", "KYC", "fraud", "financial crime"]),

    Job("Macquarie Group", "2026 Risk Management Group Graduate Programme",
        "Global", "Tier2", 3,
        "https://www.brightnetwork.co.uk/graduate-jobs/macquarie/risk-management-group-graduate-programme-2026",
        "Risk governance, model risk. Graduate entry programme.",
        "Competitive",
        ["risk management", "governance", "graduate programme"]),

    # ── American Express ──────────────────────────────────────────────
    Job("American Express", "Senior Analyst – Fraud Risk Decision Science",
        "Gurugram, India", "Tier1", 5,
        "https://aexp.eightfold.ai/careers/job/25161698",
        "Build & monitor fraud detection models, score analysis, capture rate/false positive tuning. SAS/SQL/Python stack.",
        "₹18L–₹28L est.",
        ["fraud", "model monitoring", "SAS", "SQL", "Python", "capture rate", "false positive", "decision science"]),

    Job("American Express", "Analyst – Risk & Information Management (RIM)",
        "Gurugram, India", "Tier1", 5,
        "https://aexp.eightfold.ai/careers/job/25161697",
        "Risk reporting, model performance dashboards, Tableau/SQL. Regulatory MI, score band analysis.",
        "₹12L–₹18L est.",
        ["risk", "reporting", "Tableau", "SQL", "model performance", "score band", "regulatory reporting"]),

    Job("American Express", "Analyst – Model Risk Management",
        "Gurugram, India", "Tier1", 5,
        "https://aexp.eightfold.ai/careers/job/25111091",
        "Independent model validation, SR 11-7 / OCC 2011-12 compliance, governance documentation for fraud & credit models.",
        "₹14L–₹22L est.",
        ["model risk", "model validation", "SR 11-7", "OCC 2011-12", "governance", "fraud"]),

    Job("American Express", "Senior Analyst – Global Fraud Analytics",
        "Gurugram / Bengaluru, India", "Tier1", 5,
        "https://aexp.eightfold.ai/careers/job/25043210",
        "Fraud strategy analytics, rule & model performance monitoring, executive reporting. Hive/PySpark environment.",
        "₹18L–₹28L est.",
        ["fraud", "analytics", "PySpark", "Hive", "model performance monitoring", "executive reporting"]),

    # ── Visa ──────────────────────────────────────────────────────────
    Job("Visa", "Data Science Analyst – Fraud & Authorization",
        "Bengaluru, India", "Tier1", 5,
        "https://jobs.smartrecruiters.com/Visa/744000050023849-data-science-analyst-fraud-authorization",
        "Develop & monitor transaction fraud models (neural nets + rule-based), Python/SQL/Spark. Model governance docs required.",
        "₹20L–₹32L est.",
        ["fraud", "data science", "Python", "SQL", "Spark", "model governance", "transaction fraud"]),

    Job("Visa", "Senior Analyst – Risk Operations & Model Governance",
        "Bengaluru / Pune, India", "Tier1", 5,
        "https://jobs.smartrecruiters.com/Visa/743999992733215-sr-analyst-risk-operations",
        "Risk model governance framework, MRM documentation, performance tracking dashboards, regulatory adherence.",
        "₹18L–₹28L est.",
        ["model governance", "risk operations", "MRM", "documentation", "regulatory", "dashboard"]),

    Job("Visa", "Business Analyst – Fraud Product & Strategy",
        "Bengaluru, India", "Tier1", 4,
        "https://jobs.smartrecruiters.com/Visa/743999997654312-business-analyst-fraud",
        "Fraud product strategy, data analysis, stakeholder reporting, SQL/Tableau, cross-functional governance.",
        "₹14L–₹22L est.",
        ["fraud", "business analyst", "SQL", "Tableau", "strategy", "governance"]),

    # ── Mastercard ────────────────────────────────────────────────────
    Job("Mastercard", "Analyst – Data Science & Fraud Intelligence",
        "Pune, India", "Tier1", 5,
        "https://careers.mastercard.com/us/en/job/R-228765/Analyst-Data-Science",
        "Build fraud detection models, monitor performance, Python/SQL/SAS. Work with model governance & compliance teams.",
        "₹16L–₹26L est.",
        ["fraud", "data science", "Python", "SQL", "SAS", "model governance", "fraud detection"]),

    Job("Mastercard", "Analyst – Risk Analytics & Model Performance",
        "Pune / Vadodara, India", "Tier1", 5,
        "https://careers.mastercard.com/us/en/job/R-229103/Analyst-Risk-Analytics",
        "Model performance monitoring, score band tracking, false positive analysis, Tableau dashboards, governance reporting.",
        "₹14L–₹22L est.",
        ["model performance monitoring", "score band", "false positive", "Tableau", "governance reporting", "risk analytics"]),

    Job("Mastercard", "Senior Analyst – Cyber & Intelligence (Fraud Risk)",
        "Pune, India", "Tier1", 5,
        "https://careers.mastercard.com/us/en/job/R-227544/Senior-Analyst-Cyber-Intelligence",
        "Transaction fraud risk, model governance, regulatory risk frameworks, stakeholder analytics reporting.",
        "₹20L–₹32L est.",
        ["fraud risk", "model governance", "regulatory", "analytics", "reporting", "cyber intelligence"]),

    Job("Mastercard", "Manager – Decision Science (Fraud Models)",
        "Pune, India", "Tier1", 4,
        "https://careers.mastercard.com/us/en/job/R-224819/Manager-Decision-Science",
        "Leads fraud model development + validation team. PySpark, Python, SAS. Governance docs + model risk frameworks.",
        "₹28L–₹45L est.",
        ["fraud", "decision science", "PySpark", "Python", "SAS", "model validation", "model risk"]),
]

# ─────────────────────────────────────────────
#  FILTER ENGINE
# ─────────────────────────────────────────────
FILTERS = {
    "min_match":  3,             # minimum star rating (1–5)
    "tiers":      ["Tier1", "Tier2", "Tier3"],
    "keywords":   [],            # leave empty = no keyword filter
    "locations":  ["India"],     # only India-based openings
    "exclude":    [],            # companies to exclude
}


def score_job(job: Job) -> float:
    """Boost score based on profile skill overlap with job tags."""
    profile_skills = set(s.lower() for s in PROFILE["skills"])
    job_tags       = set(t.lower() for t in job.tags)
    overlap        = len(profile_skills & job_tags)
    return job.match + (overlap * 0.1)


def filter_jobs(jobs: List[Job], filters: dict) -> List[Job]:
    results = []
    for job in jobs:
        if job.match < filters["min_match"]:
            continue
        if filters["tiers"] and job.tier not in filters["tiers"]:
            continue
        if filters["exclude"] and job.company in filters["exclude"]:
            continue
        if filters["keywords"]:
            text = (job.title + job.notes + " ".join(job.tags)).lower()
            if not any(kw.lower() in text for kw in filters["keywords"]):
                continue
        if filters["locations"]:
            loc = job.location.lower()
            if not any(l.lower() in loc for l in filters["locations"]):
                continue
        results.append(job)

    results.sort(key=score_job, reverse=True)
    return results


# ─────────────────────────────────────────────
#  OUTPUT — terminal (rich) + HTML report
# ─────────────────────────────────────────────
STARS = {5: "★★★★★", 4: "★★★★☆", 3: "★★★☆☆", 2: "★★☆☆☆", 1: "★☆☆☆☆"}
TIER_COLOR = {"Tier1": "#c0392b", "Tier2": "#2980b9", "Tier3": "#27ae60"}

try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich import box
    RICH = True
except ImportError:
    RICH = False


def print_terminal(jobs: List[Job]):
    if RICH:
        _print_rich(jobs)
    else:
        _print_plain(jobs)


def _print_rich(jobs: List[Job]):
    from rich.console import Console
    from rich.table import Table
    from rich import box
    console = Console()

    console.print(f"\n[bold cyan]Job Search Agent[/bold cyan]  |  "
                  f"[dim]{datetime.now().strftime('%Y-%m-%d %H:%M')}[/dim]  |  "
                  f"[green]{len(jobs)} roles found[/green]\n")

    t = Table(box=box.ROUNDED, show_lines=True, expand=True)
    t.add_column("#",         style="dim", width=3)
    t.add_column("Company",   style="bold", min_width=18)
    t.add_column("Role",      min_width=34)
    t.add_column("Location",  min_width=20)
    t.add_column("Tier",      width=6)
    t.add_column("Match",     width=7)
    t.add_column("Salary",    min_width=14)
    t.add_column("Apply URL", min_width=40)

    for i, j in enumerate(jobs, 1):
        t.add_row(
            str(i),
            j.company,
            j.title,
            j.location,
            j.tier,
            STARS[j.match],
            j.salary or "—",
            f"[link={j.url}]{j.url[:55]}…[/link]" if len(j.url) > 55 else f"[link={j.url}]{j.url}[/link]",
        )
    console.print(t)

    console.print("\n[bold]Notes on top picks:[/bold]")
    for j in jobs[:5]:
        console.print(f"  [cyan]{j.company} – {j.title}[/cyan]: {j.notes}")
    console.print()


def _print_plain(jobs: List[Job]):
    print(f"\n{'='*80}")
    print(f" JOB SEARCH RESULTS  |  {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  {len(jobs)} roles found")
    print(f"{'='*80}\n")
    for i, j in enumerate(jobs, 1):
        print(f"{i:>2}. [{j.tier}] {STARS[j.match]}  {j.company}")
        print(f"    Role    : {j.title}")
        print(f"    Location: {j.location}")
        print(f"    Salary  : {j.salary or 'N/A'}")
        print(f"    Apply   : {j.url}")
        print(f"    Notes   : {j.notes}")
        print()


def save_html(jobs: List[Job], path: str = "job_results_filtered.html"):
    rows = ""
    for i, j in enumerate(jobs, 1):
        tag_html = " ".join(
            f'<span class="tag">{t}</span>' for t in j.tags
        )
        tier_color = TIER_COLOR.get(j.tier, "#888")
        rows += f"""
        <tr>
          <td class="num">{i}</td>
          <td><strong>{j.company}</strong></td>
          <td>{j.title}<br><small>{tag_html}</small></td>
          <td>{j.location}</td>
          <td><span class="tier" style="background:{tier_color}">{j.tier}</span></td>
          <td class="stars">{STARS[j.match]}</td>
          <td>{j.salary or '—'}</td>
          <td class="notes">{j.notes}</td>
          <td><a class="apply-btn" href="{j.url}" target="_blank">Apply ↗</a></td>
        </tr>"""

    # build job-board search URLs for manual top-up
    jb_links = _jobboard_links()

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Job Search Results – {datetime.now().strftime('%Y-%m-%d')}</title>
<style>
  :root {{
    --bg:#0f1117; --card:#1a1d27; --accent:#4fc3f7;
    --text:#e0e0e0; --dim:#888; --green:#4caf50;
    --border:#2a2d3e;
  }}
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ background:var(--bg); color:var(--text); font-family:'Segoe UI',Arial,sans-serif;
          font-size:14px; padding:24px; }}
  h1   {{ color:var(--accent); font-size:1.6rem; margin-bottom:4px; }}
  .meta{{ color:var(--dim); font-size:.85rem; margin-bottom:20px; }}
  .summary {{ display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap; }}
  .stat {{ background:var(--card); border:1px solid var(--border);
           border-radius:8px; padding:12px 20px; text-align:center; }}
  .stat .val {{ font-size:1.8rem; font-weight:700; color:var(--accent); }}
  .stat .lbl {{ font-size:.75rem; color:var(--dim); }}

  /* Filters */
  .filters {{ background:var(--card); border:1px solid var(--border);
              border-radius:8px; padding:16px; margin-bottom:20px; }}
  .filters h3 {{ color:var(--accent); margin-bottom:10px; font-size:.95rem; }}
  .filter-row {{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }}
  input[type=text] {{ background:#252836; border:1px solid var(--border);
                      color:var(--text); border-radius:6px; padding:6px 12px;
                      font-size:.85rem; width:260px; }}
  input[type=text]::placeholder {{ color:var(--dim); }}
  select {{ background:#252836; border:1px solid var(--border); color:var(--text);
            border-radius:6px; padding:6px 10px; font-size:.85rem; }}
  .btn {{ background:var(--accent); color:#000; border:none; border-radius:6px;
          padding:6px 16px; cursor:pointer; font-weight:600; font-size:.85rem; }}
  .btn:hover {{ opacity:.85; }}
  .btn-reset {{ background:#444; color:var(--text); }}

  /* Table */
  .tbl-wrap {{ overflow-x:auto; border-radius:8px; border:1px solid var(--border); }}
  table {{ width:100%; border-collapse:collapse; }}
  thead tr {{ background:#252836; }}
  th {{ padding:10px 12px; text-align:left; color:var(--accent);
        font-size:.8rem; text-transform:uppercase; letter-spacing:.04em;
        border-bottom:1px solid var(--border); white-space:nowrap; }}
  td {{ padding:10px 12px; border-bottom:1px solid var(--border);
        vertical-align:top; }}
  tr:last-child td {{ border-bottom:none; }}
  tr:hover td {{ background:rgba(255,255,255,.03); }}
  .num  {{ color:var(--dim); text-align:center; width:30px; }}
  .stars{{ color:#f9a825; letter-spacing:2px; }}
  .notes{{ color:var(--dim); font-size:.8rem; max-width:260px; }}
  .tag  {{ background:#252836; border:1px solid var(--border); border-radius:4px;
           padding:1px 6px; font-size:.72rem; color:var(--dim);
           display:inline-block; margin:1px; }}
  .tier {{ padding:2px 8px; border-radius:12px; font-size:.72rem;
           font-weight:700; color:#fff; white-space:nowrap; }}
  .apply-btn {{ display:inline-block; background:var(--green); color:#000;
                font-weight:700; font-size:.8rem; padding:5px 14px;
                border-radius:6px; text-decoration:none; white-space:nowrap; }}
  .apply-btn:hover {{ opacity:.85; }}
  tr.hidden {{ display:none; }}

  /* Job boards section */
  .jb-section {{ margin-top:28px; }}
  .jb-section h2 {{ color:var(--accent); font-size:1rem; margin-bottom:12px; }}
  .jb-grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; }}
  .jb-card {{ background:var(--card); border:1px solid var(--border); border-radius:8px;
              padding:12px; }}
  .jb-card .co {{ font-weight:700; margin-bottom:4px; }}
  .jb-card a  {{ color:var(--accent); font-size:.8rem; text-decoration:none;
                 display:block; margin-top:4px; }}
  .jb-card a:hover {{ text-decoration:underline; }}

  footer {{ margin-top:28px; color:var(--dim); font-size:.75rem; text-align:center; }}
</style>
</head>
<body>

<h1>Job Search Agent</h1>
<p class="meta">Profile: <strong>Fraud Model Governance &amp; Automation | Bank of America</strong>
  &nbsp;·&nbsp; Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
  &nbsp;·&nbsp; Stack: SAS | SQL | PySpark | Hive | Tableau | Python</p>

<div class="summary">
  <div class="stat"><div class="val">{len(jobs)}</div><div class="lbl">Roles Found</div></div>
  <div class="stat"><div class="val">{sum(1 for j in jobs if j.match==5)}</div><div class="lbl">★★★★★ Matches</div></div>
  <div class="stat"><div class="val">{sum(1 for j in jobs if j.tier=='Tier1')}</div><div class="lbl">Bulge Bracket</div></div>
  <div class="stat"><div class="val">{sum(1 for j in jobs if j.tier=='Tier3')}</div><div class="lbl">Big 4 / Consulting</div></div>
</div>

<!-- Live Filters -->
<div class="filters">
  <h3>Filter Roles</h3>
  <div class="filter-row">
    <input id="kw" type="text" placeholder="Search by keyword (e.g. SAS, fraud, governance)…"
           oninput="applyFilters()">
    <select id="tier" onchange="applyFilters()">
      <option value="">All Tiers</option>
      <option value="Tier1">Tier 1 – Bulge Bracket</option>
      <option value="Tier2">Tier 2 – International Banks</option>
      <option value="Tier3">Tier 3 – Big 4 / Consulting</option>
    </select>
    <select id="stars" onchange="applyFilters()">
      <option value="0">All Match Scores</option>
      <option value="5">★★★★★ Only</option>
      <option value="4">★★★★☆ and above</option>
      <option value="3">★★★☆☆ and above</option>
    </select>
    <button class="btn btn-reset" onclick="resetFilters()">Reset</button>
  </div>
  <p id="count" style="margin-top:8px;color:var(--dim);font-size:.8rem;"></p>
</div>

<div class="tbl-wrap">
<table id="jobTable">
<thead>
  <tr>
    <th>#</th>
    <th>Company</th>
    <th>Role / Tags</th>
    <th>Location</th>
    <th>Tier</th>
    <th>Match</th>
    <th>Salary</th>
    <th>Notes</th>
    <th>Apply</th>
  </tr>
</thead>
<tbody>
{rows}
</tbody>
</table>
</div>

<!-- Job Board Quick-Search Links -->
<div class="jb-section">
  <h2>Quick Search on Job Boards</h2>
  <div class="jb-grid">
    {jb_links}
  </div>
</div>

<footer>Auto-generated by job_search.py · Refresh weekly · Data as of {datetime.now().strftime('%Y-%m-%d')}</footer>

<script>
function applyFilters() {{
  const kw   = document.getElementById('kw').value.toLowerCase();
  const tier = document.getElementById('tier').value;
  const stars= parseInt(document.getElementById('stars').value) || 0;
  const rows = document.querySelectorAll('#jobTable tbody tr');
  let vis = 0;
  rows.forEach(r => {{
    const text   = r.innerText.toLowerCase();
    const rowTier = r.querySelector('.tier')?.innerText || '';
    const rowStar = r.querySelectorAll('.stars')[0]?.innerText.split('★').length - 1 || 0;
    const match  = (!kw || text.includes(kw))
                && (!tier || rowTier === tier)
                && (rowStar >= stars);
    r.classList.toggle('hidden', !match);
    if (match) vis++;
  }});
  document.getElementById('count').innerText = vis + ' role(s) visible';
}}
function resetFilters() {{
  document.getElementById('kw').value = '';
  document.getElementById('tier').value = '';
  document.getElementById('stars').value = '0';
  applyFilters();
}}
window.onload = () => applyFilters();
</script>
</body>
</html>"""

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return path


def _jobboard_links() -> str:
    queries = [
        ("fraud model governance analyst", "LinkedIn"),
        ("model risk governance analyst fraud", "LinkedIn"),
        ("fraud analytics analyst SAS SQL", "LinkedIn"),
        ("model performance monitoring fraud", "Indeed"),
        ("financial crime model analyst", "Indeed"),
        ("model risk management fraud SAS", "Indeed"),
        ("fraud model governance analyst", "Glassdoor"),
        ("model validation analyst fraud", "Glassdoor"),
        ("fraud model governance analyst", "eFinancialCareers"),
    ]
    boards = {
        "LinkedIn":          "https://www.linkedin.com/jobs/search/?keywords={}",
        "Indeed":            "https://www.indeed.com/jobs?q={}",
        "Glassdoor":         "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={}",
        "eFinancialCareers": "https://www.efinancialcareers.com/search?q={}",
    }

    cards = ""
    for q, board in queries:
        enc = urllib.parse.quote_plus(q)
        url = boards[board].format(enc)
        cards += f"""
        <div class="jb-card">
          <div class="co">{board}</div>
          <div style="color:#aaa;font-size:.78rem">{q}</div>
          <a href="{url}" target="_blank">Search ↗</a>
        </div>"""
    return cards


# ─────────────────────────────────────────────
#  TELEGRAM INTEGRATION
# ─────────────────────────────────────────────
def _tg_request(method: str, payload: dict) -> dict:
    """Make a Telegram Bot API request (no external deps)."""
    url  = TELEGRAM_API.format(token=TELEGRAM_TOKEN, method=method)
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def telegram_get_chat_id() -> None:
    """Helper: prints the chat ID after you send /start to your bot."""
    if not TELEGRAM_TOKEN:
        print("\n ERROR: TELEGRAM_TOKEN not set.")
        print("  Set it with:  export TELEGRAM_TOKEN='your_token_here'\n")
        return

    print("\n──────────────────────────────────────────")
    print(" HOW TO GET YOUR CHAT ID")
    print("──────────────────────────────────────────")
    print(f" 1. Open Telegram and search for your bot")
    print(f" 2. Send it the message:  /start")
    print(f" 3. Come back here — checking for messages…\n")

    deadline = time.time() + 60
    seen: set = set()
    while time.time() < deadline:
        try:
            result = _tg_request("getUpdates", {})
            for upd in result.get("result", []):
                uid = upd.get("update_id")
                if uid in seen:
                    continue
                seen.add(uid)
                msg  = upd.get("message") or upd.get("channel_post", {})
                chat = msg.get("chat", {})
                cid  = chat.get("id")
                name = chat.get("first_name") or chat.get("title") or "?"
                if cid:
                    print(f" ✓ Found!  Chat ID = {cid}  (name: {name})")
                    print(f"\n Now set it permanently:")
                    print(f"   export TELEGRAM_CHAT_ID='{cid}'")
                    print(f"\n Or add to .env file:")
                    print(f"   TELEGRAM_CHAT_ID={cid}\n")
                    return
        except Exception as e:
            print(f"   [polling error: {e}]")
        time.sleep(2)

    print(" Timed out. Make sure you sent /start to your bot and try again.\n")


def telegram_send_jobs(jobs: List[Job]) -> None:
    """Send filtered job results to Telegram with Apply buttons."""
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("\n [Telegram] Skipped — TELEGRAM_TOKEN or TELEGRAM_CHAT_ID not set.")
        print("  Run:  python3 job_search.py --chatid   to get your chat ID\n")
        return

    tier_emoji = {"Tier1": "🏦", "Tier2": "🌐", "Tier3": "🏢"}
    stars_map  = {5: "⭐⭐⭐⭐⭐", 4: "⭐⭐⭐⭐", 3: "⭐⭐⭐"}

    # ── Header message ─────────────────────────────────────────────────
    header = (
        f"🔍 <b>Job Search Results</b>\n"
        f"📅 {datetime.now().strftime('%d %b %Y, %H:%M')}\n"
        f"👤 Fraud Model Governance | BofA\n"
        f"📊 <b>{len(jobs)} roles found</b>\n\n"
        f"Top picks sorted by profile match ↓"
    )
    try:
        _tg_request("sendMessage", {
            "chat_id":    TELEGRAM_CHAT_ID,
            "text":       header,
            "parse_mode": "HTML",
        })
    except Exception as e:
        print(f" [Telegram] Failed to send header: {e}")
        return

    time.sleep(0.4)   # respect rate limit

    # ── One card per job ────────────────────────────────────────────────
    for i, j in enumerate(jobs, 1):
        emoji = tier_emoji.get(j.tier, "🏢")
        stars = stars_map.get(j.match, "⭐⭐⭐")
        tags  = " · ".join(j.tags[:5]) if j.tags else ""

        text = (
            f"{emoji} <b>{i}. {j.company}</b>\n"
            f"📌 {j.title}\n"
            f"📍 {j.location}\n"
            f"{stars}  |  {j.tier}"
            + (f"\n💰 {j.salary}" if j.salary else "")
            + (f"\n🏷 <i>{tags}</i>" if tags else "")
            + (f"\n💬 {j.notes}" if j.notes else "")
        )

        payload: dict = {
            "chat_id":    TELEGRAM_CHAT_ID,
            "text":       text,
            "parse_mode": "HTML",
            "reply_markup": {
                "inline_keyboard": [[
                    {"text": "Apply Now ↗", "url": j.url}
                ]]
            },
        }

        try:
            _tg_request("sendMessage", payload)
        except Exception as e:
            print(f" [Telegram] Failed for job {i} ({j.company}): {e}")

        time.sleep(0.35)   # ~3 msg/sec to stay within Telegram limits

    # ── Footer ──────────────────────────────────────────────────────────
    try:
        _tg_request("sendMessage", {
            "chat_id":    TELEGRAM_CHAT_ID,
            "text":       f"✅ Done! {len(jobs)} jobs sent. Tap <b>Apply Now</b> on any card above to open the listing.",
            "parse_mode": "HTML",
        })
        print(f" [Telegram] ✓ {len(jobs)} jobs sent to your chat.\n")
    except Exception as e:
        print(f" [Telegram] Footer error: {e}")


# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────
def main():
    args = sys.argv[1:]

    # Helper mode: get chat ID
    if "--chatid" in args:
        telegram_get_chat_id()
        return

    send_telegram = "--no-telegram" not in args

    print("\n[Job Search Agent] Filtering roles against your profile…")

    filtered = filter_jobs(JOBS, FILTERS)
    print_terminal(filtered)

    html_path = os.path.join(os.path.dirname(__file__), "job_results_filtered.html")
    save_html(filtered, html_path)
    print(f"\n HTML report saved → {html_path}")

    # Auto-open in browser
    try:
        webbrowser.open(f"file://{os.path.abspath(html_path)}")
        print(" Opening in browser…")
    except Exception:
        print(f" Open manually: file://{os.path.abspath(html_path)}")

    # Send to Telegram
    if send_telegram:
        print("\n[Telegram] Sending jobs to your chat…")
        telegram_send_jobs(filtered)

    print(f" Done. {len(filtered)} jobs listed.\n")


if __name__ == "__main__":
    main()
